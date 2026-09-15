/**
 * src/components/RequireRole.jsx
 * ------------------------------------------------------------------
 * Wraps a route element and only renders it if the signed-in user's
 * role is in `allow`. Used in App.jsx like:
 *   <Route path="/create-page" element={
 *     <RequireRole allow={['admin', 'editor']}><NewTopicPage /></RequireRole>
 *   } />
 *
 * IMPORTANT HONESTY NOTE: this only hides/redirects in the UI. Real
 * enforcement (stopping a determined user from calling the API
 * directly) happens server-side in server/auth.js, which verifies
 * the Firebase ID token and checks the role stored in Firestore
 * before allowing a draft to be created or published. Never rely on
 * a frontend-only check for anything that actually needs to be
 * secure - UI guards are for user experience (don't show a form
 * you can't use), server guards are for security.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { paths } from '../routes/routes.config.js';

export default function RequireRole({ allow, children }) {
  const { user, role, loading } = useAuth();

  if (loading) return null; // avoid a flash of "access denied" while auth state is still loading

  if (!user) return <Navigate to={paths.signIn()} replace />;

  if (!allow.includes(role)) {
    return (
      <div className="content-page">
        <h1>Restricted</h1>
        <p>Your account role ("{role}") doesn't have access to this page.</p>
      </div>
    );
  }

  return children;
}
