# Dept Photo Alerts — Frontend

React (Vite) web app that talks to the FastAPI backend. Same codebase
builds into both the website and — via Capacitor — an installable Android
APK.

## 1. Local setup

Requires Node.js 18+.

```bash
cd frontend
npm install
cp .env.example .env
```

Open `.env` and set `VITE_API_BASE_URL` to your backend's URL
(`http://localhost:8000` while the backend is running locally, or your
Render URL once it's deployed). Leave the `VITE_FIREBASE_*` values blank
for now — the app runs fine without them, it just skips push notifications
until you fill them in (step 2).

```bash
npm run dev
```

Opens at `http://localhost:5173`. Try the full flow: your phone → whitelist
it as a user via `POST /users/whitelist` in the backend's `/docs` page (or
have your first admin account, already in `supabase_schema.sql`, whitelist
it from **Users** in the app) → sign in → pick a department → send a photo
as admin → see it show up in the feed.

## 2. Turning on push notifications

1. In the same Firebase project you created for the backend (Firebase
   Console → your project): **Project settings** → **General** → scroll to
   **Your apps** → click the **</>** (web) icon → register an app (any
   nickname) → copy the 6 config values into your `.env` as
   `VITE_FIREBASE_*`.
2. **Project settings** → **Cloud Messaging** → **Web configuration** →
   **Web Push certificates** → **Generate key pair** → copy that into
   `VITE_FIREBASE_VAPID_KEY`.
3. Open `public/firebase-messaging-sw.js` and paste the same 6 values in
   by hand (this file is a raw static file the browser loads directly, so
   it can't read `.env` — see the comment at the top of the file).
4. Restart `npm run dev`. On next sign-in, the browser will prompt for
   notification permission — accept it, and the backend will start
   delivering pushes to that device.

## 3. Deploying the web app (GitHub Pages, free)

```bash
npm run build
```

This outputs static files to `dist/`. Push `dist/` to a `gh-pages` branch
(or use the `gh-pages` npm package to automate it), then in your repo:
**Settings → Pages** → set the source to that branch. Make sure
`VITE_API_BASE_URL` in your `.env` points at your deployed Render backend
(not `localhost`) before running the build.

## 4. Wrapping it as an Android app (Capacitor)

```bash
npm install @capacitor/core @capacitor/android
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

That last command opens Android Studio. From there: **Build → Build Bundle(s)
/ APK(s) → Build APK(s)**. The resulting `.apk` (in
`android/app/build/outputs/apk/`) is what you hand people to sideload —
no Play Store needed. `capacitor.config.json` already has the app ID and
name set.

**Note on push notifications inside the Android wrapper:** the web-push
setup in step 2 works for the browser and often works inside Capacitor's
WebView too, but for the most reliable native Android push behavior
(delivery when the app is fully closed, not just backgrounded), the next
step up is swapping in the `@capacitor/push-notifications` plugin, which
talks to FCM through Android's native APIs instead of the browser's. Worth
doing once you've confirmed the rest of the app end-to-end — happy to wire
that up when you're ready for it.

## What's next

Both the backend and frontend are complete and tested independently. Next:
run them together end-to-end (backend `uvicorn` + frontend `npm run dev`),
confirm the full loop — whitelist a number, sign in, send a photo, see the
push — then move on to Android wrapping and deployment.
