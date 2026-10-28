# Avlod Ta'lim

Avlod Ta'lim — o'quv markazini boshqarish uchun Django REST API va React/Vite panellari jamlangan loyiha.

> **Holati:** loyiha ishlab chiqish bosqichida. Backend testlari va ayrim panellar tekshirilgan, ammo barcha frontend bo'limlari backend bilan to'liq ulanmagan. Mock ma'lumot ishlatadigan sahifalar ham bor. Production serverga joylashdan oldin quyidagi cheklovlarni ko'rib chiqing.

## Panellar

| Ilova | Papka | Lokal manzil | Izoh |
|---|---|---|---|
| Admin | `frontend/apps/admin` | `http://localhost:5173` | Backend API bilan eng ko'p ulangan panel. Ayrim amallari hali moslashtirilmagan. |
| Direktor | `frontend/apps/director` | `http://localhost:3000` | Alohida direktor paneli. Ayrim sahifalar mock ma'lumotlardan foydalanadi. |
| O'qituvchi | `frontend/apps/teacher` | `http://localhost:3000` | Demo/mock xizmatlar mavjud. |
| O'quvchi | `frontend/apps/student` | `http://localhost:3000` | Demo/mock xizmatlar mavjud. |

Direktor, o'qituvchi va o'quvchi ilovalari odatda bir xil `3000` portni ishlatadi. Ularni alohida ishga tushiring yoki Vite portini o'zgartiring.

## Texnologiyalar

- Backend: Python 3.12+, Django, Django REST Framework, SimpleJWT
- Ma'lumotlar bazasi: lokal ishlab chiqishda SQLite; production uchun PostgreSQL tavsiya qilinadi
- Frontend: React, TypeScript, Vite

## Lokal ishga tushirish

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

SQLite ishlatish uchun `backend/.env` ichidagi `DATABASE_URL` qatori kommentda qolganini tekshiring. Agar terminalda `DATABASE_URL` oldindan o'rnatilgan bo'lsa, uni ham olib tashlang:

```bash
unset DATABASE_URL
```

Keyin migratsiyalar va boshlang'ich admin hisobini yarating:

```bash
python manage.py migrate
python manage.py createsuperuser
```

`createsuperuser` Django superuser yaratadi, ammo ilova panellari uchun `role` ham to'g'ri bo'lishi kerak: admin panel uchun `admin`, alohida direktor paneli uchun `director`. Hisob yaratilgach, Django shell'da kerakli rolni belgilang:

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
user = get_user_model().objects.get(username="SIZNING_LOGININGIZ")
user.role = "admin"  # direktor paneli uchun "director" deb yozing
user.save(update_fields=["role"])
exit()
```

Backendni ishga tushiring:

```bash
python manage.py runserver
```

API: `http://localhost:8000/api/v1/`  
Swagger hujjatlari: `http://localhost:8000/api/docs/`

### 2. Admin frontend

Yangi terminal oynasida:

```bash
cd frontend
npm install
npm run dev:admin
```

Vite ko'rsatgan manzilni oching (odatda `http://localhost:5173/login`). Frontend API manzili kerak bo'lsa, `frontend/apps/admin/.env.example` faylini `.env.local` nomi bilan nusxalab, `VITE_API_BASE_URL` ni sozlang. Lokal qiymat:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Direktor, o'qituvchi yoki o'quvchi frontend

`frontend` papkasidan mos buyruqni ishga tushiring:

```bash
npm run dev:director
# yoki
npm run dev:teacher
# yoki
npm run dev:student
```

Bu ilovalar odatda `http://localhost:3000` manzilida ochiladi. Backend CORS sozlamasida frontend manzillari (`http://localhost:5173` va `http://localhost:3000`) ruxsat etilgan bo'lishi kerak. Production'da lokal manzillarni haqiqiy domenlaringiz bilan almashtiring.

## Tekshiruv va build

Backend (`backend` papkasida, virtual muhit faolligida):

```bash
python manage.py check
python manage.py test
```

Frontend (`frontend` papkasida):

```bash
npm run lint --prefix apps/admin
npm run lint --prefix apps/director
npm run lint --prefix apps/teacher
npm run lint --prefix apps/student
npm run build:admin
npm run build:director
npm run build:teacher
npm run build:student
```

Build buyruqlari har bir ilova uchun `dist/` papkasini yaratadi.

## Backend imkoniyatlari

Backendda rolga asoslangan foydalanuvchilar, login/JWT, kurslar, guruhlar, darslar, davomat, to'lovlar, ish haqi hisoblari, tangalar, topshiriqlar, testlar va bildirishnomalar uchun API mavjud. To'liq endpoint ro'yxati va biznes qoidalari [backend/README.md](backend/README.md) da berilgan.

## Hozirgi cheklovlar

- Frontenddagi barcha sahifa va amallar backend API bilan to'liq integratsiya qilinmagan.
- Direktor, o'qituvchi va o'quvchi panellarining ayrim xizmatlari mock yoki brauzer `localStorage` ma'lumotlaridan foydalanadi.
- Backendda ayrim frontend funksiyalari uchun endpointlar hali yo'q; tafsilotlar [frontend/README.md](frontend/README.md) va [backend/README.md](backend/README.md) da.
- Haqiqiy React frontend va PostgreSQL bilan to'liq end-to-end deploy sinovi o'tkazilmagan.

Shu sabab muvaffaqiyatli login yoki build barcha bo'limlar production'da ishlashini anglatmaydi.

## Production deploy

Render uchun yo'riqnoma [DEPLOYMENT.md](DEPLOYMENT.md), Blueprint esa [render.yaml](render.yaml) faylida. Render'dan VPS yoki boshqa hostingga ko'chirish, PostgreSQL backup/restore va media nusxalash bo'yicha [SERVER_MIGRATION.md](SERVER_MIGRATION.md) ni ko'ring. Ubuntu/VPS uchun systemd va Nginx namunalari [deployment/](deployment/), DB eksport/tiklash skriptlari [migration/](migration/) ichida. Haqiqiy domen va credentiallar bilan Render Dashboard sozlamalari talab qilinadi; deploy bu muhitdan bajarilmagan.

Productionda PostgreSQL, `DEBUG=false`, serverga xos kuchli secret key va aniq host/CORS/CSRF domenlari talab qilinadi. Uploadlar lokal `private_media/` papkasida saqlanadi; Render Free'da bu disk ephemeral bo'lib, deploy yoki restart paytida fayllar yo'qolishi mumkin. `backend/.env` va barcha credentiallar Git'dan tashqarida qolishi kerak. Backend va frontend integratsiyasidagi cheklovlarni yuqorida ko'ring.
