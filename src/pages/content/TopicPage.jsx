import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTopicByPath, getCategory } from '../../data/topics/index.js';
import { getMarkdown } from '../../data/topics/discovery.js';
import { addRecentTopic } from '../../utils/recentTopics.js';
import { paths } from '../../routes/routes.config.js';
import { useAuth } from '../../context/AuthContext.jsx';
import MarkdownContent from '../../components/MarkdownContent.jsx';
import './ContentPages.css';

export default function TopicPage() {
  const { categoryKey, '*': topicPath = '' } = useParams();
  const resolvedPath = `${categoryKey}/${topicPath}`.replace(/\/+$/, '');
  const topic = getTopicByPath(resolvedPath);
  const category = getCategory(categoryKey);
  const { user } = useAuth();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!topic) return;
    setContent(getMarkdown(topic.contentPath));
    addRecentTopic({ categoryKey, slug: topic.path.slice(`${categoryKey}/`.length), title: topic.title });
  }, [topic, categoryKey]);

  if (!topic) {
    return <div className="content-page"><h1>Topic not found</h1><p>Couldn’t find “{resolvedPath}”. <Link to={paths.category(categoryKey)}>Back to category</Link></p></div>;
  }

  const isLocked = topic.restricted && !user;
  return (
    <article className="content-page content-page--document">
      <p className="content-page__breadcrumb"><Link to={paths.category(categoryKey)}>{category?.label || categoryKey}</Link> <span aria-hidden="true">/</span> {topic.title}</p>
      <h1>{topic.title}</h1>
      {topic.description && <p className="content-page__lead">{topic.description}</p>}
      <div className="content-page__tags">{topic.tags.map((tag) => <span key={tag} className="content-page__tag">{tag}</span>)}</div>
      {isLocked ? <div className="content-page__locked"><p>This topic is available to signed-in members.</p></div> : <MarkdownContent>{content}</MarkdownContent>}
    </article>
  );
}
