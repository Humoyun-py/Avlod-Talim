from datetime import date
from decimal import Decimal, InvalidOperation
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import router, transaction
from django.db.models.deletion import Collector
from django.db.models import ProtectedError, Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from .permissions import RolePermission, StaffWritePermission
from .serializers import *
from .services import *

def parse_int(value, field, default=None, minimum=None, maximum=None):
    if value in (None, ""):
        if default is None:
            raise ValidationError({field: "This field is required."})
        value = default
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValidationError({field: "A whole number is required."})
    if (minimum is not None and number < minimum) or (maximum is not None and number > maximum):
        raise ValidationError({field: "Value is out of range."})
    return number

def parse_ids(values, field):
    if not isinstance(values, list):
        raise ValidationError({field: "A list of IDs is required."})
    return [parse_int(value, field) for value in values]

def parse_decimal(value, field, minimum=Decimal("0.01"), maximum=None):
    try:
        number = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError({field: "A valid number is required."})
    if not number.is_finite() or number < minimum or (maximum is not None and number > maximum):
        raise ValidationError({field: "Value is out of range."})
    return number

@transaction.atomic
def hard_delete(instance):
    using = router.db_for_write(instance.__class__, instance=instance)
    collector = Collector(using=using)
    try:
        collector.collect([instance])
    except ProtectedError:
        raise ValidationError({"detail": "This record is linked to financial history and cannot be deleted."})

    related_objects = [
        (model, [obj.pk for obj in objects])
        for model, objects in collector.data.items()
    ]
    related_objects.extend(
        (queryset.model, list(queryset.values_list("pk", flat=True)))
        for queryset in collector.fast_deletes
    )
    for model, object_ids in related_objects:
        if object_ids:
            AuditLog.objects.using(using).filter(
                object_type=model.__name__,
                object_id__in=[str(object_id) for object_id in object_ids],
            ).delete()

    collector.delete()

class LoginThrottle(AnonRateThrottle):
    scope = "login"

def auth_payload(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}

class BaseLogin(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]
    serializer_class = LoginSerializer
    staff_roles = ()
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        if not user or not user.is_active or (self.staff_roles and user.role not in self.staff_roles) or (not self.staff_roles and user.role != "student") or user.tuition_restricted:
            return Response({"detail": "Invalid credentials or account access is restricted"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(auth_payload(user))
class StaffLoginView(BaseLogin):
    staff_roles = ("director", "admin", "teacher")
class StudentLoginView(BaseLogin):
    def post(self, request):
        data = request.data.copy()
        data["username"] = f"student-{data.get('student_id', '')}"
        user = authenticate(request, username=data["username"], password=data.get("password"))
        if not user or user.role != "student" or not user.is_active or user.tuition_restricted:
            return Response({"detail": "Invalid credentials or account access is restricted"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(auth_payload(user))

class LogoutView(APIView):
    serializer_class = SimplePayloadSerializer
    def post(self, request):
        try:
            RefreshToken(request.data["refresh"]).blacklist()
        except Exception:
            raise ValidationError({"refresh": "Invalid refresh token"})
        return Response(status=status.HTTP_205_RESET_CONTENT)

class MeView(APIView):
    serializer_class = UserSerializer
    def get(self, request): return Response(UserSerializer(request.user).data)
    def patch(self, request):
        if set(request.data.keys()) - {"first_name", "last_name", "phone"}:
            raise ValidationError({"detail": "Only profile fields may be updated"})
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class PasswordChangeView(APIView):
    serializer_class = PasswordChangeSerializer
    def post(self, request):
        if not request.user.check_password(request.data.get("old_password", "")):
            raise ValidationError({"old_password": "Incorrect password"})
        password = request.data.get("new_password", "")
        from django.contrib.auth.password_validation import validate_password
        try: validate_password(password, request.user)
        except DjangoValidationError as exc: raise ValidationError({"new_password": list(exc.messages)})
        request.user.set_password(password); request.user.save(update_fields=["password"])
        audit(request.user, "password.changed", request.user)
        return Response({"detail": "Password updated"})

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin")
    filter_backends = [filters.SearchFilter]
    filterset_fields = ["is_active", "enrollments__group"]
    search_fields = ["first_name", "last_name", "student_id", "username"]
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return User.objects.none()
        role = self.request.query_params.get("role", "student")
        if self.request.user.role == "admin" and role != "student":
            return User.objects.none()
        return User.objects.filter(role=role).prefetch_related("enrollments__group__course", "enrollments__group__teacher")
    def get_serializer_class(self):
        return StudentCreateSerializer if self.action == "create" and self.request.data.get("role", "student") == "student" else TeacherCreateSerializer if self.action == "create" and self.request.data.get("role") == "teacher" else UserSerializer
    def create(self, request, *args, **kwargs):
        if request.data.get("role") == "teacher" and request.user.role != "director":
            raise PermissionDenied("Only a Director can create teachers")
        if request.data.get("role", "student") not in ("student", "teacher"):
            raise ValidationError({"role": "This endpoint only creates student or teacher accounts"})
        return super().create(request, *args, **kwargs)
    def perform_update(self, serializer):
        user = serializer.save()
        audit(self.request.user, "user.updated", user)
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if "is_active" in request.data and request.user.role != "director":
            raise PermissionDenied("Only a Director may change account activation")
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop("partial", False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    def destroy(self, request, *args, **kwargs):
        if request.user.role != "director":
            raise PermissionDenied("Only a Director may permanently delete accounts.")
        if request.query_params.get("role", "student") not in ("student", "teacher"):
            raise ValidationError({"role": "Only student or teacher accounts can be deleted here."})
        hard_delete(self.get_object())
        return Response(status=status.HTTP_204_NO_CONTENT)
    @action(detail=True, methods=["post"], permission_classes=[RolePermission], url_path="deactivate")
    def deactivate(self, request, pk=None):
        user = self.get_object(); user.is_active = False; user.save(update_fields=["is_active"]); audit(request.user, "user.deactivated", user); return Response(UserSerializer(user).data)
    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        if request.user.role != "director": raise PermissionDenied("Only a Director may reset credentials")
        user = self.get_object()
        import secrets, string
        password = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(6 if user.role == "student" else 14))
        user.set_password(password); user.save(update_fields=["password"])
        audit(request.user, "credentials.reset", user)
        return Response({"user_id": user.pk, "temporary_password": password})
    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        user = self.get_object(); return Response(PaymentSerializer(user.payments.all(), many=True).data)
    @action(detail=True, methods=["get"])
    def attendance(self, request, pk=None):
        user = self.get_object()
        if request.user.role == "student" and request.user.pk != user.pk: raise PermissionDenied()
        return Response(AttendanceSerializer(user.attendance_records.all(), many=True).data)
    @action(detail=True, methods=["get"], url_path="group-profile")
    def group_profile(self, request, pk=None):
        student = self.get_object()
        if request.user.role == "student" and request.user.pk != student.pk: raise PermissionDenied()
        enrollment = student.enrollments.filter(active=True).select_related("group__course", "group__teacher").first()
        if not enrollment: return Response({"group": None, "classmates": []})
        group = enrollment.group
        classmates = [{"id": row.student_id, "full_name": row.student.get_full_name(), "first_name": row.student.first_name}
                      for row in group.enrollments.filter(active=True).select_related("student")]
        return Response({"group": GroupSerializer(group).data, "course": CourseSerializer(group.course).data, "teacher": group.teacher.get_full_name(), "classmates": classmates})

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [StaffWritePermission]
    filterset_fields = ["active"]
    roles = ("director", "admin", "teacher", "student")
    def get_queryset(self):
        return Course.objects.filter(active=True) if self.request.user.role in ("teacher", "student") else Course.objects.all()
    def destroy(self, request, *args, **kwargs):
        if request.user.role != "director":
            raise PermissionDenied("Only a Director may permanently delete courses.")
        hard_delete(self.get_object())
        return Response(status=status.HTTP_204_NO_CONTENT)

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [RolePermission]
    filterset_fields = ["course", "teacher", "active"]
    roles = ("director", "admin", "teacher", "student")
    write_roles = ("director", "admin")
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return TeachingGroup.objects.none()
        qs = TeachingGroup.objects.select_related("course", "teacher").prefetch_related("enrollments__student").order_by("id")
        if self.request.user.role == "admin": qs = qs.filter(active=True)
        if self.request.user.role == "teacher": return qs.filter(teacher=self.request.user)
        if self.request.user.role == "student": return qs.filter(enrollments__student=self.request.user, enrollments__active=True).distinct()
        return qs
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "course__name", "teacher__first_name", "teacher__last_name"]
    ordering_fields = ["id", "name", "start_date"]
    def perform_create(self, serializer):
        group = serializer.save(); audit(self.request.user, "group.created", group)
    def perform_update(self, serializer):
        group = serializer.save()
        audit(self.request.user, "group.updated", group)
    def destroy(self, request, *args, **kwargs):
        if request.user.role != "director":
            raise PermissionDenied("Only a Director may permanently delete groups.")
        hard_delete(self.get_object())
        return Response(status=status.HTTP_204_NO_CONTENT)
    @action(detail=True, methods=["get", "post"])
    def students(self, request, pk=None):
        group = self.get_object()
        if request.method == "POST":
            if request.user.role not in ("director", "admin"):
                raise PermissionDenied()
            ids = parse_ids(request.data.get("student_ids", []), "student_ids")
            students = list(User.objects.filter(pk__in=ids, role="student", is_active=True))
            if len(students) != len(set(ids)):
                raise ValidationError({"student_ids": "One or more students are invalid"})
            try: create_enrollment(group, students, request.user)
            except ValueError as exc: raise ValidationError({"student_ids": str(exc)})
            return Response({"group_id": group.pk, "enrolled_count": len(students)}, status=201)
        return Response(UserSerializer(User.objects.filter(enrollments__group=group, enrollments__active=True), many=True).data)

    @action(detail=False, methods=["post"], url_path="enrollments")
    def enrollments(self, request):
        group = get_object_or_404(TeachingGroup, pk=request.data.get("group"))
        if request.user.role not in ("director", "admin"):
            raise PermissionDenied()
        ids = parse_ids(request.data.get("student_ids", []), "student_ids")
        students = list(User.objects.filter(pk__in=ids, role="student", is_active=True))
        if len(students) != len(set(ids)):
            raise ValidationError({"student_ids": "One or more students are invalid"})
        try: enrollments = create_enrollment(group, students, request.user)
        except ValueError as exc: raise ValidationError({"student_ids": str(exc)})
        return Response({"group_id": group.pk, "enrolled_count": len(enrollments)}, status=201)

    @action(detail=False, methods=["post"], url_path="enrollments/remove")
    def remove_enrollment(self, request):
        if request.user.role not in ("director", "admin"):
            raise PermissionDenied()
        enrollment = get_object_or_404(GroupEnrollment, group_id=request.data.get("group"), student_id=request.data.get("student"), active=True)
        enrollment.end()
        audit(request.user, "group.enrollment_ended", enrollment)
        return Response({"detail": "Student removed from group"})

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin", "teacher", "student")
    write_roles = ("director", "admin", "teacher")
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return Lesson.objects.none()
        qs = Lesson.objects.select_related("course", "group", "teacher").prefetch_related("topics")
        user = self.request.user
        if user.role == "teacher": qs = qs.filter(teacher=user)
        if user.role == "student": qs = qs.filter(group__enrollments__student=user, group__enrollments__active=True, status=Lesson.Status.COMPLETED).distinct()
        return qs
    def check_lesson_owner(self, group, teacher):
        if self.request.user.role == "teacher" and (group.teacher_id != self.request.user.pk or teacher.pk != self.request.user.pk):
            raise PermissionDenied("You can manage lessons only for your assigned groups")
        if group.teacher_id != teacher.pk: raise PermissionDenied("Lesson teacher must be assigned to the group")
    def perform_create(self, serializer):
        teacher = self.request.user if self.request.user.role == "teacher" else serializer.validated_data.get("teacher")
        self.check_lesson_owner(serializer.validated_data["group"], teacher)
        lesson = serializer.save(teacher=teacher)
        if lesson.title:
            LessonTopic.objects.get_or_create(lesson=lesson, title=lesson.title)
    def perform_update(self, serializer):
        group = serializer.validated_data.get("group", serializer.instance.group)
        teacher = serializer.validated_data.get("teacher", serializer.instance.teacher)
        self.check_lesson_owner(group, teacher)
        serializer.save()
    @action(detail=True, methods=["post"], url_path="start")
    def start(self, request, pk=None):
        if request.user.role != "teacher":
            raise PermissionDenied("Only teachers can start lessons.")
        lesson = self.get_object()
        if lesson.status == Lesson.Status.IN_PROGRESS:
            return Response(self.get_serializer(lesson).data)
        if lesson.status != Lesson.Status.PLANNED:
            raise ValidationError({"status": "Only planned lessons can be started."})
        lesson.status = Lesson.Status.IN_PROGRESS
        lesson.save(update_fields=["status"])
        audit(request.user, "lesson.started", lesson)
        return Response(self.get_serializer(lesson).data)
    @action(detail=True, methods=["post"], url_path="mark-taught")
    def mark_taught(self, request, pk=None):
        lesson = self.get_object(); topic = lesson.topics.get(pk=request.data.get("topic_id")); topic.taught_at = timezone.now(); topic.save(update_fields=["taught_at"]); audit(request.user, "lesson.topic_taught", topic); return Response({"id": topic.id, "taught_at": topic.taught_at})
    def partial_update(self, request, *args, **kwargs):
        lesson = self.get_object()
        if request.user.role == "teacher" and lesson.teacher_id != request.user.pk:
            raise PermissionDenied()
        return super().partial_update(request, *args, **kwargs)

class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceRecord.objects.none()
    serializer_class = AttendanceSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin", "teacher", "student")
    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related("student", "group", "lesson", "recorded_by")
        if self.request.user.role == "teacher": qs = qs.filter(group__teacher=self.request.user)
        if self.request.user.role == "student": qs = qs.filter(student=self.request.user)
        return qs
    def create(self, request, *args, **kwargs):
        raise PermissionDenied("Use POST /attendance/bulk/ to record attendance")
    @action(detail=False, methods=["post"], url_path="bulk", permission_classes=[RolePermission])
    def bulk(self, request):
        lesson = get_object_or_404(Lesson, pk=request.data.get("lesson"))
        if request.user.role == "teacher" and lesson.teacher_id != request.user.pk:
            raise PermissionDenied()
        if request.user.role == "student":
            raise PermissionDenied()
        rows = record_attendance(lesson, request.data.get("records", []), request.user)
        return Response(AttendanceSerializer(rows, many=True).data)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = TuitionPayment.objects.none()
    serializer_class = PaymentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [RolePermission]
    roles = ("director", "admin", "student")
    requires_learning_access = False
    http_method_names = ["get", "post", "head", "options"]
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return TuitionPayment.objects.none()
        qs = TuitionPayment.objects.select_related("student", "received_by", "reviewed_by")
        if self.request.user.role == "student": return qs.filter(student=self.request.user)
        if self.request.user.role in ("director", "admin"): return qs
        return qs.none()
    filter_backends = [filters.OrderingFilter]
    filterset_fields = ["student", "method", "status"]
    def create(self, request, *args, **kwargs):
        if request.user.role not in ("director", "admin"): raise PermissionDenied()
        student = get_object_or_404(User, pk=parse_int(request.data.get("student"), "student"), role="student")
        method = request.data.get("method")
        if method not in TuitionPayment.Method.values: raise ValidationError({"method": "Unsupported payment method."})
        amount = parse_decimal(request.data.get("amount"), "amount")
        try: payment = register_payment(student, amount, method, request.user, request.data.get("reference", ""), request.FILES.get("receipt"), request.data.get("notes", ""))
        except ValueError as exc: raise ValidationError({"reference": str(exc)})
        return Response(PaymentSerializer(payment).data, status=201)
    @action(detail=False, methods=["get"], url_path="verification-queue")
    def verification_queue(self, request):
        if request.user.role not in ("director", "admin"): raise PermissionDenied()
        qs = self.get_queryset().filter(status=TuitionPayment.Status.PENDING).order_by("created_at")
        page = self.paginate_queryset(qs)
        serializer = PaymentSerializer(page if page is not None else qs, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if request.user.role not in ("director", "admin"): raise PermissionDenied()
        try: return Response(PaymentSerializer(review_payment(self.get_object(), request.user, True)).data)
        except ValueError as exc: raise ValidationError({"status": str(exc)})
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if request.user.role not in ("director", "admin"): raise PermissionDenied()
        try: return Response(PaymentSerializer(review_payment(self.get_object(), request.user, False, request.data.get("reason", ""))).data)
        except ValueError as exc: raise ValidationError({"status": str(exc)})

class ProductViewSet(viewsets.ModelViewSet):
    queryset = ShopProduct.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [StaffWritePermission]
    roles = ("director", "admin", "student")
    def get_queryset(self):
        return ShopProduct.objects.filter(active=True) if self.request.user.role == "student" else ShopProduct.objects.all()

class ShopCategoryViewSet(viewsets.ModelViewSet):
    queryset = ShopCategory.objects.all()
    serializer_class = ShopCategorySerializer
    permission_classes = [StaffWritePermission]
    roles = ("director", "admin")

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.none()
    serializer_class = NotificationSerializer
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return Notification.objects.none()
        return Notification.objects.filter(recipient=self.request.user)
    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        item = self.get_object(); item.read_at = timezone.now(); item.save(update_fields=["read_at"]); return Response(NotificationSerializer(item).data)

class DashboardView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    def get(self, request):
        if request.user.role == "student":
            return Response({"student": UserSerializer(request.user).data, "groups": GroupSerializer(TeachingGroup.objects.filter(enrollments__student=request.user, enrollments__active=True), many=True).data, "coin_balance": coin_balance(request.user), "notifications_unread": request.user.notifications.filter(read_at__isnull=True).count()})
        if request.user.role == "teacher":
            groups = TeachingGroup.objects.filter(teacher=request.user)
            return Response({"groups": groups.count(), "students": GroupEnrollment.objects.filter(group__in=groups, active=True).count(), "lessons": Lesson.objects.filter(teacher=request.user).count()})
        students = User.objects.filter(role="student")
        active_students = students.filter(is_active=True, tuition_restricted=False).count()
        teachers = User.objects.filter(role="teacher", is_active=True).count()
        groups = TeachingGroup.objects.filter(active=True).count()
        pending = TuitionPayment.objects.filter(status="pending").count()
        outstanding = Decimal("0.00")
        for period in TuitionPeriod.objects.filter(closed=False).values("student_id", "year", "month", "amount_due"):
            paid = FinancialTransaction.objects.filter(student_id=period["student_id"], kind=FinancialTransaction.Type.TUITION,
                transaction_date__year=period["year"], transaction_date__month=period["month"]).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            outstanding += max(Decimal("0.00"), period["amount_due"] - paid)
        today = timezone.localdate()
        chart_months = []
        for offset in range(11, -1, -1):
            month_number = today.month - offset
            year = today.year
            while month_number <= 0:
                month_number += 12
                year -= 1
            chart_months.append((year, month_number))
        first_year, first_month = chart_months[0]
        revenue_rows = FinancialTransaction.objects.filter(
            kind=FinancialTransaction.Type.TUITION,
            transaction_date__gte=date(first_year, first_month, 1),
        ).values("transaction_date__year", "transaction_date__month").annotate(total=Sum("amount"))
        revenue_by_month = {
            (row["transaction_date__year"], row["transaction_date__month"]): float(row["total"] or 0)
            for row in revenue_rows
        }
        registration_rows = User.objects.filter(
            role=User.Role.STUDENT,
            date_joined__date__gte=date(first_year, first_month, 1),
        ).values("date_joined__year", "date_joined__month").annotate(total=Count("id"))
        registrations_by_month = {
            (row["date_joined__year"], row["date_joined__month"]): row["total"]
            for row in registration_rows
        }
        month_labels = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]
        monthly_revenue = [
            {"year": year, "month": month, "label": month_labels[month - 1], "revenue": revenue_by_month.get((year, month), 0)}
            for year, month in chart_months
        ]
        student_registrations = [
            {"year": year, "month": month, "label": month_labels[month - 1], "students": registrations_by_month.get((year, month), 0)}
            for year, month in chart_months
        ]
        attendance_rows = AttendanceRecord.objects.filter(
            date__year=today.year, date__month=today.month
        ).values("status").annotate(total=Count("id"))
        attendance = {row["status"]: row["total"] for row in attendance_rows}
        attendance_total = sum(attendance.values())
        payment_rows = TuitionPayment.objects.filter(
            created_at__year=today.year, created_at__month=today.month
        ).values("status").annotate(total=Count("id"))
        payment_status = {row["status"]: row["total"] for row in payment_rows}
        return Response({
            "metrics": {
                "total_students": students.count(),
                "active_students": active_students,
                "total_teachers": teachers,
                "total_groups": groups,
                "available_courses": Course.objects.filter(active=True).count(),
                "payments_this_month": FinancialTransaction.objects.filter(
                    kind="tuition", transaction_date__year=today.year, transaction_date__month=today.month
                ).aggregate(total=Sum("amount"))["total"] or 0,
                "outstanding_payments": outstanding,
                "pending_payment_verifications": pending,
                "pending_shop_orders": ShopOrder.objects.filter(status="pending").count(),
            },
            "recent_activities": [],
            "charts": {
                "monthly_revenue": monthly_revenue,
                "student_registrations": student_registrations,
                "attendance": {
                    "present": attendance.get(AttendanceRecord.Status.PRESENT, 0),
                    "absent": attendance.get(AttendanceRecord.Status.ABSENT, 0),
                    "excused": attendance.get(AttendanceRecord.Status.EXCUSED, 0),
                    "total": attendance_total,
                },
                "payment_status": {
                    "approved": payment_status.get(TuitionPayment.Status.APPROVED, 0),
                    "pending": payment_status.get(TuitionPayment.Status.PENDING, 0),
                    "rejected": payment_status.get(TuitionPayment.Status.REJECTED, 0),
                    "blocked_students": students.filter(Q(is_active=False) | Q(tuition_restricted=True)).count(),
                },
            },
        })

class OrganizationSettingsView(APIView):
    serializer_class = OrganizationSettingsSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin")

    def get(self, request):
        settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
        return Response(OrganizationSettingsSerializer(settings).data)

    def patch(self, request):
        settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
        serializer = OrganizationSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        audit(request.user, "organization.settings_updated", settings)
        return Response(serializer.data)

class CoinView(APIView):
    serializer_class = SimplePayloadSerializer
    def get(self, request):
        student = request.user
        student_id = request.query_params.get("student")
        if student_id:
            student = get_object_or_404(User, pk=student_id, role="student")
            if request.user.role == "student" and request.user.pk != student.pk:
                raise PermissionDenied()
            if request.user.role == "teacher" and not GroupEnrollment.objects.filter(
                student=student, group__teacher=request.user, active=True
            ).exists():
                raise PermissionDenied()
            if request.user.role not in ("student", "teacher", "director", "admin"):
                raise PermissionDenied()
        transactions = student.coin_transactions.values("id", "student_id", "amount", "reason", "created_at")
        return Response({"balance": coin_balance(student), "transactions": list(transactions)})

    def post(self, request):
        student = get_object_or_404(User, pk=parse_int(request.data.get("student"), "student"), role="student")
        if request.user.role not in ("director", "teacher") or (request.user.role == "teacher" and not GroupEnrollment.objects.filter(student=student, group__teacher=request.user, active=True).exists()): raise PermissionDenied()
        reason = str(request.data.get("reason") or "").strip()
        if not reason: raise ValidationError({"reason": "This field is required."})
        amount = parse_int(request.data.get("amount"), "amount", minimum=1)
        try: row = award_coins(student, amount, request.user, reason, request.data.get("reference", ""))
        except ValueError as exc: raise ValidationError({"detail": str(exc)})
        return Response({"id": row.id, "amount": row.amount, "balance": coin_balance(student)}, status=201)

class PurchaseView(APIView):
    serializer_class = PurchaseSerializer
    def post(self, request):
        if request.user.role != "student": raise PermissionDenied("Only students can purchase from the shop")
        if not request.user.check_password(request.data.get("password", "")): raise ValidationError({"password": "Password confirmation failed"})
        product_id = parse_int(request.data.get("product"), "product")
        quantity = parse_int(request.data.get("quantity"), "quantity", default=1, minimum=1)
        try: order = purchase_product(request.user, product_id, quantity)
        except ShopProduct.DoesNotExist: raise ValidationError({"product": "Product not found."})
        except ValueError as exc: raise ValidationError({"detail": str(exc)})
        return Response({"id": order.id, "status": order.status}, status=201)

class ShopOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin", "student")
    requires_learning_access = False
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return ShopOrder.objects.none()
        qs = ShopOrder.objects.select_related("student", "product", "decided_by").order_by("-created_at")
        return qs.filter(student=self.request.user) if self.request.user.role == "student" else qs
    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.filter_queryset(self.get_queryset()))
        rows = page if page is not None else self.get_queryset()
        data = [{"id": order.pk, "student": order.student_id, "student_name": order.student.get_full_name(), "product": order.product_id,
                 "product_name": order.product.name, "quantity": order.quantity, "unit_price": order.unit_price,
                 "status": order.status, "created_at": order.created_at} for order in rows]
        return self.get_paginated_response(data) if page is not None else Response(data)
    def retrieve(self, request, *args, **kwargs):
        order = self.get_object()
        return Response({"id": order.pk, "student": order.student_id, "student_name": order.student.get_full_name(), "product": order.product_id,
                         "product_name": order.product.name, "quantity": order.quantity, "unit_price": order.unit_price,
                         "status": order.status, "created_at": order.created_at})
    @action(detail=True, methods=["patch"], url_path="status")
    @transaction.atomic
    def update_status(self, request, pk=None):
        if request.user.role not in ("director", "admin"):
            raise PermissionDenied()
        order = get_object_or_404(
            ShopOrder.objects.select_for_update().select_related("student", "product"),
            pk=pk,
        )
        next_status = request.data.get("status")
        allowed = {
            ShopOrder.Status.PENDING: {ShopOrder.Status.APPROVED, ShopOrder.Status.REJECTED},
            ShopOrder.Status.APPROVED: {ShopOrder.Status.FULFILLED, ShopOrder.Status.REJECTED},
        }
        if next_status not in allowed.get(order.status, set()):
            raise ValidationError({"status": "This order status transition is not allowed."})
        if next_status == ShopOrder.Status.REJECTED:
            order.product.stock += order.quantity
            order.product.save(update_fields=["stock"])
            CoinTransaction.objects.create(
                student=order.student,
                amount=order.unit_price * order.quantity,
                reason=f"Shop order #{order.pk} refund",
                created_by=request.user,
            )
        order.status = next_status
        order.decided_by = request.user
        order.save(update_fields=["status", "decided_by"])
        audit(request.user, "shop.order_status_updated", order, {"status": next_status})
        return Response({
            "id": order.pk,
            "student": order.student_id,
            "student_name": order.student.get_full_name(),
            "product": order.product_id,
            "product_name": order.product.name,
            "quantity": order.quantity,
            "unit_price": order.unit_price,
            "status": order.status,
            "created_at": order.created_at,
        })

class ReportView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin")
    def get(self, request):
        month = parse_int(request.query_params.get("month"), "month", default=timezone.localdate().month, minimum=1, maximum=12)
        year = parse_int(request.query_params.get("year"), "year", default=timezone.localdate().year, minimum=2000, maximum=2100)
        teacher_id = request.query_params.get("teacher")
        course_id = request.query_params.get("course")
        group_id = request.query_params.get("group")
        enrollments = GroupEnrollment.objects.filter(active=True)
        if teacher_id:
            enrollments = enrollments.filter(group__teacher_id=teacher_id)
        if course_id:
            enrollments = enrollments.filter(group__course_id=course_id)
        if group_id:
            enrollments = enrollments.filter(group_id=group_id)
        student_ids = enrollments.values_list("student_id", flat=True).distinct()
        transactions = FinancialTransaction.objects.filter(
            kind=FinancialTransaction.Type.TUITION,
            transaction_date__year=year,
            transaction_date__month=month,
        )
        if teacher_id or course_id or group_id:
            transactions = transactions.filter(student_id__in=student_ids)
        revenue_by_method = {
            row["payment__method"] or "other": row["total"] or Decimal("0.00")
            for row in transactions.values("payment__method").annotate(total=Sum("amount"))
        }
        revenue = sum(revenue_by_method.values(), Decimal("0.00"))
        students = User.objects.filter(role=User.Role.STUDENT)
        if teacher_id or course_id or group_id:
            students = students.filter(pk__in=student_ids)
        attendance_qs = AttendanceRecord.objects.filter(date__year=year, date__month=month)
        if teacher_id:
            attendance_qs = attendance_qs.filter(lesson__teacher_id=teacher_id)
        if course_id:
            attendance_qs = attendance_qs.filter(group__course_id=course_id)
        if group_id:
            attendance_qs = attendance_qs.filter(group_id=group_id)
        attendance = {row["status"]: row["count"] for row in attendance_qs.values("status").annotate(count=Count("id"))}
        total_attendance = sum(attendance.values())
        period_students = students.filter(date_joined__year=year, date_joined__month=month).count()
        active_students = students.filter(is_active=True, tuition_restricted=False).count()
        blocked_students = students.filter(Q(is_active=False) | Q(tuition_restricted=True)).count()
        teachers = User.objects.filter(role=User.Role.TEACHER, is_active=True)
        groups = TeachingGroup.objects.filter(active=True)
        if teacher_id:
            teachers = teachers.filter(pk=teacher_id)
            groups = groups.filter(teacher_id=teacher_id)
        if course_id:
            groups = groups.filter(course_id=course_id)
        if group_id:
            groups = groups.filter(pk=group_id)
        teacher_salary = sum(
            (calculate_salary(teacher, year, month).calculated_salary for teacher in teachers),
            Decimal("0.00"),
        )
        return Response({
            "year": year,
            "month": month,
            "tuition_collected": str(revenue),
            "revenue_by_method": {key: str(value) for key, value in revenue_by_method.items()},
            "students": {
                "new": period_students,
                "active": active_students,
                "blocked": blocked_students,
                "total": students.count(),
            },
            "teachers": teachers.count(),
            "teacher_salary": str(teacher_salary),
            "groups": groups.count(),
            "attendance": {
                "present": attendance.get(AttendanceRecord.Status.PRESENT, 0),
                "absent": attendance.get(AttendanceRecord.Status.ABSENT, 0),
                "excused": attendance.get(AttendanceRecord.Status.EXCUSED, 0),
                "total": total_attendance,
            },
        })

class SalaryView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director",)
    def get(self, request):
        year = parse_int(request.query_params.get("year"), "year", default=timezone.localdate().year, minimum=2000, maximum=2100)
        month = parse_int(request.query_params.get("month"), "month", default=timezone.localdate().month, minimum=1, maximum=12)
        rows = []
        teacher_filter = request.query_params.get("teacher")
        teachers = User.objects.filter(role="teacher", is_active=True).order_by("last_name", "first_name")
        if teacher_filter: teachers = teachers.filter(pk=parse_int(teacher_filter, "teacher"))
        for teacher in teachers:
            period = calculate_salary(teacher, year, month)
            paid = period.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            rows.append({"teacher_id": teacher.pk, "teacher": teacher.get_full_name(), "year": year, "month": month,
                "eligible_tuition": str(period.eligible_tuition), "absence_adjustments": str(period.absence_adjustments),
                "percentage": str(period.percentage), "calculated_salary": str(period.calculated_salary),
                "paid": str(paid), "remaining": str(period.calculated_salary-paid), "finalized": period.finalized, "period_id": period.pk})
        return Response(rows)
    def post(self, request):
        teacher = get_object_or_404(User, pk=parse_int(request.data.get("teacher"), "teacher"), role="teacher")
        year = parse_int(request.data.get("year"), "year", minimum=2000, maximum=2100)
        month = parse_int(request.data.get("month"), "month", minimum=1, maximum=12)
        period = calculate_salary(teacher, year, month, finalize=True)
        return Response({"id": period.id, "teacher": teacher.get_full_name(), "calculated_salary": str(period.calculated_salary), "finalized": period.finalized})

class SalaryPaymentView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director",)
    def post(self, request):
        period = get_object_or_404(TeacherSalaryPeriod, pk=parse_int(request.data.get("period"), "period"))
        try:
            payment = pay_salary(period, Decimal(request.data.get("amount", "0")), request.user, request.data.get("reference", ""))
        except (ValueError, ArithmeticError) as exc:
            raise ValidationError({"detail": str(exc)})
        return Response({"id": payment.id, "period": period.id, "amount": str(payment.amount), "paid_at": payment.paid_at}, status=201)

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related("lesson", "created_by")
    serializer_class = AssignmentSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin", "teacher", "student")
    write_roles = ("director", "admin", "teacher")
    def get_serializer_class(self):
        return AssignmentSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == "teacher": return qs.filter(lesson__teacher=self.request.user)
        if self.request.user.role == "student": return qs.filter(lesson__group__enrollments__student=self.request.user, lesson__status="completed").distinct()
        return qs
    def check_lesson_owner(self, lesson):
        if self.request.user.role == "teacher" and lesson.teacher_id != self.request.user.pk: raise PermissionDenied()
    def perform_create(self, serializer):
        self.check_lesson_owner(serializer.validated_data["lesson"])
        serializer.save(created_by=self.request.user)
    def perform_update(self, serializer):
        self.check_lesson_owner(serializer.validated_data.get("lesson", serializer.instance.lesson))
        serializer.save()

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSubmissionSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]
    permission_classes = [RolePermission]
    roles = ("director", "admin", "teacher", "student")
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return AssignmentSubmission.objects.none()
        qs = AssignmentSubmission.objects.select_related("assignment__lesson__group", "student", "reviewed_by").order_by("-submitted_at", "id")
        user = self.request.user
        if user.role == "student": return qs.filter(student=user)
        if user.role == "teacher": return qs.filter(assignment__lesson__teacher=user)
        return qs
    def create(self, request, *args, **kwargs):
        if request.user.role != "student": raise PermissionDenied("Only students can submit assignments")
        assignment = get_object_or_404(Assignment.objects.select_related("lesson__group"), pk=request.data.get("assignment"))
        if assignment.lesson.status != Lesson.Status.COMPLETED or not assignment.lesson.group.enrollments.filter(student=request.user, active=True).exists():
            raise PermissionDenied("Assignment is not available to this student")
        if assignment.due_at and assignment.due_at < timezone.now(): raise ValidationError({"detail": "Assignment deadline has passed"})
        text = request.data.get("text") or ""
        github_url = (request.data.get("github_url") or "").strip()
        image = request.FILES.get("image")
        errors = validate_submission(assignment, text, github_url, image)
        if errors: raise ValidationError(errors)
        if AssignmentSubmission.objects.filter(assignment=assignment, student=request.user, score__isnull=False).exists():
            raise ValidationError({"detail": "This submission has already been graded and can no longer be changed."})
        submission, created = AssignmentSubmission.objects.update_or_create(assignment=assignment, student=request.user,
            defaults={"text": text, "github_url": github_url, "image": image})
        return Response(AssignmentSubmissionSerializer(submission).data, status=201 if created else 200)
    def partial_update(self, request, *args, **kwargs):
        submission = self.get_object()
        if request.user.role not in ("director", "teacher") or (request.user.role == "teacher" and submission.assignment.lesson.teacher_id != request.user.pk):
            raise PermissionDenied()
        if "score" in request.data: submission.score = parse_decimal(request.data["score"], "score", minimum=Decimal("0"), maximum=Decimal("9999.99"))
        if "feedback" in request.data: submission.feedback = request.data["feedback"]
        submission.reviewed_by = request.user
        submission.save(update_fields=["score", "feedback", "reviewed_by"])
        audit(request.user, "assignment.reviewed", submission)
        return Response(AssignmentSubmissionSerializer(submission).data)

class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quiz.objects.all()
    def get_serializer_class(self):
        return QuizSerializer
    def get_queryset(self):
        qs = Quiz.objects.select_related("lesson")
        if self.request.user.role == "student": return qs.filter(lesson__group__enrollments__student=self.request.user, lesson__topics__taught_at__isnull=False).distinct()
        if self.request.user.role == "teacher": return qs.filter(lesson__teacher=self.request.user)
        return qs
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        if request.user.role != "student" or not quiz.lesson.group.enrollments.filter(student=request.user, active=True).exists(): raise PermissionDenied()
        try: attempt = submit_quiz(quiz, request.user, request.data.get("answers", {}))
        except ValueError as exc: raise ValidationError({"detail": str(exc)})
        return Response({"id": attempt.id, "score_percent": attempt.score_percent, "passed": attempt.passed}, status=201)
