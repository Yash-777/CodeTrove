/**
 * src/data/topics/jwt.js
 * ------------------------------------------------------------------
 * Same shape/rules as java.js - see that file's header comment.
 * Covers the "JWT" category.
 */

const jwtTopics = [
  {
    slug: 'structure',
    title: 'JWT structure',
    summary: 'Header.Payload.Signature - what each part actually contains.',
    tags: ['jwt', 'security'],
    gifUrl: null,
    relatedTool: 'jwt-tool',
    body: '',
  },
  {
    slug: 'expiry-claims',
    title: 'Standard claims (exp, iat, iss)',
    summary: 'The reserved fields most JWT libraries understand by default.',
    tags: ['jwt', 'security'],
    gifUrl: null,
    relatedTool: 'jwt-tool',
    body: '',
  },
];

export default jwtTopics;
