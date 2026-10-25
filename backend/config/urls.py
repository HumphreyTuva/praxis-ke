from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

from core.views import spa_index

admin.site.site_header = "Praxis KE administration"
admin.site.site_title = "Praxis KE"
admin.site.index_title = "Content & enquiries"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    # Static files emitted by the Vite build (served here for convenience; in a
    # busy production deployment put nginx / a CDN in front of these paths).
    re_path(
        r"^(?P<path>(?:assets|brand|favicons)/.+|site\.webmanifest|manage\.webmanifest|sw\.js|favicon\.ico)$",
        serve,
        {"document_root": settings.FRONTEND_DIST},
    ),
]

# Uploaded publication PDFs.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Everything else belongs to the React router.
urlpatterns += [re_path(r"^(?!api/|admin/|media/|static/).*$", spa_index, name="spa")]
