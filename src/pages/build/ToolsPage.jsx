/**
 * src/pages/build/ToolsPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/tools
 * The BUILD pillar's tools listing - aggregates every category's
 * `tools` array (already defined in data/topics/index.js) into one
 * flat, browsable page, instead of only being visible one category
 * at a time on CategoryPage. Same underlying data, different view -
 * no duplication.
 */

import { CATEGORIES } from '../../data/topics/index.js';
import '../content/ContentPages.css';

export default function ToolsPage() {
  return (
    <div className="content-page">
      <h1>Tools</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Formatters, validators, and encode/decode utilities, grouped by language.
        Built-in tools open inline; external ones open in a new tab.
      </p>

      {CATEGORIES.filter((c) => c.tools.length > 0).map((category) => (
        <div key={category.key} style={{ marginTop: '1.8rem' }}>
          <h2 className="content-page__subheading" style={{ color: category.color, marginTop: 0 }}>
            {category.label}
          </h2>
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
        </div>
      ))}
    </div>
  );
}
