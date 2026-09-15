/**
 * src/data/topics/index.js
 * ------------------------------------------------------------------
 * THE SINGLE SOURCE OF TRUTH for "which categories exist, what topics
 * are inside them, and which tools go with them." Sidebar, Dashboard,
 * CategoryPage, and TopicPage all read through the helper functions
 * exported here - none of them import java.js / json.js / etc.
 * directly. Add a category/topic here (or in its own file) and the
 * whole app updates automatically.
 *
 * ---------------------------------------------------------------
 * HOW TO ADD A BRAND NEW CATEGORY (e.g. "Docker"):
 *   1. Create src/data/topics/docker.js, copy the pattern from
 *      java.js, export an array of topic objects.
 *   2. Import it below and add ONE entry to the CATEGORIES array,
 *      including a `color` (any hex) and a `tools` list (can be []).
 *   3. Done. Sidebar + Dashboard + routing all pick it up.
 *
 * HOW TO ADD A TOPIC TO AN EXISTING CATEGORY:
 *   Just edit that category's file (e.g. json.js) - nothing here
 *   needs to change. (Or use the "+ New page" form in the app, which
 *   generates this same shape of code for you.)
 * ---------------------------------------------------------------
 *
 * `tools` field on each category:
 *   [{ name, description, internalTool: string|null, externalUrl: string|null }]
 *   - internalTool: slug of a tool page built INSIDE this app (none
 *     exist yet - see the architecture doc for the planned build-vs-
 *     link-out list). Left null until that tool page exists.
 *   - externalUrl: if set, render as an "opens in new tab" link
 *     instead - used for tools we're deliberately linking out to
 *     rather than rebuilding (e.g. a live coding sandbox).
 */

import javaTopics from './java.js';
import javascriptTopics from './javascript.js';
import nodejsTopics from './nodejs.js';
import jsonTopics from './json.js';
import jwtTopics from './jwt.js';
import gitTopics from './git.js';
import { getTopicContent } from './contentLoader.js';

export const CATEGORIES = [
  {
    key: 'java',
    label: 'Java',
    color: '#E76F51',
    codeLang: 'java',
    topics: javaTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('java', topic.slug),
    })),
    tools: [
      { name: 'Java Formatter', description: 'Beautify Java source using standard style rules.', internalTool: 'java-formatter', externalUrl: null },
      { name: 'Maven POM Formatter', description: 'One dependency per line, pretty-printed XML.', internalTool: 'pom-formatter', externalUrl: null },
    ],
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    color: '#D9A404',
    codeLang: 'javascript',
    topics: javascriptTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('javascript', topic.slug),
    })),
    tools: [
      { name: 'JS/JSON Validator', description: 'Catch syntax errors before you run the code.', internalTool: 'json-formatter', externalUrl: null },
    ],
  },
  {
    key: 'nodejs',
    label: 'Node.js',
    color: '#3FA34D',
    codeLang: 'javascript',
    topics: nodejsTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('nodejs', topic.slug),
    })),
    tools: [
      { name: 'package.json Validator', description: 'Check for common manifest mistakes.', internalTool: null, externalUrl: 'https://www.npmjs.com/package/package-json-validator' },
    ],
  },
  {
    key: 'json',
    label: 'JSON',
    color: '#3B82F6',
    codeLang: 'json',
    topics: jsonTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('json', topic.slug),
    })),
    tools: [
      { name: 'JSON Formatter & Validator', description: 'Format, minify, and validate JSON.', internalTool: 'json-formatter', externalUrl: null },
      { name: 'JSON Diff', description: 'Compare two JSON documents side by side.', internalTool: 'json-diff', externalUrl: null },
      { name: 'JSON Key Editor', description: 'Remove or replace a value by key using regex/path match.', internalTool: 'json-key-editor', externalUrl: null },
    ],
  },
  {
    key: 'jwt',
    label: 'JWT',
    color: '#8B5CF6',
    codeLang: 'json',
    topics: jwtTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('jwt', topic.slug),
    })),
    tools: [
      { name: 'JWT Encode/Decode', description: 'Inspect header, payload, and signature.', internalTool: 'jwt-tool', externalUrl: null },
      { name: 'jwt.io', description: 'The reference JWT debugger, for cross-checking results.', internalTool: null, externalUrl: 'https://jwt.io' },
    ],
  },
  {
    key: 'git',
    label: 'Git',
    color: '#FB7185',
    codeLang: 'bash',
    topics: gitTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('git', topic.slug),
    })),
    tools: [
      { name: 'Live Coding Interview Tool', description: 'Real-time collaborative coding sandbox.', internalTool: null, externalUrl: 'https://codeinterview.io/' },
    ],
  },
];

export function getCategory(categoryKey) {
  return CATEGORIES.find((c) => c.key === categoryKey);
}

export function getTopic(categoryKey, topicSlug) {
  const category = getCategory(categoryKey);
  if (!category) return undefined;

  const topic = category.topics.find((t) => t.slug === topicSlug);
  return topic ? { ...topic } : undefined;
}

export function getAllTopicsFlat() {
  return CATEGORIES.flatMap((category) =>
    category.topics.map((topic) => ({
      ...topic,
      categoryKey: category.key,
      categoryLabel: category.label,
      categoryColor: category.color,
    }))
  );
}
