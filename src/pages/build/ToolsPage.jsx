import '../content/ContentPages.css';

const TOOLS = [
  {
    name: 'JWT Encode / Decode',
    description: 'Inspect, decode, and generate HMAC-signed JWT tokens.',
    href: '/build/tools/jwt-tool',
    internal: true,
  },
];

export default function ToolsPage() {
  return (
    <div className="content-page">
      <p className="content-page__breadcrumb">Build</p>
      <h1>Tools</h1>
      <p className="content-page__lead">
        Developer utilities for inspecting, validating, and transforming common formats.
      </p>
      <ul className="tool-list">
        {TOOLS.map((tool) => (
          <li key={tool.name} className="tool-list__item">
            <div>
              <strong>{tool.name}</strong>
              <p>{tool.description}</p>
            </div>
            <a className="tool-list__link" href={tool.href}>
              Open <span className="tool-list__badge">tool</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
