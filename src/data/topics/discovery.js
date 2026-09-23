const markdownFiles = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function titleFromSlug(slug) {
  return slug.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};
  return Object.fromEntries(match[1].split('\n').flatMap((line) => {
    const [key, ...value] = line.split(':');
    return key && value.length ? [[key.trim(), value.join(':').trim().replace(/^['"]|['"]$/g, '')]] : [];
  }));
}

function nodeFromPath(filePath, markdown) {
  const parts = filePath.replace(/^\.\//, '').split('/');
  parts.pop();
  if (parts[0] === 'git' && parts[1] === 'sourcetree') return null;

  let category;
  let routeSegments;
  let root = 'topics';

  if (parts[0] === 'sub-topics') {
    root = 'sub-topics';
    category = parts[1];
    routeSegments = [category, ...parts.slice(2)];
  } else if (parts[0] === 'git' && parts[1] === 'source-tree') {
    root = 'source-tree';
    category = 'git';
    // Include the category in the canonical URL/path. This is required for
    // TopicPage's `/content/:categoryKey/*` resolver.
    routeSegments = ['git', ...parts.slice(1)];
  } else {
    category = parts[0];
    routeSegments = [category, ...parts.slice(1)];
  }

  if (!category || routeSegments.length < 2) return null;
  const meta = frontmatter(markdown);
  const path = routeSegments.join('/');

  return {
    id: `${root}:${path}`,
    slug: routeSegments.at(-1),
    title: meta.title || titleFromSlug(routeSegments.at(-1)),
    description: meta.description || '',
    path,
    parentPath: routeSegments.slice(0, -1).join('/'),
    contentPath: filePath,
    category,
    root,
    order: Number(meta.order) || 0,
    count: null,
    children: [],
  };
}

function buildTree(nodes) {
  const roots = [];
  const byPath = new Map(nodes.map((node) => [node.path, node]));
  nodes.forEach((node) => {
    const parent = byPath.get(node.parentPath);
    (parent ? parent.children : roots).push(node);
  });
  const sort = (items) => {
    items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    items.forEach((item) => { item.count = item.children.length || null; sort(item.children); });
  };
  sort(roots);
  return roots;
}

export const TOPIC_NODES = Object.entries(markdownFiles).map(([path, markdown]) => nodeFromPath(path, markdown)).filter(Boolean);

export const TOPIC_TREES = Object.fromEntries(
  [...new Set(TOPIC_NODES.map((node) => node.category))].map((category) => [
    category,
    buildTree(TOPIC_NODES.filter((node) => node.category === category && node.root !== 'sub-topics')),
  ])
);

export function findTopic(path) { return TOPIC_NODES.find((node) => node.path === path); }
export function getMarkdown(contentPath) {
  const markdown = markdownFiles[contentPath];
  return typeof markdown === 'string' ? markdown.replace(/^---[\s\S]*?---\s*\n?/, '').trimEnd() : '';
}
export function flattenTree(nodes) { return nodes.flatMap((node) => [node, ...flattenTree(node.children)]); }
