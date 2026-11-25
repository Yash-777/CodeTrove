import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ImageLightbox.css';

const SVG_RE = /\.svg(?:[?#].*)?$/i;
export const isSvgSrc = (src) => typeof src === 'string' && SVG_RE.test(src.trim());

export default function ImageLightbox({ src, alt = '', className = '', width, height, ...props }) {
  const [open, setOpen] = useState(false);
  const [fullSize, setFullSize] = useState(false);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const svg = isSvgSrc(src);

  const close = () => { setOpen(false); setFullSize(false); };

  // Esc to close + lock page scroll while the popup is open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleOpen = (e) => {
    if (e.target.closest('a')) return; // image wrapped in a link: let the link work
    setOpen(true);
  };

  const specified = width || height ? `${width || 'auto'} × ${height || 'auto'}` : null;
  const naturalLabel = natural.w ? `${natural.w} × ${natural.h}px` : 'not specified';

  return (
    <>
      <img
        className={`${className} ${svg ? 'markdown-svg' : ''} markdown-zoomable`.trim()}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        role="button"
        tabIndex={0}
        title="Click to enlarge"
        onClick={handleOpen}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(true))}
        {...props}
      />

      {open && createPortal(
        <div className="img-lightbox__backdrop" onClick={close} role="dialog" aria-modal="true">
          <div className="img-lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="img-lightbox__bar">
              <span className="img-lightbox__meta">
                {svg ? 'SVG' : 'Image'} · Natural: {naturalLabel}
                {specified ? ` · Specified: ${specified}` : ''}
              </span>
              <div className="img-lightbox__actions">
                <button type="button" onClick={() => setFullSize((v) => !v)}>
                  {fullSize ? 'Fit to screen' : 'Full size'}
                </button>
                <button type="button" onClick={close} aria-label="Close">✕</button>
              </div>
            </div>

            <div className={`img-lightbox__body${fullSize ? ' is-full' : ''}`}>
              <img
                src={src}
                alt={alt}
                className={`img-lightbox__img${fullSize ? ' is-full' : ''}${svg ? ' is-svg' : ''}`}
                onLoad={(e) => setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}