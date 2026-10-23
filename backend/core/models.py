import secrets
import string
from decimal import Decimal
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    class Role(models.TextChoices):
        DIRECTOR = "director", "Director"
        ADMIN = "admin", "Admin"
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.STUDENT, db_index=True)
    phone = models.CharField(max_length=24, blank=True)
    student_id = models.CharField(max_length=8, unique=True, null=True, blank=True, validators=[RegexValidator(r"^\d{8}$")])
    tuition_restricted = models.BooleanField(default=False)

    @classmethod
    def new_student_credentials(cls):
        alphabet = string.ascii_letters + string.digits
        for _ in range(10):
            sid = "".join(secrets.choice(string.digits) for _ in range(8))
            if not cls.objects.filter(student_id=sid).exists():
                password = "".join(secrets.choice(alphabet) for _ in range(6))
                return sid, password
        raise RuntimeError("Could not allocate a unique student ID")

class Course(models.Model):
    name = models.CharField(max_length=160, unique=True)
    description = models.TextField(blank=True)
    duration_months = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    monthly_fee = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    lessons_per_month = models.PositiveSmallIntegerField(default=12, validators=[MinValueValidator(1)])
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TeachingGroup(models.Model):
    name = models.CharField(max_length=120)
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="groups")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="teaching_groups", limit_choices_to={"role": "teacher"})
    active = models.BooleanField(default=True)
    start_date = models.DateField(default=timezone.localdate)
    end_date = models.DateField(null=True, blank=True)
    schedule = models.JSONField(default=dict, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "course"], name="uniq_group_course_name")]

class GroupEnrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="enrollments", limit_choices_to={"role": "student"})
    group = models.ForeignKey(TeachingGroup, on_delete=models.PROTECT, related_name="enrollments")
    monthly_fee = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    started_on = models.DateField(default=timezone.localdate)
    ended_on = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def end(self):
        if self.active:
            self.active = False
            self.ended_on = timezone.localdate()
            self.save(update_fields=["active", "ended_on"])
    class Meta:
        constraints = [models.UniqueConstraint(fields=["student", "group", "started_on"], name="uniq_enrollment_start")]
        indexes = [models.Index(fields=["student", "active"]), models.Index(fields=["group", "active"])]

class CourseMonth(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="months")
    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=160, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["course", "number"], name="uniq_course_month")]

class Lesson(models.Model):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="lessons")
    group = models.ForeignKey(TeachingGroup, on_delete=models.PROTECT, related_name="lessons")
    month = models.ForeignKey(CourseMonth, null=True, blank=True, on_delete=models.SET_NULL, related_name="lessons")
    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    scheduled_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PLANNED)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="lessons_taught")
    is_demo = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["group", "number"], name="uniq_group_lesson_number")]

class LessonTopic(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=180)
    content = models.TextField(blank=True)
    taught_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        ordering = ["id"]

class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        EXCUSED = "excused", "Excused"
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="attendance_records")
    group = models.ForeignKey(TeachingGroup, on_delete=models.PROTECT, related_name="attendance_records")
    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT, related_name="attendance_records")
    date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=8, choices=Status.choices)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="attendance_recorded")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["student", "lesson"], name="uniq_attendance_student_lesson")]

class TuitionPeriod(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="tuition_periods")
    enrollment = models.ForeignKey(GroupEnrollment, on_delete=models.PROTECT, related_name="tuition_periods")
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    due_date = models.DateField()
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    closed = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["enrollment", "year", "month"], name="uniq_tuition_period")]

class TuitionPayment(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        CLICK = "click", "Click"
        PAYME = "payme", "Payme"
        UZUM = "uzum", "Uzum"
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        REVERSED = "reversed", "Reversed"
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    method = models.CharField(max_length=8, choices=Method.choices)
    status = models.CharField(max_length=10, choices=Status.choices)
    receipt = models.FileField(upload_to="receipts/%Y/%m/", null=True, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT, related_name="payments_received")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="payments_reviewed")
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["reference"], condition=~models.Q(reference=""), name="uniq_payment_reference")]

class FinancialTransaction(models.Model):
    class Type(models.TextChoices):
        TUITION = "tuition", "Tuition"
        ADJUSTMENT = "adjustment", "Adjustment"
        REVERSAL = "reversal", "Reversal"
        SALARY_PAYMENT = "salary_payment", "Salary payment"
    student = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="financial_transactions")
    payment = models.OneToOneField(TuitionPayment, null=True, blank=True, on_delete=models.PROTECT, related_name="ledger_transaction")
    kind = models.CharField(max_length=20, choices=Type.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_date = models.DateField(default=timezone.localdate)
    description = models.CharField(max_length=255, blank=True)
    reference = models.CharField(max_length=120, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT, related_name="financial_transactions_created")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [models.Index(fields=["student", "transaction_date"])]

class TeacherSalaryPeriod(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="salary_periods")
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("40.00"))
    eligible_tuition = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    absence_adjustments = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    calculated_salary = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    finalized = models.BooleanField(default=False)
    finalized_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["teacher", "year", "month"], name="uniq_salary_period")]

class TeacherSalaryPayment(models.Model):
    period = models.ForeignKey(TeacherSalaryPeriod, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    paid_at = models.DateTimeField(default=timezone.now)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="salary_payments_made")
    reference = models.CharField(max_length=120, blank=True)

class CoinTransaction(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="coin_transactions")
    amount = models.IntegerField()
    reason = models.CharField(max_length=255)
    reference = models.CharField(max_length=120, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT, related_name="coins_awarded")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["reference"], condition=~models.Q(reference=""), name="uniq_coin_reference")]

class ShopProduct(models.Model):
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", null=True, blank=True)
    coin_price = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    stock = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ShopOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        FULFILLED = "fulfilled", "Fulfilled"
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="shop_orders")
    product = models.ForeignKey(ShopProduct, on_delete=models.PROTECT, related_name="orders")
    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="shop_orders_decided")

class Assignment(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT, related_name="assignments")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="assignments_created")
    created_at = models.DateTimeField(auto_now_add=True)

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.PROTECT, related_name="submissions")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="assignment_submissions")
    text = models.TextField(blank=True)
    file = models.FileField(upload_to="submissions/", null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="submissions_reviewed")
    class Meta:
        constraints = [models.UniqueConstraint(fields=["assignment", "student"], name="uniq_assignment_submission")]

class Quiz(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT, related_name="quizzes")
    title = models.CharField(max_length=180)
    pass_percent = models.PositiveSmallIntegerField(default=80, validators=[MinValueValidator(1), MaxValueValidator(100)])
    active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="quizzes_created")

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    prompt = models.TextField()
    order = models.PositiveSmallIntegerField()

class QuizOption(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.PROTECT, related_name="attempts")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="quiz_attempts")
    score_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class QuizAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(QuizQuestion, on_delete=models.PROTECT)
    selected_option = models.ForeignKey(QuizOption, null=True, blank=True, on_delete=models.PROTECT)
    is_correct = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["attempt", "question"], name="uniq_quiz_answer")]

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=180)
    message = models.TextField()
    kind = models.CharField(max_length=32, default="general")
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT, related_name="audit_events")
    action = models.CharField(max_length=80)
    object_type = models.CharField(max_length=80)
    object_id = models.CharField(max_length=80)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]

class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT)
    updated_at = models.DateTimeField(auto_now=True)
