#!/usr/bin/env bash
# One-time setup: installs deps, builds the frontend, migrates and seeds the database.
set -euo pipefail
cd "$(dirname "$0")"
python3 -m pip install -r backend/requirements.txt
(cd frontend && npm install && npm run build)
cd backend
python3 manage.py makemigrations core
python3 manage.py migrate
python3 manage.py seed_content
python3 manage.py create_owner
echo "Owner dashboard: open the site and press Ctrl+Shift+A (or long-press the logo on a phone), or go to /manage"
echo "Run:  python3 manage.py runserver   → http://127.0.0.1:8000"
