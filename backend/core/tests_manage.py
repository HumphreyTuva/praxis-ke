import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase

from .models import ContactMessage, Pillar, Publication, SiteSettings


class ManageApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_content", verbosity=0)
        User = get_user_model()
        cls.owner = User.objects.create_user("nancy", "nancymutwiri97@gmail.com", "Sturdy-pass-2026", is_staff=True)
        cls.visitor = User.objects.create_user("visitor", "v@example.org", "Another-pass-2026")

    def setUp(self):
        cache.clear()

    def post(self, url, data):
        return self.client.post(url, json.dumps(data), content_type="application/json")

    def login(self):
        r = self.post("/api/manage/login/", {"identifier": "Nancymutwiri97@gmail.com", "password": "Sturdy-pass-2026"})
        self.assertEqual(r.status_code, 200)

    def test_requires_login(self):
        self.assertEqual(self.client.get("/api/manage/summary/").status_code, 401)
        self.assertFalse(self.client.get("/api/manage/me/").json()["authenticated"])

    def test_login_by_email_and_wrong_password(self):
        self.assertEqual(self.post("/api/manage/login/", {"identifier": "nancymutwiri97@gmail.com", "password": "nope"}).status_code, 400)
        self.login()
        me = self.client.get("/api/manage/me/").json()
        self.assertTrue(me["authenticated"])

    def test_non_staff_cannot_login(self):
        r = self.post("/api/manage/login/", {"identifier": "v@example.org", "password": "Another-pass-2026"})
        self.assertEqual(r.status_code, 400)

    def test_messages_flow(self):
        m = ContactMessage.objects.create(name="A", email="a@example.org", message="x" * 30)
        self.login()
        self.assertEqual(self.client.get("/api/manage/summary/").json()["unread"], 1)
        r = self.client.patch(f"/api/manage/messages/{m.id}/", json.dumps({"handled": True}), content_type="application/json")
        self.assertTrue(r.json()["handled"] and r.json()["read"])
        self.assertEqual(self.client.delete(f"/api/manage/messages/{m.id}/").status_code, 200)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_publication_create_edit_upload_delete(self):
        self.login()
        r = self.post("/api/manage/publications/", {"title": ""})
        self.assertEqual(r.status_code, 400)
        r = self.post("/api/manage/publications/", {
            "title": "Budget Transparency", "status": "published", "summary": "A short summary.",
            "author": "Nancy Kanana", "outputs": ["One", "Two"],
            "pillars": ["comparative-and-international-policy-learning"], "featured": True,
        })
        self.assertEqual(r.status_code, 201)
        pub = r.json()
        self.assertEqual(pub["slug"], "budget-transparency")
        self.assertEqual(pub["author"], "Nancy Kanana")
        self.assertEqual(Publication.objects.filter(featured=True).count(), 1)  # others un-featured
        pdf = SimpleUploadedFile("brief.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        r = self.client.post(f"/api/manage/publications/{pub['id']}/", {"title": "Budget Transparency", "status": "published", "summary": "S", "file": pdf})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["file_url"])
        bad = SimpleUploadedFile("evil.exe", b"x")
        r = self.client.post(f"/api/manage/publications/{pub['id']}/", {"title": "T", "status": "draft", "file": bad})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.client.delete(f"/api/manage/publications/{pub['id']}/").status_code, 200)

    def test_pillars_and_reorder(self):
        self.login()
        r = self.post("/api/manage/pillars/", {"title": "New area", "icon": "outcomes", "summary": "Short.", "key_questions": ["Q?"]})
        self.assertEqual(r.status_code, 201)
        ids = list(Pillar.objects.values_list("id", flat=True))[::-1]
        self.assertEqual(self.post("/api/manage/pillars/reorder/", {"ids": ids}).status_code, 200)
        self.assertEqual(Pillar.objects.order_by("order").first().id, ids[0])

    def test_site_settings_shown_publicly(self):
        self.login()
        r = self.post("/api/manage/site/", {"public_email": "hello@example.org", "location": "Nairobi, Kenya", "linkedin_url": "not a url"})
        self.assertEqual(r.status_code, 400)
        r = self.post("/api/manage/site/", {"public_email": "hello@example.org", "location": "Nairobi, Kenya", "linkedin_url": "https://linkedin.com/company/x"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.client.get("/api/site/").json()["email"], "hello@example.org")

    def test_change_password(self):
        self.login()
        self.assertEqual(self.post("/api/manage/password/", {"current": "wrong", "new": "Brand-new-pass-77"}).status_code, 400)
        self.assertEqual(self.post("/api/manage/password/", {"current": "Sturdy-pass-2026", "new": "123"}).status_code, 400)
        self.assertEqual(self.post("/api/manage/password/", {"current": "Sturdy-pass-2026", "new": "Brand-new-pass-77"}).status_code, 200)
