import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './MermaidLightbox.css';

const toPx = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Read the natural size of a Mermaid SVG from its viewBox (fallback: width/height attrs). */
function readNaturalSize(svgMarkup) {
  try {
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const el = doc.documentElement;
    if (!el || doc.querySelector('parsererror')) return { w: 0, h: 0 };
    const vb = (el.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) return { w: Math.round(vb[2]), h: Math.round(vb[3]) };
    return { w: Math.round(toPx(el.getAttribute('width'))), h: Math.round(toPx(el.getAttribute('height'))) };
  } catch {
    return { w: 0, h: 0 };
  }
}

/** Rewrite the root <svg> so it renders at an exact pixel size (Mermaid emits width="100%" + max-width). */
function sizeSvg(svgMarkup, w, h) {
  if (!w || !h) return svgMarkup;
  try {
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const el = doc.documentElement;
    if (!el || doc.querySelector('parsererror')) return svgMarkup;
    el.removeAttribute('width');
    el.removeAttribute('height');
    el.setAttribute('style', `width:${w}px;height:${h}px`);
    return new XMLSerializer().serializeToString(el);
  } catch {
    return svgMarkup;
  }
}

/**
 * Popup viewer for a rendered Mermaid diagram.
 *
 * Props
 *  - svg:    the SVG markup returned by mermaid.render()
 *  - title:  accessible label
 *  - width / height: optional "specified" size in px (number or "480px"). Enables the "Specified" view.
 *  - onClose: called when the popup should close
 *
 * Views: Fit (scaled down to the screen), Specified (if given), Full size (natural size, scrollable).
 */
export default function MermaidLightbox({ svg, title = 'Mermaid diagram', width, height, onClose }) {
  const natural = useMemo(() => readNaturalSize(svg), [svg]);

  // Resolve the specified size, deriving the missing side from the natural aspect ratio.
  const specified = useMemo(() => {
    let w = toPx(width);
    let h = toPx(height);
    if (!w && !h) return null;
    const ratio = natural.w && natural.h ? natural.w / natural.h : 0;
    if (!w && ratio) w = Math.round(h * ratio);
    if (!h && ratio) h = Math.round(w / ratio);
    return w && h ? { w, h } : null;
  }, [width, height, natural]);

  const [mode, setMode] = useState(specified ? 'specified' : 'fit');

  // Esc to close + lock page scroll while open
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const markup = useMemo(() => {
    if (mode === 'specified' && specified) return sizeSvg(svg, specified.w, specified.h);
    return sizeSvg(svg, natural.w, natural.h); // fit + full both start from natural size; CSS caps fit
  }, [mode, svg, natural, specified]);

  const naturalLabel = natural.w ? `${natural.w} × ${natural.h}px` : 'unknown';
  const views = [
    { id: 'fit', label: 'Fit to screen' },
    ...(specified ? [{ id: 'specified', label: `Specified (${specified.w} × ${specified.h})` }] : []),
    { id: 'full', label: 'Full size' },
  ];

  return createPortal(
    <div className="mermaid-lightbox__backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="mermaid-lightbox" onClick={(e) => e.stopPropagation()}>
        <div className="mermaid-lightbox__bar">
          <span className="mermaid-lightbox__meta">Diagram · Natural: {naturalLabel}</span>
          <div className="mermaid-lightbox__actions">
            <div className="mermaid-lightbox__views" role="group" aria-label="View size">
              {views.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={mode === v.id ? 'is-active' : ''}
                  aria-pressed={mode === v.id}
                  onClick={() => setMode(v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button type="button" className="mermaid-lightbox__close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className={`mermaid-lightbox__body is-${mode}`}>
          <div className="mermaid-lightbox__canvas" dangerouslySetInnerHTML={{ __html: markup }} />
        </div>
      </div>
    </div>,
    document.body
  );
}
