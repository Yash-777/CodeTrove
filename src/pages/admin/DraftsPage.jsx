/**
 * src/pages/admin/DraftsPage.jsx
 * ------------------------------------------------------------------
 * Route: /drafts
 * Everything in the server's temp folder (server/drafts/*.json).
 * Both admins and editors can see this list, but only ADMINS see a
 * "Publish" button - editors can Discard their own submissions, but
 * turning a draft into a real page requires admin approval, matching
 * the "editor suggests, admin approves" workflow.
 *
 * The server enforces this too (see server/auth.js) - the button
 * being hidden here is just so an editor never sees an option that
 * would fail anyway.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { paths } from '../../routes/routes.config.js';
import '../content/ContentPages.css';

export default function DraftsPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function authHeader() {
    const idToken = await user.getIdToken();
    return { Authorization: `Bearer ${idToken}` };
  }

  async function loadDrafts() {
    setLoadError(null);
    try {
      const res = await fetch('/api/drafts', { headers: await authHeader() });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setDrafts(await res.json());
    } catch (err) {
      setLoadError(
        `Couldn't reach the draft server (${err.message}). Start it with "npm run server" in another terminal.`
      );
    }
  }

  async function handlePublish(draft) {
    setBusyId(draft.id);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/publish`, { method: 'POST', headers: await authHeader() });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Server responded with ${res.status}`);

      const categoryKey = draft.isNewCategory ? draft.newCategoryKey : draft.categoryKey;
      navigate(paths.topic(categoryKey, draft.slug));
    } catch (err) {
      setLoadError(`Publish failed: ${err.message}`);
      setBusyId(null);
    }
  }

  async function handleDiscard(draft) {
    setBusyId(draft.id);
    try {
      await fetch(`/api/drafts/${draft.id}`, { method: 'DELETE', headers: await authHeader() });
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (err) {
      setLoadError(`Discard failed: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="content-page">
      <h1>Drafts</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Pages saved from <Link to={paths.createPage()}>+ New topic</Link>, waiting in the
        temp folder. {role === 'admin' ? 'Publish writes them into the real data files.' : 'An admin reviews these before they go live.'}
      </p>

      {loadError && <p className="new-topic-page__status new-topic-page__status--error">{loadError}</p>}
      {!loadError && drafts.length === 0 && <p>No drafts yet.</p>}

      <ul className="tool-list" style={{ marginTop: '1.2rem' }}>
        {drafts.map((draft) => (
          <li key={draft.id} className="tool-list__item">
            <div>
              <strong>{draft.title}</strong>
              <p>
                {draft.isNewCategory ? `New category: ${draft.newCategoryLabel}` : `Category: ${draft.categoryKey}`}
                {' '}· slug: {draft.slug}
                {draft.authorEmail && <> · submitted by {draft.authorEmail}</>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" disabled={busyId === draft.id} onClick={() => handleDiscard(draft)}>
                Discard
              </button>
              {role === 'admin' && (
                <button type="button" className="btn-primary" disabled={busyId === draft.id} onClick={() => handlePublish(draft)}>
                  {busyId === draft.id ? 'Publishing…' : 'Publish'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
