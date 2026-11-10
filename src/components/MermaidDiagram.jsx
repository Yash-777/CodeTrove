import { useEffect, useId, useState } from 'react';
import './MermaidDiagram.css';

let mermaidInitialized = false;

export default function MermaidDiagram({ chart, title = 'Mermaid diagram' }) {
  const reactId = useId();
  const diagramId = `codetrove-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [rendered, setRendered] = useState({ svg: '', error: '' });

  useEffect(() => {
    let cancelled = false;
    setRendered({ svg: '', error: '' });

    async function renderDiagram() {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            //theme: 'default', look: 'classic',
            theme: 'redux-color', look: 'neo',
            htmlLabels: false,
            flowchart: {
              theme: 'default', look: 'classic', layout: 'dagre', curve: 'linear',
              wrappingWidth: 400, // keeps labels like "Application configuration" on one line
            },
          });
          mermaidInitialized = true;
        }

        const result = await mermaid.render(diagramId, chart.trim());
        if (!cancelled) setRendered({ svg: result.svg, error: '' });
      } catch (error) {
        if (!cancelled) {
          setRendered({
            svg: '',
            error: error instanceof Error ? error.message : 'This Mermaid diagram could not be rendered.',
          });
        }
      }
    }

    renderDiagram();
    return () => { cancelled = true; };
  }, [chart, diagramId]);

  return (
    <figure className="markdown-mermaid" aria-label={title}>
      {rendered.svg ? (
        <div className="markdown-mermaid__canvas" role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: rendered.svg }} />
      ) : rendered.error ? (
        <div className="markdown-mermaid__fallback" role="status">
          <p>Diagram unavailable; showing its source instead.</p>
          <pre><code>{chart.trim()}</code></pre>
        </div>
      ) : (
        <div className="markdown-mermaid__loading" role="status">Rendering diagram…</div>
      )}
    </figure>
  );
}
