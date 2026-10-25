from django.urls import path

from . import views

from . import manage_views as m

urlpatterns = [
    # --- owner dashboard API (session login, staff only) ---
    path("manage/me/", m.me),
    path("manage/login/", m.login_view),
    path("manage/logout/", m.logout_view),
    path("manage/password/", m.change_password),
    path("manage/summary/", m.summary),
    path("manage/messages/", m.messages_list),
    path("manage/messages/<int:pk>/", m.message_detail),
    path("manage/publications/", m.publications_collection),
    path("manage/publications/<int:pk>/", m.publication_item),
    path("manage/pillars/", m.pillars_collection),
    path("manage/pillars/reorder/", m.pillars_reorder),
    path("manage/pillars/<int:pk>/", m.pillar_item),
    path("manage/site/", m.site_settings),
    # --- public API ---
    path("site/", views.site_info),
    path("pillars/", views.pillars),
    path("publications/", views.publications),
    path("publications/featured/", views.featured),
    path("publications/<slug:slug>/", views.publication_detail),
    path("contact/", views.contact),
]
