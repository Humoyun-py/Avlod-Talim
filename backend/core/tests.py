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

    def test_director_cannot_create_teacher_with_username_used_by_any_account(self):
        self.login(self.director)
        response = self.client.post(
            "/api/v1/students/",
            {
                "role": "teacher",
                "first_name": "New",
                "last_name": "Teacher",
                "username": self.student.username.upper(),
                "password": "Teacher-long-and-unique-2026!",
                "confirm_password": "Teacher-long-and-unique-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("already in use", str(response.data["username"]))
        self.assertFalse(User.objects.filter(username="new-teacher").exists())

    def test_director_can_create_teacher(self):
        self.login(self.director)
        response = self.client.post(
            "/api/v1/students/",
            {
                "role": "teacher",
                "first_name": "New",
                "last_name": "Teacher",
                "username": "new-teacher",
                "password": "Teacher-long-and-unique-2026!",
                "confirm_password": "Teacher-long-and-unique-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        teacher = User.objects.get(username="new-teacher")
        self.assertEqual(teacher.role, User.Role.TEACHER)
        self.assertTrue(teacher.check_password("Teacher-long-and-unique-2026!"))

    def test_director_can_create_student_with_group_and_monthly_fee(self):
        self.login(self.director)

        response = self.client.post(
            "/api/v1/students/",
            {
                "first_name": "New",
                "last_name": "Student",
                "phone": "+998 90 123 45 67",
                "course": str(self.course.pk),
                "group": str(self.group.pk),
                "monthly_fee": "250000",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        student = User.objects.get(pk=response.data["id"])
        self.assertEqual(student.role, User.Role.STUDENT)
        self.assertEqual(len(response.data["student_id"]), 8)
        self.assertTrue(response.data["initial_password"])
        self.assertTrue(
            GroupEnrollment.objects.filter(
                student=student,
                group=self.group,
                monthly_fee=Decimal("250000"),
                active=True,
            ).exists()
        )

    def test_student_creation_rejects_group_from_another_course(self):
        other_course = Course.objects.create(
            name="Science",
            duration_months=4,
            monthly_fee=Decimal("300000"),
        )
        other_group = TeachingGroup.objects.create(
            name="Science A",
            course=other_course,
            teacher=self.teacher,
        )
        self.login(self.director)

        response = self.client.post(
            "/api/v1/students/",
            {
                "first_name": "Invalid",
                "last_name": "Enrollment",
                "course": self.course.pk,
                "group": other_group.pk,
                "monthly_fee": "250000",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("group", response.data)
        self.assertFalse(User.objects.filter(first_name="Invalid").exists())

    def test_student_creation_rejects_inactive_course(self):
        self.course.active = False
        self.course.save(update_fields=["active"])
        self.login(self.director)

        response = self.client.post(
            "/api/v1/students/",
            {
                "first_name": "Inactive",
                "last_name": "Course",
                "course": str(self.course.pk),
                "group": str(self.group.pk),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("course", response.data)
        self.assertFalse(User.objects.filter(first_name="Inactive").exists())

    def test_director_can_deactivate_teacher_without_deleting_related_records(self):
        self.login(self.director)

        response = self.client.post(
            f"/api/v1/students/{self.teacher.pk}/deactivate/?role=teacher"
        )

        self.assertEqual(response.status_code, 200)
        self.teacher.refresh_from_db()
        self.assertFalse(self.teacher.is_active)
        self.assertTrue(TeachingGroup.objects.filter(pk=self.group.pk, teacher=self.teacher).exists())
        self.assertTrue(AuditLog.objects.filter(action="user.deactivated", object_id=str(self.teacher.pk)).exists())

    def test_director_can_permanently_delete_student_and_related_records(self):
        lesson = Lesson.objects.create(
            course=self.course,
            group=self.group,
            number=1,
            title="Student history",
            teacher=self.teacher,
            scheduled_date=date.today(),
        )
        record_attendance(
            lesson,
            [{"student_id": self.student.pk, "status": AttendanceRecord.Status.PRESENT}],
            self.teacher,
        )
        TuitionPeriod.objects.create(
            student=self.student,
            enrollment=self.enrollment,
            year=date.today().year,
            month=date.today().month,
            due_date=date.today(),
            amount_due=Decimal("300000"),
        )
        payment = register_payment(
            self.student, Decimal("100000"), "cash", self.admin, "delete-student-payment"
        )
        award_coins(self.student, 30, self.teacher, "award", "delete-student-coins")
        product = ShopProduct.objects.create(name="Delete student product", coin_price=20, stock=1)
        purchase_product(self.student, product.pk)
        self.login(self.director)

        response = self.client.delete(f"/api/v1/students/{self.student.pk}/?role=student")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.student.pk).exists())
        self.assertFalse(GroupEnrollment.objects.filter(pk=self.enrollment.pk).exists())
        self.assertFalse(TuitionPeriod.objects.filter(student_id=self.student.pk).exists())
        self.assertFalse(TuitionPayment.objects.filter(pk=payment.pk).exists())
        self.assertFalse(FinancialTransaction.objects.filter(student_id=self.student.pk).exists())
        self.assertFalse(AttendanceRecord.objects.filter(student_id=self.student.pk).exists())
        self.assertFalse(CoinTransaction.objects.filter(student_id=self.student.pk).exists())
        self.assertFalse(ShopOrder.objects.filter(student_id=self.student.pk).exists())
        self.assertTrue(TeachingGroup.objects.filter(pk=self.group.pk).exists())
        self.assertTrue(Lesson.objects.filter(pk=lesson.pk).exists())

    def test_director_can_permanently_delete_teacher_and_related_records(self):
        lesson = Lesson.objects.create(
            course=self.course,
            group=self.group,
            number=1,
            title="Teacher history",
            teacher=self.teacher,
            scheduled_date=date.today(),
        )
        record_attendance(
            lesson,
            [{"student_id": self.student.pk, "status": AttendanceRecord.Status.PRESENT}],
            self.teacher,
        )
        self.login(self.director)

        response = self.client.delete(f"/api/v1/students/{self.teacher.pk}/?role=teacher")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.teacher.pk).exists())
        self.assertFalse(TeachingGroup.objects.filter(pk=self.group.pk).exists())
        self.assertFalse(Lesson.objects.filter(pk=lesson.pk).exists())
        self.assertFalse(GroupEnrollment.objects.filter(pk=self.enrollment.pk).exists())
        self.assertFalse(AttendanceRecord.objects.filter(lesson_id=lesson.pk).exists())
        self.assertTrue(User.objects.filter(pk=self.student.pk).exists())
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())

    def test_director_can_permanently_delete_course_and_group_tree(self):
        lesson = Lesson.objects.create(
            course=self.course,
            group=self.group,
            number=1,
            title="Course history",
            teacher=self.teacher,
            scheduled_date=date.today(),
        )
        self.login(self.director)

        response = self.client.delete(f"/api/v1/courses/{self.course.pk}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Course.objects.filter(pk=self.course.pk).exists())
        self.assertFalse(TeachingGroup.objects.filter(pk=self.group.pk).exists())
        self.assertFalse(Lesson.objects.filter(pk=lesson.pk).exists())
        self.assertFalse(GroupEnrollment.objects.filter(pk=self.enrollment.pk).exists())
        self.assertTrue(User.objects.filter(pk=self.teacher.pk).exists())
        self.assertTrue(User.objects.filter(pk=self.student.pk).exists())

    def test_director_can_permanently_delete_group_and_learning_history(self):
        lesson = Lesson.objects.create(
            course=self.course,
            group=self.group,
            number=1,
            title="Group history",
            teacher=self.teacher,
            scheduled_date=date.today(),
        )
        assignment = Assignment.objects.create(
            lesson=lesson,
            title="Group assignment",
            created_by=self.teacher,
        )
        submission = AssignmentSubmission.objects.create(
            assignment=assignment,
            student=self.student,
            text="Submission",
        )
        quiz = Quiz.objects.create(
            lesson=lesson,
            title="Group quiz",
            created_by=self.teacher,
        )
        question = QuizQuestion.objects.create(quiz=quiz, prompt="Question", order=1)
        option = QuizOption.objects.create(question=question, text="Answer", is_correct=True)
        attempt = QuizAttempt.objects.create(quiz=quiz, student=self.student)
        answer = QuizAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_option=option,
            is_correct=True,
        )
        record_attendance(
            lesson,
            [{"student_id": self.student.pk, "status": AttendanceRecord.Status.PRESENT}],
            self.teacher,
        )
        self.login(self.director)

        response = self.client.delete(f"/api/v1/groups/{self.group.pk}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(TeachingGroup.objects.filter(pk=self.group.pk).exists())
        self.assertFalse(Lesson.objects.filter(pk=lesson.pk).exists())
        self.assertFalse(GroupEnrollment.objects.filter(pk=self.enrollment.pk).exists())
        self.assertFalse(AttendanceRecord.objects.filter(lesson_id=lesson.pk).exists())
        self.assertFalse(Assignment.objects.filter(pk=assignment.pk).exists())
        self.assertFalse(AssignmentSubmission.objects.filter(pk=submission.pk).exists())
        self.assertFalse(Quiz.objects.filter(pk=quiz.pk).exists())
        self.assertFalse(QuizQuestion.objects.filter(pk=question.pk).exists())
        self.assertFalse(QuizOption.objects.filter(pk=option.pk).exists())
        self.assertFalse(QuizAttempt.objects.filter(pk=attempt.pk).exists())
        self.assertFalse(QuizAnswer.objects.filter(pk=answer.pk).exists())
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())
        self.assertTrue(User.objects.filter(pk=self.student.pk).exists())

    def test_only_director_can_permanently_delete_learning_records(self):
        self.login(self.admin)

        self.assertEqual(
            self.client.delete(f"/api/v1/students/{self.student.pk}/?role=student").status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"/api/v1/students/{self.teacher.pk}/?role=teacher").status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"/api/v1/groups/{self.group.pk}/").status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"/api/v1/courses/{self.course.pk}/").status_code,
            403,
        )
        self.assertTrue(User.objects.filter(pk=self.student.pk).exists())
        self.assertTrue(User.objects.filter(pk=self.teacher.pk).exists())
        self.assertTrue(TeachingGroup.objects.filter(pk=self.group.pk).exists())
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())

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

    def test_director_settings_categories_and_monthly_report_use_api_data(self):
        today = date.today()
        self.login(self.director)

        settings_response = self.client.patch(
            "/api/v1/settings/",
            {"center_name": "Avlod Center", "default_monthly_payment": "450000"},
            format="json",
        )
        self.assertEqual(settings_response.status_code, 200)
        self.assertEqual(
            self.client.get("/api/v1/settings/").data["center_name"],
            "Avlod Center",
        )

        category_response = self.client.post(
            "/api/v1/shop/categories/",
            {"name": "Books"},
            format="json",
        )
        self.assertEqual(category_response.status_code, 201)
        categories = self.client.get("/api/v1/shop/categories/").data["results"]
        self.assertIn(category_response.data["id"], {row["id"] for row in categories})

        Lesson.objects.create(
            course=self.course,
            group=self.group,
            number=1,
            title="Report lesson",
            teacher=self.teacher,
            scheduled_date=today,
            status=Lesson.Status.COMPLETED,
        )
        register_payment(
            self.student,
            Decimal("125000"),
            "cash",
            self.admin,
            "report-cash",
        )
        report_response = self.client.get(
            "/api/v1/reports/monthly/",
            {
                "month": today.month,
                "year": today.year,
                "teacher": self.teacher.pk,
            },
        )
        self.assertEqual(report_response.status_code, 200)
        self.assertEqual(
            Decimal(report_response.data["tuition_collected"]),
            Decimal("125000"),
        )
        self.assertEqual(
            Decimal(report_response.data["teacher_salary"]),
            Decimal("50000"),
        )
        self.assertEqual(report_response.data["students"]["total"], 1)

    def test_director_can_reject_shop_order_and_refund_coins(self):
        product = ShopProduct.objects.create(name="Book", coin_price=20, stock=1, active=True)
        award_coins(self.student, 30, self.teacher, "great work", "award-refund")
        order = purchase_product(self.student, product.pk)
        self.login(self.director)

        response = self.client.patch(
            f"/api/v1/shop/orders/{order.pk}/status/",
            {"status": ShopOrder.Status.REJECTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(coin_balance(self.student), 30)
        product.refresh_from_db()
        self.assertEqual(product.stock, 1)

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

    def test_assigned_teacher_can_start_a_planned_lesson_idempotently(self):
        lesson = Lesson.objects.create(
            course=self.course,
            group=self.group,
            number=1,
            title="Startable lesson",
            teacher=self.teacher,
            status=Lesson.Status.PLANNED,
        )
        self.login(self.teacher)

        response = self.client.post(f"/api/v1/lessons/{lesson.pk}/start/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["status"], Lesson.Status.IN_PROGRESS)
        lesson.refresh_from_db()
        self.assertEqual(lesson.status, Lesson.Status.IN_PROGRESS)

        repeated_response = self.client.post(f"/api/v1/lessons/{lesson.pk}/start/")
        self.assertEqual(repeated_response.status_code, 200, repeated_response.data)
        self.assertEqual(repeated_response.data["status"], Lesson.Status.IN_PROGRESS)

    def test_teacher_cannot_start_another_teachers_lesson(self):
        other_teacher = User.objects.create_user(
            username="other-teacher",
            password="Unique-other-teacher-password-2026!",
            role="teacher",
        )
        other_group = TeachingGroup.objects.create(
            name="Other",
            course=self.course,
            teacher=other_teacher,
        )
        lesson = Lesson.objects.create(
            course=self.course,
            group=other_group,
            number=1,
            title="Other teacher lesson",
            teacher=other_teacher,
            status=Lesson.Status.PLANNED,
        )
        self.login(self.teacher)

        response = self.client.post(f"/api/v1/lessons/{lesson.pk}/start/")

        self.assertEqual(response.status_code, 404)
        lesson.refresh_from_db()
        self.assertEqual(lesson.status, Lesson.Status.PLANNED)

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
            "total_teachers",
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

class FinancialActorProtectionTest(TestCase):
    def test_staff_with_ledger_records_cannot_be_deleted(self):
        from django.db.models import ProtectedError
        admin = User.objects.create_user(username="admin", password="AdminPass123!", role="admin")
        student = User.objects.create_user(username="student-12345678", password="StudPass123!", role="student", student_id="12345678")
        register_payment(student, Decimal("100"), "cash", admin)
        with self.assertRaises(ProtectedError):
            admin.delete()
        self.assertTrue(FinancialTransaction.objects.filter(created_by=admin).exists())

class InvalidInputTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="AdminPass123!", role="admin")
        self.director = User.objects.create_user(username="director", password="DirectorPass123!", role="director")
        self.student = User.objects.create_user(username="student-12345678", password="StudPass123!", role="student", student_id="12345678")
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_payment_rejects_unknown_student_bad_amount_and_unknown_method(self):
        bad = [
            {"student": 999999, "amount": "100", "method": "cash"},
            {"student": "abc", "amount": "100", "method": "cash"},
            {"student": self.student.pk, "amount": "abc", "method": "cash"},
            {"student": self.student.pk, "amount": "-5", "method": "cash"},
            {"student": self.student.pk, "amount": "100", "method": "bitcoin"},
            {"student": self.student.pk, "method": "cash"},
        ]
        for payload in bad:
            with self.subTest(payload=payload):
                response = self.client.post("/api/v1/payments/", payload, format="json")
                self.assertIn(response.status_code, (400, 404))
        self.assertFalse(TuitionPayment.objects.exists())

    def test_coin_award_and_purchase_reject_malformed_input(self):
        self.client.force_authenticate(self.director)
        response = self.client.post("/api/v1/coins/", {"student": self.student.pk, "amount": "x", "reason": "r"}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/v1/coins/", {"student": self.student.pk, "amount": 5, "reason": ""}, format="json")
        self.assertEqual(response.status_code, 400)
        self.client.force_authenticate(self.student)
        self.student.set_password("StudPass123!"); self.student.save()
        response = self.client.post("/api/v1/shop/purchase/", {"password": "StudPass123!", "product": "x"}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/v1/shop/purchase/", {"password": "StudPass123!", "product": 424242}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_report_and_salary_query_params_are_validated(self):
        self.client.force_authenticate(self.director)
        self.assertEqual(self.client.get("/api/v1/reports/monthly/?month=13").status_code, 400)
        self.assertEqual(self.client.get("/api/v1/reports/monthly/?year=abc").status_code, 400)
        self.assertEqual(self.client.get("/api/v1/salaries/?month=0").status_code, 400)
        self.assertEqual(self.client.get("/api/v1/salaries/?teacher=abc").status_code, 400)
        teacher = User.objects.create_user(username="teacher", password="TeacherPass123!", role="teacher")
        self.assertEqual(self.client.post("/api/v1/salaries/", {"teacher": teacher.pk, "year": 2026, "month": 13}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/v1/salaries/payments/", {"period": "abc", "amount": "1"}, format="json").status_code, 400)

class ProfileUpdateTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="teacher", password="TeacherPass123!", role="teacher")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_user_can_update_own_profile_fields(self):
        response = self.client.patch("/api/v1/auth/me/", {"first_name": "Ali", "last_name": "Valiyev", "phone": "+998901234567"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual((self.user.first_name, self.user.last_name, self.user.phone), ("Ali", "Valiyev", "+998901234567"))

    def test_profile_update_rejects_role_or_activation_changes(self):
        response = self.client.patch("/api/v1/auth/me/", {"role": "director"}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.patch("/api/v1/auth/me/", {"is_active": False}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.patch("/api/v1/auth/me/", {"email": "x@example.com"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "teacher")
        self.assertTrue(self.user.is_active)

class SubmissionTypesTest(TestCase):
    def setUp(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.SimpleUploadedFile = SimpleUploadedFile
        self.teacher = User.objects.create_user(username="teacher", password="TeacherPass123!", role="teacher")
        self.student = User.objects.create_user(username="student-12345678", password="StudPass123!", role="student", student_id="12345678")
        course = Course.objects.create(name="Design", duration_months=2, monthly_fee=Decimal("100000"))
        group = TeachingGroup.objects.create(name="D1", course=course, teacher=self.teacher)
        GroupEnrollment.objects.create(student=self.student, group=group, monthly_fee=Decimal("100000"))
        lesson = Lesson.objects.create(course=course, group=group, number=1, title="Draw", teacher=self.teacher, status="completed")
        self.client = APIClient()
        self.client.force_authenticate(self.student)
        self.lesson = lesson

    def make_assignment(self, types):
        return Assignment.objects.create(lesson=self.lesson, title="HW", created_by=self.teacher, submission_types=types)

    def image(self, name="work.png", size=1024):
        return self.SimpleUploadedFile(name, b"\x89PNG" + b"0" * size, content_type="image/png")

    def test_text_and_image_assignment_requires_both(self):
        assignment = self.make_assignment(["text", "image"])
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "Mine"}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.data)
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "Mine", "image": self.image()}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["image"])

    def test_programming_assignment_requires_valid_github_link(self):
        assignment = self.make_assignment(["text", "github_link"])
        for bad in ["", "not a url", "https://example.com/x/y", "https://github.com/onlyuser"]:
            with self.subTest(url=bad):
                response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "Notes", "github_url": bad}, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("github_url", response.data)
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "Notes", "github_url": "https://github.com/student/project"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["github_url"], "https://github.com/student/project")

    def test_disallowed_types_are_rejected(self):
        assignment = self.make_assignment(["text"])
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "Mine", "github_url": "https://github.com/a/b"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("github_url", response.data)

    def test_image_type_and_size_limits(self):
        assignment = self.make_assignment(["image"])
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "image": self.SimpleUploadedFile("x.exe", b"MZ", content_type="application/octet-stream")}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.data)
        with patch("core.services.MAX_UPLOAD_BYTES", 100):
            response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "image": self.image(size=500)}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.data)

    def test_teacher_can_set_submission_types_and_rejects_unknown_type(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post("/api/v1/assignments/", {"lesson": self.lesson.pk, "title": "Poster", "submission_types": ["image", "text"]}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["submission_types"], ["image", "text"])
        response = self.client.post("/api/v1/assignments/", {"lesson": self.lesson.pk, "title": "Bad", "submission_types": ["video"]}, format="json")
        self.assertEqual(response.status_code, 400)

class AuthorizationAndIntegrityRegressionTest(TestCase):
    def setUp(self):
        self.director = User.objects.create_user(username="director", password="DirectorPass123!", role="director")
        self.admin = User.objects.create_user(username="admin", password="AdminPass123!", role="admin")
        self.teacher = User.objects.create_user(username="teacher", password="TeacherPass123!", role="teacher")
        self.other_teacher = User.objects.create_user(username="teacher2", password="TeacherPass123!", role="teacher")
        self.student = User.objects.create_user(username="student-12345678", password="StudPass123!", role="student", student_id="12345678")
        self.other_student = User.objects.create_user(username="student-87654321", password="OtherPass123!", role="student", student_id="87654321")
        self.course = Course.objects.create(name="Math", duration_months=4, monthly_fee=Decimal("300000"))
        self.group = TeachingGroup.objects.create(name="A", course=self.course, teacher=self.teacher)
        GroupEnrollment.objects.create(student=self.student, group=self.group, monthly_fee=Decimal("300000"))
        self.lesson = Lesson.objects.create(course=self.course, group=self.group, number=1, title="Intro", teacher=self.teacher, status="completed")
        self.client = APIClient()

    def test_student_cannot_edit_or_delete_groups_lessons_or_assignments(self):
        assignment = Assignment.objects.create(lesson=self.lesson, title="HW", created_by=self.teacher)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(f"/api/v1/groups/{self.group.pk}/", {"name": "Hacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/v1/lessons/{self.lesson.pk}/").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/v1/assignments/{assignment.pk}/", {"title": "Hacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/v1/assignments/{assignment.pk}/").status_code, 403)
        self.assertEqual(self.client.post(f"/api/v1/lessons/{self.lesson.pk}/mark-taught/", {"topic_id": 1}, format="json").status_code, 403)
        self.assertTrue(Lesson.objects.filter(pk=self.lesson.pk).exists())
        self.group.refresh_from_db()
        self.assertEqual(self.group.name, "A")

    def test_teacher_cannot_create_groups_or_reassign_group_teacher(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post("/api/v1/groups/", {"name": "B", "course": self.course.pk, "teacher": self.teacher.pk}, format="json")
        self.assertEqual(response.status_code, 403)
        response = self.client.patch(f"/api/v1/groups/{self.group.pk}/", {"teacher": self.other_teacher.pk}, format="json")
        self.assertEqual(response.status_code, 403)
        self.group.refresh_from_db()
        self.assertEqual(self.group.teacher_id, self.teacher.pk)

    def test_teacher_cannot_move_lesson_or_assignment_to_another_teacher(self):
        other_group = TeachingGroup.objects.create(name="Other", course=self.course, teacher=self.other_teacher)
        other_lesson = Lesson.objects.create(course=self.course, group=other_group, number=1, title="Their", teacher=self.other_teacher)
        assignment = Assignment.objects.create(lesson=self.lesson, title="HW", created_by=self.teacher)
        self.client.force_authenticate(self.teacher)
        response = self.client.patch(f"/api/v1/lessons/{self.lesson.pk}/", {"teacher": self.other_teacher.pk}, format="json")
        self.assertEqual(response.status_code, 403)
        response = self.client.patch(f"/api/v1/assignments/{assignment.pk}/", {"lesson": other_lesson.pk}, format="json")
        self.assertEqual(response.status_code, 403)
        self.lesson.refresh_from_db(); assignment.refresh_from_db()
        self.assertEqual(self.lesson.teacher_id, self.teacher.pk)
        self.assertEqual(assignment.lesson_id, self.lesson.pk)

    def test_lesson_with_wrong_teacher_is_not_created(self):
        self.client.force_authenticate(self.director)
        payload = {"course": self.course.pk, "group": self.group.pk, "number": 2, "title": "Mismatch", "teacher": self.other_teacher.pk}
        response = self.client.post("/api/v1/lessons/", payload, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Lesson.objects.filter(title="Mismatch").exists())

    def test_adding_already_enrolled_student_returns_400_not_500(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/api/v1/groups/{self.group.pk}/students/", {"student_ids": [self.student.pk]}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.patch(f"/api/v1/groups/{self.group.pk}/", {"student_ids": [self.student.pk]}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_group_patch_with_student_ids_enrolls_each_student_once(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(f"/api/v1/groups/{self.group.pk}/", {"student_ids": [self.other_student.pk]}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(GroupEnrollment.objects.filter(student=self.other_student, group=self.group, active=True).count(), 1)

    def test_malformed_student_ids_return_400(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/api/v1/groups/{self.group.pk}/students/", {"student_ids": ["abc"]}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/v1/groups/enrollments/", {"group": self.group.pk, "student_ids": "abc"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_payment_review_twice_returns_400(self):
        payment = register_payment(self.student, Decimal("100000"), "click", self.admin, "click-1")
        self.client.force_authenticate(self.director)
        self.assertEqual(self.client.post(f"/api/v1/payments/{payment.pk}/approve/", {}, format="json").status_code, 200)
        self.assertEqual(self.client.post(f"/api/v1/payments/{payment.pk}/approve/", {}, format="json").status_code, 400)
        self.assertEqual(FinancialTransaction.objects.filter(payment=payment).count(), 1)

    def test_duplicate_payment_and_coin_references_return_400(self):
        self.client.force_authenticate(self.admin)
        payload = {"student": self.student.pk, "amount": "100000", "method": "cash", "reference": "REF-1"}
        self.assertEqual(self.client.post("/api/v1/payments/", payload, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/v1/payments/", payload, format="json").status_code, 400)
        self.client.force_authenticate(self.director)
        coin = {"student": self.student.pk, "amount": 5, "reason": "Good", "reference": "COIN-1"}
        self.assertEqual(self.client.post("/api/v1/coins/", coin, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/v1/coins/", coin, format="json").status_code, 400)

    def test_weak_new_password_returns_400_not_500(self):
        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/auth/password/change/", {"old_password": "StudPass123!", "new_password": "123"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password("StudPass123!"))

    def test_graded_submission_cannot_be_overwritten_by_student(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        assignment = Assignment.objects.create(lesson=self.lesson, title="HW", created_by=self.teacher)
        submission = AssignmentSubmission.objects.create(assignment=assignment, student=self.student, text="First", score=Decimal("90"))
        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/submissions/", {"assignment": assignment.pk, "text": "Changed"}, format="json")
        self.assertEqual(response.status_code, 400)
        submission.refresh_from_db()
        self.assertEqual(submission.text, "First")

class StaffScopeAndDeletionRegressionTest(TestCase):
    def setUp(self):
        self.director = User.objects.create_user(username="director", password="DirectorPass123!", role="director")
        self.admin = User.objects.create_user(username="admin", password="AdminPass123!", role="admin")
        self.teacher = User.objects.create_user(username="teacher", password="TeacherPass123!", role="teacher")
        self.student = User.objects.create_user(username="student-12345678", password="StudPass123!", role="student", student_id="12345678")
        self.client = APIClient()

    def test_admin_cannot_list_director_or_admin_accounts(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/v1/students/?role=director").data["count"], 0)
        self.assertEqual(self.client.get("/api/v1/students/?role=admin").data["count"], 0)

    def test_deleting_staff_with_financial_history_returns_400_not_500(self):
        CoinTransaction.objects.create(student=self.student, amount=5, reason="Good", created_by=self.teacher)
        self.client.force_authenticate(self.director)
        response = self.client.delete(f"/api/v1/students/{self.teacher.pk}/?role=teacher")
        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.teacher.pk).exists())

    def test_deleting_audited_user_keeps_audit_trail(self):
        AuditLog.objects.create(actor=self.admin, action="test.event", object_type="User", object_id="1")
        self.admin.delete()
        self.assertTrue(AuditLog.objects.filter(action="test.event", actor__isnull=True).exists())
