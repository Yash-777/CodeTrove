/**
 * server/firebaseAdmin.js
 * ------------------------------------------------------------------
 * Initializes firebase-admin - Google's official server-side SDK,
 * distinct from the `firebase` package used in the browser
 * (src/firebase/config.js). The admin SDK can verify ID tokens and
 * read/write Firestore with full trust (no security-rule
 * restrictions), which is exactly what a server needs to check "is
 * this really user X, and what's their role?" without trusting
 * anything the browser claims about itself.
 *
 * Needs a service account key - see README.md "Setting up Firebase"
 * for how to download one and point GOOGLE_APPLICATION_CREDENTIALS
 * at it. Without it, every request needing auth will fail loudly
 * (by design - never silently skip auth checks).
 */

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
