from datetime import date
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone
from core.models import TuitionPeriod, FinancialTransaction, Notification, AuditLog, User

class Command(BaseCommand):
    help = "Restrict accounts with unpaid tuition periods after their configured due date. Safe to run repeatedly."
    def handle(self, *args, **options):
        today = timezone.localdate()
        changed = 0
        periods = TuitionPeriod.objects.filter(closed=False, due_date__lte=today).select_related("student")
        for period in periods:
            paid = FinancialTransaction.objects.filter(student=period.student, kind="tuition", transaction_date__year=period.year, transaction_date__month=period.month).aggregate(total=Sum("amount"))["total"] or 0
            # Do not lock the student until all due tuition periods have been evaluated.
            other_due = TuitionPeriod.objects.filter(student=period.student, closed=False, due_date__lte=today).exclude(pk=period.pk)
            outstanding = paid < period.amount_due
            for other in other_due:
                other_paid = FinancialTransaction.objects.filter(student=period.student, kind="tuition", transaction_date__year=other.year, transaction_date__month=other.month).aggregate(total=Sum("amount"))["total"] or 0
                outstanding = outstanding or other_paid < other.amount_due
            if outstanding and not period.student.tuition_restricted:
                period.student.tuition_restricted = True
                period.student.save(update_fields=["tuition_restricted"])
                AuditLog.objects.create(actor=None, action="student.tuition_restricted", object_type="User", object_id=str(period.student_id), metadata={"period": f"{period.year}-{period.month:02d}", "outstanding": str(period.amount_due - paid)})
                Notification.objects.create(recipient=period.student, title="Tuition payment overdue", message="Your learning access is restricted until verified tuition payments satisfy the outstanding amount.", kind="payment_restriction")
                changed += 1
        self.stdout.write(self.style.SUCCESS(f"Restricted {changed} student account(s)."))
