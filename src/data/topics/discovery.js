const markdownFiles = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};

  return Object.fromEntries(match[1].split('\n').flatMap((line) => {
    const [key, ...value] = line.split(':');
    return key && value.length
      ? [[key.trim(), value.join(':').trim().replace(/^['"]|['"]$/g, '')]]
      : [];
  }));
}

function nodeFromPath(filePath, markdown) {
  const parts = filePath.replace(/^\.\//, '').split('/');
  parts.pop();

  // The old git/sourcetree location is retained for history but is not part
  // of navigation. The canonical parent is git/source-tree.
  if (parts[0] === 'git' && parts[1] === 'sourcetree') return null;

  let categoryKey;
  let routeSegments;
  let root = 'topics';

  if (parts[0] === 'sub-topics') {
    root = 'sub-topics';
    categoryKey = parts[1];
    routeSegments = [categoryKey, ...parts.slice(2)];
  } else if (parts[0] === 'git' && parts[1] === 'source-tree') {
    // Keep source-tree as a real parent node. For example:
    // git/source-tree/content.md -> git/source-tree
    // git/source-tree/ssh-key-setup/content.md -> git/source-tree/ssh-key-setup
    root = 'source-tree';
    categoryKey = 'git';
    routeSegments = parts.slice(1);
  } else {
    categoryKey = parts[0];
    routeSegments = parts.slice(1);
  }

  if (!categoryKey || !routeSegments.length) return null;

  const meta = frontmatter(markdown);
  const slug = routeSegments[routeSegments.length - 1];
  const path = routeSegments.join('/');

  return {
    id: `${root}:${path}`,
    slug,
    title: meta.title || titleFromSlug(slug),
    description: meta.description || '',
    path,
    parentPath: routeSegments.slice(0, -1).join('/'),
    contentPath: filePath,
    category: categoryKey,
    root,
    order: Number(meta.order) || 0,
    count: null,
    children: [],
  };
}

function sortNodes(nodes) {
  return nodes.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function buildTree(nodes) {
  const roots = [];
  const byPath = new Map(nodes.map((node) => [node.path, node]));

  nodes.forEach((node) => {
    const parent = byPath.get(node.parentPath);
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sort = (items) => {
    sortNodes(items);
    items.forEach((item) => {
      item.count = item.children.length || null;
      sort(item.children);
    });
  };

  sort(roots);
  return roots;
}

export const TOPIC_NODES = Object.entries(markdownFiles)
  .map(([path, markdown]) => nodeFromPath(path, markdown))
  .filter(Boolean);

export const TOPIC_TREES = Object.fromEntries(
  [...new Set(TOPIC_NODES.map((node) => node.category))].map((category) => [
    category,
    buildTree(TOPIC_NODES.filter((node) => node.category === category && node.root !== 'sub-topics')),
  ])
);

export function findTopic(path) {
  return TOPIC_NODES.find((node) => node.path === path);
}

export function getMarkdown(contentPath) {
  const markdown = markdownFiles[contentPath];
  return typeof markdown === 'string'
    ? markdown.replace(/^---[\s\S]*?---\s*\n?/, '').trimEnd()
    : '';
}

export function flattenTree(nodes) {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}
