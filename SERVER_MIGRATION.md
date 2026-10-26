# Render'dan VPS yoki boshqa hostingga ko'chirish

Backend hostingga bog'liq emas: `config.wsgi:application`, PostgreSQL `DATABASE_URL`, `requirements.txt`, Django migrations va environment variables'dan foydalanadi. Ushbu qo'llanmada Render'dan yangi Linux serverga database va yuklangan fayllarni yo'qotmasdan ko'chirish tartibi berilgan. Haqiqiy production backup'ni staging'da tiklab tekshirmaguncha ma'lumotlar xavfsiz ko'chishini kafolatlab bo'lmaydi.

## Saqlanadigan ma'lumotlar

PostgreSQL dump foydalanuvchilar va password hash'lari, kurs/guruh/enrolment, dars va davomat, coin va moliyaviy tranzaksiyalar, to'lovlar, audit yozuvlari, JWT blacklist va Django migration holatini saqlaydi. Yuklangan fayllar alohida private object storage'da bo'ladi; DB backupning o'zi media fayllarni o'z ichiga olmaydi. Ikkalasini ham backup qiling.

## 1. Avval staging'da ko'chirishni mashq qiling

1. Yangi server yoki staging muhit va **bo'sh** PostgreSQL yarating.
2. Render DB'dan dump oling, private media fayllarni ko'chiring va staging DB'ga tiklang.
3. Shu repository commit'ini joylab, Python virtualenv yarating va `pip install -r backend/requirements.txt` bajaring.
4. Env sozlab, `check --deploy`, migration, API login/role, moliyaviy yozuvlar va media fayllarini tekshiring.
5. Staging'dan backup olib, uni yana boshqa bo'sh DB'ga tiklashni sinang. Bu tugamaguncha production cutover qilmang.

## 2. Yangi serverni tayyorlash

1. PostgreSQL'da eski bazadan farqli nomli yangi, bo'sh target DB yarating.
2. Python 3.12+ va PostgreSQL client vositalarini (`psql`, `pg_dump`, `pg_restore`) o'rnating.
3. Tekshirilgan commit'ni serverga oling, backend virtualenv yarating va `requirements.txt` ni o'rnating.
4. `deployment/systemd/avlod-talim.service` va `deployment/nginx/avlod-talim.conf` fayllarini haqiqiy o'rnatish yo'llari va domenga moslang. Gunicorn `config.wsgi:application` ni ishga tushirsin, Nginx esa HTTPS proxy bo'lsin.
5. `/etc/avlod-talim/backend.env` kabi ruxsati cheklangan secret fayli yoki secret manager ishlating; repository'dagi `.env` ni serverga ko'chirmang.

```dotenv
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<Render'dagi ayni secret qiymati>
DJANGO_ALLOWED_HOSTS=api.example.uz
DATABASE_URL=postgresql://USER:URL_ENCODED_PASSWORD@127.0.0.1:5432/avlod_talim
CORS_ALLOWED_ORIGINS=https://admin.example.uz,https://director.example.uz
CSRF_TRUSTED_ORIGINS=https://admin.example.uz,https://director.example.uz
SECURE_SSL_REDIRECT=true
AWS_STORAGE_BUCKET_NAME=avlod-talim-private-media
AWS_ACCESS_KEY_ID=<private storage access key>
AWS_SECRET_ACCESS_KEY=<private storage secret>
AWS_S3_REGION_NAME=<bucket region>
# AWS_S3_ENDPOINT_URL=<S3-compatible provider talab qilsa>
AWS_QUERYSTRING_EXPIRE=300
```

`DJANGO_SECRET_KEY`ni o'zgartirmaslik password hash'lari va hali amal qilayotgan JWT'larni saqlaydi. Secret key almashtirilsa faol JWT tokenlar bekor bo'ladi. Database URL ichidagi maxsus belgilarni URL-encode qiling.

## 3. Render PostgreSQL'dan backup olish

Render DB service'dagi **Recovery → Create export** orqali logical export oling va Render'dan tashqaridagi shifrlangan joyga nusxalang. Yoki `pg_dump` custom format skriptidan foydalaning:

```bash
export DATABASE_URL='postgresql://...'
export BACKUP_DIR="$PWD/backups"
./migration/export.sh
```

Ulanish URL'ini buyruq satriga ochiq yozmang, shell history yoki log'ga chiqarmang. Skript `pg_dump` ishga tushiradi, `pg_restore --list` va SHA-256 bilan tekshiradi. Dump maxfiy foydalanuvchi va moliyaviy ma'lumotlarni o'z ichiga oladi; kirishni cheklang va shifrlangan doimiy joyga nusxalang.

## 4. Media fayllarni ko'chirish

Production backend private S3-compatible bucket ishlatadi. Bucket ommaga ochiq bo'lmasin; FileField qisqa muddatli signed URL beradi. Render va yangi VPS bir bucket hamda credential ishlatsa, fayllarni ko'chirish shart emas. Boshqa provider'ga o'tishda upload'ni to'xtatib, `uploads/` prefix'ini saqlab fayllarni ko'chiring:

```bash
mkdir -m 700 -p "$PWD/media-transfer"
aws s3 sync "s3://$SOURCE_BUCKET/uploads/" "$PWD/media-transfer/" --only-show-errors
aws --endpoint-url="$TARGET_S3_ENDPOINT" s3 sync "$PWD/media-transfer/" "s3://$TARGET_BUCKET/uploads/" --only-show-errors
```

AWS CLI'da source va target uchun tegishli credential, region va endpoint'ni sozlang. `--delete` ishlatmang. Manba va target'dagi fayllar soni, umumiy hajmi hamda ayrim fayllarning checksum'ini taqqoslang. DB'dagi file path qiymatlarini o'zgartirmang.

Oldingi backend Render'ning vaqtinchalik `private_media/` diskiga upload qilgan bo'lishi mumkin. Bu fayllar restart yoki deploy vaqtida yo'qolishi mumkin. Yangi storage'ni ulash eski fayllarni avtomatik tiklamaydi. Keyingi deploydan oldin eski instance'da fayl qolgan-qolmaganini va ularni private backup'ga olish imkonini tekshiring.

## 5. Dump'ni yangi bo'sh PostgreSQL'ga tiklash

Yangi target DB yarating va bo'shligini tasdiqlang. Restore skripti DB nomini tekshiradi; user table topilsa to'xtaydi va hech narsani o'chirmaydi.

```bash
export TARGET_DATABASE_URL='postgresql://...'
export EXPECTED_TARGET_DB='avlod_talim_migration_test'
export DUMP_FILE='/secure-backups/avlod-talim-YYYYMMDDTHHMMSSZ.dump'
./migration/restore-to-empty-db.sh
```

Render Dashboard export'i `.dir.tar.gz` bo'lsa, uni custom dump skriptiga bermang. Arxivni alohida ochib, mos PostgreSQL versiyasida `pg_restore --format=directory --no-owner --no-privileges --exit-on-error --dbname="$TARGET_DATABASE_URL" <dump-directory>` buyrug'idan faqat yangi bo'sh DB uchun foydalaning. `--clean`, `--if-exists` yoki `flush` ishlatmang. Restore buyrug'i mavjud obyektlarni o'chirishi mumkin; Render ham bu flaglar haqida ogohlantiradi.

## 6. Tekshiruv va yakuniy cutover

Restore'dan so'ng:

```bash
python manage.py check --deploy
python manage.py showmigrations
python manage.py migrate --check
```

Yangi kodda pending migration bo'lsa, backup borligini tasdiqlagach `python manage.py migrate --noinput` bajaring.

- Manba va target'dagi user, course, group, enrollment, lesson, attendance, coin, payment, financial transaction, audit log va tuition period sonlarini taqqoslang.
- Mavjud login, role va password hash ko'chganini test login bilan tekshiring; foydalanuvchilarni qayta ro'yxatdan o'tkazish talab qilinmasligi kerak.
- Admin/director/teacher/student ruxsatlari, JWT refresh, payment review va API endpointlarni tekshiring.
- Har bir FileField path target bucket'dagi ayni object key'ga mosligini va signed URL faqat vakolatli API javobida chiqib, 300 soniyada muddati tugashini tekshiring.
- HTTPS, CORS/CSRF, admin static fayllari, log'da secret yo'qligi va backup'dan qayta tiklashni tekshiring.

Yakuniy production ko'chirish:

1. Kam yozuv bo'ladigan vaqtni tanlab, Render API va `enforce_tuition` cron'ni vaqtincha to'xtating. Login, payment, upload kabi DB/media yozuvlarini yoping.
2. Render PostgreSQL'dan yakuniy dump oling; media bucket'ning yakuniy backup/sync'ini qiling.
3. Rehearsal'dagi emas, yakuniy dump'ni yangi bo'sh target DB'ga tiklang. Yakuniy media fayllarni o'sha key'lar bilan ko'chiring.
4. Yangi VPS environment variable'larini target DB va storage'ga qarating, Gunicorn/Nginx'ni ishga tushiring va smoke test qiling.
5. DNS va frontend `VITE_API_BASE_URL` ni yangi API host'ga o'tkazing, HTTPS/CORS'ni tekshiring.
6. Render service, eski DB va backup'larni yangi tizim barqaror ishlaguncha saqlang.

Eski serverni darhol o'chirmang. Cutover'dan keyin yangi DB'ga yozuv tushgan bo'lsa, DNS'ni eski serverga qaytarish bu yozuvlarni eski bazaga ko'chirmaydi. Rollback'dan oldin yangi yozuvlarni to'xtatib, yangi DB'dan eskisiga alohida sync yoki restore rejasini tasdiqlang.

## Backup va tiklash davriyligi

Render pullik PostgreSQL'dagi PITR va logical export imkoniyatlarini Dashboard'da tekshiring. Logical export Render'da 7 kun saqlanishi mumkin; uzoq muddatli backup'ni alohida shifrlangan storage'da saqlang. Private media bucket'da versioning/backup va tiklash sinovlarini sozlang. Backup'ni staging'da muntazam tiklab tekshiring.

## Xavfsizlik chegaralari

- Ruxsat, backup va target DB'ni qayta tekshirmasdan production DB'ga restore qilmang, o'chirmang yoki yangidan yaratmang.
- Yangi tizim tekshiruvi tugamaguncha eski server yoki Render DB'ni o'chirmang.
- Dump va media fayllarda maxfiy ma'lumot bor; ularni shifrlang va kirishni cheklang.
- Haqiqiy production backup bilan staging mashqi o'tkazilmaguncha barcha ma'lumot xavfsiz ko'chadi deb kafolat bermang.
