/**
 * src/pages/auth/SignInPage.jsx
 * ------------------------------------------------------------------
 * Route: /signin
 * Plain email/password sign-in. If this account is already signed in
 * on 2 other devices, useAuth().signIn throws a friendly error (see
 * AuthContext.jsx) which is shown right here rather than a generic
 * Firebase error code.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { paths } from '../../routes/routes.config.js';
import { friendlyAuthError } from './SignUpPage.jsx';
import './AuthPages.css';

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(paths.home());
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        {import.meta.env.MODE === 'test' && import.meta.env.DEV && (
          <section className="auth-card__test-users" aria-label="Development test accounts">
            <strong>Local test accounts · UI only</strong>
            <p>Choose an account to test role-based navigation:</p>
            {[
              { label: 'Yash-777', email: 'yash.777@codetrove.dev', password: 'IIayuX8v%Mci%CSf', role: 'admin' },
              { label: 'Yash-Editor', email: 'yash.editor@codetrove.dev', password: 'Editor', role: 'editor' },
              { label: 'Yash-Viewer', email: 'yash.viewer@codetrove.dev', password: 'Viewer', role: 'viewer' },
            ].map((account) => (
              <button key={account.email} type="button" className="auth-card__test-user" onClick={() => { setEmail(account.email); setPassword(account.password); }}>
                <span><b>{account.label}</b><small>{account.email}</small></span><span className={`auth-card__role auth-card__role--${account.role}`}>{account.role}</span>
              </button>
            ))}
          </section>
        )}

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="field">
          <span>Password</span>
          <div className="password-field__input-row">
            <input
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-field__icon-btn"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && <p className="auth-card__error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="auth-card__switch">
          New here? <Link to={paths.signUp()}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}
