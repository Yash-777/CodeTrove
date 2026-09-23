const topicContentFiles = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Content roots are deliberately explicit so a topic's metadata tells us
 * where its markdown lives. The default keeps existing topics compatible.
 *
 * Examples:
 *   topics       -> ./javascript/promises/content.md
 *   sub-topics   -> ./sub-topics/javascript/array-methods/content.md
 *   source-tree  -> ./git/source-tree/clone/content.md
 */
function contentKey(contentRoot, categoryKey, topicSlug) {
  if (contentRoot === 'sub-topics') {
    return `./sub-topics/${categoryKey}/${topicSlug}/content.md`;
  }

  if (contentRoot === 'source-tree') {
    return `./git/source-tree/${categoryKey}/${topicSlug}/content.md`;
  }

  return `./${categoryKey}/${topicSlug}/content.md`;
}

export function getTopicContent(categoryKey, topicSlug, contentRoot = 'topics') {
  const topicKey = contentKey(contentRoot, categoryKey, topicSlug);
  const categoryInfoKey = `./${categoryKey}/content_info.md`;
  const topicContent = topicContentFiles[topicKey];

  if (typeof topicContent === 'string' && topicContent.trim()) {
    return topicContent.trimEnd();
  }

  // Category overviews only apply to primary category content.
  if (contentRoot === 'topics') {
    const categoryInfoContent = topicContentFiles[categoryInfoKey];
    if (typeof categoryInfoContent === 'string' && categoryInfoContent.trim()) {
      return categoryInfoContent.trimEnd();
    }
  }

  return `Missing content for ${contentRoot}/${categoryKey}/${topicSlug}. Create a file at src/data/topics/${contentRoot === 'topics' ? `${categoryKey}` : `${contentRoot}/${categoryKey}`}/${topicSlug}/content.md`;
}

export function hasTopicContent(categoryKey, topicSlug, contentRoot = 'topics') {
  return typeof topicContentFiles[contentKey(contentRoot, categoryKey, topicSlug)] === 'string';
}
