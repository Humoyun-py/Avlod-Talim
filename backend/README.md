# Avlod Ta'lim backend

## Repository audit

The workspace contains one Django backend and four Vite/React applications (`frontend/apps/admin`, `director`, `teacher`, and `student`). Their feature coverage and API wiring differ; several pages still use local mock stores. The backend README documents the implemented API; `frontend/README.md` tracks frontend integration status. Separate downloaded panel repositories were not present in the workspace.

## Stack and setup

Python 3.12+, Django, Django REST Framework, SimpleJWT, PostgreSQL (SQLite fallback for local development), django-filter, drf-spectacular, CORS headers, and Pillow. Copy `.env.example` to `.env` and export its values in your shell; production must set a strong `DJANGO_SECRET_KEY`, `DEBUG=false`, `ALLOWED_HOSTS`, PostgreSQL `DATABASE_URL`, and explicit frontend CORS origins. Uploaded receipts are stored under private media and must be served through an authenticated download endpoint in production; do not expose the media directory directly.

```sh
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Run the automated suite with `python manage.py test` (or `pytest`). Current verified results: 15 tests pass; `manage.py check` reports no issues; `makemigrations --check --dry-run` reports no model drift; `spectacular --validate` produces the OpenAPI schema without warnings/errors. Tests cover authentication, access scoping, enrollment transactions, attendance correction, payment verification and ledger posting, salary arithmetic and payouts, coin purchases, quiz scoring, assignment submission/review, and account reactivation.

OpenAPI schema: `/api/schema/`; Swagger UI: `/api/docs/`. The frontend base URL should include `/api/v1`, for example `VITE_API_BASE_URL=http://localhost:8000/api/v1`. Monthly tuition enforcement is idempotently available as `python manage.py enforce_tuition`; schedule it externally after monthly due dates. The configured due day is used by the operator when creating `TuitionPeriod.due_date` records.

## Implemented domain

The `core` Django app contains custom role-aware user accounts, courses, groups and historical enrollments, course months, lessons/topics, attendance, tuition periods/payments/ledger transactions, teacher salary periods and payouts, coin ledger and products/orders, assignments/submissions, quizzes/questions/answers/attempts, notifications, audit logs, and system settings. The models intentionally share one app in this empty scaffold to make initial deployment coherent; they can be split into the requested domain apps after real frontend and deployment constraints are known.

## API overview

All routes use `/api/v1/` and JWT bearer authentication except login.

- Auth: `POST auth/staff/login/`, `POST auth/student/login/`, `POST auth/token/refresh/`, `POST auth/logout/`, `GET auth/me/`, `POST auth/password/change/`.
- Accounts: `/students/` supports staff listing/creation of students, `/students/?role=teacher` lists teachers, `/{id}/payments/`, `/{id}/attendance/`, and deactivation.
- Education: `/courses/`, `/groups/`, `/groups/{id}/students/`, `/lessons/`, `/lessons/{id}/mark-taught/`, `/attendance/`, `/attendance/bulk/`.
- Finance: `/payments/`, `/payments/{id}/approve/`, `/payments/{id}/reject/`, `/salaries/` (Director monthly report; POST finalizes a period), `/reports/monthly/`, `manage.py enforce_tuition`.
- Shop and coins: `/shop/products/`, `/shop/purchase/`, `/coins/` (GET own ledger/balance; POST staff coin award).
- Learning: `/assignments/`, `/quizzes/`, `/quizzes/{id}/submit/`.
- Notifications: `/notifications/`, `/notifications/{id}/read/`.
- Role dashboards: `/dashboard/` returns role-appropriate data.

Responses use DRF pagination (25 per page), validation errors, and filtering/search backends. Swagger is generated from the registered API.

## Authentication and authorization

Staff share username/password login; students log in with their 8-digit student ID and generated password. Login returns role-bearing access and refresh JWTs; refresh rotation and blacklist support are enabled. Login is throttled. Passwords use Django hashing. Director/Admin manage most records; teacher querysets are restricted to assigned groups/lessons; student group, lesson, attendance, notification, and quiz querysets are derived from the authenticated account. Tuition restrictions deny learning endpoints. Initial student credentials are returned only on create and are not part of ordinary account serialization.

## Financial policies

Cash registration is immediately verified and creates exactly one ledger entry. Click/Payme/Uzum receipt submissions remain pending and do not affect the ledger until a Director approves them. Reversals must be represented by compensating ledger transactions; confirmed payment mutation/deletion is disallowed. Period totals use `DecimalField` values.

Salary calculation uses configured percentage (default 40%) on verified tuition ledger payments for months with completed, non-demo lessons assigned to the teacher. Finalized periods are immutable; payouts are separately recorded and cannot exceed the remaining calculated amount. Demo lessons are explicit. The brief gives an absence threshold but does not define the monetary deduction per absence or whether that deduction changes salary entitlement. This implementation therefore tracks the first three relevant absences but applies zero monetary salary adjustment, avoiding an invented financial rule. Partial payments count as tuition collected in the transaction month. Group transfers preserve enrollment records.

Monthly account restrictions evaluate each persisted tuition period on/after its due date against verified payments for that student/month. They are idempotent and audit/notify once when an account first becomes restricted. A scheduling system should invoke the management command daily. A verified payment restores student access once all overdue periods are fully paid. Tuition periods must be generated/maintained by an authorized process; automatic period generation is not yet provided.

## Environment variables

See `.env.example`: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `STUDENT_PAYMENT_DUE_DAY`, `TEACHER_SALARY_PERCENT`, `MONTHLY_LESSON_COUNT`, `DEMO_LESSONS_PER_ENROLLMENT`, and `ABSENCE_DEDUCTION_LIMIT`.

## Current limitations

This backend was created without an existing frontend. The test suite is initial coverage, not exhaustive production verification. Dedicated domain app separation, private receipt download endpoint, salary payout HTTP endpoint, student group transfer workflow, course-month/topic CRUD endpoints, full report suite, order administration endpoints, payment reversal endpoint, and automatic tuition-period generation remain before production deployment. Integration against a real React frontend and PostgreSQL instance has not been run.
