/**
 * src/pages/content/TopicPage.jsx
 * ------------------------------------------------------------------
 * Route: /content/:categoryKey/:topicSlug
 * Renders one topic's detail using MarkdownContent for markdown
 * rendering, records the visit into "Recent" (utils/recentTopics.js),
 * and enforces `topic.restricted` - some topics are viewable without
 * signing in, others require any logged-in account (any role,
 * including plain "viewer" - see the roles table in README.md).
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopic, getCategory } from '../../data/topics/index.js';
import { getDocumentationRoute } from '../../data/topics/navigation.js';
import { getTopicContent } from '../../data/topics/contentLoader.js';
import { addRecentTopic } from '../../utils/recentTopics.js';
import { paths } from '../../routes/routes.config.js';
import { useAuth } from '../../context/AuthContext.jsx';
import MarkdownContent from '../../components/MarkdownContent.jsx';
import './ContentPages.css';

export default function TopicPage() {
  const { categoryKey, topicSlug, sectionKey, subtopicSlug, pageSlug } = useParams();
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const nestedRoute = sectionKey
    ? getDocumentationRoute(sectionKey, topicSlug, subtopicSlug, pageSlug)
    : undefined;
  const legacyTopic = !nestedRoute && !sectionKey ? getTopic(categoryKey, topicSlug) : undefined;
  const legacyCategory = legacyTopic ? getCategory(categoryKey) : undefined;

  useEffect(() => {
    if (legacyTopic) {
      addRecentTopic({ categoryKey, slug: topicSlug, title: legacyTopic.title });
      setContent(getTopicContent(categoryKey, topicSlug));
      return;
    }

    const page = nestedRoute?.page;
    const subtopic = nestedRoute?.subtopic;
    const topic = nestedRoute?.topic;

    if (page?.contentKey) {
      const [contentCategory, contentSlug] = page.contentKey.split('/');
      setContent(getTopicContent(contentCategory, contentSlug));
    } else if (page?.summary) {
      setContent(`## ${page.title}\n\n${page.summary}`);
    } else if (subtopic) {
      setContent(`## ${subtopic.title}\n\nThis documentation section is defined in the navigation metadata.`);
    } else if (topic) {
      setContent(`## ${topic.title}\n\nThis documentation topic is defined in the navigation metadata.`);
    } else {
      setContent('');
    }
  }, [categoryKey, topicSlug, legacyTopic, nestedRoute]);

  if (!legacyTopic && !nestedRoute) {
    return (
      <div className="content-page">
        <h1>Topic not found</h1>
        <p>
          Couldn't find "{topicSlug}" in the documentation hierarchy.{' '}
          <Link to={paths.home()}>Back to dashboard</Link>
        </p>
      </div>
    );
  }

  const page = nestedRoute?.page;
  const subtopic = nestedRoute?.subtopic;
  const documentationTopic = nestedRoute?.topic;
  const title = page?.title || subtopic?.title || documentationTopic?.title || legacyTopic.title;
  const tags = page?.keywords || documentationTopic?.keywords || legacyTopic.tags || [];
  const isLocked = legacyTopic?.restricted && !user;

  return (
    <article className="content-page">
      <p className="content-page__breadcrumb">
        {nestedRoute ? (
          <>
            <Link to={paths.documentationTopic(nestedRoute.sectionKey, documentationTopic.key)}>
              {documentationTopic.title}
            </Link>
            {subtopic && <> / {subtopic.title}</>}
          </>
        ) : (
          <Link to={paths.category(categoryKey)}>{legacyCategory?.label || categoryKey}</Link>
        )}
      </p>

      <h1>{title}</h1>

      {tags.length > 0 && (
        <div className="content-page__tags">
          {tags.map((tag) => (
            <span key={tag} className="content-page__tag">{tag}</span>
          ))}
        </div>
      )}

      {isLocked ? (
        <div className="content-page__locked">
          <p>This topic is available to signed-in members.</p>
          <div className="content-page__locked-actions">
            <Link to={paths.signIn()} className="btn-primary" style={{ textDecoration: 'none' }}>Sign in</Link>
            <Link to={paths.signUp()} className="btn-secondary" style={{ textDecoration: 'none' }}>Create a free account</Link>
          </div>
        </div>
      ) : (
        <MarkdownContent>{content}</MarkdownContent>
      )}

      {legacyTopic?.gifUrl && !isLocked && (
        <img src={legacyTopic.gifUrl} alt={`${legacyTopic.title} demo`} className="content-page__gif" />
      )}

      {legacyTopic?.relatedTool && !isLocked && (
        <p className="content-page__tool-link">
          Try it: <code>{legacyTopic.relatedTool}</code> tool (coming soon)
        </p>
      )}
    </article>
  );
}
