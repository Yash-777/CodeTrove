const topicContentFiles = import.meta.glob('./**/content.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function getTopicContent(categoryKey, topicSlug) {
  const key = `./${categoryKey}/${topicSlug}/content.md`;
  const content = topicContentFiles[key];

  if (typeof content === 'string' && content.trim()) {
    return content.trimEnd();
  }

  return `Missing content for ${categoryKey}/${topicSlug}. Create a file at src/data/topics/${categoryKey}/${topicSlug}/content.md`;
}
