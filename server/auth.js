/**
 * server/auth.js
 * ------------------------------------------------------------------
 * Express middleware that does the part a frontend guard (see
 * src/components/RequireRole.jsx) fundamentally CANNOT do securely:
 * prove who's really making this request, using a token the browser
 * can't forge.
 *
 * How it works:
 *  1. The client sends `Authorization: Bearer <Firebase ID token>`
 *     (obtained via `user.getIdToken()` - see NewTopicPage.jsx /
 *     DraftsPage.jsx).
 *  2. `adminAuth.verifyIdToken()` cryptographically checks that token
 *     was really issued by Firebase for a real, currently-valid user
 *     - a forged or expired token is rejected here.
 *  3. We then look up that user's role from Firestore (the SAME
 *     source of truth the client reads, but via the trusted admin
 *     SDK) and attach it to `req.user` for route handlers to check.
 */

import { adminAuth, adminDb } from './firebaseAdmin.js';

/** Requires a valid signed-in user of ANY role. Populates req.user. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    const role = snap.exists ? snap.data().role : 'viewer';
    req.user = { uid: decoded.uid, email: decoded.email, role };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired sign-in - please sign in again.' });
  }
}

/** Use AFTER requireAuth: `[requireAuth, requireRole(['admin'])]`. */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `This action requires one of these roles: ${allowedRoles.join(', ')}.` });
      return;
    }
    next();
  };
}
