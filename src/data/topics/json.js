/**
 * src/data/topics/json.js
 * ------------------------------------------------------------------
 * Same shape/rules as java.js - see that file's header comment.
 * Covers the "JSON" category. Notice `relatedTool` here points at
 * tool slugs like "json-formatter" - once you build the real tool
 * pages (see the architecture doc), TopicPage can render a button
 * that deep-links straight into that tool.
 */

const jsonTopics = [
  {
    slug: 'basics',
    title: 'JSON basics',
    summary: 'Objects, arrays, and the six value types JSON supports.',
    tags: ['json'],
    gifUrl: null,
    relatedTool: 'json-formatter',
    body: '',
  },
  {
    slug: 'json-path',
    title: 'JSONPath basics',
    summary: 'A query language for selecting values out of a JSON document.',
    tags: ['json', 'query'],
    gifUrl: null,
    relatedTool: 'json-key-editor',
    body: '',
  },
  {
    slug: 'schema-validation',
    title: 'JSON Schema validation',
    summary: 'Describe the expected shape of a document and validate against it.',
    tags: ['json', 'validation'],
    gifUrl: null,
    relatedTool: 'json-formatter',
    restricted: true,
    body: '',
  },
];

export default jsonTopics;
