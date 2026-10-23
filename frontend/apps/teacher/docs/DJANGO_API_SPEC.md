# Avlod Ta’lim — Teacher Panel: Django REST Framework API Specification

This document provides the complete API contract required by the **Teacher Panel** frontend to integrate with the Python / Django REST Framework / PostgreSQL backend.

---

## 1. Authentication & Security (JWT)

### `POST /api/auth/login/`
Authenticates a user and issues JSON Web Tokens.
- **Request Body:**
  ```json
  {
    "username": "teacher_aziz",
    "password": "<plain_text_password>"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>",
    "user": {
      "id": "tch-001",
      "username": "teacher_aziz",
      "full_name": "Azizbek Rahimov",
      "email": "azizbek.rahimov@avlodtalim.uz",
      "role": "teacher",
      "phone": "+998 90 123 45 67",
      "avatar_url": "/media/teachers/aziz.jpg",
      "subjects": ["Python Backend Development", "Django Framework"],
      "department": "Dasturlash va Axborot Texnologiyalari",
      "status": "active"
    }
  }
  ```
- **RBAC Rule:**
  If `user.role != 'teacher'`, return `403 Forbidden`:
  `{"detail": "Faqat O'qituvchilar ushbu tizimga kira oladi."}`

### `POST /api/auth/refresh/`
Rotates/refreshes an expired JWT access token.
- **Request Body:** `{"refresh": "<jwt_refresh_token>"}`
- **Response (200 OK):** `{"access": "<new_jwt_access_token>"}`

---

## 2. Dashboard Endpoints

### `GET /api/teacher/dashboard/`
Returns dynamic, calculated statistics for the requesting teacher.
- **Headers:** `Authorization: Bearer <access_token>`
- **Response (200 OK):**
  ```json
  {
    "my_groups_count": 4,
    "my_students_count": 52,
    "lessons_today_count": 2,
    "lessons_this_month": 19,
    "attendance_rate": 94.2,
    "pending_homework_count": 7
  }
  ```

---

## 3. Groups & Students Endpoints

### `GET /api/teacher/groups/`
Lists only groups assigned to `request.user`.
- **Query Params (optional):** `status=active|completed`
- **Response (200 OK):** Array of group objects.

### `GET /api/teacher/groups/{id}/`
Retrieves detailed information of an assigned group (with roster and schedule).
- **Object Permission:** `IsAssignedTeacher`

### `GET /api/teacher/students/`
Lists all students enrolled in the teacher's groups.
- **Query Params (optional):** `group_id=<uuid>`
- **Object Permission:** Teacher must not be able to query students from groups they do not teach.

### `GET /api/teacher/students/{id}/`
Returns student profile, attendance summary, and homework history.

---

## 4. Schedule & Lessons

### `GET /api/teacher/lessons/`
Returns scheduled lessons for `request.user`.
- **Query Params:** `date=YYYY-MM-DD`, `group_id=<uuid>`

### `GET /api/teacher/lessons/{id}/attendance/`
Returns the attendance sheet for this lesson.

### `POST /api/teacher/lessons/{id}/attendance/`
Submits student attendance records for this lesson.
- **Request Body:**
  ```json
  {
    "records": [
      {
        "student_id": "std-001",
        "status": "present",
        "notes": ""
      },
      {
        "student_id": "std-003",
        "status": "late",
        "notes": "10 daqiqa kechikdi"
      }
    ]
  }
  ```
- **Validation Rules:**
  - Prevents duplicate attendance entries for the same student on the same lesson.
  - Automatically stamps `marked_by = request.user` and `marked_at = timezone.now()`.

### `POST /api/teacher/lessons/{id}/complete/`
Marks a scheduled lesson as completed.
- **Request Body:**
  ```json
  {
    "topic": "Django REST Framework: Serializers & Views",
    "summary": "ModelSerializer va ValidationError bilan ishlash o'rganildi",
    "covered_material": "GitHub repo havolasi...",
    "homework_assigned": "Talabalar modeli uchun Serializer yozish",
    "additional_notes": "Xona harorati yaxshi, barcha talabalar faol qatnashdi"
  }
  ```

### `POST /api/teacher/lessons/{id}/video-submissions/`
Submits a lesson video URL or S3 storage link for quality inspection by Director / Admin.
- **Request Body:**
  ```json
  {
    "video_url": "https://storage.avlodtalim.uz/lessons/py-24-lesson-12.mp4"
  }
  ```

---

## 5. Homework Management

### `GET /api/teacher/homework/`
Lists assignments created by the teacher.

### `POST /api/teacher/homework/`
Creates a new assignment for an assigned group.
- **Request Body:**
  ```json
  {
    "group_id": "grp-py-101",
    "title": "Singleton DB Pool",
    "description": "Thread-safe singleton pattern yaratish",
    "deadline": "2026-10-22 23:59"
  }
  ```

### `GET /api/teacher/homework/{id}/submissions/`
Retrieves submissions for a homework.

### `POST /api/teacher/homework/submissions/{id}/review/`
Grades and provides feedback on a student submission.
- **Request Body:**
  ```json
  {
    "score": 95,
    "feedback": "Ajoyib yechim, thread-safety to'g'ri ta'minlangan."
  }
  ```

---

## 6. Profile & Security

### `GET /api/teacher/profile/` & `PATCH /api/teacher/profile/`
Reads or updates allowed profile fields (`full_name`, `phone`).

### `POST /api/teacher/change-password/`
Secure password update endpoint.
- **Request Body:**
  ```json
  {
    "current_password": "<old>",
    "new_password": "<new>"
  }
  ```

---

## 7. Reports & Salary

### `GET /api/teacher/reports/`
Returns performance and attendance aggregates by group and date range.

### `GET /api/teacher/salary/`
Permission-governed salary statement. Only returns records for `request.user`.
Salaries are strictly generated and approved by the Director.
