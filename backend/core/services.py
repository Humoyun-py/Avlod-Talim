from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from .models import AuditLog, AttendanceRecord, CoinTransaction, FinancialTransaction, GroupEnrollment, Lesson, QuizAnswer, QuizAttempt, QuizOption, ShopOrder, ShopProduct, TeacherSalaryPeriod, TeacherSalaryPayment, TuitionPayment

def audit(actor, action, obj, metadata=None):
    AuditLog.objects.create(actor=actor, action=action, object_type=obj.__class__.__name__, object_id=str(obj.pk), metadata=metadata or {})

@transaction.atomic
def create_enrollment(group, students, actor, fee_by_student=None):
    fee_by_student = fee_by_student or {}
    records = []
    for student in students:
        if student.role != "student" or not student.is_active:
            raise ValueError("Every selected account must be an active student")
        if GroupEnrollment.objects.filter(student=student, active=True).exists():
            raise ValueError(f"Student {student.student_id} is already enrolled in an active group")
        records.append(GroupEnrollment.objects.create(student=student, group=group, monthly_fee=fee_by_student.get(str(student.pk), group.course.monthly_fee)))
    audit(actor, "group.enrollments_added", group, {"student_ids": [r.student_id for r in records]})
    return records

@transaction.atomic
def record_attendance(lesson, entries, actor):
    if lesson.teacher_id != actor.pk and actor.role not in ("director", "admin"):
        raise PermissionError("You cannot record attendance for this lesson")
    rows = []
    for entry in entries:
        if not GroupEnrollment.objects.filter(student_id=entry["student_id"], group=lesson.group, active=True).exists():
            raise ValueError("Attendance student is not actively enrolled in this group")
        row, created = AttendanceRecord.objects.update_or_create(student_id=entry["student_id"], lesson=lesson, defaults={"group": lesson.group, "date": lesson.scheduled_date or timezone.localdate(), "status": entry["status"], "recorded_by": actor})
        if not created:
            audit(actor, "attendance.corrected", row, {"status": row.status})
        rows.append(row)
    return rows

@transaction.atomic
def register_payment(student, amount, method, actor, reference="", receipt=None, notes=""):
    status = TuitionPayment.Status.APPROVED if method == TuitionPayment.Method.CASH else TuitionPayment.Status.PENDING
    payment = TuitionPayment.objects.create(student=student, amount=amount, method=method, status=status, received_by=actor, reference=reference, receipt=receipt, notes=notes)
    if status == TuitionPayment.Status.APPROVED:
        FinancialTransaction.objects.create(student=student, payment=payment, kind=FinancialTransaction.Type.TUITION, amount=amount, reference=reference, created_by=actor, description=f"{method} tuition payment")
    audit(actor, "payment.registered", payment, {"amount": str(amount), "method": method})
    return payment

@transaction.atomic
def review_payment(payment, actor, approved, reason=""):
    if payment.status != TuitionPayment.Status.PENDING:
        raise ValueError("Only pending payments can be reviewed")
    payment.status = TuitionPayment.Status.APPROVED if approved else TuitionPayment.Status.REJECTED
    payment.reviewed_by, payment.reviewed_at, payment.rejection_reason = actor, timezone.now(), "" if approved else reason
    payment.save(update_fields=["status", "reviewed_by", "reviewed_at", "rejection_reason"])
    if approved:
        FinancialTransaction.objects.create(student=payment.student, payment=payment, kind=FinancialTransaction.Type.TUITION, amount=payment.amount, reference=payment.reference, created_by=actor, description="Verified tuition payment")
        restore_student_if_current_period_paid(payment.student)
    audit(actor, "payment.approved" if approved else "payment.rejected", payment, {"reason": reason})
    return payment

def restore_student_if_current_period_paid(student):
    """Clear tuition restriction only when every overdue period is fully covered."""
    from .models import TuitionPeriod
    overdue = TuitionPeriod.objects.filter(student=student, closed=False, due_date__lte=timezone.localdate())
    for period in overdue:
        paid = FinancialTransaction.objects.filter(student=student, kind=FinancialTransaction.Type.TUITION,
            transaction_date__year=period.year, transaction_date__month=period.month).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        if paid < period.amount_due:
            return False
    if student.tuition_restricted:
        student.tuition_restricted = False
        student.save(update_fields=["tuition_restricted"])
        audit(None, "student.tuition_reactivated", student)
        from .models import Notification
        Notification.objects.create(recipient=student, title="Learning access restored", message="Your verified tuition payments are up to date.", kind="account_reactivated")
    return True

def paid_amount(student, year, month):
    value = FinancialTransaction.objects.filter(student=student, kind=FinancialTransaction.Type.TUITION, transaction_date__year=year, transaction_date__month=month).aggregate(total=Sum("amount"))["total"]
    return value or Decimal("0.00")

@transaction.atomic
def calculate_salary(teacher, year, month, finalize=False):
    period, _ = TeacherSalaryPeriod.objects.select_for_update().get_or_create(teacher=teacher, year=year, month=month)
    if period.finalized:
        return period
    period.percentage = Decimal(str(getattr(settings, "TEACHER_SALARY_PERCENT", "40")))
    lessons = Lesson.objects.filter(teacher=teacher, status=Lesson.Status.COMPLETED, scheduled_date__year=year, scheduled_date__month=month, is_demo=False)
    enrollments = GroupEnrollment.objects.filter(group__in=lessons.values("group")).select_related("student", "group").distinct()
    paid, adjustments = Decimal("0.00"), Decimal("0.00")
    for enrollment in enrollments:
        paid += paid_amount(enrollment.student, year, month)
        absent = AttendanceRecord.objects.filter(student=enrollment.student, group=enrollment.group, lesson__in=lessons, status=AttendanceRecord.Status.ABSENT).count()
        # The brief sets a count threshold but no deduction amount. Never invent a monetary deduction.
        adjustments += min(absent, settings.ABSENCE_DEDUCTION_LIMIT) * Decimal("0.00")
    period.eligible_tuition, period.absence_adjustments = paid, adjustments
    period.calculated_salary = ((paid - adjustments) * period.percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if finalize:
        period.finalized, period.finalized_at = True, timezone.now()
    period.save()
    audit(None, "salary.calculated", period, {"eligible_tuition": str(paid), "salary": str(period.calculated_salary)})
    return period

@transaction.atomic
def pay_salary(period, amount, actor, reference=""):
    period = TeacherSalaryPeriod.objects.select_for_update().get(pk=period.pk)
    if not period.finalized:
        raise ValueError("Salary period must be finalized before payment")
    paid = period.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    if amount <= 0 or paid + amount > period.calculated_salary:
        raise ValueError("Salary payment exceeds remaining payable amount")
    result = TeacherSalaryPayment.objects.create(period=period, amount=amount, paid_by=actor, reference=reference)
    FinancialTransaction.objects.create(kind=FinancialTransaction.Type.SALARY_PAYMENT, amount=-amount, description=f"Salary paid to {period.teacher.get_full_name()}", reference=reference, created_by=actor)
    audit(actor, "salary.paid", result, {"amount": str(amount)})
    return result

@transaction.atomic
def award_coins(student, amount, actor, reason, reference=""):
    if amount <= 0:
        raise ValueError("Coin award must be positive")
    row = CoinTransaction.objects.create(student=student, amount=amount, created_by=actor, reason=reason, reference=reference)
    audit(actor, "coins.awarded", row, {"amount": amount})
    return row

def coin_balance(student):
    return student.coin_transactions.aggregate(total=Sum("amount"))["total"] or 0

@transaction.atomic
def purchase_product(student, product_id, quantity=1):
    product = ShopProduct.objects.select_for_update().get(pk=product_id, active=True)
    if quantity < 1 or product.stock < quantity:
        raise ValueError("Product is unavailable in the requested quantity")
    cost = product.coin_price * quantity
    if coin_balance(student) < cost:
        raise ValueError("Insufficient coin balance")
    product.stock -= quantity
    product.save(update_fields=["stock"])
    CoinTransaction.objects.create(student=student, amount=-cost, reason=f"Shop purchase: {product.name}")
    order = ShopOrder.objects.create(student=student, product=product, quantity=quantity, unit_price=product.coin_price, status=ShopOrder.Status.APPROVED)
    audit(student, "shop.purchased", order, {"cost": cost})
    return order

@transaction.atomic
def submit_quiz(quiz, student, answers):
    if not quiz.active or not quiz.lesson.topics.filter(taught_at__isnull=False).exists():
        raise ValueError("Quiz is unavailable until its lesson topic has been taught")
    attempt = QuizAttempt.objects.create(quiz=quiz, student=student)
    questions, correct = list(quiz.questions.all()), 0
    for question in questions:
        option_id = answers.get(str(question.pk))
        selected = QuizOption.objects.filter(pk=option_id, question=question).first() if option_id else None
        is_correct = bool(selected and selected.is_correct)
        correct += int(is_correct)
        QuizAnswer.objects.create(attempt=attempt, question=question, selected_option=selected, is_correct=is_correct)
    attempt.score_percent = Decimal(correct * 100 / len(questions)).quantize(Decimal("0.01")) if questions else Decimal("0")
    attempt.passed, attempt.submitted_at = attempt.score_percent >= quiz.pass_percent, timezone.now()
    attempt.save(update_fields=["score_percent", "passed", "submitted_at"])
    return attempt
