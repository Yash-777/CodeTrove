/**
 * src/layout/Sidebar.jsx
 * ------------------------------------------------------------------
 * Two layers of navigation:
 *   1. LEARN / BUILD / STORE pillar switcher.
 *   2. Learn renders a metadata-driven documentation tree.
 *
 * Documentation hierarchy is recursive so new sections, topics,
 * subtopics, sub-subtopics, and pages do not require sidebar changes.
 */

import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/topics/index.js';
import { NAVIGATION_TREE, getNavigationSearchResults } from '../data/navigation.js';
import { getRecentTopics } from '../utils/recentTopics.js';
import { paths } from '../routes/routes.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Sidebar.css';

const PILLARS = [
  { key: 'learn', label: 'Learn' },
  { key: 'build', label: 'Build' },
  { key: 'store', label: 'Store' },
];

function pillarForPath(pathname) {
  if (pathname.startsWith('/build')) return 'build';
  if (pathname.startsWith('/store')) return 'store';
  return 'learn';
}

function nodeHasContent(node) {
  return (node.children?.length || 0) > 0 || (node.pages?.length || 0) > 0;
}

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const canAuthorContent = role === 'admin' || role === 'editor';

  const [activePillar, setActivePillar] = useState(() => pillarForPath(location.pathname));
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => setActivePillar(pillarForPath(location.pathname)), [location.pathname]);
  useEffect(() => setRecent(getRecentTopics()), [location.pathname]);

  const trimmedSearch = search.trim().toLowerCase();
  const searchResults = useMemo(() => getNavigationSearchResults(search), [search]);

  useEffect(() => {
    if (!trimmedSearch) return;
    setExpanded((previous) => {
      const next = { ...previous };
      searchResults.forEach((result) => result.ancestors.forEach((ancestor) => { next[ancestor.path] = true; }));
      return next;
    });
  }, [trimmedSearch, searchResults]);

  function isActivePath(path) {
    return location.pathname === `/content/tree/${path}`;
  }

  function isNodeActive(node) {
    return location.pathname.startsWith(`/content/tree/${node.path}/`);
  }

  function toggleNode(node) {
    setExpanded((previous) => ({ ...previous, [node.path]: !(previous[node.path] ?? isNodeActive(node)) }));
  }

  function renderPage(page) {
    return (
      <li key={page.path} className="sidebar__tree-item">
        <NavLink
          to={`/content/tree/${page.path}`}
          className={({ isActive }) => isActive
            ? 'sidebar__link sidebar__link--active sidebar__link--page'
            : 'sidebar__link sidebar__link--page'}
        >
          {page.label}
        </NavLink>
      </li>
    );
  }

  function renderNode(node, depth = 0) {
    const hasContent = nodeHasContent(node);
    const active = isNodeActive(node);
    const isOpen = expanded[node.path] ?? active;

    return (
      <li key={node.path} className="sidebar__tree-item">
        <button
          type="button"
          className={`sidebar__tree-header ${depth === 0 ? 'sidebar__tree-header--topic' : ''} ${active ? 'sidebar__tree-header--active' : ''}`}
          onClick={() => {
            if (!hasContent) return;
            toggleNode(node);
          }}
          aria-expanded={hasContent ? isOpen : undefined}
        >
          {depth === 0 && <span className="sidebar__dot" />}
          <span className="sidebar__tree-title">{node.label}</span>
          {hasContent && <span className={`sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}`}>›</span>}
        </button>

        {isOpen && hasContent && (
          <ul className="sidebar__tree-list">
            {(node.children || []).map((child) => renderNode(child, depth + 1))}
            {(node.pages || []).map(renderPage)}
          </ul>
        )}
      </li>
    );
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
      <div className="sidebar__top">
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
          <div className="sidebar__search-wrap">
            <input
              type="search"
              className="sidebar__search"
              placeholder="Search CodeTrove..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search CodeTrove documentation"
            />
            <span className="sidebar__search-shortcut">⌘K</span>
          </div>
        )}
      </div>

      <div className="sidebar__scroll">
        {activePillar === 'learn' && (
          <>
          {canAuthorContent && (
            <button type="button" className="sidebar__new-btn" onClick={() => navigate(paths.createPage())}>
              + New topic
            </button>
          )}

          <NavLink to={paths.practice()} className="sidebar__link" style={{ marginBottom: '0.5rem' }}>
            Practice
          </NavLink>

          {trimmedSearch ? (
            <>
              <p className="sidebar__section-label">Search results</p>
              {searchResults.length === 0 ? (
                <p className="sidebar__empty">No documentation matches "{search}".</p>
              ) : (
                <ul className="sidebar__search-results">
                  {searchResults.map((result) => (
                    <li key={result.path}>
                      <NavLink
                        to={`/content/tree/${result.path}`}
                        className={({ isActive }) => isActive
                          ? 'sidebar__search-result sidebar__search-result--active'
                          : 'sidebar__search-result'}
                      >
                        {result.ancestors.slice(0, -1).map((ancestor) => (
                          <span key={ancestor.path}>{ancestor.label}</span>
                        ))}
                        <span className="sidebar__search-result-page">└── {result.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              {NAVIGATION_TREE.map((section) => {
                const active = isNodeActive(section);
                const isOpen = expanded[section.path] ?? active;
                return (
                  <div key={section.path} className="sidebar__section">
                    <button
                      type="button"
                      className="sidebar__section-toggle"
                      onClick={() => toggleNode(section)}
                      aria-expanded={isOpen}
                    >
                      <span className="sidebar__section-label">{section.label}</span>
                      <span className={`sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}`}>›</span>
                    </button>
                    {isOpen && (
                      <ul className="sidebar__tree-list sidebar__tree-list--root">
                        {(section.children || []).map((child) => renderNode(child, 0))}
                        {(section.pages || []).map(renderPage)}
                      </ul>
                    )}
                  </div>
                );
              })}

              {recent.length > 0 && (
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
      </div>
    </nav>
  );
}
