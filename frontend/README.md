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

## Netlify deployment

Deploy the four Vite apps as four separate Netlify sites connected to the same GitHub repository. Each app has its own `netlify.toml` with the workspace build command, output directory, production `VITE_API_BASE_URL`, and SPA fallback redirect. The Node version is pinned to 24 in `.nvmrc`; the npm workspace lockfile is `frontend/package-lock.json`.

For each Netlify site, select its app directory as **Package directory** and set **Base directory** to `frontend`:

| Site | Package directory | Build command | Publish directory |
|---|---|---|---|
| Admin | `frontend/apps/admin` | `npm run build --workspace=@avlod/admin` | `apps/admin/dist` |
| Director | `frontend/apps/director` | `npm run build --workspace=@avlod/director` | `apps/director/dist` |
| Teacher | `frontend/apps/teacher` | `npm run build --workspace=@avlod/teacher` | `apps/teacher/dist` |
| Student | `frontend/apps/student` | `npm run build --workspace=@avlod/student` | `apps/student/dist` |

The checked-in `VITE_API_BASE_URL` points to `https://avlod-talim.onrender.com/api/v1`. That API currently returns HTTP 503, so the published pages can load but authenticated/API workflows will not work until the Render backend is healthy. After Netlify creates the sites, add each actual HTTPS site origin to the backend's `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`; do not guess or use a broad wildcard. Netlify deployment also requires the Git branch and this configuration to be pushed to GitHub first.
