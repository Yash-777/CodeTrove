/**
 * src/layout/Header.jsx
 * ------------------------------------------------------------------
 * Sidebar collapse toggle, brand, theme switcher, and auth-aware
 * actions: signed-out visitors see Sign in/Sign up; signed-in users
 * see their email, role badge, and a sign-out button. "+ New topic"
 * only renders for admin/editor roles - this is the UI-level half of
 * role enforcement (see components/RequireRole.jsx for the other
 * half, and server/auth.js for the part that actually can't be
 * bypassed).
 */

import { Link } from 'react-router-dom';
import { Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { paths } from '../routes/routes.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import './Header.css';

const THEME_CYCLE = { light: 'dark', dark: 'system', system: 'light' };
const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

export default function Header({ sidebarOpen, onToggleSidebar }) {
  const { user, profile, role, signOutCurrentDevice } = useAuth();
  const { mode, setMode } = useTheme();
  const ThemeIcon = THEME_ICON[mode];
  const canAuthorContent = role === 'admin' || role === 'editor';

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__toggle"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        ☰
      </button>

      <Link to={paths.home()} className="app-header__brand">
        Codetrove
      </Link>

      <div className="app-header__spacer" />

      {canAuthorContent && (
        <>
          <Link to={paths.createPage()} className="app-header__action">+ New topic</Link>
          <Link to={paths.drafts()} className="app-header__action app-header__action--ghost">Drafts</Link>
        </>
      )}

      <button
        type="button"
        className="app-header__icon-btn"
        onClick={() => setMode(THEME_CYCLE[mode])}
        aria-label={`Theme: ${mode}. Click to cycle.`}
        title={`Theme: ${mode} (click to change)`}
      >
        <ThemeIcon size={18} />
      </button>

      <Link to={paths.preferences()} className="app-header__icon-btn" aria-label="Preferences" title="Preferences">
        ⚙
      </Link>

      {user ? (
        <div className="app-header__user">
          <span className="app-header__role-badge">{role}</span>
          <span className="app-header__email" title={profile?.email}>{profile?.email}</span>
          <button
            type="button"
            className="app-header__icon-btn"
            onClick={signOutCurrentDevice}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <>
          <Link to={paths.signIn()} className="app-header__action app-header__action--ghost">Sign in</Link>
          <Link to={paths.signUp()} className="app-header__action">Sign up</Link>
        </>
      )}
    </header>
  );
}
