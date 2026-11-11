import json

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase

from .models import ContactMessage, Publication


class ApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_content", verbosity=0)

    def setUp(self):
        cache.clear()

    def test_site_info(self):
        data = self.client.get("/api/site/").json()
        self.assertEqual(set(data), {"email", "location", "linkedin", "x"})

    def test_pillars(self):
        data = self.client.get("/api/pillars/").json()["results"]
        self.assertEqual(len(data), 5)
        self.assertEqual(data[0]["icon"], "design")

    def test_publication_list_and_detail(self):
        data = self.client.get("/api/publications/").json()["results"]
        self.assertEqual(data[0]["slug"], "from-transparency-to-accountability")
        self.assertIsNone(data[0]["download_url"])  # not released yet
        self.assertEqual(data[0]["cover"], "/brand/cover-transparency.webp")
        detail = self.client.get("/api/publications/from-transparency-to-accountability/")
        self.assertEqual(detail.status_code, 200)
        self.assertIn("research_question", detail.json())

    def test_publication_author_is_public(self):
        publication = Publication.objects.create(
            title="Author byline",
            summary="A summary.",
            author="Nancy Kanana",
            status=Publication.Status.PUBLISHED,
            published_on="2026-11-11",
        )
        response = self.client.get(f"/api/publications/{publication.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["author"], "Nancy Kanana")
        self.assertEqual(response.json()["published_on"], "2026-11-11")

    def test_drafts_are_hidden(self):
        Publication.objects.create(title="Hidden", summary="x", status="draft")
        slugs = [p["slug"] for p in self.client.get("/api/publications/").json()["results"]]
        self.assertNotIn("hidden", slugs)
        self.assertEqual(self.client.get("/api/publications/hidden/").status_code, 404)

    def test_featured(self):
        self.assertEqual(
            self.client.get("/api/publications/featured/").json()["result"]["slug"],
            "from-transparency-to-accountability",
        )

    def _post(self, payload):
        return self.client.post("/api/contact/", json.dumps(payload), content_type="application/json")

    def test_contact_valid(self):
        r = self._post({"name": "Amina", "email": "a@example.org", "topic": "collaboration",
                        "message": "We would like to discuss a joint research project."})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_contact_validation(self):
        r = self._post({"name": "", "email": "nope", "message": "short"})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(set(r.json()["errors"]), {"name", "email", "message"})

    def test_contact_honeypot(self):
        r = self._post({"name": "Bot", "email": "b@example.org", "message": "x" * 30, "website": "spam.example"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_contact_rate_limit(self):
        body = {"name": "Amina", "email": "a@example.org", "message": "A sufficiently long message body."}
        codes = [self._post(body).status_code for _ in range(6)]
        self.assertEqual(codes[:5], [201] * 5)
        self.assertEqual(codes[5], 429)
