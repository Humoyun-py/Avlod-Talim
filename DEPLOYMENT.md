# Django backendni Render'ga joylash

Render workspace'da `avlod-talim-db` PostgreSQL (Free, PostgreSQL 18) va `Avlod-Talim` web service (Free) mavjud. 2026-10-26 dagi oxirgi ko'rilgan deploy muvaffaqiyatsiz edi; API health tekshiruvi 503 qaytardi. Hozirgi servis Free rejasida, shuning uchun ma'lumotlar bazasining amal qilish muddati/backup cheklovlari va web service uyqu holatini hisobga oling. Pullik tarifga o'tish yoki yangi resurs sotib olish faqat alohida tasdiq bilan amalga oshiriladi. `render.yaml` amaldagi Free resurslarga moslangan, ammo bu tarif production uchun tavsiya etilmaydi.

## Blueprint orqali boshlash

1. `render.yaml` mavjud database yoki web service'ni almashtirishga/yangidan yaratishga urinmasligi uchun Dashboard'dagi Blueprint sync o'zgarishlarini diqqat bilan ko'ring.
2. `DATABASE_URL` Render ichki PostgreSQL URL'iga bog'langan. `DJANGO_SECRET_KEY` Blueprint orqali yaratiladi; mavjud servisda uni almashtirmang, chunki JWT'lar bekor bo'lishi mumkin.
3. `CORS_ALLOWED_ORIGINS` va `CSRF_TRUSTED_ORIGINS` qiymatlarini Environment sahifasida qo'shing. Faqat haqiqiy HTTPS frontend originlarini ishlating.
4. Build muvaffaqiyatli tugagach, `https://avlod-talim.onrender.com/` manzilini oching. API hujjatlari: `/api/docs/`, schema: `/api/schema/`.

## Qo'lda Web Service yaratish

- Runtime: Python 3.12
- Root Directory: `backend`
- Build Command: `./build.sh`
- Start Command (joriy Free reja): `python manage.py migrate --noinput && python manage.py bootstrap_staff_accounts && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile -`
- Health Check Path: `/`

Paid web service'da migratsiyani alohida Pre-Deploy Command (`python manage.py migrate --noinput`) bilan bajarish afzal. Render Pre-Deploy buyrug'i paid web service uchun mavjud; joriy Free rejada migration Start Command ichida bitta service instance ishga tushganda qo'llanadi. Bir vaqtda parallel deploy boshlamang.

Kerakli Environment Variables (Dashboard'dagi qiymatlarni repo yoki chatga ko'chirmang):

- `DJANGO_DEBUG=false`
- `DJANGO_SECRET_KEY`: Render'da Generate Value orqali kamida 50 belgili tasodifiy maxfiy qiymat.
- `DATABASE_URL`: Render PostgreSQL'ning internal connection string'i.
- `DJANGO_ALLOWED_HOSTS`: `avlod-talim.onrender.com`; `RENDER_EXTERNAL_HOSTNAME` ham avtomatik qo'shiladi.
- `CORS_ALLOWED_ORIGINS`: kerakli admin/director/teacher/student frontendlarining `https://` originlari.
- `CSRF_TRUSTED_ORIGINS`: CSRF uchun ruxsat beriladigan frontendlarning `https://` originlari.
- `SECURE_SSL_REDIRECT=true`
- `SECURE_HSTS_SECONDS=3600`
- Ixtiyoriy boshlang'ich panel akkauntlari: `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_DIRECTOR_USERNAME`, `BOOTSTRAP_DIRECTOR_EMAIL`, `BOOTSTRAP_DIRECTOR_PASSWORD`. Har bir akkaunt uchun uchala qiymatni Render Dashboard'da kiriting; parollarni repository/chat'ga qo'ymang.
- Mavjud akkaunt parolini aniq yangilash uchun tegishli `BOOTSTRAP_ADMIN_RESET_PASSWORD=true` yoki `BOOTSTRAP_DIRECTOR_RESET_PASSWORD=true` ni faqat bitta deploy davomida yoqing. Deploy muvaffaqiyatli bo'lib, yangi login tekshirilgach flagni darhol o'chiring. Username mavjud akkauntga aynan mos bo'lishi kerak.

`DJANGO_SECRET_KEY` bo'lmasa production Django ishga tushmaydi. Render'ning `SECRET_KEY` nomli o'zgaruvchisi ham alias sifatida qabul qilinadi. Secret va database parolini kod, README, GitHub yoki commitga yozmang; `backend/.env` ni commit qilmang.

Deploy paytida `bootstrap_staff_accounts` sozlangan admin va director panel akkauntlarini yo'q bo'lsa yaratadi. Boshlang'ich sozlamalar kiritilmagan bo'lsa, buyruq hech narsa yaratmay o'tadi. Username mavjud va roli mos bo'lsa, parolni o'zgartirmaydi; faqat tegishli `*_RESET_PASSWORD=true` bo'lganda parolni yangilaydi. Flagni keyingi deploydan oldin o'chiring. Roli mos bo'lmasa deploy aniq xato bilan to'xtaydi. Parol Django validatorlaridan o'tishi shart. Bu akkauntlar React panellari uchun; Django `/admin/` saytiga alohida superuser kerak.

## Build va migration

`backend/build.sh` dependency'larni o'rnatadi, `manage.py check --deploy` bajaradi va `collectstatic --noinput` bilan statik fayllarni yig'adi. `set -Eeuo pipefail` sabab xato bo'lsa build to'xtaydi. Joriy Free rejada migration Start Command ichida bajariladi; parallel deploy yoki bir nechta instance'ga o'tishdan oldin paid Pre-Deploy/maintenance oqimini alohida sozlang.

Migratsiyalarni production'da avtomatik yaratmaymiz: `makemigrations` faqat ishlab chiqish muhitida bajarilib, migration fayli tekshirilib GitHub'ga commit qilinadi. Bir deploy'da bir nechta instance ishga tushsa ham migratsiya instance boshiga takrorlanmaydi. Bitta Render Web Service uchun bitta deploy pipeline ishlating va bir vaqtda parallel manual/auto deploy boshlamang. Migration schema yoki ma'lumotni o'zgartirsa, eski va yangi kod versiyalari bilan vaqtincha mos keladigan bosqichli o'zgarishlardan foydalaning.

### Yangi migration ishlab chiqish va yuborish

Lokal development muhitida, `backend/` papkasida:

```bash
python manage.py makemigrations
python manage.py makemigrations --check --dry-run
python manage.py migrate
python manage.py test
git add core/migrations
git commit -m "Add database migration"
git push origin main
```

Generated migration faylini ochib ko'ring: ma'lumot yo'qotadigan `RemoveField`, `DeleteModel`, `AlterField` yoki `RunSQL` bor-yo'qligini baholang. Migrationlarni sababsiz o'chirmang va qayta yaratmang. CI/build `makemigrations` yaratmaydi; u faqat mavjud repo migratsiyalarini qo'llaydi.

Render deploy/app logida `migrate --noinput` natijasini tekshiring. Muvaffaqiyatli apply qilingan migrationlar yonida `[X]` bo'ladi. Holatni Render Shell'da ko'rish:

```bash
python manage.py showmigrations
python manage.py migrate --check
```

`showmigrations` bo'limlarni `[X]` (qo'llangan) yoki `[ ]` (kutilayotgan) qilib chiqaradi. Migration yiqilsa, deploy/app logdagi birinchi traceback/DB xatosini toping. Sababni tuzatib, migration kodini yangi commit bilan yuboring. Production migration tarixini qo'lda o'zgartirmang, `flush` ishlatmang va jadvallarni o'chirib qayta yaratmang. Backup va restore bosqichlari [SERVER_MIGRATION.md](SERVER_MIGRATION.md) da.

Lokal SQLite'dagi mavjud foydalanuvchi yoki moliyaviy ma'lumotlar yangi Render PostgreSQL'ga avtomatik ko'chmaydi. Ko'chirish kerak bo'lsa, avval alohida backup oling va staging bazada sinovdan o'tgan import rejasidan foydalaning. Production bazada `flush`, migration'larni o'chirish yoki ma'lumotlarni almashtirib yuborishi mumkin bo'lgan restore buyrug'ini ishlatmang.

## Statik fayllar

Django'da `STATIC_ROOT=staticfiles/`, `STATIC_URL=/static/`; production'da WhiteNoise middleware `SecurityMiddleware` ortidan ishlaydi. `collectstatic` build vaqtida yig'adi va WhiteNoise admin CSS/JS kabi statik fayllarni beradi.

## Maxfiy media fayllar

`TuitionPayment.receipt`, `AssignmentSubmission.file` va boshqa uploadlar `private_media/` lokal papkasiga yoziladi. Render Free filesystem'i ephemeral: restart yoki redeploy paytida fayllar yo'qolishi mumkin. Maxfiy receipt va topshiriqlarni saqlash uchun bu doimiy backup emas. Alohida autentifikatsiyalangan download endpointi ham yo'q; production'da fayl URL'lari orqali yuklamani tarqatish hozir qo'llab-quvvatlanmaydi. Fayllarni doimiy saqlash zarur bo'lsa, serverda persistent disk yoki private object storage kerak bo'ladi.

## PostgreSQL va migratsiyalar

Settings Render'ning `DATABASE_URL` qiymatidan foydalanadi. Paroldagi maxsus belgilar URI formatida encode qilinadi, Django esa username va passwordni decode qiladi. Production'da `DATABASE_URL` yo'q yoki SQLite URL bo'lsa, dastur aniq xato bilan to'xtaydi. Render'ning internal DB URL'ini tanlang va database bilan web service'ni bir hududda joylashtiring.

Render Shell'da migration holatini ko'rish uchun:

```bash
python manage.py showmigrations
python manage.py migrate --check
```

`migrate` buyrug'i Render `preDeployCommand` bosqichida ishlaydi. Production database'da migration fayllarini o'chirmang, `flush` qilmang va bazani yangidan yaratmang.

## Tuition cron vazifasi

`python manage.py enforce_tuition` muddati o'tgan va to'lanmagan `TuitionPeriod` yozuvlarini topib, hali cheklanmagan o'quvchi hisobini cheklaydi. Hisob allaqachon cheklangan bo'lsa, odatiy qayta ishga tushirish yangi audit log yoki bildirishnoma yaratmaydi. Buyruq `TuitionPeriod` yozuvlarini yaratmaydi; oylik to'lov davrlari boshqa jarayon orqali oldindan kiritilgan bo'lishi kerak.

Render Dashboard'da alohida **Cron Job** yarating va quyidagilarni belgilang:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Command: `python manage.py enforce_tuition`
- Schedule: har kuni Toshkent vaqti bilan 01:15. Render cron vaqti UTC bo'lgani uchun oldingi kunning 20:15 UTC vaqtini, ya'ni `15 20 * * *` ni kiriting.
- Environment: Web Service'dagi `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, host/CORS/CSRF qiymatlarini ishlating. Secretni qayta generatsiya qilmang; ikkala servisda bir xil secret bo'lishi uchun Environment Group yoki aynan bir xil qiymatdan foydalaning.

Render bir cron job'ning bir vaqtda ikki nusxada ishlashiga yo'l qo'ymaydi. Avval staging bazada **Trigger Run** qiling va natija hamda audit log'ni ko'ring. Cron job alohida build va service bo'lgani uchun barcha environment variable'larini unga ham kiriting.

## Autentifikatsiya va frontend ulanishi

- Staff login: `/api/v1/auth/staff/login/`
- Student login: `/api/v1/auth/student/login/`
- JWT refresh: `/api/v1/auth/token/refresh/`

Access token 15 daqiqa, refresh token 1 kun amal qiladi; refresh rotation va blacklist yoqilgan. Rollarni backend tekshiradi. Deploydan keyin Render Shell'da `createsuperuser` ishga tushiring va zarur bo'lsa foydalanuvchining `role` qiymatini `admin` yoki `director` qiling.

Har bir frontendni production uchun build qilayotganda `VITE_API_BASE_URL=https://<api-host>/api/v1` ni belgilang. Brauzerning Network va Console oynalarida login, token refresh, himoyalangan API va CORS'ni tekshiring. Ayrim panellar mock yoki `localStorage` ishlatadi, shuning uchun backend deploy frontend integratsiyasini o'z-o'zidan yakunlamaydi.

## Backup va tiklash

Render PostgreSQL backup/PITR imkoniyati, saqlash muddati va tiklash shartlari tarifga bog'liq. Ularni Render Dashboard'da tekshiring. Bepul PostgreSQL ishlatmang: baza 30 kundan so'ng tugaydi va boshqariladigan backup yo'q. Backup yo'q bo'lsa, production'da moliyaviy ma'lumot saqlamang.

Media fayllar `backend/private_media/` papkasida saqlanadi, lekin Render Free'da bu joy doimiy emas. DB backup fayllarni o'z ichiga olmaydi; fayllarni saqlash kerak bo'lsa, serverdan alohida himoyalangan backup oling. Restore'ni avval staging bazada sinang. To'g'ri baza, backup va vaqtni tekshirmasdan production'da qaytarib bo'lmaydigan restore buyrug'ini ishlatmang.

## Deploydan keyingi tekshiruv

1. Build log'da `check --deploy` va `collectstatic`, Pre-Deploy log'da `migrate --noinput` xatosiz yakunlanganini tasdiqlang.
2. `/` HTTP 200 qaytarishi va health check o'tishini tekshiring.
3. `/admin/login/` sahifasida Django admin CSS/JS to'g'ri ko'rinishini tekshiring.
4. `/api/docs/` va `/api/schema/` ochilishini tekshiring.
5. Xodim va o'quvchi loginini, noto'g'ri parolni, JWT yangilanishini va himoyalangan endpointlarni tekshiring.
6. Har bir rol faqat ruxsat berilgan ma'lumotni ko'rishi va o'zgartirishini tekshiring.
7. Render loglarida 500, DB, static, CORS xatolari yoki parol/token kabi sirlar chiqmaganini tekshiring.
8. `check --deploy` HTTPS, secret key, DEBUG va cookie ogohlantirishlarini tuzating. OpenAPI schema ogohlantirishlari alohida tozalash vazifasi bo'lib qolishi mumkin.
9. Backup va staging restore'ni amalda sinang.

## Hozirgi cheklovlar

- Shaxsiy chek va topshiriq fayllari uchun ruxsatni tekshiradigan download endpoint yo'q; Render Free'da lokal media doimiy saqlanmaydi.
- Ayrim frontendlar mock yoki `localStorage` ishlatadi; barcha frontend va API oqimlari ulanmagan.
- Ushbu muhitdan PostgreSQL, Render build log, domen va login jarayonini boshidan oxirigacha tekshirish imkoni bo'lmadi.
- Haqiqiy frontend originlari va custom domenlar noma'lum; CORS/CSRF qiymatlarini Render Dashboard'da o'zingiz kiriting.
