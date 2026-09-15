/**
 * src/pages/auth/SignUpPage.jsx
 * ------------------------------------------------------------------
 * Route: /signup
 * Standard email/password sign-up form using Firebase Auth (via
 * useAuth().signUp - see context/AuthContext.jsx for what that does
 * under the hood: creates the auth account AND a matching Firestore
 * profile doc with role "viewer").
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { scorePassword } from '../../utils/passwordStrength.js';
import PasswordField from '../../components/PasswordField.jsx';
import { paths } from '../../routes/routes.config.js';
import './AuthPages.css';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { score } = scorePassword(password);
  const passwordOk = score === 4; // all 4 rules met

  async function handleSubmit(event) {
    event.preventDefault();
    if (!passwordOk) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp(email, password);
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
        <h1>Create your account</h1>
        <p className="auth-card__lede">New accounts start as viewers - an admin can promote you later.</p>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="field">
          <span>Password</span>
          <PasswordField value={password} onChange={setPassword} />
        </label>

        {error && <p className="auth-card__error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={!passwordOk || submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="auth-card__switch">
          Already have an account? <Link to={paths.signIn()}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}

/** Turns Firebase's error codes into plain-English messages. */
export function friendlyAuthError(err) {
  if (err.code === 'session-limit-reached') return err.message;
  switch (err.code) {
    case 'auth/email-already-in-use': return 'An account already exists for that email.';
    case 'auth/invalid-email': return 'That email address looks invalid.';
    case 'auth/weak-password': return 'Password is too weak.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    default: return err.message || 'Something went wrong - please try again.';
  }
}
