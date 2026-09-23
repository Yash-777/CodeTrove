import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/topics/index.js';
import { getRecentTopics } from '../utils/recentTopics.js';
import { paths } from '../routes/routes.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Sidebar.css';

const PILLARS = [{ key: 'learn', label: 'Learn' }, { key: 'build', label: 'Build' }, { key: 'store', label: 'Store' }];
function pillarForPath(pathname) { if (pathname.startsWith('/build')) return 'build'; if (pathname.startsWith('/store')) return 'store'; return 'learn'; }

function TopicTree({ nodes, search, depth = 0 }) {
  return nodes.map((node) => {
    const matches = !search || `${node.title} ${node.path}`.toLowerCase().includes(search);
    const childNodes = TopicTree({ nodes: node.children, search, depth: depth + 1 });
    if (!matches && !childNodes.length) return null;
    const hasChildren = node.children.length > 0;
    return (
      <li key={node.id} className="sidebar__tree-item">
        {hasChildren ? (
          <details open={Boolean(search)} className="sidebar__details">
            <summary className="sidebar__topic-summary">
              <span className="sidebar__disclosure" aria-hidden="true">›</span>
              <NavLink to={paths.topicPath(node.path)} className="sidebar__link" onClick={(event) => event.stopPropagation()}>{node.title}</NavLink>
            </summary>
            <ul className="sidebar__tree-list">{childNodes}</ul>
          </details>
        ) : (
          <NavLink to={paths.topicPath(node.path)} className={({ isActive }) => `sidebar__link sidebar__topic-link${isActive ? ' sidebar__link--active' : ''}`} aria-current="page">{node.title}</NavLink>
        )}
      </li>
    );
  }).filter(Boolean);
}

export default function Sidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryKey: activeCategoryKey } = useParams();
  const { user, role } = useAuth();
  const [activePillar, setActivePillar] = useState(() => pillarForPath(location.pathname));
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState([]);
  useEffect(() => setActivePillar(pillarForPath(location.pathname)), [location.pathname]);
  useEffect(() => setRecent(getRecentTopics()), [activeCategoryKey, location.pathname]);
  const query = useMemo(() => search.trim().toLowerCase(), [search]);

  if (!open) return <nav className="sidebar sidebar--collapsed" aria-label="Navigation (collapsed)">{CATEGORIES.map((category) => <button key={category.key} className="sidebar__rail-dot" style={{ background: category.color }} title={category.label} onClick={() => navigate(paths.category(category.key))}>{category.label.charAt(0)}</button>)}</nav>;

  return <nav className="sidebar" aria-label="Documentation navigation">
    <div className="sidebar__pillars" role="tablist">{PILLARS.map((pillar) => <button key={pillar.key} role="tab" aria-selected={activePillar === pillar.key} className={`sidebar__pillar ${activePillar === pillar.key ? 'sidebar__pillar--active' : ''}`} onClick={() => setActivePillar(pillar.key)}>{pillar.label}</button>)}</div>
    {activePillar === 'learn' && <>
      <input type="search" className="sidebar__search" placeholder="Search topics…" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search topics" />
      <p className="sidebar__section-label">Documentation</p>
      {CATEGORIES.map((category) => <section key={category.key} className="sidebar__category-group">
        <details open={Boolean(query) || activeCategoryKey === category.key}>
          <summary className="sidebar__group-header"><span className="sidebar__dot" style={{ background: category.color }} /><span className="sidebar__group-title">{category.label}</span><span className="sidebar__topic-count">{category.topics.length || ''}</span></summary>
          <ul className="sidebar__tree-list"><TopicTree nodes={category.tree} search={query} /></ul>
        </details>
      </section>)}
      {recent.length > 0 && !query && <><p className="sidebar__section-label">Recent</p><ul className="sidebar__list">{recent.map((item) => <li key={`${item.categoryKey}-${item.slug}`}><NavLink to={paths.topic(item.categoryKey, item.slug)} className="sidebar__link">{item.title}</NavLink></li>)}</ul></>}
    </>}
    {activePillar === 'build' && <ul className="sidebar__list"><li><NavLink to={paths.compiler()} className="sidebar__link">Online Compiler</NavLink></li><li><NavLink to={paths.tools()} className="sidebar__link">Tools</NavLink></li><li><NavLink to={paths.projects()} className="sidebar__link">My Projects</NavLink></li></ul>}
    {activePillar === 'store' && <p className="sidebar__store-note">{user ? 'Your profile and saved learning' : 'Sign in to access your profile and saved data.'}</p>}
    {role === 'admin' && <NavLink to={paths.adminUsers()} className="sidebar__link">Manage users</NavLink>}
  </nav>;
}
