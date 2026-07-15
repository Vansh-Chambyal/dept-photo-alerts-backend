import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let firebaseApp;
function getFirebaseApp() {
  if (!firebaseApp) firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
}

// Returns a push token, or null if push isn't available/granted/configured
// yet. Deliberately never throws — push is a nice-to-have, not something
// that should block sign-in if Firebase isn't set up or the user says no.
export async function requestPushToken() {
  try {
    if (!firebaseConfig.apiKey) return null; // Firebase env vars not filled in yet
    if (!(await isSupported())) return null;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token || null;
  } catch (err) {
    console.warn("Push notification setup skipped:", err);
    return null;
  }
}
