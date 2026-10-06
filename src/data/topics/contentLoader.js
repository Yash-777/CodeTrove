const topicContentFiles = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function getTopicContent(categoryKey, topicSlug) {
  const topicKey = `./${categoryKey}/${topicSlug}/content.md`;
  const categoryInfoKey = `./${categoryKey}/content_info.md`;

  const topicContent = topicContentFiles[topicKey];
  if (typeof topicContent === 'string' && topicContent.trim()) {
    return topicContent.trimEnd();
  }

  const categoryInfoContent = topicContentFiles[categoryInfoKey];
  if (typeof categoryInfoContent === 'string' && categoryInfoContent.trim()) {
    return categoryInfoContent.trimEnd();
  }

  return `Missing content for ${categoryKey}/${topicSlug}. Create a file at src/data/topics/${categoryKey}/${topicSlug}/content.md or src/data/topics/${categoryKey}/content_info.md`;
}


export function getNavigationContent(contentKey) {
  const key = contentKey.endsWith('.md')
    ? `./${contentKey}`
    : `./${contentKey}/content.md`;
  const content = topicContentFiles[key];
  if (typeof content === 'string' && content.trim()) return content.trimEnd();
  const expectedPath = key.endsWith('.md') ? key.slice(2) : `${contentKey}/content.md`;
  return `Missing content for ${contentKey}. Create a file at src/data/topics/${expectedPath}`;
}
