/**
 * src/pages/admin/UsersPage.jsx
 * ------------------------------------------------------------------
 * Route: /admin/users (admin only - see App.jsx's RequireRole wrap)
 * Lists every account from the `users` Firestore collection and lets
 * an admin change roles with a dropdown. This is how someone actually
 * becomes an "editor" or "admin" after signing up as the default
 * "viewer" - there's no self-service way to grant yourself elevated
 * access, which is the point.
 *
 * `getDocs(collection(db, 'users'))` = a one-time read of every
 * document in the "users" collection - unlike AuthContext's
 * onSnapshot (which stays live), a plain admin list screen is fine
 * to just re-fetch on demand (see the "Refresh" button).
 */

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { useAuth } from '../../context/AuthContext.jsx';

const ROLES = ['viewer', 'editor', 'admin'];

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(uid, newRole) {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
  }

  return (
    <div className="content-page">
      <h1>Manage users</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Changing a role here updates it live - that person's UI updates immediately (via
        AuthContext's real-time Firestore listener), no sign-out required.
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="auth-card__error">{error}</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem' }}>Devices signed in</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem' }}>
                  {u.email} {u.uid === user?.uid && <em>(you)</em>}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.uid, e.target.value)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ padding: '0.5rem' }}>{(u.sessions || []).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
