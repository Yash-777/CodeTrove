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
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/topics/index.js';
import {
  DOCUMENTATION_NAVIGATION,
  getDocumentationSearchResults,
} from '../data/topics/navigation.js';
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

function hasChildren(item) {
  return item.subtopics.length > 0 || item.pages.length > 0;
}

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const canAuthorContent = role === 'admin' || role === 'editor';

  const [activePillar, setActivePillar] = useState(() => pillarForPath(location.pathname));
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});

  useEffect(() => setActivePillar(pillarForPath(location.pathname)), [location.pathname]);
  useEffect(() => setRecent(getRecentTopics()), [location.pathname]);

  const trimmedSearch = search.trim().toLowerCase();
  const searchResults = useMemo(() => getDocumentationSearchResults(search), [search]);

  useEffect(() => {
    if (!trimmedSearch) return;

    const sections = {};
    const topics = {};
    const subtopics = {};

    searchResults.forEach((result) => {
      sections[result.sectionKey] = true;
      topics[`${result.sectionKey}/${result.topic.key}`] = true;
      if (result.subtopic) {
        subtopics[`${result.sectionKey}/${result.topic.key}/${result.subtopic.key}`] = true;
      }
    });

    setExpandedSections((prev) => ({ ...prev, ...sections }));
    setExpandedTopics((prev) => ({ ...prev, ...topics }));
    setExpandedSubtopics((prev) => ({ ...prev, ...subtopics }));
  }, [trimmedSearch, searchResults]);

  function toggle(setter, key, fallback = false) {
    setter((prev) => ({ ...prev, [key]: !(prev[key] ?? fallback) }));
  }

  function isSectionActive(section) {
    return location.pathname.startsWith(`/content/${section.key}/`);
  }

  function isTopicActive(section, topic) {
    const path = paths.documentationTopic(section.key, topic.key);
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  function isSubtopicActive(section, topic, subtopic) {
    const path = paths.documentationSubtopic(section.key, topic.key, subtopic.key);
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  function renderPage(section, topic, page, subtopic = null) {
    const path = subtopic
      ? paths.documentationPage(section.key, topic.key, subtopic.key, page.key)
      : `${paths.documentationTopic(section.key, topic.key)}/${page.key}`;

    return (
      <li key={page.key}>
        <NavLink
          to={path}
          className={({ isActive }) => isActive
            ? 'sidebar__link sidebar__link--active sidebar__link--page'
            : 'sidebar__link sidebar__link--page'}
        >
          {page.title}
        </NavLink>
      </li>
    );
  }

  function renderSubtopic(section, topic, subtopic) {
    const key = `${section.key}/${topic.key}/${subtopic.key}`;
    const active = isSubtopicActive(section, topic, subtopic);
    const expanded = expandedSubtopics[key] ?? active;

    return (
      <li key={subtopic.key} className="sidebar__tree-item">
        <button
          type="button"
          className={`sidebar__tree-header ${active ? 'sidebar__tree-header--active' : ''}`}
          onClick={() => {
            if (subtopic.pages.length === 0) {
              navigate(paths.documentationSubtopic(section.key, topic.key, subtopic.key));
              return;
            }
            toggle(setExpandedSubtopics, key, active);
          }}
          aria-expanded={subtopic.pages.length > 0 ? expanded : undefined}
        >
          <span className="sidebar__tree-title">{subtopic.title}</span>
          <span className={`sidebar__chevron ${expanded ? 'sidebar__chevron--open' : ''}`}>›</span>
        </button>
        {expanded && subtopic.pages.length > 0 && (
          <ul className="sidebar__tree-list sidebar__tree-list--pages">
            {subtopic.pages.map((page) => renderPage(section, topic, page, subtopic))}
          </ul>
        )}
      </li>
    );
  }

  function renderTopic(section, topic) {
    const key = `${section.key}/${topic.key}`;
    const active = isTopicActive(section, topic);
    const expanded = expandedTopics[key] ?? active;

    return (
      <li key={topic.key} className="sidebar__tree-item">
        <button
          type="button"
          className={`sidebar__tree-header sidebar__tree-header--topic ${active ? 'sidebar__tree-header--active' : ''}`}
          onClick={() => {
            if (!hasChildren(topic)) {
              navigate(paths.documentationTopic(section.key, topic.key));
              return;
            }
            toggle(setExpandedTopics, key, active);
          }}
          aria-expanded={hasChildren(topic) ? expanded : undefined}
        >
          <span className="sidebar__dot" />
          <span className="sidebar__tree-title">{topic.title}</span>
          {hasChildren(topic) && (
            <span className={`sidebar__chevron ${expanded ? 'sidebar__chevron--open' : ''}`}>›</span>
          )}
        </button>
        {expanded && hasChildren(topic) && (
          <ul className="sidebar__tree-list">
            {topic.subtopics.map((subtopic) => renderSubtopic(section, topic, subtopic))}
            {topic.pages.map((page) => renderPage(section, topic, page))}
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
                  {searchResults.map((result, index) => (
                    <li key={`${result.type}-${result.path}-${index}`}>
                      <NavLink
                        to={result.path}
                        className={({ isActive }) => isActive
                          ? 'sidebar__search-result sidebar__search-result--active'
                          : 'sidebar__search-result'}
                      >
                        <span>{result.topic.title}</span>
                        {result.subtopic && <span>└── {result.subtopic.title}</span>}
                        {result.page && (
                          <span className="sidebar__search-result-page">
                            {result.subtopic ? '     ├── ' : '└── '}{result.page.title}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              {DOCUMENTATION_NAVIGATION.map((section) => {
                const expanded = expandedSections[section.key] ?? isSectionActive(section);

                return (
                  <div key={section.key} className="sidebar__section">
                    <button
                      type="button"
                      className="sidebar__section-toggle"
                      onClick={() => toggle(setExpandedSections, section.key, isSectionActive(section))}
                      aria-expanded={expanded}
                    >
                      <span className="sidebar__section-label">{section.title}</span>
                      <span className={`sidebar__chevron ${expanded ? 'sidebar__chevron--open' : ''}`}>›</span>
                    </button>

                    {expanded && (
                      <ul className="sidebar__tree-list sidebar__tree-list--root">
                        {section.topics.map((topic) => renderTopic(section, topic))}
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
    </nav>
  );
}
