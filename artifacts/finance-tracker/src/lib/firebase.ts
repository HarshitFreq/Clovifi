import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Auth,
} from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB0es96NrrrF_t_6Z_6spbcRkLvB1LXq0Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "clovifi-11.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "clovifi-11",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "clovifi-11.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "234028099609",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:234028099609:web:d991a471c9fe1b56e5a288",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TQNZ2LFJ52",
};

export const isFirebaseConfigured = true;

// Initialize Firebase safely
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Initialize analytics in browser environment if supported
  if (typeof window !== "undefined") {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Analytics unsupported or blocked (e.g. adblocker)
    });
  }
} catch (err) {
  console.warn("Firebase initialization warning:", err);
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export {
  app,
  auth,
  analytics,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
};

// Helper: Sync Firebase authenticated user session with our PostgreSQL backend (best-effort)
export async function syncFirebaseUserWithBackend(user: FirebaseUser): Promise<any> {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/auth/firebase-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        token,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      return await res.json().catch(() => null);
    }
    return null;
  } catch (err) {
    // Non-blocking: If running on static hosting or backend is offline, session is still preserved in Firebase Auth
    console.warn("Backend session sync notice:", err);
    return null;
  }
}
