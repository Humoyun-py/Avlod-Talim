from decimal import Decimal
from django.contrib.auth import authenticate
from django.db.models import Sum, Count
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
        if set(request.data.keys()) - {"first_name", "last_name", "email", "phone"}:
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
        validate_password(password, request.user)
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
        if role == "teacher":
            role = "teacher"
        queryset = User.objects.filter(role=role).prefetch_related("enrollments__group__course", "enrollments__group__teacher")
        if self.request.user.role == "admin" and role == "teacher":
            return User.objects.none()
        return queryset
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

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [RolePermission]
    filterset_fields = ["course", "teacher", "active"]
    roles = ("director", "admin", "teacher", "student")
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
        if "student_ids" in self.request.data:
            ids = [int(value) for value in self.request.data.get("student_ids", [])]
            students = list(User.objects.filter(pk__in=ids, role="student", is_active=True))
            if len(students) != len(set(ids)):
                raise ValidationError({"student_ids": "One or more students are invalid"})
            create_enrollment(group, students, self.request.user)
        audit(self.request.user, "group.updated", group)
    @action(detail=True, methods=["get", "post"])
    def students(self, request, pk=None):
        group = self.get_object()
        if request.method == "POST":
            if request.user.role not in ("director", "admin"):
                raise PermissionDenied()
            ids = request.data.get("student_ids", [])
            students = list(User.objects.filter(pk__in=ids, role="student", is_active=True))
            if len(students) != len(set(ids)):
                raise ValidationError({"student_ids": "One or more students are invalid"})
            create_enrollment(group, students, request.user)
            return Response({"group_id": group.pk, "enrolled_count": len(students)}, status=201)
        return Response(UserSerializer(User.objects.filter(enrollments__group=group, enrollments__active=True), many=True).data)

    @action(detail=False, methods=["post"], url_path="enrollments")
    def enrollments(self, request):
        group = get_object_or_404(TeachingGroup, pk=request.data.get("group"))
        if request.user.role not in ("director", "admin"):
            raise PermissionDenied()
        ids = request.data.get("student_ids", [])
        students = list(User.objects.filter(pk__in=ids, role="student", is_active=True))
        if len(students) != len(set(ids)):
            raise ValidationError({"student_ids": "One or more students are invalid"})
        enrollments = create_enrollment(group, students, request.user)
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
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return Lesson.objects.none()
        qs = Lesson.objects.select_related("course", "group", "teacher").prefetch_related("topics")
        user = self.request.user
        if user.role == "teacher": qs = qs.filter(teacher=user)
        if user.role == "student": qs = qs.filter(group__enrollments__student=user, group__enrollments__active=True, status=Lesson.Status.COMPLETED).distinct()
        return qs
    def perform_create(self, serializer):
        if self.request.user.role not in ("director", "admin", "teacher"):
            raise PermissionDenied()
        if self.request.user.role == "teacher" and not TeachingGroup.objects.filter(pk=self.request.data.get("group"), teacher=self.request.user).exists():
            raise PermissionDenied("You can create lessons only for your assigned groups")
        lesson = serializer.save(teacher=self.request.user if self.request.user.role == "teacher" else serializer.validated_data.get("teacher"))
        if lesson.group.teacher_id != lesson.teacher_id: raise PermissionDenied("Lesson teacher must be assigned to the group")
        if lesson.title:
            LessonTopic.objects.get_or_create(lesson=lesson, title=lesson.title)
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
        student = User.objects.get(pk=request.data.get("student"), role="student")
        payment = register_payment(student, Decimal(request.data["amount"]), request.data["method"], request.user, request.data.get("reference", ""), request.FILES.get("receipt"), request.data.get("notes", ""))
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
        return Response(PaymentSerializer(review_payment(self.get_object(), request.user, True)).data)
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if request.user.role not in ("director", "admin"): raise PermissionDenied()
        return Response(PaymentSerializer(review_payment(self.get_object(), request.user, False, request.data.get("reason", ""))).data)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = ShopProduct.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [StaffWritePermission]
    roles = ("director", "admin", "student")
    def get_queryset(self):
        return ShopProduct.objects.filter(active=True) if self.request.user.role == "student" else ShopProduct.objects.all()

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
        students = User.objects.filter(role="student", is_active=True).count()
        teachers = User.objects.filter(role="teacher", is_active=True).count()
        groups = TeachingGroup.objects.filter(active=True).count()
        pending = TuitionPayment.objects.filter(status="pending").count()
        if request.user.role == "admin":
            return Response({"students": students, "teachers": teachers, "groups": groups, "pending_payments": pending})
        outstanding = Decimal("0.00")
        for period in TuitionPeriod.objects.filter(closed=False).values("student_id", "year", "month", "amount_due"):
            paid = FinancialTransaction.objects.filter(student_id=period["student_id"], kind=FinancialTransaction.Type.TUITION,
                transaction_date__year=period["year"], transaction_date__month=period["month"]).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            outstanding += max(Decimal("0.00"), period["amount_due"] - paid)
        return Response({"metrics": {"total_students": students, "active_students": students, "total_groups": groups, "available_courses": Course.objects.filter(active=True).count(), "payments_this_month": FinancialTransaction.objects.filter(kind="tuition", transaction_date__year=timezone.localdate().year, transaction_date__month=timezone.localdate().month).aggregate(total=Sum("amount"))["total"] or 0, "outstanding_payments": outstanding, "pending_payment_verifications": pending, "pending_shop_orders": ShopOrder.objects.filter(status="pending").count()}, "recent_activities": [], "charts": {"monthly_revenue": [], "student_registrations": [], "payment_methods_breakdown": {}, "shop_order_status": {}}})

class CoinView(APIView):
    serializer_class = SimplePayloadSerializer
    def get(self, request): return Response({"balance": coin_balance(request.user), "transactions": list(request.user.coin_transactions.values("id", "amount", "reason", "created_at"))})
    def post(self, request):
        student = get_object_or_404(User, pk=request.data.get("student"), role="student")
        if request.user.role not in ("director", "teacher") or (request.user.role == "teacher" and not GroupEnrollment.objects.filter(student=student, group__teacher=request.user, active=True).exists()): raise PermissionDenied()
        row = award_coins(student, int(request.data["amount"]), request.user, request.data["reason"], request.data.get("reference", "")); return Response({"id": row.id, "amount": row.amount, "balance": coin_balance(student)}, status=201)

class PurchaseView(APIView):
    serializer_class = PurchaseSerializer
    def post(self, request):
        if request.user.role != "student": raise PermissionDenied("Only students can purchase from the shop")
        if not request.user.check_password(request.data.get("password", "")): raise ValidationError({"password": "Password confirmation failed"})
        try: order = purchase_product(request.user, request.data.get("product"), int(request.data.get("quantity", 1)))
        except ValueError as exc: raise ValidationError({"detail": str(exc)})
        return Response({"id": order.id, "status": order.status}, status=201)

class ShopOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin", "student")
    requires_learning_access = False
    def get_queryset(self):
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

class ReportView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director", "admin")
    def get(self, request):
        month, year = int(request.query_params.get("month", timezone.localdate().month)), int(request.query_params.get("year", timezone.localdate().year))
        revenue = FinancialTransaction.objects.filter(kind="tuition", transaction_date__year=year, transaction_date__month=month).aggregate(total=Sum("amount"))["total"] or 0
        attendance = AttendanceRecord.objects.filter(date__year=year, date__month=month).values("status").annotate(count=Count("id"))
        return Response({"year": year, "month": month, "tuition_collected": str(revenue), "attendance": list(attendance)})

class SalaryView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director",)
    def get(self, request):
        year, month = int(request.query_params.get("year", timezone.localdate().year)), int(request.query_params.get("month", timezone.localdate().month))
        rows = []
        teacher_filter = request.query_params.get("teacher")
        teachers = User.objects.filter(role="teacher", is_active=True).order_by("last_name", "first_name")
        if teacher_filter: teachers = teachers.filter(pk=teacher_filter)
        for teacher in teachers:
            period = calculate_salary(teacher, year, month)
            paid = period.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            rows.append({"teacher_id": teacher.pk, "teacher": teacher.get_full_name(), "year": year, "month": month,
                "eligible_tuition": str(period.eligible_tuition), "absence_adjustments": str(period.absence_adjustments),
                "percentage": str(period.percentage), "calculated_salary": str(period.calculated_salary),
                "paid": str(paid), "remaining": str(period.calculated_salary-paid), "finalized": period.finalized, "period_id": period.pk})
        return Response(rows)
    def post(self, request):
        teacher = get_object_or_404(User, pk=request.data.get("teacher"), role="teacher")
        period = calculate_salary(teacher, int(request.data["year"]), int(request.data["month"]), finalize=True)
        return Response({"id": period.id, "teacher": teacher.get_full_name(), "calculated_salary": str(period.calculated_salary), "finalized": period.finalized})

class SalaryPaymentView(APIView):
    serializer_class = SimplePayloadSerializer
    permission_classes = [RolePermission]
    roles = ("director",)
    def post(self, request):
        period = get_object_or_404(TeacherSalaryPeriod, pk=request.data.get("period"))
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
    def get_serializer_class(self):
        return AssignmentSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == "teacher": return qs.filter(lesson__teacher=self.request.user)
        if self.request.user.role == "student": return qs.filter(lesson__group__enrollments__student=self.request.user, lesson__status="completed").distinct()
        return qs
    def perform_create(self, serializer):
        if self.request.user.role not in ("director", "admin", "teacher"): raise PermissionDenied()
        lesson = serializer.validated_data["lesson"]
        if self.request.user.role == "teacher" and lesson.teacher_id != self.request.user.pk: raise PermissionDenied()
        serializer.save(created_by=self.request.user)

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
        if not request.data.get("text") and not request.FILES.get("file"): raise ValidationError({"detail": "Provide text or an uploaded file"})
        submission, created = AssignmentSubmission.objects.update_or_create(assignment=assignment, student=request.user,
            defaults={"text": request.data.get("text", ""), "file": request.FILES.get("file")})
        return Response(AssignmentSubmissionSerializer(submission).data, status=201 if created else 200)
    def partial_update(self, request, *args, **kwargs):
        submission = self.get_object()
        if request.user.role not in ("director", "teacher") or (request.user.role == "teacher" and submission.assignment.lesson.teacher_id != request.user.pk):
            raise PermissionDenied()
        if "score" in request.data: submission.score = request.data["score"]
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
