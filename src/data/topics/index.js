import { getMarkdown, TOPIC_TREES, flattenTree } from './discovery.js';

const categoryConfig = [
  { key: 'javascript', label: 'JavaScript', color: '#D9A404', codeLang: 'javascript', tools: [] },
  { key: 'java', label: 'Java', color: '#E76F51', codeLang: 'java', tools: [] },
  { key: 'nodejs', label: 'Node.js', color: '#3FA34D', codeLang: 'javascript', tools: [] },
  { key: 'json', label: 'JSON', color: '#3B82F6', codeLang: 'json', tools: [] },
  { key: 'jwt', label: 'JWT', color: '#8B5CF6', codeLang: 'json', tools: [] },
  { key: 'git', label: 'Git', color: '#FB7185', codeLang: 'bash', tools: [] },
  { key: 'email', label: 'Email', color: '#06B6D4', codeLang: 'javascript', tools: [] },
];

export const CATEGORIES = categoryConfig.map((config) => {
  const tree = TOPIC_TREES[config.key] || [];
  const topics = flattenTree(tree).map((topic) => ({
    ...topic,
    body: getMarkdown(topic.contentPath),
    tags: [config.key, topic.root === 'source-tree' ? 'sourcetree' : 'topic'],
    gifUrl: null,
    relatedTool: null,
  }));

  return { ...config, tree, topics };
});

export function getCategory(categoryKey) {
  return CATEGORIES.find((category) => category.key === categoryKey);
}

export function getTopic(categoryKey, topicSlug) {
  const category = getCategory(categoryKey);
  return category?.topics.find((topic) => topic.path === `${categoryKey}/${topicSlug}` || topic.slug === topicSlug);
}

export function getTopicByPath(path) {
  return CATEGORIES.flatMap((category) => category.topics).find((topic) => topic.path === path);
}

export function getAllTopicsFlat() {
  return CATEGORIES.flatMap((category) => category.topics.map((topic) => ({
    ...topic,
    categoryKey: category.key,
    categoryLabel: category.label,
    categoryColor: category.color,
  })));
}
