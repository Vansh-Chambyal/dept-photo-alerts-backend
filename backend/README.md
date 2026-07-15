# Dept Photo Alerts — Backend

FastAPI backend for the department photo-alert app. Phone number + PIN login
(no SMS, no cost), Supabase for the database and photo storage, Firebase
Cloud Messaging for push notifications. Every piece here runs on a free tier
with no card required anywhere.

## 1. Supabase setup (database + photo storage)

1. Go to https://supabase.com → sign up (no card needed) → **New project**.
   Pick any name and region, set a database password (save it, you'll need
   it in step 4).
2. Once the project is ready: **SQL Editor** → **New query** → paste in the
   entire contents of `supabase_schema.sql` from this folder → **Run**.
   Before running, edit the last line to use your own phone number — that
   row makes you the first administrator.
3. **Storage** (left sidebar) → **New bucket** → name it `photos` → toggle
   **Public bucket** on → **Create bucket**. Public is what lets the app
   display photos via a plain URL without extra signing logic.
4. **Project Settings** (gear icon) → **Database** → **Connection string**
   → copy the **URI**. Change `postgresql://` to `postgresql+asyncpg://`
   at the very start, and fill in the password from step 1. This is your
   `DATABASE_URL`.
5. **Project Settings** → **API** → copy the **Project URL** (`SUPABASE_URL`)
   and the **service_role** key (`SUPABASE_SERVICE_KEY` — NOT the `anon`
   key; the service role key is what lets the backend upload photos).

## 2. Firebase setup (push notifications only)

1. Go to https://console.firebase.google.com → **Add project** → any name
   → you can skip Google Analytics. This creates a project on the free
   **Spark** plan — leave it there, don't upgrade to Blaze. Cloud Messaging
   is free and unlimited on Spark; we're only using this project for
   notifications, not auth or storage.
2. **Project settings** (gear icon) → **Service accounts** tab →
   **Generate new private key**. This downloads a JSON file.
3. Rename it to `firebase-service-account.json` and place it directly in
   this `backend/` folder (next to `requirements.txt`). Keep it out of any
   public git repo — add it to `.gitignore`.

## 3. Local setup

Requires Python 3.10+.

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now open .env and fill in the 5 values from steps 1 and 2 above
```

Run it:

```bash
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` — FastAPI's interactive docs, where you
can try every endpoint directly from the browser. `GET /health` should
return `{"status": "ok"}`, confirming the server and your `.env` are wired
up correctly.

## 4. API reference

| Endpoint | Who | What it does |
|---|---|---|
| `GET /departments` | anyone | List departments (for the picker on first login) |
| `POST /departments` | admin | Create a department |
| `PUT /departments/{id}` | admin | Rename a department |
| `DELETE /departments/{id}` | admin | Delete a department (blocked if users are still assigned) |
| `POST /auth/check-phone` | anyone | Is this number registered, and has it set a PIN yet? |
| `POST /auth/set-pin` | anyone | First-time setup: set PIN + pick department, returns a token |
| `POST /auth/login` | anyone | Phone + PIN → token |
| `GET /users/me` | logged in | Your own profile |
| `POST /users/me/fcm-token` | logged in | Save this device's push token |
| `POST /users/me/department` | logged in | Change your own department |
| `GET /users` | admin | List every user |
| `POST /users/whitelist` | admin | Grant a phone number access |
| `DELETE /users/{id}` | admin | Remove a user |
| `POST /photos/send` | admin | Upload a photo to a department + push notify everyone in it |
| `GET /photos` | logged in | Your department's photos (admins see all) |

Every endpoint except the ones marked "anyone" expects
`Authorization: Bearer <token>` from `/auth/set-pin` or `/auth/login`.

## 5. Deploying (Render, free)

1. Push this `backend/` folder to a GitHub repo.
2. https://render.com → sign up (no card needed) → **New** → **Web Service**
   → connect your repo.
3. Settings:
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type**: Free
4. Add the same 5 environment variables from your `.env` file under
   **Environment**. For `FIREBASE_CREDENTIALS_PATH`, you can't easily
   commit the JSON file to a public repo — instead paste its full contents
   into a new env var (e.g. `FIREBASE_CREDENTIALS_JSON`) and adjust
   `app/fcm.py` to write it to a temp file on startup, or use a private
   repo. (Happy to wire that up when we get here.)
5. Deploy. Render gives you a URL like `https://your-app.onrender.com` —
   that's your backend's base URL for the frontend to call.

**Two free-tier things worth knowing:**
- Render's free web service spins down after 15 minutes with no traffic
  and takes 30–60 seconds to wake back up on the next request. Point a free
  uptime monitor (e.g. UptimeRobot) at `https://your-app.onrender.com/health`
  every ~10 minutes during work hours to keep it warm.
- Supabase's free database pauses after 7 days with zero activity. Data
  isn't deleted, it just needs a manual resume (or the same kind of
  periodic ping) to stay online continuously.

## What's next

This backend is complete and runnable on its own — test it via `/docs`
before moving on. Next up: the React + Capacitor frontend that talks to it.
