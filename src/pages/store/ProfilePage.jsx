/**
 * src/pages/store/ProfilePage.jsx
 * ------------------------------------------------------------------
 * Route: /store/profile (requires login)
 * Unlike Resume/Certificates/Career (placeholders below), this page
 * is genuinely functional right now - it just displays the Firestore
 * `users/{uid}` document that already exists (email, role, how many
 * devices are signed in) via useAuth(). "Personal developer data" in
 * the structure diagram starts here; secrets/tokens/IDs would extend
 * this same document (or a linked one) later.
 */

import { useAuth } from '../../context/AuthContext.jsx';
import { paths } from '../../routes/routes.config.js';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { profile, role, signOutOtherDevices } = useAuth();

  return (
    <div className="content-page">
      <h1>My Profile</h1>

      <div className="tool-list__item" style={{ display: 'block', maxWidth: '420px' }}>
        <p><strong>Email:</strong> {profile?.email}</p>
        <p><strong>Role:</strong> {role}</p>
        <p><strong>Devices signed in:</strong> {(profile?.sessions || []).length} / 2</p>
        <button type="button" className="btn-secondary" onClick={signOutOtherDevices} style={{ marginTop: '0.5rem' }}>
          Sign out other devices
        </button>
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
        Resume, certificates, and career history live under <Link to={paths.resume()}>Resume</Link>,{' '}
        <Link to={paths.certificates()}>Certificates</Link>, and <Link to={paths.career()}>Career</Link> -
        not built yet, see those pages for what's planned.
      </p>
    </div>
  );
}
