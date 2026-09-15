/**
 * src/data/topics/nodejs.js
 * ------------------------------------------------------------------
 * Same shape/rules as java.js - see that file's header comment.
 * Covers the "Node.js" category.
 */

const nodejsTopics = [
  {
    slug: 'commonjs-vs-esm',
    title: 'CommonJS vs ES Modules',
    summary: 'The two module systems you will run into in Node projects.',
    tags: ['nodejs', 'modules'],
    gifUrl: null,
    relatedTool: null,
    body: `CommonJS (older, default in .js files unless configured otherwise):
  const fs = require('fs');
  module.exports = myFunction;

ES Modules (modern, used when package.json has "type": "module", or in .mjs
files - this is also what this whole React project uses):
  import fs from 'fs';
  export default myFunction;`,
  },
  {
    slug: 'express-basics',
    title: 'Express.js basics',
    summary: 'Minimal setup for a REST API server.',
    tags: ['nodejs', 'express', 'api'],
    gifUrl: null,
    relatedTool: null,
    body: `Example:
  import express from 'express';
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.listen(3000, () => console.log('Listening on :3000'));`,
  },
];

export default nodejsTopics;
