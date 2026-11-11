from django.contrib import admin

from .models import ContactMessage, Pillar, Publication, SiteSettings


@admin.register(Pillar)
class PillarAdmin(admin.ModelAdmin):
    list_display = ("title", "icon", "order")
    list_editable = ("order",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "status", "published_on", "featured")
    list_filter = ("status", "kind", "featured")
    search_fields = ("title", "subtitle", "summary")
    filter_horizontal = ("pillars",)
    prepopulated_fields = {"slug": ("title",)}
    fieldsets = (
        (None, {"fields": ("title", "subtitle", "author", "slug", "kind", "status", "featured", "published_on")}),
        ("Summary", {"fields": ("summary", "regions", "pillars")}),
        ("Research framing", {"fields": ("research_question", "purpose", "outputs", "scope_note")}),
        ("Cover, full text & download", {"fields": ("cover", "cover_url", "body", "file")}),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "topic", "organisation", "created", "handled")
    list_filter = ("topic", "handled")
    list_editable = ("handled",)
    search_fields = ("name", "email", "organisation", "message")
    readonly_fields = ("name", "email", "organisation", "topic", "message", "created")

    def has_add_permission(self, request):
        return False


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
