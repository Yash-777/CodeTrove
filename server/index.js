/**
 * server/index.js
 * ------------------------------------------------------------------
 * Local Express server backing the wiki workflow: drafts (temp
 * folder) + publish (writes real source files). Run separately from
 * the React app with `npm run server`.
 *
 * SECURITY LAYERS APPLIED HERE (in order for each request):
 *   1. apiRateLimiter  - throttles by IP, protects against overload
 *      regardless of who's asking (see rateLimit.js)
 *   2. requireAuth      - verifies the Firebase ID token, attaches
 *      req.user = { uid, email, role } (see auth.js)
 *   3. requireRole([...]) - checks req.user.role against what the
 *      specific action needs
 *
 * This is the REAL enforcement layer - src/components/RequireRole.jsx
 * in the React app only controls what's shown in the UI; a request
 * sent directly to this server (bypassing the UI entirely) still has
 * to pass all three checks above.
 */

import express from 'express';
import cors from 'cors';
import { apiRateLimiter } from './rateLimit.js';
import { requireAuth, requireRole } from './auth.js';
import { listDrafts, saveDraft, getDraft, deleteDraft, publishDraft } from './fileOps.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRateLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Admins see every draft; editors see only their own submissions.
app.get('/api/drafts', requireAuth, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const all = listDrafts();
    const visible = req.user.role === 'admin' ? all : all.filter((d) => d.authorUid === req.user.uid);
    res.json(visible);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admins AND editors can create drafts - editors' drafts wait for an
// admin to publish them (the "suggest -> review -> publish" flow).
app.post('/api/drafts', requireAuth, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const draft = saveDraft({ ...req.body, authorUid: req.user.uid, authorEmail: req.user.email });
    res.status(201).json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Discard: admins can discard anything, editors only their own.
app.delete('/api/drafts/:id', requireAuth, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const draft = getDraft(req.params.id);
    if (draft && req.user.role !== 'admin' && draft.authorUid !== req.user.uid) {
      res.status(403).json({ error: "You can only discard your own drafts." });
      return;
    }
    deleteDraft(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish: admin only - this is the step that actually edits your
// real src/data/topics/*.js files.
app.post('/api/drafts/:id/publish', requireAuth, requireRole(['admin']), (req, res) => {
  try {
    const draft = getDraft(req.params.id);
    if (!draft) {
      res.status(404).json({ error: 'Draft not found - it may have already been published or discarded.' });
      return;
    }
    const result = publishDraft(draft);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Codetrove draft server running at http://localhost:${PORT}`);
  console.log('Requires GOOGLE_APPLICATION_CREDENTIALS to be set - see README.md "Setting up Firebase".');
});
