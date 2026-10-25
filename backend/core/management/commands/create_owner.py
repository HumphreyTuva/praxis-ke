import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create (or repair) the website owner's dashboard login. Prints a one-time password if it creates the account."

    def add_arguments(self, parser):
        parser.add_argument("--email", default=settings.OWNER_EMAIL)
        parser.add_argument("--first-name", default="Nancy")
        parser.add_argument("--last-name", default="Mutwiri")
        parser.add_argument("--password", default="", help="Optional. A random one is generated if omitted.")

    def handle(self, *args, **opts):
        User = get_user_model()
        email = opts["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        created = user is None
        if created:
            username = email.split("@")[0][:140]
            user = User(username=username, email=email)
        user.first_name = user.first_name or opts["first_name"]
        user.last_name = user.last_name or opts["last_name"]
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        password = opts["password"]
        if created:
            password = password or secrets.token_urlsafe(9)
            user.set_password(password)
        elif password:
            user.set_password(password)
        user.save()
        if created or opts["password"]:
            self.stdout.write(self.style.SUCCESS(f"Dashboard login ready for {email}"))
            self.stdout.write(f"  Password: {password}")
            self.stdout.write("  Sign in at /manage, then change it under Settings > Account.")
        else:
            self.stdout.write(f"{email} already exists and has dashboard access (password unchanged).")
