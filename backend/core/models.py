from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class Pillar(models.Model):
    """One of the research pillars shown on the Home and Research pages."""

    ICONS = [
        ("design", "Policy design (document + magnifier)"),
        ("implementation", "Implementation (gear)"),
        ("accountability", "Accountability (institution)"),
        ("comparative", "Comparative learning (globe)"),
        ("outcomes", "Outcomes & evaluation (chart)"),
    ]

    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=24, choices=ICONS, default="design")
    summary = models.CharField(max_length=240, help_text="One or two sentences for cards.")
    description = models.TextField(help_text="Longer explanation for the Research page.")
    key_questions = models.JSONField(
        default=list, blank=True, help_text='A JSON list of strings, e.g. ["Question one?", "Question two?"]'
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class Publication(models.Model):
    class Kind(models.TextChoices):
        BRIEF = "brief", "Policy brief"
        NOTE = "note", "Research note"
        COMMENTARY = "commentary", "Commentary"
        REPORT = "report", "Report"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft (hidden)"
        FORTHCOMING = "forthcoming", "In development (visible, not yet released)"
        PUBLISHED = "published", "Published"

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=400, blank=True)
    author = models.CharField(max_length=160, blank=True)
    slug = models.SlugField(unique=True, blank=True)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.BRIEF)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    summary = models.TextField(help_text="Short summary shown on cards and at the top of the page.")
    research_question = models.TextField(blank=True)
    purpose = models.TextField(blank=True)
    outputs = models.JSONField(
        default=list, blank=True, help_text="JSON list of strings: what this publication will deliver."
    )
    scope_note = models.TextField(blank=True, help_text="Honest note on scope / limitations.")
    body = models.TextField(
        blank=True,
        help_text="Full text once published. Separate paragraphs with a blank line; start a line with '## ' for a heading.",
    )
    regions = models.CharField(max_length=200, blank=True, help_text="Comma-separated, e.g. Kenya, South Africa")
    pillars = models.ManyToManyField(Pillar, blank=True, related_name="publications")
    cover = models.FileField(upload_to="covers/", blank=True, help_text="Cover image (portrait, 3:4). Optional: a branded cover is generated if empty.")
    cover_url = models.CharField(max_length=300, blank=True, help_text="Alternative to uploading: a path or URL, e.g. /brand/cover-transparency.webp")
    file = models.FileField(upload_to="publications/", blank=True, help_text="PDF for download (published items only).")
    published_on = models.DateField(null=True, blank=True)
    featured = models.BooleanField(default=False, help_text="Shown on the Home page. Only the newest featured item is used.")
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-featured", "-published_on", "-created"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:50]
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return f"/publications/{self.slug}"


class ContactMessage(models.Model):
    class Topic(models.TextChoices):
        COLLAB = "collaboration", "Research collaboration"
        ADVISORY = "advisory", "Advisory support"
        MEDIA = "media", "Media or speaking"
        FEEDBACK = "feedback", "Feedback on a publication"
        OTHER = "other", "Something else"

    name = models.CharField(max_length=120)
    email = models.EmailField()
    organisation = models.CharField(max_length=160, blank=True)
    topic = models.CharField(max_length=20, choices=Topic.choices, default=Topic.COLLAB)
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    handled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"{self.name} — {self.get_topic_display()} ({self.created:%d %b %Y})"


class SiteSettings(models.Model):
    """Public contact details, editable by the owner from the dashboard (single row)."""

    public_email = models.EmailField(blank=True)
    location = models.CharField(max_length=120, blank=True, default="Kenya")
    linkedin_url = models.URLField(blank=True)
    x_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def __str__(self):
        return "Site settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        from django.conf import settings

        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "public_email": settings.PUBLIC_CONTACT_EMAIL,
                "location": settings.PUBLIC_LOCATION,
                "linkedin_url": settings.PUBLIC_LINKEDIN_URL,
                "x_url": settings.PUBLIC_X_URL,
            },
        )
        return obj
