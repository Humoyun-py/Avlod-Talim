# Production deployment (Ubuntu + PostgreSQL + Nginx)

Ushbu yo'riqnoma serverga deploy qilish uchun tayyorlangan andoza. Haqiqiy domen, server manzili va SSH ruxsati berilmagani uchun bu repodan serverga deploy bajarilmagan. `example.uz`, `/srv/avlod-talim` va parol qiymatlarini o'zingizning infratuzilmangizga moslang.

## Hozirgi tayyorgarlik va muhim cheklovlar

- Backend production sozlamalarida `DJANGO_DEBUG=false`, kamida 50 belgili maxfiy `DJANGO_SECRET_KEY`, aniq `DJANGO_ALLOWED_HOSTS`, HTTPS CORS/CSRF originlari va PostgreSQL `DATABASE_URL` talab qilinadi.
- `DATABASE_URL` yo'q yoki noto'g'ri bo'lsa production server SQLite'ga jim o'tmaydi, ishga tushishida xato beradi. URL parolidagi `@`, `#`, `/`, `:` kabi belgilar URL encode qilinishi kerak.
- PostgreSQL ulanishi TLS sertifikat/`sslmode` parametrlari bilan sozlanishi mumkin. DB parolini shell history, Git yoki chatga yozmang.
- `private_media/` ichidagi chek va topshiriqlarni foydalanuvchi huquqini tekshirib beradigan download endpointi yo'q. Nginx ataylab `/media/` ni ochmaydi. Bu endpoint amalga oshirilmaguncha fayllar API orqali ommaviy yuklab olinmaydi; yangi chek upload qilishni production'da faollashtirishdan oldin ruxsatli download oqimini alohida ishlab chiqing.
- `enforce_tuition` muddati o'tgan `TuitionPeriod` yozuvlarini tekshiradi, lekin TuitionPeriod yozuvlarini o'zi yaratmaydi. Markazning oylik davrlarini oldindan kiritish kerak. Timer har kuni 01:15 da buyruqni ishga tushiradi.
- Admin panel bilan qolgan panellarning integratsiyasi to'liq tasdiqlanmagan. Deploy oldidan real frontend API domeni va har bir rolning muhim oqimlarini alohida tekshiring.

## 1. Server va system user

Ubuntu LTS serverda domenning DNS A/AAAA yozuvini serverga qarating. SSH orqali:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-dev build-essential libpq-dev postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl
sudo adduser --system --group --home /srv/avlod-talim avlod
sudo install -d -o avlod -g www-data -m 0750 /srv/avlod-talim
```

Kodni `/srv/avlod-talim` ichiga checkout qiling va `avlod` foydalanuvchisiga backend papkasi hamda private media ustidan kerakli ruxsat bering. Release'ni `main` branch'dan joylashdan oldin kutilgan commit hash'ni tekshiring.

## 2. PostgreSQL

DB nomi va userini yarating. Kuchli parolni `psql` promptiga kiriting, buyruq argumentiga qo'shmang:

```bash
sudo -u postgres psql
```

```sql
CREATE ROLE avlod_user LOGIN;
\password avlod_user
CREATE DATABASE avlod_talim OWNER avlod_user ENCODING 'UTF8';
\q
```

DB faqat lokal ulanishga ochiq qolishi tavsiya etiladi. Alohida DB server bo'lsa firewall va TLS sertifikatlarini sozlang.

## 3. Python, environment va initial deploy

```bash
cd /srv/avlod-talim/backend
sudo -u avlod python3 -m venv .venv
sudo -u avlod .venv/bin/pip install --upgrade pip
sudo -u avlod .venv/bin/pip install -r requirements.txt
sudo install -d -o avlod -g www-data -m 0750 private_media staticfiles
sudo install -d -o root -g avlod -m 0750 /etc/avlod-talim
sudo install -o root -g avlod -m 0640 /dev/null /etc/avlod-talim/backend.env
sudoedit /etc/avlod-talim/backend.env
```

`backend.env` namunasi (qiymatlarni haqiqiy domenlarga almashtiring):

```dotenv
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<kamida-50-belgili-tasodifiy-maxfiy-qiymat>
DJANGO_ALLOWED_HOSTS=api.example.uz
DATABASE_URL=postgresql://avlod_user:URL_ENCODED_PASSWORD@127.0.0.1:5432/avlod_talim?sslmode=prefer
CORS_ALLOWED_ORIGINS=https://admin.example.uz,https://director.example.uz
CSRF_TRUSTED_ORIGINS=https://admin.example.uz,https://director.example.uz
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=3600
```

Masalan, Python orqali secret yarating va natijani `sudoedit` bilan to'g'ridan-to'g'ri serverdagi env fayliga kiriting:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(64))'
```

`backend.env` ni Git'ga kiritmang. Secret va DB credentiallariga faqat root hamda deploy service access olishi kerak. Django sozlamalari URL parolini DB'ga uzatishdan oldin decode qiladi.

Deploydan oldin eski bazada ma'lumot bo'lsa, avval uni zaxiralang va `pg_restore` bilan tiklang (quyida). SQLite'dan ko'chirish zarur bo'lsa, bu yo'riqnoma avtomatik ko'chirmaydi: alohida migration/import rejasi tuzing va production ma'lumotni ustidan yozmang. Bo'sh DB bo'lsa:

```bash
sudo -u avlod bash -lc 'cd /srv/avlod-talim/backend && set -a && source /etc/avlod-talim/backend.env && set +a && .venv/bin/python manage.py check --deploy'
sudo -u avlod bash -lc 'cd /srv/avlod-talim/backend && set -a && source /etc/avlod-talim/backend.env && set +a && .venv/bin/python manage.py migrate --noinput && .venv/bin/python manage.py collectstatic --noinput'
```

`check --deploy` docs/OpenAPI generatorning type hint va `ShopOrderViewSet` schema introspection bo'yicha ogohlantirishlarini ham chiqarishi mumkin. Haqiqiy muhitda bu buyruqni ishlating; production secret zaifligi, DEBUG, HTTPS yoki cookie ogohlantirishlari chiqsa deployni to'xtatib, sababini tuzating. HSTS subdomain/preload'ni faqat barcha tegishli domenlar doim HTTPS bo'lishi aniq bo'lganda yoqing.

`createsuperuser` ni interaktiv yarating; keyin kerakli `role=admin` yoki `role=director`ni Django shell'da belgilang. `is_staff` Django admin saytiga tegishli; API panel rolini u bilan adashtirmang.

## 4. Gunicorn va timerlar

```bash
sudo install -o root -g root -m 0644 deployment/systemd/avlod-talim.service /etc/systemd/system/
sudo install -o root -g root -m 0644 deployment/systemd/avlod-talim-tuition.service /etc/systemd/system/
sudo install -o root -g root -m 0644 deployment/systemd/avlod-talim-tuition.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now avlod-talim.service avlod-talim-tuition.timer
```

Gunicorn Unix socket'ni Nginx bilan `www-data` guruhi orqali ulashadi. Ishlamasa `journalctl -u avlod-talim -e` ni ko'ring. Tuition timer natijasi `journalctl -u avlod-talim-tuition.service` da yoziladi; jadval: `systemctl list-timers avlod-talim-tuition.timer`.

## 5. Nginx, HTTPS va frontend

`deployment/nginx/avlod-talim.conf` faylini `/etc/nginx/sites-available/avlod-talim` ga ko'chiring. `server_name`, frontend statik fayllari uchun alohida virtual host va asset yo'llarini haqiqiy domen/buildga moslang. API upstream konfiguratsiyasi `X-Forwarded-Proto` yuboradi; bu Django HTTPS redirect loop'ini oldini oladi. `/media/` uchun alias qo'shmang.

```bash
sudo ln -s /etc/nginx/sites-available/avlod-talim /etc/nginx/sites-enabled/avlod-talim
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.example.uz
```

Frontendlarni build vaqtida production API URL bilan build qiling. Frontend hosting'da HTTPS va SPA fallback sozlang. Lokal `localhost` API URL production bundle ichida qolmaganini tekshiring.

## 6. Backup va restore

Backup env fayli faqat serverda bo'lsin:

```bash
sudo install -o root -g root -m 0600 /dev/null /etc/avlod-talim/backup.env
sudoedit /etc/avlod-talim/backup.env
```

`backup.env` ichiga `DATABASE_URL=...`, `BACKUP_DIR=/var/backups/avlod-talim`, `MEDIA_DIR=/srv/avlod-talim/backend/private_media`, `RETENTION_DAYS=14` kiriting. So'ng:

```bash
sudo install -o root -g root -m 0750 deployment/scripts/backup.sh /srv/avlod-talim/deployment/scripts/backup.sh
sudo install -o root -g root -m 0644 deployment/systemd/avlod-talim-backup.service /etc/systemd/system/
sudo install -o root -g root -m 0644 deployment/systemd/avlod-talim-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now avlod-talim-backup.timer
sudo systemctl start avlod-talim-backup.service
```

Backupni boshqa disk yoki himoyalangan object storage'ga muntazam nusxalang. Server diskidagi nusxa server ishdan chiqishidan himoya qilmaydi. Backup'lar private media va shaxsiy ma'lumotlarni o'z ichiga oladi: ruxsatni cheklang, storage encryption yoqing, retention va restore mashqini belgilang.

DB tiklashni faqat alohida tekshirilgan restore rejasida, maqsad DB to'g'ri ekanini tasdiqlab bajaring:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" /path/to/database-YYYYMMDDTHHMMSSZ.dump
tar -xzf /path/to/media-YYYYMMDDTHHMMSSZ.tar.gz -C /srv/avlod-talim/backend/
sudo chown -R avlod:www-data /srv/avlod-talim/backend/private_media
```

`--clean` target DB'dagi joriy obyektlarni o'chirishi mumkin. Bu buyruqni production DB'ga ishlatishdan oldin to'g'ri backup/target/restore vaqti aniqlanib, maintenance rejalashtirilgan bo'lishi kerak. Dastlab izolyatsiyalangan staging DB'ga tiklab, ilovani tekshiring.

## 7. Deploydan keyingi tekshiruv

```bash
sudo systemctl status avlod-talim --no-pager
sudo systemctl status avlod-talim-tuition.timer --no-pager
sudo systemctl status avlod-talim-backup.timer --no-pager
curl --fail https://api.example.uz/
```

Shuningdek Django `check --deploy`, migratsiya holati (`showmigrations`), login, har bir role uchun ruxsatlar, to'lovni ko'rib chiqish, fayl upload chegaralari, browser CORS, HTTPS redirect va DB/media restore'ni staging'da tekshiring. Faqat UI yuklanganiga qarab deploy muvaffaqiyatli deb hisoblamang.

## Yangilash tartibi

Har relizda backup oling, tekshirilgan commitni deploy qiling, dependency'larni o'rnating, `check --deploy`, `migrate --noinput`, `collectstatic --noinput` bajarib Gunicorn'ni qayta ishga tushiring. DB migration rollback hamesha avtomatik emas; release va migration uchun alohida rollback/forward-fix rejasini saqlang.
