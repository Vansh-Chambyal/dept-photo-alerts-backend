// Handles push notifications while the app isn't in the foreground.
// This file is served as-is by the browser (Vite doesn't process anything
// in public/), so unlike the rest of the app it can't read values from
// .env — paste in the same 6 Firebase values from your .env file by hand
// below, once you've created the Firebase project.
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "PASTE_VITE_FIREBASE_API_KEY",
  authDomain: "PASTE_VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "PASTE_VITE_FIREBASE_PROJECT_ID",
  storageBucket: "PASTE_VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "PASTE_VITE_FIREBASE_APP_ID",
});

firebase.messaging();
