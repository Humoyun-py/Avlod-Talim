from datetime import date
from decimal import Decimal
from unittest.mock import patch
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from .models import *
from .services import *

class BootstrapStaffAccountsTest(TestCase):
    env_keys = (
        "BOOTSTRAP_ADMIN_USERNAME",
        "BOOTSTRAP_ADMIN_EMAIL",
        "BOOTSTRAP_ADMIN_PASSWORD",
        "BOOTSTRAP_ADMIN_RESET_PASSWORD",
        "BOOTSTRAP_DIRECTOR_USERNAME",
        "BOOTSTRAP_DIRECTOR_EMAIL",
        "BOOTSTRAP_DIRECTOR_PASSWORD",
        "BOOTSTRAP_DIRECTOR_RESET_PASSWORD",
    )

    def set_bootstrap_env(self, values):
        cleared = dict.fromkeys(self.env_keys, "")
        with patch.dict("os.environ", {**cleared, **values}, clear=False):
            call_command("bootstrap_staff_accounts")

    def test_creates_admin_and_director_with_configured_roles(self):
        variables = {
            "BOOTSTRAP_ADMIN_USERNAME": "initial-admin",
            "BOOTSTRAP_ADMIN_EMAIL": "admin@example.test",
            "BOOTSTRAP_ADMIN_PASSWORD": "A-long-unique-admin-password-2026!",
            "BOOTSTRAP_DIRECTOR_USERNAME": "initial-director",
            "BOOTSTRAP_DIRECTOR_EMAIL": "director@example.test",
            "BOOTSTRAP_DIRECTOR_PASSWORD": "A-long-unique-director-password-2026!",
        }
        self.set_bootstrap_env(variables)

        admin = User.objects.get(username="initial-admin")
        director = User.objects.get(username="initial-director")
        self.assertEqual(admin.role, User.Role.ADMIN)
        self.assertEqual(director.role, User.Role.DIRECTOR)
        self.assertTrue(admin.check_password(variables["BOOTSTRAP_ADMIN_PASSWORD"]))
        self.assertTrue(director.check_password(variables["BOOTSTRAP_DIRECTOR_PASSWORD"]))
        client = APIClient()
        for username, password, role in (
            ("initial-admin", variables["BOOTSTRAP_ADMIN_PASSWORD"], "admin"),
            ("initial-director", variables["BOOTSTRAP_DIRECTOR_PASSWORD"], "director"),
        ):
            response = client.post(
                "/api/v1/auth/staff/login/",
                {"username": username, "password": password},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["user"]["role"], role)

    def test_rerun_does_not_change_existing_password(self):
        original_password = "Original-long-and-unique-password-2026!"
        user = User.objects.create_user(
            username="initial-admin",
            password=original_password,
            role=User.Role.ADMIN,
        )
        variables = {
            "BOOTSTRAP_ADMIN_USERNAME": "initial-admin",
            "BOOTSTRAP_ADMIN_EMAIL": "admin@example.test",
            "BOOTSTRAP_ADMIN_PASSWORD": "Different-long-and-unique-password-2026!",
        }
        self.set_bootstrap_env(variables)

        user.refresh_from_db()
        self.assertTrue(user.check_password(original_password))
        self.assertFalse(user.check_password(variables["BOOTSTRAP_ADMIN_PASSWORD"]))

    def test_explicit_reset_replaces_existing_password_for_the_same_role_account(self):
        old_password = "Old-long-unique-director-password-2026!"
        new_password = "Brand-new-unique-director-password-2026!"
        user = User.objects.create_user(
            username="existing-director",
            password=old_password,
            email="director@example.test",
            role=User.Role.DIRECTOR,
        )
        self.set_bootstrap_env(
            {
                "BOOTSTRAP_DIRECTOR_USERNAME": "existing-director",
                "BOOTSTRAP_DIRECTOR_EMAIL": "director@example.test",
                "BOOTSTRAP_DIRECTOR_PASSWORD": new_password,
                "BOOTSTRAP_DIRECTOR_RESET_PASSWORD": "true",
            }
        )

        user.refresh_from_db()
        self.assertFalse(user.check_password(old_password))
        self.assertTrue(user.check_password(new_password))

    def test_rejects_partial_configuration_and_existing_wrong_role(self):
        with self.assertRaises(CommandError):
            self.set_bootstrap_env({"BOOTSTRAP_ADMIN_USERNAME": "initial-admin"})

        User.objects.create_user(username="initial-admin", password="not-used", role=User.Role.STUDENT)
        variables = {
            "BOOTSTRAP_ADMIN_USERNAME": "initial-admin",
            "BOOTSTRAP_ADMIN_EMAIL": "admin@example.test",
            "BOOTSTRAP_ADMIN_PASSWORD": "A-long-unique-admin-password-2026!",
        }
        with self.assertRaises(CommandError):
            self.set_bootstrap_env(variables)

@override_settings(SECURE_SSL_REDIRECT=False)
class DomainTestCase(TestCase):
    def setUp(self):
        self.director = User.objects.create_user(username="director", password="DirectorPass123!", role="director", first_name="Dir")
        self.admin = User.objects.create_user(username="admin", password="AdminPass123!", role="admin")
        self.teacher = User.objects.create_user(username="teacher", password="TeacherPass123!", role="teacher", first_name="T", last_name="One")
        self.student = User.objects.create_user(username="student-12345678", password="StudPass123!", role="student", student_id="12345678", first_name="S")
        self.other_student = User.objects.create_user(username="student-87654321", password="OtherPass123!", role="student", student_id="87654321")
        self.course = Course.objects.create(name="Math", duration_months=4, monthly_fee=Decimal("300000"))
        self.group = TeachingGroup.objects.create(name="A", course=self.course, teacher=self.teacher)
        self.enrollment = GroupEnrollment.objects.create(student=self.student, group=self.group, monthly_fee=Decimal("300000"))
        self.client = APIClient()

    def login(self, user):
        self.client.force_authenticate(user)

    def test_staff_and_student_login_and_student_restriction(self):
        response = self.client.post("/api/v1/auth/staff/login/", {"username": "teacher", "password": "TeacherPass123!"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["role"], "teacher")
        response = self.client.post("/api/v1/auth/student/login/", {"student_id": "12345678", "password": "StudPass123!"})
        self.assertEqual(response.status_code, 200)
        self.student.tuition_restricted = True; self.student.save()
        response = self.client.post("/api/v1/auth/student/login/", {"student_id": "12345678", "password": "StudPass123!"})
        self.assertEqual(response.status_code, 401)

    def test_student_cannot_read_other_students_or_unassigned_groups(self):
        self.login(self.student)
        response = self.client.get("/api/v1/students/" + str(self.other_student.pk) + "/")
        self.assertEqual(response.status_code, 403)
        own = self.client.get("/api/v1/groups/")
        self.assertEqual(own.status_code, 200)
        self.assertEqual(len(own.data["results"]), 1)
        self.login(self.teacher)
        self.assertEqual(self.client.get("/api/v1/groups/").data["results"][0]["id"], self.group.pk)

    def test_student_ids_are_unique_and_hash_password(self):
        first, password = User.new_student_credentials()
        self.assertEqual(len(first), 8); self.assertTrue(first.isdigit())
        self.assertEqual(len(password), 6)
        created = User.objects.create_user(username=f"student-{first}", student_id=first, password=password, role="student")
        self.assertTrue(created.check_password(password))
        with self.assertRaises(Exception):
            User.objects.create_user(username="dupe", student_id=first, password=password, role="student")

    def test_multiple_enrollment_is_atomic_and_rejects_active_duplicate(self):
        second_group = TeachingGroup.objects.create(name="B", course=self.course, teacher=self.teacher)
        with self.assertRaises(ValueError):
            create_enrollment(second_group, [self.other_student, self.student], self.admin)
        self.assertFalse(GroupEnrollment.objects.filter(student=self.other_student, group=second_group).exists())

    def test_attendance_unique_and_correction_audited(self):
        lesson = Lesson.objects.create(course=self.course, group=self.group, number=1, title="Intro", teacher=self.teacher, scheduled_date=date.today())
        record_attendance(lesson, [{"student_id": self.student.pk, "status": "present"}], self.teacher)
        record_attendance(lesson, [{"student_id": self.student.pk, "status": "absent"}], self.teacher)
        self.assertEqual(AttendanceRecord.objects.filter(student=self.student, lesson=lesson).count(), 1)
        self.assertEqual(AttendanceRecord.objects.get(student=self.student, lesson=lesson).status, "absent")
        self.assertTrue(AuditLog.objects.filter(action="attendance.corrected").exists())

    def test_cash_payment_posts_once_and_online_payment_waits_for_approval(self):
        cash = register_payment(self.student, Decimal("100000"), "cash", self.admin, "cash-1")
        self.assertEqual(cash.status, "approved")
        self.assertEqual(FinancialTransaction.objects.filter(payment=cash).count(), 1)
        online = register_payment(self.student, Decimal("200000"), "click", self.admin, "click-1")
        self.assertEqual(online.status, "pending")
        self.assertEqual(FinancialTransaction.objects.filter(payment=online).count(), 0)
        review_payment(online, self.director, True)
        self.assertEqual(FinancialTransaction.objects.filter(payment=online).count(), 1)
        with self.assertRaises(ValueError): review_payment(online, self.director, True)

    def test_verified_payment_reactivates_only_when_due_periods_are_paid(self):
        today = date.today()
        period = TuitionPeriod.objects.create(student=self.student, enrollment=self.enrollment, year=today.year,
            month=today.month, due_date=today, amount_due=Decimal("100000"))
        self.student.tuition_restricted = True; self.student.save()
        partial = register_payment(self.student, Decimal("50000"), "click", self.admin, "part-1")
        review_payment(partial, self.director, True)
        self.student.refresh_from_db()
        self.assertTrue(self.student.tuition_restricted)
        rest = register_payment(self.student, Decimal("50000"), "cash", self.admin, "part-2")
        restore_student_if_current_period_paid(self.student)
        self.student.refresh_from_db()
        self.assertFalse(self.student.tuition_restricted)
        self.assertTrue(Notification.objects.filter(recipient=self.student, kind="account_reactivated").exists())

    def test_salary_excludes_demo_and_applies_40_percent_to_verified_receipts(self):
        today = date.today()
        normal = Lesson.objects.create(course=self.course, group=self.group, number=1, title="Class", teacher=self.teacher, scheduled_date=today, status="completed")
        Lesson.objects.create(course=self.course, group=self.group, number=2, title="Demo", teacher=self.teacher, scheduled_date=today, status="completed", is_demo=True)
        register_payment(self.student, Decimal("300000"), "cash", self.admin, "salary-cash")
        period = calculate_salary(self.teacher, today.year, today.month)
        self.assertEqual(period.percentage, Decimal("40.00"))
        self.assertEqual(period.eligible_tuition, Decimal("300000"))
        self.assertEqual(period.calculated_salary, Decimal("120000.00"))
        period = calculate_salary(self.teacher, today.year, today.month, finalize=True)
        with self.assertRaises(ValueError): pay_salary(period, Decimal("120001"), self.director)
        pay_salary(period, Decimal("50000"), self.director, "salary-1")
        period.calculated_salary = Decimal("100000.00"); period.save()
        with self.assertRaises(ValueError): pay_salary(period, Decimal("50001"), self.director)

    def test_coins_shop_and_insufficient_balance(self):
        product = ShopProduct.objects.create(name="Book", coin_price=20, stock=1, active=True)
        award_coins(self.student, 30, self.teacher, "great work", "award-1")
        order = purchase_product(self.student, product.pk)
        self.assertEqual(order.status, "approved")
        self.assertEqual(coin_balance(self.student), 10)
        with self.assertRaises(ValueError): purchase_product(self.student, product.pk)

    def test_teacher_coin_history_is_limited_to_assigned_students(self):
        award_coins(self.student, 30, self.teacher, "great work", "award-history-1")
        self.login(self.teacher)
        response = self.client.get(f"/api/v1/coins/?student={self.student.pk}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["balance"], 30)
        self.assertEqual(response.data["transactions"][0]["student_id"], self.student.pk)
        self.assertEqual(self.client.get(f"/api/v1/coins/?student={self.other_student.pk}").status_code, 403)

    def test_quiz_server_scoring_and_taught_topic_gate(self):
        lesson = Lesson.objects.create(course=self.course, group=self.group, number=1, title="Topic", teacher=self.teacher, status="completed")
        topic = LessonTopic.objects.create(lesson=lesson, title="Basics")
        quiz = Quiz.objects.create(lesson=lesson, title="Check", created_by=self.teacher, pass_percent=80)
        question = QuizQuestion.objects.create(quiz=quiz, prompt="2+2?", order=1)
        good = QuizOption.objects.create(question=question, text="4", is_correct=True)
        with self.assertRaises(ValueError): submit_quiz(quiz, self.student, {str(question.pk): good.pk})
        topic.taught_at = timezone.now(); topic.save()
        attempt = submit_quiz(quiz, self.student, {str(question.pk): good.pk})
        self.assertEqual(attempt.score_percent, Decimal("100.00")); self.assertTrue(attempt.passed)

    def test_group_and_attendance_api_scope(self):
        self.login(self.other_student)
        self.assertEqual(len(self.client.get("/api/v1/groups/").data["results"]), 0)
        self.login(self.teacher)
        response = self.client.post("/api/v1/attendance/bulk/", {"lesson": 9999, "records": []}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_salary_endpoint_director_only(self):
        self.login(self.admin)
        self.assertEqual(self.client.get("/api/v1/salaries/").status_code, 403)
        self.login(self.director)
        self.assertEqual(self.client.get("/api/v1/salaries/").status_code, 200)

    def test_admin_and_director_dashboard_response_shapes_match(self):
        expected_keys = {"metrics", "recent_activities", "charts"}
        expected_metric_keys = {
            "total_students",
            "active_students",
            "total_groups",
            "available_courses",
            "payments_this_month",
            "outstanding_payments",
            "pending_payment_verifications",
            "pending_shop_orders",
        }

        for user in (self.admin, self.director):
            with self.subTest(role=user.role):
                self.login(user)
                response = self.client.get("/api/v1/dashboard/")

                self.assertEqual(response.status_code, 200)
                self.assertEqual(set(response.data), expected_keys)
                self.assertEqual(set(response.data["metrics"]), expected_metric_keys)

    def test_assignment_submission_and_teacher_review_permissions(self):
        lesson = Lesson.objects.create(course=self.course, group=self.group, number=1, title="Work", teacher=self.teacher, status="completed")
        assignment = Assignment.objects.create(lesson=lesson, title="Homework", created_by=self.teacher)
        self.login(self.student)
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "My answer"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.login(self.other_student)
        self.assertEqual(self.client.get("/api/v1/submissions/").data["count"], 0)
        self.login(self.teacher)
        response = self.client.patch(f"/api/v1/submissions/{response.data['id']}/", {"score": "95.00", "feedback": "Good"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["score"], "95.00")

    def test_salary_payout_endpoint_records_payment_and_prevents_overspend(self):
        period = TeacherSalaryPeriod.objects.create(teacher=self.teacher, year=2026, month=1, finalized=True,
            calculated_salary=Decimal("100000"))
        self.login(self.director)
        response = self.client.post("/api/v1/salaries/payments/", {"period": period.pk, "amount": "40000", "reference": "pay-1"}, format="json")
        self.assertEqual(response.status_code, 201)
        response = self.client.post("/api/v1/salaries/payments/", {"period": period.pk, "amount": "70000"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_pending_payment_cannot_be_seen_by_teacher(self):
        register_payment(self.student, Decimal("100"), "payme", self.admin, "private-pay")
        self.login(self.teacher)
        self.assertEqual(self.client.get("/api/v1/payments/").status_code, 403)
