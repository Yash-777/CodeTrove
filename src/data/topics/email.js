/**
 * src/data/topics/email.js
 * ------------------------------------------------------------------
 * This file defines the static metadata for the "Email" category.
 * Each topic entry here is automatically picked up by src/data/topics/index.js.
 */

const emailTopics = [
  {
    slug: 'info',
    title: 'Email basics',
    summary: 'Overview of email protocols, ports, hosts, domains, and mail delivery flow.',
    tags: ['email', 'smtp', 'imap', 'pop3'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
  {
    slug: 'sending-email',
    title: 'Sending email from code',
    summary: 'Send test emails to temp-mail inboxes using JavaScript and Java examples.',
    tags: ['email', 'smtp', 'javascript', 'java'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
];

export default emailTopics;
