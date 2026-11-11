from django.db import migrations, models


def migrate_commentary_so_whats(apps, schema_editor):
    Publication = apps.get_model("core", "Publication")
    for publication in Publication.objects.filter(kind="commentary").exclude(scope_note=""):
        if not publication.so_whats:
            publication.so_whats = [publication.scope_note]
            publication.save(update_fields=["so_whats"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_publication_author"),
    ]

    operations = [
        migrations.AddField(
            model_name="publication",
            name="so_whats",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="JSON list of strings: why the argument matters.",
            ),
        ),
        migrations.RunPython(migrate_commentary_so_whats, migrations.RunPython.noop),
    ]
