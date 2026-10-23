from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CourseViewSet, GroupViewSet, LessonViewSet, AttendanceViewSet, PaymentViewSet, ProductViewSet, NotificationViewSet, DashboardView, CoinView, PurchaseView, ShopOrderViewSet, ReportView, SalaryView, SalaryPaymentView, AssignmentViewSet, SubmissionViewSet, QuizViewSet
router = DefaultRouter()
router.register("students", UserViewSet, basename="students")
router.register("courses", CourseViewSet)
router.register("groups", GroupViewSet, basename="groups")
router.register("lessons", LessonViewSet, basename="lessons")
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register("payments", PaymentViewSet, basename="payments")
router.register("shop/products", ProductViewSet)
router.register("shop/orders", ShopOrderViewSet, basename="shop-orders")
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("assignments", AssignmentViewSet, basename="assignments")
router.register("submissions", SubmissionViewSet, basename="submissions")
router.register("quizzes", QuizViewSet, basename="quizzes")
urlpatterns = [path("", include(router.urls)), path("dashboard/", DashboardView.as_view()), path("coins/", CoinView.as_view()), path("shop/purchase/", PurchaseView.as_view()), path("reports/monthly/", ReportView.as_view()), path("salaries/", SalaryView.as_view()), path("salaries/payments/", SalaryPaymentView.as_view())]
