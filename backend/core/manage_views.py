"""JSON API behind the owner dashboard (/manage). Session login; staff users only.

Conventions that keep the frontend simple:
  * Updates use POST to the item URL (so multipart file uploads work); deletes use DELETE.
  * Validation problems return 400 {"errors": {"field": "message"}}.
"""
import datetime
import json
from functools import wraps

from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator, validate_email
from django.http import JsonResponse
from django.utils.text import slugify
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import ContactMessage, Pillar, Publication, SiteSettings

IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp")
MAX_IMAGE = 6 * 1024 * 1024
MAX_PDF = 25 * 1024 * 1024


# ---------------------------------------------------------------- helpers
def staff_api(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Please sign in."}, status=401)
        if not request.user.is_staff:
            return JsonResponse({"error": "This account can't use the dashboard."}, status=403)
        return view(request, *args, **kwargs)

    return wrapper


def payload(request):
    if (request.content_type or "").startswith("application/json"):
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except (ValueError, UnicodeDecodeError):
            return {}
        return data if isinstance(data, dict) else {}
    return request.POST


def as_bool(value):
    return value is True or str(value).strip().lower() in ("1", "true", "on", "yes")


def as_list(value):
    if isinstance(value, str):
        try:
            value = json.loads(value) if value.strip() else []
        except ValueError:
            value = []
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if str(v).strip()]


def unique_slug(model, text, exclude_pk=None):
    base = slugify(text)[:50] or "item"
    slug, n = base, 2
    while model.objects.filter(slug=slug).exclude(pk=exclude_pk).exists():
        slug = f"{base[:46]}-{n}"
        n += 1
    return slug


def user_json(u):
    name = u.get_full_name().strip() or u.first_name or u.email.split("@")[0] or u.username
    return {"name": name, "first_name": u.first_name or name.split(" ")[0], "email": u.email}


def message_json(m):
    return {
        "id": m.id,
        "name": m.name,
        "email": m.email,
        "organisation": m.organisation,
        "topic": m.topic,
        "topic_label": m.get_topic_display(),
        "message": m.message,
        "created": m.created.isoformat(),
        "read": m.read,
        "handled": m.handled,
    }


def media_url(request, f):
    return request.build_absolute_uri(f.url) if f else None


def publication_json(request, p, full=False):
    data = {
        "id": p.id,
        "slug": p.slug,
        "title": p.title,
        "kind": p.kind,
        "kind_label": p.get_kind_display(),
        "status": p.status,
        "featured": p.featured,
        "author": p.author,
        "published_on": p.published_on.isoformat() if p.published_on else None,
        "updated": p.updated.isoformat(),
        "cover": media_url(request, p.cover) or p.cover_url or None,
        "has_file": bool(p.file),
    }
    if full:
        data.update(
            subtitle=p.subtitle,
            summary=p.summary,
            research_question=p.research_question,
            purpose=p.purpose,
            outputs=p.outputs or [],
            scope_note=p.scope_note,
            body=p.body,
            regions=p.regions,
            pillars=list(p.pillars.values_list("slug", flat=True)),
            file_url=media_url(request, p.file),
            file_name=p.file.name.split("/")[-1] if p.file else None,
        )
    return data


def pillar_json(p):
    return {
        "id": p.id,
        "slug": p.slug,
        "title": p.title,
        "icon": p.icon,
        "summary": p.summary,
        "description": p.description,
        "key_questions": p.key_questions or [],
        "order": p.order,
    }


def site_json(s):
    return {"public_email": s.public_email, "location": s.location, "linkedin_url": s.linkedin_url, "x_url": s.x_url}


def bad(errors, status=400):
    return JsonResponse({"errors": errors}, status=status)


# ---------------------------------------------------------------- auth
@ensure_csrf_cookie
@require_http_methods(["GET"])
def me(request):
    """Also sets the CSRF cookie the frontend needs before its first POST."""
    if request.user.is_authenticated and request.user.is_staff:
        return JsonResponse({"authenticated": True, "user": user_json(request.user)})
    return JsonResponse({"authenticated": False})


@require_http_methods(["POST"])
def login_view(request):
    data = payload(request)
    identifier = str(data.get("identifier", "")).strip()
    password = str(data.get("password", ""))
    ip = request.META.get("REMOTE_ADDR", "unknown")
    key = f"login-rate:{ip}"
    if cache.get(key, 0) >= 10:
        return JsonResponse({"error": "Too many attempts. Please wait a few minutes and try again."}, status=429)

    username = identifier
    if "@" in identifier:
        found = get_user_model().objects.filter(email__iexact=identifier).first()
        username = found.get_username() if found else ""
    user = authenticate(request, username=username, password=password) if username and password else None
    if user is None or not user.is_staff:
        cache.set(key, cache.get(key, 0) + 1, 15 * 60)
        return JsonResponse({"error": "That email or password isn't right. Please try again."}, status=400)

    cache.delete(key)
    login(request, user)
    request.session.set_expiry(60 * 60 * 24 * 30)
    return JsonResponse({"authenticated": True, "user": user_json(user)})


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@staff_api
@require_http_methods(["POST"])
def change_password(request):
    data = payload(request)
    current, new = str(data.get("current", "")), str(data.get("new", ""))
    if not request.user.check_password(current):
        return bad({"current": "That isn't your current password."})
    try:
        validate_password(new, request.user)
    except ValidationError as exc:
        return bad({"new": " ".join(exc.messages)})
    request.user.set_password(new)
    request.user.save()
    update_session_auth_hash(request, request.user)
    return JsonResponse({"ok": True})


# ---------------------------------------------------------------- overview
@staff_api
@require_http_methods(["GET"])
def summary(request):
    pubs = Publication.objects
    return JsonResponse(
        {
            "unread": ContactMessage.objects.filter(read=False).count(),
            "open_messages": ContactMessage.objects.filter(handled=False).count(),
            "messages_total": ContactMessage.objects.count(),
            "publications": {
                "published": pubs.filter(status=Publication.Status.PUBLISHED).count(),
                "forthcoming": pubs.filter(status=Publication.Status.FORTHCOMING).count(),
                "draft": pubs.filter(status=Publication.Status.DRAFT).count(),
            },
            "pillars": Pillar.objects.count(),
            "recent_messages": [message_json(m) for m in ContactMessage.objects.all()[:3]],
        }
    )


# ---------------------------------------------------------------- messages
@staff_api
@require_http_methods(["GET"])
def messages_list(request):
    return JsonResponse({"results": [message_json(m) for m in ContactMessage.objects.all()[:500]]})


@staff_api
@require_http_methods(["GET", "PATCH", "DELETE"])
def message_detail(request, pk):
    try:
        m = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return JsonResponse({"error": "Message not found."}, status=404)
    if request.method == "DELETE":
        m.delete()
        return JsonResponse({"ok": True})
    if request.method == "PATCH":
        data = payload(request)
        if "read" in data:
            m.read = as_bool(data["read"])
        if "handled" in data:
            m.handled = as_bool(data["handled"])
            if m.handled:
                m.read = True
        m.save()
    return JsonResponse(message_json(m))


# ---------------------------------------------------------------- publications
def _check_upload(f, exts, limit, label):
    name = f.name.lower()
    if not name.endswith(exts):
        return f"{label} must be one of: {', '.join(e.lstrip('.') for e in exts)}."
    if f.size > limit:
        return f"{label} is too large (maximum {limit // (1024 * 1024)} MB)."
    return None


def _save_publication(request, obj=None):
    d = payload(request)
    errors = {}
    title = str(d.get("title", "")).strip()
    author = str(d.get("author", "")).strip()
    kind = str(d.get("kind", Publication.Kind.BRIEF)).strip()
    status = str(d.get("status", Publication.Status.DRAFT)).strip()
    summary = str(d.get("summary", "")).strip()
    if not title:
        errors["title"] = "Please give the publication a title."
    if len(author) > 160:
        errors["author"] = "Please keep the author name under 160 characters."
    if kind not in Publication.Kind.values:
        errors["kind"] = "Please choose a type."
    if status not in Publication.Status.values:
        errors["status"] = "Please choose a status."
    if status != Publication.Status.DRAFT and not summary:
        errors["summary"] = "Add a short summary before showing this on the website."
    published_on = None
    raw_date = str(d.get("published_on", "") or "").strip()
    if raw_date:
        try:
            published_on = datetime.date.fromisoformat(raw_date)
        except ValueError:
            errors["published_on"] = "Please choose a valid date."
    cover = request.FILES.get("cover")
    pdf = request.FILES.get("file")
    if cover and (err := _check_upload(cover, IMAGE_EXT, MAX_IMAGE, "The cover image")):
        errors["cover"] = err
    if pdf and (err := _check_upload(pdf, (".pdf",), MAX_PDF, "The document")):
        errors["file"] = err
    if errors:
        return None, bad(errors)

    creating = obj is None
    obj = obj or Publication()
    obj.title = title
    obj.subtitle = str(d.get("subtitle", "")).strip()
    obj.author = author
    obj.kind = kind
    obj.status = status
    obj.summary = summary
    obj.research_question = str(d.get("research_question", "")).strip()
    obj.purpose = str(d.get("purpose", "")).strip()
    obj.outputs = as_list(d.get("outputs"))
    obj.scope_note = str(d.get("scope_note", "")).strip()
    obj.body = str(d.get("body", "")).strip()
    obj.regions = str(d.get("regions", "")).strip()
    obj.published_on = published_on
    obj.featured = as_bool(d.get("featured", False))
    if creating:
        obj.slug = unique_slug(Publication, title)
    if cover:
        obj.cover = cover
        obj.cover_url = ""
    elif as_bool(d.get("clear_cover", False)):
        if obj.cover:
            obj.cover.delete(save=False)
        obj.cover_url = ""
    if pdf:
        obj.file = pdf
    elif as_bool(d.get("clear_file", False)) and obj.file:
        obj.file.delete(save=False)
    obj.save()
    obj.pillars.set(Pillar.objects.filter(slug__in=as_list(d.get("pillars"))))
    if obj.featured:
        Publication.objects.exclude(pk=obj.pk).update(featured=False)
    return obj, None


@staff_api
@require_http_methods(["GET", "POST"])
def publications_collection(request):
    if request.method == "POST":
        obj, err = _save_publication(request)
        return err or JsonResponse(publication_json(request, obj, full=True), status=201)
    pubs = Publication.objects.all().order_by("-updated")
    return JsonResponse({"results": [publication_json(request, p) for p in pubs]})


@staff_api
@require_http_methods(["GET", "POST", "DELETE"])
def publication_item(request, pk):
    try:
        obj = Publication.objects.get(pk=pk)
    except Publication.DoesNotExist:
        return JsonResponse({"error": "Publication not found."}, status=404)
    if request.method == "DELETE":
        obj.delete()
        return JsonResponse({"ok": True})
    if request.method == "POST":
        obj, err = _save_publication(request, obj)
        if err:
            return err
    return JsonResponse(publication_json(request, obj, full=True))


# ---------------------------------------------------------------- pillars
def _save_pillar(request, obj=None):
    d = payload(request)
    errors = {}
    title = str(d.get("title", "")).strip()
    icon = str(d.get("icon", "design")).strip()
    summary = str(d.get("summary", "")).strip()
    if not title:
        errors["title"] = "Please give this research area a title."
    if icon not in dict(Pillar.ICONS):
        errors["icon"] = "Please choose an icon."
    if not summary:
        errors["summary"] = "Add a one or two sentence summary."
    if len(summary) > 240:
        errors["summary"] = "Please keep the summary under 240 characters."
    if errors:
        return None, bad(errors)
    creating = obj is None
    obj = obj or Pillar()
    obj.title, obj.icon, obj.summary = title, icon, summary
    obj.description = str(d.get("description", "")).strip()
    obj.key_questions = as_list(d.get("key_questions"))
    if creating:
        obj.slug = unique_slug(Pillar, title)
        last = Pillar.objects.order_by("-order").first()
        obj.order = (last.order + 1) if last else 1
    obj.save()
    return obj, None


@staff_api
@require_http_methods(["GET", "POST"])
def pillars_collection(request):
    if request.method == "POST":
        obj, err = _save_pillar(request)
        return err or JsonResponse(pillar_json(obj), status=201)
    return JsonResponse({"results": [pillar_json(p) for p in Pillar.objects.all()], "icons": [i for i, _ in Pillar.ICONS]})


@staff_api
@require_http_methods(["POST"])
def pillars_reorder(request):
    ids = payload(request).get("ids", [])
    if not isinstance(ids, list):
        return bad({"ids": "Invalid order."})
    for position, pk in enumerate(ids, start=1):
        Pillar.objects.filter(pk=pk).update(order=position)
    return JsonResponse({"ok": True})


@staff_api
@require_http_methods(["GET", "POST", "DELETE"])
def pillar_item(request, pk):
    try:
        obj = Pillar.objects.get(pk=pk)
    except Pillar.DoesNotExist:
        return JsonResponse({"error": "Not found."}, status=404)
    if request.method == "DELETE":
        obj.delete()
        return JsonResponse({"ok": True})
    if request.method == "POST":
        obj, err = _save_pillar(request, obj)
        if err:
            return err
    return JsonResponse(pillar_json(obj))


# ---------------------------------------------------------------- site settings
@staff_api
@require_http_methods(["GET", "POST"])
def site_settings(request):
    s = SiteSettings.load()
    if request.method == "POST":
        d = payload(request)
        errors = {}
        email = str(d.get("public_email", "")).strip()
        location = str(d.get("location", "")).strip()
        linkedin = str(d.get("linkedin_url", "")).strip()
        x_url = str(d.get("x_url", "")).strip()
        if email:
            try:
                validate_email(email)
            except ValidationError:
                errors["public_email"] = "That email address doesn't look right."
        for field, value in (("linkedin_url", linkedin), ("x_url", x_url)):
            if value:
                try:
                    URLValidator(schemes=["http", "https"])(value)
                except ValidationError:
                    errors[field] = "Paste the full link, starting with https://"
        if errors:
            return bad(errors)
        s.public_email, s.location, s.linkedin_url, s.x_url = email, location, linkedin, x_url
        s.save()
    return JsonResponse(site_json(s))
