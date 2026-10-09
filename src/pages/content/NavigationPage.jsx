import { Link, useParams } from 'react-router-dom';
import { getNavigationPage, getNavigationNode } from '../../data/navigation.js';
import { getNavigationContent } from '../../data/topics/contentLoader.js';
import MarkdownContent from '../../components/MarkdownContent.jsx';
import './ContentPages.css';

export default function NavigationPage() {
  const params = useParams();
  const pagePath = params['*'] || [
    params.treeSection,
    params.treeTopic,
    params.treeSubtopic,
    params.treePage,
  ].filter(Boolean).join('/');
  const page = getNavigationPage(pagePath);
  const node = !page ? getNavigationNode(pagePath) : undefined;

  if (!page && !node) {
    return (
      <div className="content-page">
        <h1>Page not found</h1>
        <p>No documentation page exists for <code>{pagePath}</code>.</p>
        <Link to="/">Back to dashboard</Link>
      </div>
    );
  }

  if (node) {
    return (
      <article className="content-page">
        <p className="content-page__breadcrumb">
          {node.path.split('/').map((_, index, parts) => {
            const ancestorPath = parts.slice(0, index + 1).join('/');
            const ancestor = getNavigationNode(ancestorPath);
            return (
              <span key={ancestorPath}>{index > 0 ? ' / ' : ''}{ancestor?.label}</span>
            );
          })}
        </p>
        <h1>{node.label}</h1>
        {node.hasContent ? (
          <MarkdownContent>{getNavigationContent(node.contentKey)}</MarkdownContent>
        ) : (
          <p>This documentation section does not have a <code>content.md</code> file yet.</p>
        )}
      </article>
    );
  }

  return (
    <article className="content-page">
      <p className="content-page__breadcrumb">
        {page.ancestors.map((ancestor, index) => (
          <span key={ancestor.path}>{index > 0 ? ' / ' : ''}{ancestor.label}</span>
        ))}
      </p>
      <h1>{page.label}</h1>
      <MarkdownContent>{getNavigationContent(page.contentKey)}</MarkdownContent>
    </article>
  );
}
