/**
 * src/layout/Sidebar.jsx
 * ------------------------------------------------------------------
 * Two layers of navigation:
 *   1. A LEARN / BUILD / STORE pillar switcher (tabs) at the top -
 *      this is Codetrove's top-level structure from the project's
 *      IA diagram.
 *   2. Below it, whichever pillar is selected renders its own nav
 *      list - Learn shows the search + "Languages" accordion (the
 *      original claude.ai-style behavior); Build and Store show flat
 *      link lists, since they don't need search/collapse behavior.
 *
 * `activePillar` is local UI state (not part of the URL) - simplest
 * option here since switching pillars is just "which list do I show
 * in the sidebar," not a page navigation by itself.
 */

import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/topics/index.js';
import { getRecentTopics } from '../utils/recentTopics.js';
import { paths } from '../routes/routes.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Sidebar.css';

const PILLARS = [
  { key: 'learn', label: 'Learn' },
  { key: 'build', label: 'Build' },
  { key: 'store', label: 'Store' },
];

/** Which pillar a given URL belongs to, so opening a direct link
 * (e.g. /build/tools) highlights the right tab automatically. */
function pillarForPath(pathname) {
  if (pathname.startsWith('/build')) return 'build';
  if (pathname.startsWith('/store')) return 'store';
  return 'learn';
}

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryKey: activeCategoryKey } = useParams();
  const { user, role } = useAuth();
  const canAuthorContent = role === 'admin' || role === 'editor';

  const [activePillar, setActivePillar] = useState(() => pillarForPath(location.pathname));
  useEffect(() => setActivePillar(pillarForPath(location.pathname)), [location.pathname]);

  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(getRecentTopics());
  }, [activeCategoryKey]);

  const trimmedSearch = search.trim().toLowerCase();

  const expandedKeys = useMemo(() => {
    if (trimmedSearch) {
      return new Set(
        CATEGORIES.filter((c) => c.topics.some((t) => t.title.toLowerCase().includes(trimmedSearch))).map((c) => c.key)
      );
    }
    return new Set(activeCategoryKey ? [activeCategoryKey] : []);
  }, [trimmedSearch, activeCategoryKey]);

  const [manualOverrides, setManualOverrides] = useState({});
  function isExpanded(categoryKey) {
    if (categoryKey in manualOverrides) return manualOverrides[categoryKey];
    return expandedKeys.has(categoryKey);
  }
  function toggleGroup(categoryKey) {
    setManualOverrides((prev) => ({ ...prev, [categoryKey]: !isExpanded(categoryKey) }));
  }

  if (!open) {
    return (
      <nav className="sidebar sidebar--collapsed" aria-label="Navigation (collapsed)">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            className="sidebar__rail-dot"
            style={{ background: category.color }}
            title={category.label}
            onClick={() => navigate(paths.category(category.key))}
          >
            {category.label.charAt(0)}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="sidebar" aria-label="Navigation">
      <div className="sidebar__pillars" role="tablist">
        {PILLARS.map((pillar) => (
          <button
            key={pillar.key}
            role="tab"
            aria-selected={activePillar === pillar.key}
            className={`sidebar__pillar ${activePillar === pillar.key ? 'sidebar__pillar--active' : ''}`}
            onClick={() => setActivePillar(pillar.key)}
          >
            {pillar.label}
          </button>
        ))}
      </div>

      {activePillar === 'learn' && (
        <>
          <input
            type="search"
            className="sidebar__search"
            placeholder="Search topics…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search topics"
          />

          {canAuthorContent && (
            <button type="button" className="sidebar__new-btn" onClick={() => navigate(paths.createPage())}>
              + New topic
            </button>
          )}

          <NavLink to={paths.practice()} className="sidebar__link" style={{ marginBottom: '0.5rem' }}>
            Practice
          </NavLink>

          <p className="sidebar__section-label">Languages</p>

          {CATEGORIES.map((category) => {
            const matchingTopics = trimmedSearch
              ? category.topics.filter((t) => t.title.toLowerCase().includes(trimmedSearch))
              : category.topics;
            if (trimmedSearch && matchingTopics.length === 0) return null;
            const expanded = isExpanded(category.key);

            return (
              <div key={category.key} className="sidebar__group">
                <button
                  type="button"
                  className="sidebar__group-header"
                  onClick={() => toggleGroup(category.key)}
                  aria-expanded={expanded}
                >
                  <span className="sidebar__dot" style={{ background: category.color }} />
                  <span className="sidebar__group-title">{category.label}</span>
                  <span className={`sidebar__chevron ${expanded ? 'sidebar__chevron--open' : ''}`}>›</span>
                </button>
                {expanded && (
                  <ul className="sidebar__list">
                    {matchingTopics.map((topic) => (
                      <li key={topic.slug}>
                        <NavLink
                          to={paths.topic(category.key, topic.slug)}
                          className={({ isActive }) => (isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link')}
                        >
                          {topic.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {recent.length > 0 && !trimmedSearch && (
            <>
              <p className="sidebar__section-label">Recent</p>
              <ul className="sidebar__list">
                {recent.map((item) => (
                  <li key={`${item.categoryKey}-${item.slug}`}>
                    <NavLink to={paths.topic(item.categoryKey, item.slug)} className="sidebar__link">
                      {item.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {activePillar === 'build' && (
        <ul className="sidebar__list" style={{ padding: 0 }}>
          <li><NavLink to={paths.compiler()} className="sidebar__link">Online Compiler</NavLink></li>
          <li><NavLink to={paths.tools()} className="sidebar__link">Tools</NavLink></li>
          <li><NavLink to={paths.projects()} className="sidebar__link">My Projects</NavLink></li>
        </ul>
      )}

      {activePillar === 'store' && (
        user ? (
          <ul className="sidebar__list" style={{ padding: 0 }}>
            <li><NavLink to={paths.profile()} className="sidebar__link">My Profile</NavLink></li>
            <li><NavLink to={paths.resume()} className="sidebar__link">Resume</NavLink></li>
            <li><NavLink to={paths.certificates()} className="sidebar__link">Certificates</NavLink></li>
            <li><NavLink to={paths.career()} className="sidebar__link">Career</NavLink></li>
          </ul>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', padding: '0 0.4rem' }}>
            <NavLink to={paths.signIn()}>Sign in</NavLink> to access your profile, resume, and saved data.
          </p>
        )
      )}

      {role === 'admin' && (
        <NavLink to={paths.adminUsers()} className="sidebar__link" style={{ marginTop: 'auto' }}>
          Manage users
        </NavLink>
      )}
    </nav>
  );
}
