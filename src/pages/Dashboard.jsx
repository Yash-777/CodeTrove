/**
 * src/pages/Dashboard.jsx
 * ------------------------------------------------------------------
 * The landing page ("/") - styled after the "big colorful grid of
 * language cards" pattern from sites like awesome-cheatsheets: a
 * short hero, then one card per category, each tinted with that
 * category's color (see CATEGORIES in data/topics/index.js).
 *
 * Clicking a card goes to that category's listing page
 * (/content/:categoryKey). The quick-jump dropdowns from the first
 * version are kept as a smaller secondary control for people who'd
 * rather type/select than scan cards.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, getCategory } from '../data/topics/index.js';
import { paths } from '../routes/routes.config.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Dashboard.css';

const PILLAR_CARDS = [
  { key: 'learn', title: 'Learn', blurb: 'Docs, guides, and real code examples by language.', to: null },
  { key: 'build', title: 'Build', blurb: 'Formatters, validators, and an online compiler.', to: (paths) => paths.tools() },
  { key: 'store', title: 'Store', blurb: 'Your profile, resume, certificates, and saved work.', to: (paths) => paths.profile() },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(CATEGORIES[0]?.key ?? '');
  const topicsInCategory = getCategory(selectedCategoryKey)?.topics ?? [];

  function handleTopicChange(event) {
    const topicSlug = event.target.value;
    if (topicSlug) navigate(paths.topic(selectedCategoryKey, topicSlug));
  }

  function goToPillar(pillar) {
    if (pillar.key === 'learn') return; // already home
    if (pillar.key === 'store' && !user) { navigate(paths.signIn()); return; }
    navigate(pillar.to(paths));
  }

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <h1>Codetrove</h1>
        <p className="dashboard__lede">
          Explanations, real code samples, and inline tools for Java, JavaScript,
          Node.js, JSON, JWT, and Git - one place, so you stop bookmarking six
          different sites.
        </p>

        <div className="dashboard__jump">
          <label className="dashboard__field">
            <span>Jump to</span>
            <select value={selectedCategoryKey} onChange={(e) => setSelectedCategoryKey(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="dashboard__field">
            <span>Topic</span>
            <select defaultValue="" onChange={handleTopicChange}>
              <option value="" disabled>Choose a topic…</option>
              {topicsInCategory.map((t) => (
                <option key={t.slug} value={t.slug}>{t.title}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="dashboard__pillars">
        {PILLAR_CARDS.map((pillar) => (
          <button key={pillar.key} type="button" className="pillar-card" onClick={() => goToPillar(pillar)}>
            <strong>{pillar.title}</strong>
            <span>{pillar.blurb}</span>
          </button>
        ))}
      </section>

      <section className="dashboard__grid">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            className="lang-card"
            style={{ '--card-color': category.color }}
            onClick={() => navigate(paths.category(category.key))}
          >
            <span className="lang-card__badge">{category.label.charAt(0)}</span>
            <span className="lang-card__title">{category.label}</span>
            <span className="lang-card__meta">
              {category.topics.length} topics · {category.tools.length} tools
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
