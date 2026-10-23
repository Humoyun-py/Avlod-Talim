# Avlod Ta'lim frontend workspace

Each panel is an independent Vite application so its routes, UI, and dependencies remain isolated. The root folder groups the apps and provides consistent launch/build commands.

## Applications

- `apps/student` — student portal plus legacy director UI pages mixed into the same app; split/cleanup is still needed.
- `apps/admin` — combined admin/director/teacher/student router and the only panel with a mostly centralized live API service.
- `apps/director` — standalone director UI; its service/context currently use mock data.
- `apps/teacher` — teacher portal; its auth and service layer currently provide demo/mock behavior despite an Axios API client.

## Install and run

From this folder run `npm install`, then launch one app:

```sh
npm run dev:admin
npm run dev:director
npm run dev:teacher
npm run dev:student
```

Each app has its own `.env.example`. Configure the backend base URL to `http://127.0.0.1:8000/api/v1/`; the Django server must be running separately.

## Integration audit (2026-10-22)

All four API base URL examples now target `/api/v1`. Staff login (teacher, director, admin) and student login use Django's `/auth/staff/login/` and `/auth/student/login/` contracts; the teacher and student clients use Django's `/auth/token/refresh/` refresh endpoint. The admin client now uses the Django dashboard, profile, and password-change routes. Student mode defaults to live API and does not silently switch to local mock mode.

This does not complete end-to-end panel integration. The standalone director pages and teacher domain service still use local mock stores; student dashboard/domain methods still read mock/localStorage structures; the admin service still calls multiple non-existent endpoints and sends payloads that do not match Django serializers. Backend endpoints also do not yet cover all UI operations (private receipt uploads/download, course topics/months, order management, profile update, richer reports). Treat successful authentication as the only broadly connected workflow at this point. Check `backend/README.md` for implemented routes and explicitly documented business limits.

## Local development

Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` in each app's `.env.local`, allow each app origin in backend `CORS_ALLOWED_ORIGINS`, run Django from `backend`, then start the desired Vite app with `npm run dev:<panel>` from this directory. Install Python and frontend dependencies first. See backend setup and tests in `backend/README.md`.
