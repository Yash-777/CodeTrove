import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '../../routes/routes.config.js';
import { useAuth } from '../../context/AuthContext.jsx';
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
    try { await signIn(email, password); navigate(paths.home()); }
    catch (err) { setError(err?.message || 'Unable to sign in. Please try again.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Password</span><div className="password-field__input-row"><input type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" className="password-field__icon-btn" onClick={() => setVisible((value) => !value)}>{visible ? 'Hide' : 'Show'}</button></div></label>
        {error && <p className="auth-card__error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        <p className="auth-card__switch">New here? <Link to={paths.signUp()}>Create an account</Link></p>
      </form>
    </div>
  );
}
