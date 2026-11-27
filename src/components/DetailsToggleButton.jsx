import { useEffect, useRef, useState } from 'react';
import './DetailsToggleButton.css';

/**
 * "Expand all / Collapse all" for every <details> inside `containerRef`.
 *
 * - Renders nothing when the content has no toggleable <details>.
 * - <details open> elements authored as open are skipped (left exactly as they are).
 * - The label follows the real state, so opening/closing a single <details> by hand keeps it in sync.
 *
 * Props
 *  - containerRef: ref to the element that holds the rendered markdown
 *  - watch:        value that changes when the content changes (e.g. the markdown body)
 */
export default function DetailsToggleButton({ containerRef, watch }) {
  const targets = useRef([]);
  const seen = useRef(new WeakSet());     // elements already classified
  const skipped = useRef(new WeakSet());  // elements that were open when first seen
  const [count, setCount] = useState(0);
  const [allOpen, setAllOpen] = useState(false);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    // Classify each <details> only the first time we see it, so a manual
    // "Expand all" followed by an edit doesn't make them look authored-open.
    const list = [...root.querySelectorAll('details')];
    list.forEach((d) => {
      if (seen.current.has(d)) return;
      seen.current.add(d);
      if (d.hasAttribute('open')) skipped.current.add(d);
    });
    targets.current = list.filter((d) => !skipped.current.has(d));
    setCount(targets.current.length);

    const sync = () =>
      setAllOpen(targets.current.length > 0 && targets.current.every((d) => d.open));
    sync();

    // `toggle` doesn't bubble, so listen in the capture phase
    root.addEventListener('toggle', sync, true);
    return () => root.removeEventListener('toggle', sync, true);
  }, [containerRef, watch]);

  if (count === 0) return null;

  const handleClick = () => {
    const next = !allOpen;
    targets.current.forEach((d) => { d.open = next; });
    setAllOpen(next);
  };

  return (
    <button
      type="button"
      className="details-toggle"
      aria-expanded={allOpen}
      onClick={handleClick}
    >
      {allOpen ? 'Collapse all' : 'Expand all'}
    </button>
  );
}
