import re
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import *
from .services import audit, create_enrollment, register_payment

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    enrollments = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name", "email", "phone", "role", "student_id", "is_active", "tuition_restricted", "enrollments"]
        read_only_fields = ["id", "username", "role", "student_id", "is_active", "tuition_restricted"]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_enrollments(self, obj):
        if obj.role != User.Role.STUDENT:
            return []
        rows = obj.enrollments.filter(active=True).select_related("group__course", "group__teacher")
        return [{"group": row.group_id, "group_name": row.group.name,
                 "course": row.group.course_id, "course_name": row.group.course.name,
                 "teacher": row.group.teacher_id, "teacher_name": row.group.teacher.get_full_name(),
                 "monthly_fee": str(row.monthly_fee), "coin_balance": row.student.coin_transactions.aggregate(total=Sum('amount'))['total'] or 0} for row in rows]

class TeacherCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        validate_password(data["password"])
        if data.get("phone") and not re.fullmatch(r"\+?[0-9 ()-]{7,20}", data["phone"]):
            raise serializers.ValidationError({"phone": "Enter a valid phone number"})
        return data
    @transaction.atomic
    def create(self, data):
        data.pop("confirm_password")
        password = data.pop("password")
        user = User.objects.create_user(**data, password=password, role=User.Role.TEACHER)
        audit(self.context["request"].user, "teacher.created", user)
        return user

class StudentCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.filter(active=True))
    group = serializers.PrimaryKeyRelatedField(queryset=TeachingGroup.objects.filter(active=True))
    monthly_fee = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    @transaction.atomic
    def create(self, data):
        course, group = data.pop("course"), data.pop("group")
        if group.course_id != course.pk:
            raise serializers.ValidationError({"group": "Group must belong to the selected course"})
        fee = data.pop("monthly_fee", None) or course.monthly_fee
        student_id, password = User.new_student_credentials()
        user = User.objects.create_user(username=f"student-{student_id}", student_id=student_id, role=User.Role.STUDENT, **data)
        user.set_password(password)
        user.save(update_fields=["password"])
        create_enrollment(group, [user], self.context["request"].user, {str(user.pk): fee})
        user._initial_password = password
        audit(self.context["request"].user, "student.created", user)
        return user
    def to_representation(self, user):
        result = UserSerializer(user).data
        result["initial_password"] = getattr(user, "_initial_password", None)
        return result

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

class GroupSerializer(serializers.ModelSerializer):
    student_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    enrollments = serializers.SerializerMethodField()
    course_name = serializers.CharField(source="course.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.get_full_name", read_only=True)
    class Meta:
        model = TeachingGroup
        fields = ["id", "name", "course", "course_name", "teacher", "teacher_name", "active", "start_date", "end_date", "schedule", "student_ids", "enrollments"]
        read_only_fields = ["enrollments"]
    def get_enrollments(self, group):
        return [{"student": enrollment.student_id, "monthly_fee": enrollment.monthly_fee} for enrollment in group.enrollments.filter(active=True)]
    @transaction.atomic
    def create(self, data):
        student_ids = data.pop("student_ids", [])
        teacher = data["teacher"]
        if teacher.role != "teacher" or not teacher.is_active:
            raise serializers.ValidationError({"teacher": "Select an active teacher"})
        group = TeachingGroup.objects.create(**data)
        students = list(User.objects.filter(pk__in=student_ids, role="student", is_active=True))
        if len(students) != len(set(student_ids)):
            raise serializers.ValidationError({"student_ids": "One or more students are invalid"})
        create_enrollment(group, students, self.context["request"].user)
        return group
    def update(self, instance, data):
        student_ids = data.pop("student_ids", None)
        instance = super().update(instance, data)
        if student_ids is not None:
            students = list(User.objects.filter(pk__in=student_ids, role="student", is_active=True))
            if len(students) != len(set(student_ids)):
                raise serializers.ValidationError({"student_ids": "One or more students are invalid"})
            create_enrollment(instance, students, self.context["request"].user)
        return instance

class LessonSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    topic_id = serializers.SerializerMethodField()
    class Meta:
        model = Lesson
        fields = ["id", "course", "course_name", "group", "group_name", "month", "number", "title", "description", "scheduled_date", "status", "teacher", "is_demo", "topic_id"]
    def get_topic_id(self, obj):
        topic = obj.topics.first()
        return topic.pk if topic else None

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = ["id", "student", "group", "lesson", "date", "status", "recorded_by", "created_at", "updated_at"]
        read_only_fields = ["recorded_by", "created_at", "updated_at"]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TuitionPayment
        fields = ["id", "student", "amount", "method", "status", "receipt", "reference", "notes", "received_by", "reviewed_by", "rejection_reason", "created_at", "reviewed_at"]
        read_only_fields = ["status", "received_by", "reviewed_by", "created_at", "reviewed_at"]

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopProduct
        fields = "__all__"

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "kind", "read_at", "created_at"]
        read_only_fields = fields

class AssignmentSerializer(serializers.ModelSerializer):
    lesson_data = serializers.SerializerMethodField()
    class Meta:
        model = Assignment
        fields = ["id", "lesson", "lesson_data", "title", "description", "due_at", "created_by", "created_at"]
        read_only_fields = ["created_by", "created_at"]
    def get_lesson_data(self, obj):
        return {"group": obj.lesson.group_id, "group_name": obj.lesson.group.name, "course": obj.lesson.course_id}

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = "__all__"

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = ["id", "assignment", "student", "text", "file", "submitted_at", "score", "feedback", "reviewed_by"]
        read_only_fields = ["student", "submitted_at", "score", "feedback", "reviewed_by"]

class SimplePayloadSerializer(serializers.Serializer):
    detail = serializers.CharField(required=False)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    student_id = serializers.CharField(required=False)
    password = serializers.CharField()

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()

class AttendanceBulkSerializer(serializers.Serializer):
    lesson = serializers.IntegerField()
    records = serializers.ListField(child=serializers.DictField())

class PurchaseSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    password = serializers.CharField()
