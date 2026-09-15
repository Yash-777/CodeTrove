/**
 * src/pages/build/CompilerPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/compiler
 * Placeholder for the "online compiler / code playground" idea from
 * the structure diagram (Java, JavaScript, HTML preview, SQL runner).
 * Deliberately NOT built yet - running arbitrary user code safely
 * needs a sandboxed execution backend (a real engineering project on
 * its own, similar to why the architecture doc says "link out" to
 * codeinterview.io rather than rebuild it). This page exists so the
 * navigation structure is complete and honest about what's next,
 * rather than a dead link.
 */

export default function CompilerPage() {
  return (
    <div className="content-page">
      <h1>Online Compiler</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Not built yet. Running untrusted code safely needs a sandboxed execution
        backend - a bigger piece of infrastructure than the rest of this app, and
        worth building deliberately rather than bolted on. Planned: Java, JavaScript,
        and HTML/CSS live preview, each in its own isolated runner.
      </p>
    </div>
  );
}
