import os

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction

from core.models import User


class Command(BaseCommand):
    help = "Create initial staff accounts and optionally reset their passwords."

    account_configs = (
        ("admin", User.Role.ADMIN, "BOOTSTRAP_ADMIN"),
        ("director", User.Role.DIRECTOR, "BOOTSTRAP_DIRECTOR"),
    )

    def handle(self, *args, **options):
        configured_accounts = []
        for label, role, prefix in self.account_configs:
            values = {
                "username": os.getenv(f"{prefix}_USERNAME", "").strip(),
                "email": os.getenv(f"{prefix}_EMAIL", "").strip(),
                "password": os.getenv(f"{prefix}_PASSWORD", ""),
            }
            reset_value = os.getenv(f"{prefix}_RESET_PASSWORD", "").strip().lower()
            if reset_value not in {"", "1", "0", "true", "false", "yes", "no", "on", "off"}:
                raise CommandError(f"{prefix}_RESET_PASSWORD must be a boolean value.")
            values["reset_password"] = reset_value in {"1", "true", "yes", "on"}
            if not any(values.values()):
                continue
            if not all(values[key] for key in ("username", "email", "password")):
                raise CommandError(
                    f"Set {prefix}_USERNAME, {prefix}_EMAIL, and {prefix}_PASSWORD together."
                )
            configured_accounts.append((label, role, prefix, values))

        if not configured_accounts:
            self.stdout.write("No bootstrap staff accounts configured; skipping.")
            return

        for label, role, prefix, values in configured_accounts:
            existing = User.objects.filter(username=values["username"]).first()
            if existing:
                if existing.role != role:
                    raise CommandError(
                        f"{prefix}_USERNAME belongs to an account with a different role."
                    )
                if values["reset_password"] and not existing.check_password(values["password"]):
                    try:
                        validate_password(values["password"], user=existing)
                    except ValidationError as exc:
                        raise CommandError(
                            f"{prefix}_PASSWORD does not meet password requirements."
                        ) from exc
                    existing.set_password(values["password"])
                    existing.save(update_fields=["password"])
                    self.stdout.write(
                        self.style.SUCCESS(f"Updated {label} account password.")
                    )
                    continue
                self.stdout.write(f"{label.capitalize()} account already exists; unchanged.")
                continue

            candidate = User(
                username=values["username"],
                email=values["email"],
                role=role,
            )
            try:
                validate_password(values["password"], user=candidate)
            except ValidationError as exc:
                raise CommandError(f"{prefix}_PASSWORD does not meet password requirements.") from exc

            try:
                with transaction.atomic():
                    User.objects.create_user(
                        username=values["username"],
                        email=values["email"],
                        password=values["password"],
                        role=role,
                    )
            except IntegrityError:
                existing = User.objects.filter(username=values["username"]).first()
                if existing and existing.role == role:
                    self.stdout.write(f"{label.capitalize()} account already exists; unchanged.")
                    continue
                raise CommandError(f"Could not safely create the configured {label} account.")

            self.stdout.write(self.style.SUCCESS(f"Created initial {label} account."))
