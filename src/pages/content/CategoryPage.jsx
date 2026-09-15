/**
 * src/pages/content/CategoryPage.jsx
 * ------------------------------------------------------------------
 * Route: /content/:categoryKey
 * Lists every topic in the category, plus its associated tools
 * (formatter/validator/etc.) - internal tools link within the app,
 * external ones open in a new tab with a clear label, per the
 * "build vs link-out" rule from the architecture doc.
 */

import { useParams, Link } from 'react-router-dom';
import { getCategory } from '../../data/topics/index.js';
import { paths } from '../../routes/routes.config.js';
import './ContentPages.css';

export default function CategoryPage() {
  const { categoryKey } = useParams();
  const category = getCategory(categoryKey);

  if (!category) {
    return (
      <div className="content-page">
        <h1>Category not found</h1>
        <p>"{categoryKey}" isn't a category yet. <Link to="/">Back to dashboard</Link></p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <h1 style={{ color: category.color }}>{category.label}</h1>

      <div className="content-page__grid">
        {category.topics.map((topic) => (
          <Link key={topic.slug} to={paths.topic(category.key, topic.slug)} className="content-page__card">
            <strong>{topic.title}</strong>
            <p>{topic.summary}</p>
          </Link>
        ))}
      </div>

      {category.tools.length > 0 && (
        <>
          <h2 className="content-page__subheading">Tools</h2>
          <ul className="tool-list">
            {category.tools.map((tool) => (
              <li key={tool.name} className="tool-list__item">
                <div>
                  <strong>{tool.name}</strong>
                  <p>{tool.description}</p>
                </div>
                {tool.externalUrl ? (
                  <a href={tool.externalUrl} target="_blank" rel="noopener noreferrer" className="tool-list__link">
                    Open ↗ <span className="tool-list__badge">new tab</span>
                  </a>
                ) : (
                  <span className="tool-list__badge tool-list__badge--soon">coming soon</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
