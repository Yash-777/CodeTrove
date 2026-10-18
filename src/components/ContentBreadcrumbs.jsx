import { Link } from 'react-router-dom';

/**
 * A consistent breadcrumb trail for content pages. Items with `to` are
 * navigable ancestors; items without a destination are shown as the current
 * location (or a label that has no matching route).
 */
export default function ContentBreadcrumbs({ items = [] }) {
  const visibleItems = items.filter((item) => item?.label);
  if (visibleItems.length === 0) return null;

  return (
    <nav className="content-page__breadcrumb" aria-label="Breadcrumb">
      <ol className="content-page__breadcrumb-list">
        {visibleItems.map((item, index) => (
          <li key={item.path || item.to || `${item.label}-${index}`}>
            {item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={item.current ? 'page' : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
