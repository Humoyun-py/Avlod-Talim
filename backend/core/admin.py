from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Avlod Ta'lim", {"fields": ("role", "phone", "student_id", "tuition_restricted")}),)

for model in [Course, TeachingGroup, GroupEnrollment, CourseMonth, Lesson, LessonTopic, AttendanceRecord, TuitionPeriod, TuitionPayment, FinancialTransaction, TeacherSalaryPeriod, TeacherSalaryPayment, CoinTransaction, ShopProduct, ShopOrder, Assignment, AssignmentSubmission, Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer, Notification, AuditLog, SystemSetting]:
    admin.site.register(model)
