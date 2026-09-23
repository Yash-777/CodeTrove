import { Navigate, useParams, Link } from 'react-router-dom';
import { getCategory, getTopicBySlug } from '../../data/topics/index.js';
import { paths } from '../../routes/routes.config.js';
import './ContentPages.css';

export default function CategoryPage() {
  const { categoryKey } = useParams();
  const category = getCategory(categoryKey);

  // Preserve old short topic URLs, but immediately normalize them to the
  // canonical category/topic route. This prevents a topic slug from being
  // incorrectly treated as a category key.
  if (!category) {
    const topic = getTopicBySlug(categoryKey);
    if (topic) return <Navigate replace to={paths.topicPath(topic.path)} />;

    return (
      <div className="content-page">
        <h1>Category not found</h1>
        <p>"{categoryKey}" isn't a category yet. <Link to="/">Back to dashboard</Link></p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <h1 style={{ color: category.color }}>{category.label}</h1>
      <div className="content-page__grid">
        {category.tree.flatMap((topic) => [topic]).map((topic) => (
          <Link key={topic.path} to={paths.topicPath(topic.path)} className="content-page__card">
            <strong>{topic.title}</strong>
            {topic.description && <p>{topic.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
