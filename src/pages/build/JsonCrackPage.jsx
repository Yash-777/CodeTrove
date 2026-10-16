import { Link } from 'react-router-dom';
import './JsonCrackPage.css';

const JSON_CRACK_EDITOR = 'https://jsoncrack.com/editor';
const JSON_CRACK_REPOSITORY = 'https://github.com/Yash-777/jsoncrack.com';

export default function JsonCrackPage() {
  return (
    <div className="content-page json-crack-page">
      <div className="json-crack-page__head">
        <div>
          <p className="json-crack-page__eyebrow">BUILD / TOOLS / WEB</p>
          <h1>JSON Crack</h1>
          <p className="json-crack-page__subtitle">
            Visualize JSON, YAML, XML, and CSV as interactive graphs with the open-source JSON Crack editor.
          </p>
        </div>
        <div className="json-crack-page__links">
          <a className="json-crack-page__link json-crack-page__link--primary" href={JSON_CRACK_EDITOR} target="_blank" rel="noopener noreferrer">
            Open official editor ↗
          </a>
          <a className="json-crack-page__link" href={JSON_CRACK_REPOSITORY} target="_blank" rel="noopener noreferrer">
            View GitHub repository ↗
          </a>
          <Link className="json-crack-page__link" to="/build/tools">Back to Tools</Link>
        </div>
      </div>

      <section className="json-crack-page__frame-card" aria-label="JSON Crack editor">
        <iframe
          title="JSON Crack editor"
          src={JSON_CRACK_EDITOR}
          className="json-crack-page__frame"
          loading="lazy"
          allow="clipboard-read; clipboard-write"
        />
        <p className="json-crack-page__fallback">
          If the editor is blocked by your browser or the remote site&apos;s frame policy, use{' '}
          <a href={JSON_CRACK_EDITOR} target="_blank" rel="noopener noreferrer">Open official editor ↗</a>.
        </p>
      </section>

      <section className="json-crack-page__about">
        <h2>About JSON Crack</h2>
        <p>
          JSON Crack is an Apache-2.0 licensed, open-source visualization application. It transforms structured data
          into an interactive graph so nested relationships are easier to inspect than in a plain text editor.
        </p>
        <p className="json-crack-page__source">
          Source: <a href={JSON_CRACK_REPOSITORY} target="_blank" rel="noopener noreferrer">Yash-777/jsoncrack.com ↗</a>
        </p>
      </section>
    </div>
  );
}
