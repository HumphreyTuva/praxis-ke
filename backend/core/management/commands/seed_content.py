from django.core.management.base import BaseCommand

from core.models import Pillar, Publication
from core.seed_data import PILLARS, PUBLICATIONS


class Command(BaseCommand):
    help = "Load (or refresh) the starter pillars and first publication from the Praxis KE brief."

    def handle(self, *args, **options):
        for item in PILLARS:
            data = dict(item)
            slug = data.pop("slug")
            Pillar.objects.update_or_create(slug=slug, defaults=data)

        for item in PUBLICATIONS:
            data = dict(item)
            slug = data.pop("slug")
            pillar_slugs = data.pop("pillars", [])
            # Don't overwrite edits made in the admin: only create if missing.
            pub, created = Publication.objects.get_or_create(slug=slug, defaults=data)
            if created:
                pub.pillars.set(Pillar.objects.filter(slug__in=pillar_slugs))
            elif not pub.cover and not pub.cover_url and item.get("cover_url"):
                pub.cover_url = item["cover_url"]
                pub.save(update_fields=["cover_url"])

        self.stdout.write(self.style.SUCCESS("Starter content loaded."))
