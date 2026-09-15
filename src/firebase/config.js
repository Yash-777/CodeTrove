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
    conssole.log('Initializing Firebase client SDK with config:', firebaseConfig);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    return;
  }

  // If we get here the client API key is empty. Attempt server-side admin
  // initialization if running in Node and GOOGLE_APPLICATION_CREDENTIALS is
  // available (or a local service account file exists).
  if (typeof window === 'undefined') {
    console.log('VITE_FIREBASE_API_KEY is empty. Attempting server-side Firebase Admin SDK initialization...');
    try {
      const adminImport = await import('firebase-admin');
      const admin = adminImport.default ?? adminImport;
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      let serviceAccount = null;

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        try {
          const content = fs.readFileSync(credPath, 'utf8');
          serviceAccount = JSON.parse(content);
        } catch (err) {
          console.error('Failed to read GOOGLE_APPLICATION_CREDENTIALS file:', err);
        }
      } else {
        const localPath = path.join(__dirname, 'serviceAccountKeyUAT.json');
        if (fs.existsSync(localPath)) {
          try {
            const content = fs.readFileSync(localPath, 'utf8');
            serviceAccount = JSON.parse(content);
          } catch (err) {
            console.error('Failed to read local service account file:', err);
          }
        } else {
          console.log('VITE_FIREBASE_API_KEY is empty and GOOGLE_APPLICATION_CREDENTIALS is not set.');
        }
      }

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        db = admin.firestore();
      }
    } catch (err) {
      console.error('Error initializing Firebase Admin SDK:', err);
    }
    return;
  }

  // Running in browser and no client API key: nothing we can do here.
  console.error(`
╔════════════════════════════════════════════════════════════════════╗
║                   FIREBASE NOT CONFIGURED                          ║
╚════════════════════════════════════════════════════════════════════╝

VITE_FIREBASE_API_KEY is empty and no server-side credentials available.

TO FIX THIS:
1. Go to  Firebase Console: https://console.firebase.google.com
2. Select your project → Project Settings → General tab
3. Scroll to "Your apps" → Click on your Web app → Firebase SDK snippet → Config - Copy the entire config object
4. Open .env file in your project root
5. Fill in the VITE_FIREBASE_* variables:
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123...

6. Save the file and refresh your browser

See README.md "Setting up Firebase" for detailed instructions.
`);
})();