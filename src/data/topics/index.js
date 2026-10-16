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
import typescriptTopics from './typescript.js';
import nodejsTopics from './nodejs.js';
import jsonTopics from './json.js';
import jwtTopics from './jwt.js';
import gitTopics from './git.js';
import emailTopics from './email.js';
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
      { name: 'Maven POM Formatter', description: 'Convert dependency XML to a one-line custom build format and back, and pretty-print pom.xml (2/3/4 spaces).', internalTool: 'pom-formatter', externalUrl: null },
      { name: 'Properties ⇄ YAML ⇄ JSON Converter', description: 'Validate, format, and convert application.properties, application.yml, and application.json in all six directions.', internalTool: 'properties-yaml-converter', externalUrl: null },
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
    key: 'typescript',
    label: 'TypeScript',
    color: '#3178C6',
    codeLang: 'typescript',
    topics: typescriptTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('typescript', topic.slug),
    })),
    tools: [
      { name: 'TypeScript Playground', description: 'Experiment with TypeScript examples in the browser.', internalTool: null, externalUrl: 'https://www.typescriptlang.org/play' },
    ],
  },
  {
    key: 'cryptography',
    label: 'Cryptography',
    color: '#7C3AED',
    codeLang: 'text',
    topics: [],
    tools: [
      { name: 'Cryptography Tools', description: 'Encrypt and decrypt text, generate hashes, and create or verify HMAC signatures.', internalTool: 'cryptography', externalUrl: null },
    ],
  },
  {
    key: 'text',
    label: 'Text',
    color: '#10B981',
    codeLang: 'text',
    topics: [],
    tools: [
      { name: 'Character Counter', description: 'Count characters, words, lines and common platform limits.', internalTool: 'character-counter', externalUrl: null },
      { name: 'String Utilities', description: 'Remove extra spaces, duplicate lines, and accents from text.', internalTool: 'string-utilities', externalUrl: null },
      { name: 'Compare — Diffchecker', description: 'Compare text or files in a new tab.', internalTool: null, externalUrl: 'https://www.diffchecker.com/' },
      { name: 'Compare — Text-Compare', description: 'Quick online text comparison.', internalTool: null, externalUrl: 'https://text-compare.com/' },
      { name: 'Beyond Compare', description: 'Powerful local file comparison tool (heavy files).', internalTool: null, externalUrl: 'https://www.scootersoftware.com/' },
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
      { name: 'Learn Git Branching', description: 'Open-source visual Git simulator with interactive lessons for commits, branches, merges, and remotes. Runs in its own browser sandbox and does not access your local repository.', internalTool: null, externalUrl: 'https://learngitbranching.js.org/' },
    ],
  },
  {
    key: 'web',
    label: 'Web',
    color: '#F97316',
    codeLang: 'html',
    topics: [],
    tools: [
      { name: 'HTML / XML / JSON Formatter & Validator', description: 'Beautify, minify, validate, and explore JSON/XML in a tree view.', internalTool: 'html-xml-json', externalUrl: null },
    ],
  },
  {
    key: 'diagrams-editors',
    label: 'Diagrams / Editors tools',
    color: '#8B5CF6',
    codeLang: 'markdown',
    topics: [],
    tools: [
      { name: 'Markdown Editor', description: 'Write Markdown with live preview, Mermaid diagrams, and browser-based export.', internalTool: 'markdown-editor', externalUrl: 'https://markdown.org/tools/editors/markdown/' },
      { name: 'JSON Crack', description: 'Open-source JSON, YAML, XML, and CSV visualization as interactive graphs.', internalTool: 'json-crack', externalUrl: 'https://jsoncrack.com/editor' },
      { name: 'Draw.io', description: 'Create flowcharts, UML, ER, network, and other diagrams in the official online editor.', internalTool: null, externalUrl: 'https://app.diagrams.net/' },
    ],
  },
  {
    key: 'data-time',
    label: 'Data & Time',
    color: '#0D9488',
    codeLang: 'text',
    topics: [],
    tools: [
      { name: 'Unix Timestamp ⇄ Date Time Converter', description: 'Convert epoch timestamps and human-readable dates with seconds, milliseconds, microseconds, nanoseconds, custom patterns, and local/GMT time zones.', internalTool: 'unix-timestamp-converter', externalUrl: null },
    ],
  },
  {
    key: 'email',
    label: 'Email',
    color: '#06B6D4',
    codeLang: 'javascript',
    topics: emailTopics.map((topic) => ({
      ...topic,
      body: getTopicContent('email', topic.slug),
    })),
    tools: [
      { name: 'Temp Mail', description: 'Disposable inbox for testing email delivery.', internalTool: null, externalUrl: 'https://temp-mail.org/en/' },
      { name: 'Temp Mail IO', description: 'Alternative disposable inbox for email verification.', internalTool: null, externalUrl: 'https://temp-mail.io/en' },
    ],
  },
  {
    key: 'networking',
    label: 'Networking',
    color: '#0EA5E9',
    codeLang: 'text',
    topics: [],
    tools: [
      { name: 'Network', description: 'Explore public connection details, DNS records, TCP setup, and TLS certificates with local command guides.', internalTool: 'network', externalUrl: null },
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
