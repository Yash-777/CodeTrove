/**
 * src/pages/content/TopicPage.jsx
 * ------------------------------------------------------------------
 * Route: /content/:categoryKey/:topicSlug
 * Renders one topic's detail using CodeBlock for syntax-highlighted
 * code, records the visit into "Recent" (utils/recentTopics.js), and
 * enforces `topic.restricted` - some topics are viewable without
 * signing in, others require any logged-in account (any role,
 * including plain "viewer" - see the roles table in README.md).
 */

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopic, getCategory } from '../../data/topics/index.js';
import { addRecentTopic } from '../../utils/recentTopics.js';
import { paths } from '../../routes/routes.config.js';
import { useAuth } from '../../context/AuthContext.jsx';
import CodeBlock from '../../components/CodeBlock.jsx';
import './ContentPages.css';

export default function TopicPage() {
  const { categoryKey, topicSlug } = useParams();
  const { user } = useAuth();
  const topic = getTopic(categoryKey, topicSlug);
  const category = getCategory(categoryKey);

  useEffect(() => {
    if (topic) {
      addRecentTopic({ categoryKey, slug: topicSlug, title: topic.title });
    }
  }, [categoryKey, topicSlug, topic]);

  if (!topic) {
    return (
      <div className="content-page">
        <h1>Topic not found</h1>
        <p>
          Couldn't find "{topicSlug}" under "{categoryKey}".{' '}
          <Link to={paths.category(categoryKey)}>Back to category</Link>
        </p>
      </div>
    );
  }

  const isLocked = topic.restricted && !user;

  return (
    <article className="content-page">
      <p className="content-page__breadcrumb">
        <Link to={paths.category(categoryKey)}>{categoryKey}</Link>
      </p>

      <h1>{topic.title}</h1>

      <div className="content-page__tags">
        {topic.tags.map((tag) => (
          <span key={tag} className="content-page__tag">{tag}</span>
        ))}
      </div>

      {isLocked ? (
        <div className="content-page__locked">
          <p>This topic is available to signed-in members.</p>
          <div className="content-page__locked-actions">
            <Link to={paths.signIn()} className="btn-primary" style={{ textDecoration: 'none' }}>Sign in</Link>
            <Link to={paths.signUp()} className="btn-secondary" style={{ textDecoration: 'none' }}>Create a free account</Link>
          </div>
        </div>
      ) : (
        <CodeBlock code={topic.body} language={category?.codeLang ?? 'text'} />
      )}

      {topic.gifUrl && !isLocked && (
        <img src={topic.gifUrl} alt={`${topic.title} demo`} className="content-page__gif" />
      )}

      {topic.relatedTool && !isLocked && (
        <p className="content-page__tool-link">
          Try it: <code>{topic.relatedTool}</code> tool (coming soon)
        </p>
      )}
    </article>
  );
}
