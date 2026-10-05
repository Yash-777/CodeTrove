/**
 * src/firebase/config.js
 * ------------------------------------------------------------------
 * Initializes the Firebase client SDK (Auth + Firestore). This is
 * where your actual project details plug in - see .env.example at
 * the project root for which values to fill in, from your own
 * Firebase project's console (Project settings -> your web app).
 *
 * Vite exposes any environment variable prefixed with VITE_ to
 * client code via `import.meta.env.VITE_*` (this is Vite's own
 * convention, not something we configured - it deliberately only
 * exposes VITE_-prefixed vars, so you never accidentally ship a
 * secret meant for the server into browser code).
 *
 * WITHOUT a real Firebase project's credentials in a `.env` file,
 * sign-up/sign-in will fail with a Firebase config error - this file
 * cannot work "out of the box" the way the rest of the app does,
 * because auth genuinely needs a real backend project behind it.
 * See README.md "Setting up Firebase" for the exact steps.
 */
/*
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
*/


import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export let auth = null;
export let db = null;

const clientApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';

(async () => {
  if (clientApiKey) {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    console.info('Initializing Firebase client SDK.');
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    return;
  }

  // Firebase Admin credentials are server-only. The browser must never
  // attempt to load service-account files or initialize firebase-admin.
  console.error('[CodeTrove] Firebase client configuration is missing. Copy .env.example to .env and fill in the VITE_FIREBASE_* web app values. Public pages remain available; sign-in/sign-up will return a configuration error.');
})();