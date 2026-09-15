/**
 * src/data/topics/java.js
 * ------------------------------------------------------------------
 * This file holds the STATIC DATA for every topic under the "Java"
 * category. It exports a plain JavaScript array - there is no React
 * code here at all. Keeping data separate from components is a very
 * common pattern: it means anyone (even someone who doesn't know
 * React) can add a new topic by copy-pasting an object below.
 *
 * SHAPE OF ONE TOPIC OBJECT (all topics across all categories use this
 * same shape - see src/data/topics/index.js for where it's enforced):
 *
 * {
 *   slug: string          -> unique id used in the URL, e.g. /content/java/streams
 *                             (lowercase, hyphen-separated, no spaces)
 *   title: string         -> heading shown on the page and in the sidebar
 *   summary: string       -> 1-2 line description shown on category/listing cards
 *   tags: string[]        -> used later for search/filter
 *   gifUrl: string|null   -> optional demo GIF/image url (null = show a placeholder)
 *   relatedTool: string|null -> slug of a tool this topic links to (e.g. "java-formatter")
 *   body: string          -> the explanation content. For now this is a plain
 *                             string (can contain markdown-style text). Later
 *                             this could instead be fetched from GitHub - the
 *                             rest of the app doesn't care where "body" came
 *                             from, only that the field exists.
 * }
 *
 * HOW TO ADD A NEW JAVA TOPIC:
 *   1. Copy one of the objects below.
 *   2. Change every field. `slug` MUST be unique within this file.
 *   3. Save. That's it - no other file needs to change. The sidebar,
 *      the category page, and the topic page all read this array
 *      automatically via data/topics/index.js.
 */

const javaTopics = [
  {
    slug: 'streams',
    title: 'Java Streams',
    summary: 'Functional-style operations on collections: map, filter, reduce.',
    tags: ['java', 'collections', 'functional'],
    gifUrl: null,
    relatedTool: 'java-formatter',
    body: '',
  },
  {
    slug: 'optional',
    title: 'Optional<T>',
    summary: 'A container object that may or may not hold a non-null value.',
    tags: ['java', 'null-safety'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
  {
    slug: 'records',
    title: 'Records (Java 16+)',
    summary: 'Compact syntax for immutable data-carrier classes.',
    tags: ['java', 'syntax'],
    gifUrl: null,
    relatedTool: 'java-formatter',
    body: '',
  },
];

export default javaTopics;
