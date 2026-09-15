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
    body: `JSON (JavaScript Object Notation) supports exactly 6 value types:
string, number, boolean, null, object, and array. There are no dates,
no functions, no comments - if you need those, you're extending JSON
with a convention on top of it (e.g. ISO date strings).

Example:
  {
    "name": "Ana",
    "active": true,
    "score": 87.5,
    "tags": ["a", "b"],
    "manager": null
  }`,
  },
  {
    slug: 'json-path',
    title: 'JSONPath basics',
    summary: 'A query language for selecting values out of a JSON document.',
    tags: ['json', 'query'],
    gifUrl: null,
    relatedTool: 'json-key-editor',
    body: `JSONPath lets you address nested values without writing manual
traversal code, similar to XPath for XML.

Example document: { "user": { "roles": ["admin", "editor"] } }
Path $.user.roles[0]  -> "admin"`,
  },
  {
    slug: 'schema-validation',
    title: 'JSON Schema validation',
    summary: 'Describe the expected shape of a document and validate against it.',
    tags: ['json', 'validation'],
    gifUrl: null,
    relatedTool: 'json-formatter',
    restricted: true,
    body: `A JSON Schema is itself JSON, describing types, required fields, and
constraints for another JSON document.

Schema:
  {
    "type": "object",
    "required": ["id", "email"],
    "properties": {
      "id": { "type": "number" },
      "email": { "type": "string", "format": "email" }
    }
  }

A document missing "email", or with id as a string, fails validation
against this schema - catching bad data before it reaches your code.`,
  },
];

export default jsonTopics;
