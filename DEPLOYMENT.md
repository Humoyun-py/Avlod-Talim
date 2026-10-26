# Django backendni Render'ga joylash

Loyiha Render Blueprint (`render.yaml`) va build skripti (`backend/build.sh`) bilan tayyorlandi. Render akkauntiga yoki GitHub repository'ga ulanish imkoni bo'lmagani sababli serverga deploy bajarilmadi. Blueprint'da pullik, doimiy PostgreSQL va pullik web service rejalari ko'rsatilgan: Render bepul servislarini production uchun tavsiya qilmaydi; bepul web servis uxlaydi, bepul PostgreSQL 30 kundan so'ng tugaydi va backup bermaydi. Reja narxi hamda hisob-kitobini Render Dashboard'da tekshiring.

## Blueprint orqali boshlash

1. O'zgarishlarni GitHub'dagi `Humoyun-py/Avlod-Talim` repository'ga push qiling.
2. Render Dashboard'da **New + → Blueprint** ni bosing, repository'ni ulang va `render.yaml` ni tanlang.
3. Blueprint `avlod-talim-db` PostgreSQL va `avlod-talim-api` Django Web Service yaratadi. `DJANGO_SECRET_KEY` avtomatik hosil qilinadi, `DATABASE_URL` database connection string'iga ulanadi.
4. Blueprint yaratishda `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` va private media bucket credentiallari so'raladi. Bu qiymatlarga faqat haqiqiy HTTPS frontend originlarini kiriting (masalan, har bir panel alohida host bo'lsa, barchasini vergul bilan yozing). API domenini bu ro'yxatga faqat u brauzer frontend origin sifatida ishlatilsa kiriting.
5. Render hosti `RENDER_EXTERNAL_HOSTNAME` orqali `ALLOWED_HOSTS` ga avtomatik qo'shiladi. Custom API domen ishlatilsa, uni `DJANGO_ALLOWED_HOSTS` ga qo'shib, Render Dashboard'da domenni tasdiqlang.
6. Build muvaffaqiyatli tugagach, `https://<api-host>/` manzilini oching. API hujjatlari: `https://<api-host>/api/docs/`, schema: `https://<api-host>/api/schema/`.

## Qo'lda Web Service yaratish

- Runtime: Python 3
- Root Directory: `backend`
- Build Command: `./build.sh`
- Pre-Deploy Command: `python manage.py migrate --noinput`
- Start Command: `gunicorn config.wsgi:application --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile -`
- Health Check Path: `/`

Kerakli Environment Variables:

- `DJANGO_DEBUG=false`
- `DJANGO_SECRET_KEY`: Render'da Generate Value orqali kamida 50 belgili tasodifiy maxfiy qiymat.
- `DATABASE_URL`: Render PostgreSQL'ning internal connection string'i.
- `DJANGO_ALLOWED_HOSTS`: API custom domeni bo'lsa o'sha hostname; `onrender.com` hostname avtomatik olinadi.
- `CORS_ALLOWED_ORIGINS`: kerakli admin/director/teacher/student frontendlarining `https://` originlari.
- `CSRF_TRUSTED_ORIGINS`: CSRF uchun ruxsat beriladigan frontendlarning `https://` originlari.
- `SECURE_SSL_REDIRECT=true`
- `SECURE_HSTS_SECONDS=3600`
- `AWS_STORAGE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_REGION_NAME`; S3-compatible provider endpoint talab qilsa `AWS_S3_ENDPOINT_URL` ham.

`DJANGO_SECRET_KEY` bo'lmasa production Django ishga tushmaydi. Render'ning `SECRET_KEY` nomli o'zgaruvchisi ham alias sifatida qabul qilinadi. Secret va database parolini kod, README, GitHub yoki commitga yozmang; `backend/.env` ni commit qilmang.

## Build va migration

`backend/build.sh` dependency'larni o'rnatadi, `manage.py check --deploy` bajaradi va `collectstatic --noinput` bilan statik fayllarni yig'adi. `set -Eeuo pipefail` sabab xato bo'lsa build to'xtaydi. Database migratsiyasi build'da emas, Render `preDeployCommand` bosqichida **bir marta** `python manage.py migrate --noinput` orqali bajariladi. Render yangi web instance'ni ishga tushirishdan oldin bu buyruqni yakunlaydi; buyruq xato kodi bilan tugasa deploy bekor bo'ladi va start buyrug'i ishlamaydi. Bu sozlama pullik service'dagi pre-deploy imkoniyatiga tayanadi.

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

Render deploy logida **Pre-Deploy** bosqichi va `migrate --noinput` natijasini tekshiring. Muvaffaqiyatli apply qilingan migrationlar yonida `[X]` bo'ladi. Holatni Render Shell'da ko'rish:

```bash
python manage.py showmigrations
python manage.py migrate --check
```

`showmigrations` bo'limlarni `[X]` (qo'llangan) yoki `[ ]` (kutilayotgan) qilib chiqaradi. Migration yiqilsa, Pre-Deploy logdagi birinchi traceback/DB xatosini toping; web service yangi release'ni ishga tushirmasligi kerak. Sababni tuzatib, migration kodini yangi commit bilan yuboring. Production migration tarixini qo'lda o'zgartirmang, `flush` ishlatmang va jadvallarni o'chirib qayta yaratmang. Backup va restore bosqichlari [SERVER_MIGRATION.md](SERVER_MIGRATION.md) da.

Lokal SQLite'dagi mavjud foydalanuvchi yoki moliyaviy ma'lumotlar yangi Render PostgreSQL'ga avtomatik ko'chmaydi. Ko'chirish kerak bo'lsa, avval alohida backup oling va staging bazada sinovdan o'tgan import rejasidan foydalaning. Production bazada `flush`, migration'larni o'chirish yoki ma'lumotlarni almashtirib yuborishi mumkin bo'lgan restore buyrug'ini ishlatmang.

## Statik fayllar

Django'da `STATIC_ROOT=staticfiles/`, `STATIC_URL=/static/`; production'da WhiteNoise middleware `SecurityMiddleware` ortidan ishlaydi. `collectstatic` build vaqtida yig'adi va WhiteNoise admin CSS/JS kabi statik fayllarni beradi. User uploadlar private S3-compatible bucket'ga yoziladi, Render ephemeral diskiga emas.

## Maxfiy media fayllar

`TuitionPayment.receipt`, `AssignmentSubmission.file` va media maydonlari production'da private S3-compatible storage'ga yoziladi. Obyektlarni public qilmang. Ruxsat tekshiruvli API'lar serializer orqali 300 soniyalik signed URL qaytaradi; linkni olgan har kim muddati tugaguncha foydalana oladi. Alohida download endpoint yo'q, shuning uchun haqiqiy production roli bilan file access va link tarqalishi xavfini tekshiring. Local DEBUG rejimida fayllar `private_media/` papkasida qoladi.

Render Blueprint'dan oldin private bucket yarating va public access'ni o'chiring. Production media oqimini ishlatishdan oldin:

1. Payment va submission endpointlaridagi role/queryset scoping'ni haqiqiy foydalanuvchi rollari bilan sinang.
2. Signed URL muddati 300 soniyadan oshmasin; URL'larni log, analytic event yoki public joyga chiqarmang.
3. Fayl hajmi/turi tekshiruvini, upload siyosatini va kerak bo'lsa malware scan'ni sozlang.

Hozir alohida fayl download endpointi yo'q; serializer'dan kelgan signed URL qisqa muddatli bearer link hisoblanadi. File access testlari muvaffaqiyatli bo'lmaguncha maxfiy upload oqimini faollashtirmang.

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

Media fayllarni private cloud storage'ga o'tkazgach, shifrlash, versioning/backup, saqlash muddati va tiklash tartibini alohida belgilang. Restore'ni avval staging bazada sinang. To'g'ri baza, backup va vaqtni tekshirmasdan production'da qaytarib bo'lmaydigan restore buyrug'ini ishlatmang.

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

- Shaxsiy chek va topshiriq fayllari uchun ruxsatni tekshiradigan download endpoint va private cloud storage adapter yo'q.
- Ayrim frontendlar mock yoki `localStorage` ishlatadi; barcha frontend va API oqimlari ulanmagan.
- Ushbu muhitdan PostgreSQL, Render build log, domen va login jarayonini boshidan oxirigacha tekshirish imkoni bo'lmadi.
- Haqiqiy frontend originlari va custom domenlar noma'lum; CORS/CSRF qiymatlarini Render Dashboard'da o'zingiz kiriting.
