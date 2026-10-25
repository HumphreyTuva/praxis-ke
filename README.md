# Praxis KE website — React + Django

Policy Research & Advisory · *Kenyan Roots. Global Perspective.*

- **frontend/** — React 19 + Vite. Home, About, Research, Publications (+ detail pages), Contact. No router dependency (small built-in History-API router).
- **backend/** — Django (no other packages). JSON API, admin for content and enquiries, SQLite by default. Serves the built frontend, so one process runs the whole site.

## Quick start
```bash
./setup.sh                                   # installs, builds, migrates, seeds
cd backend && python3 manage.py createsuperuser
python3 manage.py runserver                  # http://127.0.0.1:8000  (admin at /admin/)
```

### Development with hot reload
```bash
cd backend && python3 manage.py runserver     # API on :8000
cd frontend && npm run dev                    # site on :5173 (proxies /api and /media)
```

## Adding content (no redesign needed)
Admin → **Publications** → Add. Set *status* to `Published`, upload a PDF in *File*, and it appears on the Publications page with a **Download PDF** button. Tick *Featured* to show it on the Home page. `In development` items are shown with a clear badge and no download; `Draft` items are hidden. Pillars are edited under **Pillars**. Contact-form messages land under **Contact messages**.

Seed content comes only from the brief (pillars + the first, *in-development* brief). No statistics, partners, testimonials or accreditation are shown.

## Configuration (env vars)
`DJANGO_SECRET_KEY`, `DJANGO_DEBUG` (1/0), `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_LOCATION` (default "Kenya"), `PUBLIC_LINKEDIN_URL`, `PUBLIC_X_URL` (shown on the Contact page/footer only when set), `CONTACT_NOTIFY_EMAIL` (optional email copy of enquiries), `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD`. For production set `DJANGO_DEBUG=0` and a secret key; serve `/media` and `/assets` via nginx or a CDN.

## Tests
`cd backend && python3 manage.py test`

## Brand assets
`frontend/public/brand` (P monograms, hero/banner photos, cover, social share image, textures) and `frontend/public/favicons` (from your pack). **Still needed:** a true SVG/vector logo and a single-colour version (the header uses the supplied PNG mark plus live-text wordmark).

## Still to supply
Real contact email / social links: set the `PUBLIC_*` env vars (none were in the brief, so none are shown), and the publication PDF when ready.


## Owner dashboard (/manage)

A WhatsApp-simple admin for the site owner, built in React inside the same app.

- **Open it:** press `Ctrl` + `Shift` + `A` (Mac: `Cmd` + `Shift` + `A`) on any page, or **long-press the Praxis KE logo** (about 1 second) on a phone. `/manage` also works directly.
- **First login:** `setup.sh` runs `python manage.py create_owner`, which creates the account for `nancymutwiri97@gmail.com` (override with the `OWNER_EMAIL` env var) and prints a one-time password. Sign in with the email and that password, then change it under Settings. Forgot it? Run `python manage.py changepassword <username>`.
- **What the owner can do:** read and reply to messages (unread badges, mark done), add/edit/delete publications (cover image, PDF, status), reorder and edit research areas, edit contact details, change password.
- **Install as an app:** use the Install button on Home or in Settings (Android/desktop Chrome). On iPhone: Share, then Add to Home Screen.
- After pulling these changes run `python manage.py makemigrations core && python manage.py migrate`, then `npm run build` in `frontend/`.
- Tests: `python manage.py test core`.
