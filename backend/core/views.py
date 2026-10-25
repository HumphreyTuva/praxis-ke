import json

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import Http404, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import ContactMessage, Pillar, Publication, SiteSettings


def _pillar_brief(p):
    return {"slug": p.slug, "title": p.title}


def pillar_json(p):
    return {
        "slug": p.slug,
        "title": p.title,
        "icon": p.icon,
        "summary": p.summary,
        "description": p.description,
        "key_questions": p.key_questions or [],
    }


def publication_json(pub, request, detail=False):
    downloadable = pub.status == Publication.Status.PUBLISHED and bool(pub.file)
    data = {
        "slug": pub.slug,
        "title": pub.title,
        "subtitle": pub.subtitle,
        "kind": pub.kind,
        "kind_label": pub.get_kind_display(),
        "status": pub.status,
        "summary": pub.summary,
        "regions": [r.strip() for r in pub.regions.split(",") if r.strip()],
        "published_on": pub.published_on.isoformat() if pub.published_on else None,
        "featured": pub.featured,
        "pillars": [_pillar_brief(p) for p in pub.pillars.all()],
        "download_url": request.build_absolute_uri(pub.file.url) if downloadable else None,
        "cover": request.build_absolute_uri(pub.cover.url) if pub.cover else (pub.cover_url or None),
    }
    if detail:
        data.update(
            research_question=pub.research_question,
            purpose=pub.purpose,
            outputs=pub.outputs or [],
            scope_note=pub.scope_note,
            body=pub.body,
        )
    return data


def _visible_publications():
    return Publication.objects.exclude(status=Publication.Status.DRAFT).prefetch_related("pillars")


@require_GET
def site_info(request):
    """Public contact details. Empty values are simply not shown by the frontend."""
    s = SiteSettings.load()
    return JsonResponse({"email": s.public_email, "location": s.location, "linkedin": s.linkedin_url, "x": s.x_url})


@require_GET
def pillars(request):
    return JsonResponse({"results": [pillar_json(p) for p in Pillar.objects.all()]})


@require_GET
def publications(request):
    qs = _visible_publications()
    kind = request.GET.get("kind")
    if kind:
        qs = qs.filter(kind=kind)
    return JsonResponse({"results": [publication_json(p, request) for p in qs]})


@require_GET
def publication_detail(request, slug):
    try:
        pub = _visible_publications().get(slug=slug)
    except Publication.DoesNotExist:
        raise Http404("Publication not found")
    return JsonResponse(publication_json(pub, request, detail=True))


@require_GET
def featured(request):
    pub = _visible_publications().filter(featured=True).first()
    return JsonResponse({"result": publication_json(pub, request) if pub else None})


def _client_ip(request):
    return request.META.get("REMOTE_ADDR", "unknown")


@csrf_exempt  # public JSON endpoint; protected by honeypot + per-IP rate limit
@require_POST
def contact(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        if not isinstance(payload, dict):
            raise ValueError
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"errors": {"form": "Invalid request."}}, status=400)

    # Honeypot: real visitors never fill this hidden field. Pretend success to bots.
    if str(payload.get("website", "")).strip():
        return JsonResponse({"ok": True}, status=201)

    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip()
    organisation = str(payload.get("organisation", "")).strip()
    topic = str(payload.get("topic", "")).strip() or ContactMessage.Topic.COLLAB
    message = str(payload.get("message", "")).strip()

    errors = {}
    if len(name) < 2:
        errors["name"] = "Please enter your name."
    elif len(name) > 120:
        errors["name"] = "Name is too long."
    try:
        validate_email(email)
    except ValidationError:
        errors["email"] = "Please enter a valid email address."
    if len(organisation) > 160:
        errors["organisation"] = "Organisation name is too long."
    if topic not in ContactMessage.Topic.values:
        errors["topic"] = "Please choose a topic."
    if len(message) < 20:
        errors["message"] = "Please tell us a little more (at least 20 characters)."
    elif len(message) > 4000:
        errors["message"] = "Message is too long (4,000 characters maximum)."
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    key = f"contact-rate:{_client_ip(request)}"
    count = cache.get(key, 0)
    if count >= 5:
        return JsonResponse(
            {"errors": {"form": "Too many messages from this connection. Please try again later."}}, status=429
        )
    cache.set(key, count + 1, 60 * 60)

    obj = ContactMessage.objects.create(
        name=name, email=email, organisation=organisation, topic=topic, message=message
    )

    if settings.CONTACT_NOTIFY_EMAIL:
        try:
            send_mail(
                subject=f"[Praxis KE] {obj.get_topic_display()} — {name}",
                message=f"From: {name} <{email}>\nOrganisation: {organisation or '—'}\n\n{message}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_NOTIFY_EMAIL],
                fail_silently=True,
            )
        except Exception:  # never lose a saved enquiry because mail failed
            pass

    return JsonResponse({"ok": True}, status=201)


def spa_index(request):
    """Serve the built React app for every non-API route (client-side routing)."""
    index = settings.FRONTEND_DIST / "index.html"
    if not index.exists():
        return HttpResponse(
            "Frontend not built yet. Run `npm install && npm run build` in /frontend "
            "(or use `npm run dev` and open http://localhost:5173).",
            status=503,
            content_type="text/plain",
        )
    html = index.read_text(encoding="utf-8")
    # Social crawlers need an absolute image URL.
    html = html.replace('content="/brand/og-image.jpg"', f'content="{request.build_absolute_uri("/brand/og-image.jpg")}"')
    response = HttpResponse(html, content_type="text/html")
    if request.path.startswith("/manage"):
        response["X-Robots-Tag"] = "noindex, nofollow"
        response["Cache-Control"] = "no-store"
    return response
