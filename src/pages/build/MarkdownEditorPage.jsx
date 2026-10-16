import { Link } from 'react-router-dom';
import './MarkdownEditorPage.css';

const MARKDOWN_EDITOR = 'https://markdown.org/tools/editors/markdown/';

export default function MarkdownEditorPage() {
  return (
    <div className="content-page embedded-tool-page">
      <div className="embedded-tool-page__head">
        <div>
          <p className="embedded-tool-page__eyebrow">BUILD / TOOLS / DIAGRAMS & EDITORS</p>
          <h1>Markdown Editor</h1>
          <p className="embedded-tool-page__subtitle">
            Write Markdown with a live preview, Mermaid diagrams, and browser-based export.
          </p>
        </div>
        <div className="embedded-tool-page__links">
          <a className="embedded-tool-page__link embedded-tool-page__link--primary" href={MARKDOWN_EDITOR} target="_blank" rel="noopener noreferrer">
            Open official editor ↗
          </a>
          <Link className="embedded-tool-page__link" to="/build/tools">Back to Tools</Link>
        </div>
      </div>

      <section className="embedded-tool-page__frame-card" aria-label="Markdown editor">
        <iframe
          title="Markdown editor"
          src={MARKDOWN_EDITOR}
          className="embedded-tool-page__frame"
          loading="lazy"
          allow="clipboard-read; clipboard-write"
        />
        <p className="embedded-tool-page__fallback">
          If the editor is blocked by your browser or the remote site&apos;s frame policy, use{' '}
          <a href={MARKDOWN_EDITOR} target="_blank" rel="noopener noreferrer">Open official editor ↗</a>.
        </p>
      </section>

      <section className="embedded-tool-page__about">
        <h2>About this editor</h2>
        <p>
          The editor runs in the browser and is hosted by <a href={MARKDOWN_EDITOR} target="_blank" rel="noopener noreferrer">markdown.org</a>.
          CodeTrove embeds the public editor for convenience and keeps the official link available if embedding is
          restricted by a future security policy.
        </p>
      </section>
    </div>
  );
}
