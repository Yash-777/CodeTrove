import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../data/topics/index.js';
import '../content/ContentPages.css';

export default function ToolsPage() {
  return (
    <div className="content-page">
      <h1>Tools</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Formatters, validators, and encode/decode utilities, grouped by language.
        Built-in tools open inside CodeTrove; external tools open in a new tab.
      </p>

      {CATEGORIES.filter((category) => category.tools.length > 0).map((category) => (
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
                ) : tool.internalTool ? (
                  <Link to={`/build/tools/${tool.internalTool}`} className="tool-list__link">
                    Open <span className="tool-list__badge tool-list__badge--soon">tool</span>
                  </Link>
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
