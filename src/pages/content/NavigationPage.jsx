import { Link, useParams } from 'react-router-dom';
import { getNavigationPage } from '../../data/navigation.js';
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

  if (!page) {
    return (
      <div className="content-page">
        <h1>Page not found</h1>
        <p>No documentation page exists for <code>{pagePath}</code>.</p>
        <Link to="/">Back to dashboard</Link>
      </div>
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
