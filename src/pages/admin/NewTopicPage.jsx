/**
 * src/pages/admin/NewTopicPage.jsx
 * ------------------------------------------------------------------
 * Route: /create-page
 *
 * TWO WAYS TO GET YOUR PAGE INTO THE APP:
 *
 *  A) "Save as draft" (recommended) - POSTs the form to the local
 *     Express server (server/index.js, started with `npm run
 *     server`), which writes it to server/drafts/ - a TEMP FOLDER.
 *     Nothing in your real source code changes yet. Go to /drafts to
 *     preview it, then click "Publish" when you're happy - THAT step
 *     is what edits src/data/topics/*.js for real.
 *
 *  B) "Generate code instead" - the original manual flow: produces
 *     copy/paste-ready code with no server required, for whenever
 *     you'd rather review and paste by hand (or the server isn't
 *     running).
 *
 * A page in the browser can never write to your hard disk directly
 * (a security boundary every browser enforces) - option A only works
 * because server/index.js is a normal Node process with real
 * filesystem access, running locally on your own machine.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../data/topics/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  slugify,
  buildTopicObjectCode,
  buildNewCategoryFileCode,
  buildIndexRegistrationSnippet,
  downloadTextFile,
} from '../../utils/topicCodegen.js';
import { paths } from '../../routes/routes.config.js';
import '../content/ContentPages.css';
import './NewTopicPage.css';

const NEW_CATEGORY_VALUE = '__new__';

export default function NewTopicPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [categoryMode, setCategoryMode] = useState(CATEGORIES[0]?.key ?? NEW_CATEGORY_VALUE);
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryCodeLang, setNewCategoryCodeLang] = useState('text');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [relatedTool, setRelatedTool] = useState('');
  const [body, setBody] = useState('');

  const [generated, setGenerated] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [draftStatus, setDraftStatus] = useState(null); // { type: 'success'|'error', message }
  const [savingDraft, setSavingDraft] = useState(false);

  const isNewCategory = categoryMode === NEW_CATEGORY_VALUE;

  function handleTitleChange(event) {
    const value = event.target.value;
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSlugChange(event) {
    setSlugTouched(true);
    setSlug(event.target.value);
  }

  const tagList = useMemo(
    () => tags.split(',').map((t) => t.trim()).filter(Boolean),
    [tags]
  );

  const isFormValid = title.trim() && slug.trim() && summary.trim() && body.trim() &&
    (isNewCategory ? newCategoryKey.trim() && newCategoryLabel.trim() : true);

  function buildPayload() {
    return {
      isNewCategory,
      categoryKey: isNewCategory ? null : categoryMode,
      newCategoryKey: isNewCategory ? slugify(newCategoryKey) : null,
      newCategoryLabel: isNewCategory ? newCategoryLabel.trim() : null,
      newCategoryColor: isNewCategory ? newCategoryColor : null,
      newCategoryCodeLang: isNewCategory ? newCategoryCodeLang : null,
      slug: slug.trim(),
      title: title.trim(),
      summary: summary.trim(),
      tags,
      gifUrl: gifUrl.trim(),
      relatedTool: relatedTool.trim(),
      body,
    };
  }

  async function handleSaveDraft(event) {
    event.preventDefault();
    if (!isFormValid) return;
    setSavingDraft(true);
    setDraftStatus(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server responded with ${res.status}`);
      }
      await res.json();
      navigate(paths.drafts());
    } catch (err) {
      setDraftStatus({
        type: 'error',
        message: `Couldn't reach the draft server (${err.message}). Is it running? Start it in another terminal with "npm run server", or use "Generate code instead" below.`,
      });
    } finally {
      setSavingDraft(false);
    }
  }

  function handleGenerateCode() {
    if (!isFormValid) return;
    const topicObjectCode = buildTopicObjectCode({
      slug: slug.trim(), title: title.trim(), summary: summary.trim(),
      tags, gifUrl: gifUrl.trim(), relatedTool: relatedTool.trim(), body,
    });

    if (isNewCategory) {
      const key = slugify(newCategoryKey);
      setGenerated([
        { fileLabel: `NEW FILE: src/data/topics/${key}.js`, code: buildNewCategoryFileCode(key, topicObjectCode) },
        { fileLabel: 'EDIT: src/data/topics/index.js', code: buildIndexRegistrationSnippet(key, newCategoryLabel.trim(), newCategoryColor, newCategoryCodeLang) },
      ]);
    } else {
      setGenerated([
        { fileLabel: `ADD TO: src/data/topics/${categoryMode}.js (inside the array)`, code: topicObjectCode },
      ]);
    }
    setCopiedIndex(null);
  }

  async function handleCopy(index, code) {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  function handleDownload(fileLabel, code) {
    const match = fileLabel.match(/([\w-]+\.js)/);
    downloadTextFile(match ? match[1] : 'snippet.js', code);
  }

  return (
    <div className="new-topic-page">
      <h1>Create a new page</h1>
      <p className="dashboard__lede">
        Fill this in like a wiki entry, then save it as a draft (temp storage) or
        generate copy-paste code if you'd rather add it by hand.
      </p>

      <div className="new-topic-page__grid">
        <form className="new-topic-page__form" onSubmit={handleSaveDraft}>
          <fieldset>
            <legend>Category</legend>
            <label className="field">
              <span>Where does this page belong?</span>
              <select value={categoryMode} onChange={(e) => setCategoryMode(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
                <option value={NEW_CATEGORY_VALUE}>+ Create a new category…</option>
              </select>
            </label>

            {isNewCategory && (
              <div className="new-topic-page__new-category">
                <label className="field">
                  <span>New category key (used in the URL, e.g. "docker")</span>
                  <input value={newCategoryKey} onChange={(e) => setNewCategoryKey(e.target.value)} placeholder="docker" />
                </label>
                <label className="field">
                  <span>New category display name</span>
                  <input value={newCategoryLabel} onChange={(e) => setNewCategoryLabel(e.target.value)} placeholder="Docker" />
                </label>
                <label className="field">
                  <span>Card color</span>
                  <input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} />
                </label>
                <label className="field">
                  <span>Code language (for syntax-highlighted code blocks)</span>
                  <select value={newCategoryCodeLang} onChange={(e) => setNewCategoryCodeLang(e.target.value)}>
                    <option value="text">Plain text (no highlighting)</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="json">JSON</option>
                    <option value="bash">Bash / shell</option>
                    <option value="python">Python</option>
                    <option value="xml">XML</option>
                  </select>
                </label>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>Page content</legend>
            <label className="field">
              <span>Title</span>
              <input value={title} onChange={handleTitleChange} placeholder="Java Streams" required />
            </label>
            <label className="field">
              <span>Slug (used in the URL - lowercase, hyphens only)</span>
              <input value={slug} onChange={handleSlugChange} placeholder="streams" required />
            </label>
            <label className="field">
              <span>Summary (1-2 lines, shown on category cards)</span>
              <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Functional-style operations on collections." required />
            </label>
            <label className="field">
              <span>Tags (comma-separated)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="java, collections, functional" />
            </label>
            <label className="field">
              <span>GIF / image URL (optional)</span>
              <input value={gifUrl} onChange={(e) => setGifUrl(e.target.value)} placeholder="https://…" />
            </label>
            <label className="field">
              <span>Related tool slug (optional, e.g. "json-formatter")</span>
              <input value={relatedTool} onChange={(e) => setRelatedTool(e.target.value)} />
            </label>
            <label className="field">
              <span>Body / explanation</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
                placeholder="Explain the concept, then paste a real code example…" required />
            </label>
          </fieldset>

          <div className="new-topic-page__actions">
            <button type="submit" className="btn-primary" disabled={!isFormValid || savingDraft}>
              {savingDraft ? 'Saving…' : 'Save as draft'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleGenerateCode} disabled={!isFormValid}>
              Generate code instead
            </button>
          </div>

          {role === 'editor' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              As an editor, your draft goes to an admin for review before it's published.
            </p>
          )}

          {draftStatus && (
            <p className={`new-topic-page__status new-topic-page__status--${draftStatus.type}`}>
              {draftStatus.message}
            </p>
          )}
        </form>

        <aside className="new-topic-page__preview">
          <h2 className="new-topic-page__preview-heading">Preview</h2>
          <article className="content-page new-topic-page__preview-card">
            <p className="content-page__breadcrumb">
              {isNewCategory ? newCategoryLabel || 'new-category' : categoryMode}
            </p>
            <h1>{title || 'Untitled page'}</h1>
            <div className="content-page__tags">
              {tagList.map((tag) => <span key={tag} className="content-page__tag">{tag}</span>)}
            </div>
            <pre className="content-page__body">{body || 'Body preview appears here as you type…'}</pre>
          </article>
        </aside>
      </div>

      {generated && (
        <section className="new-topic-page__output">
          <h2>Generated code</h2>
          {generated.map((item, index) => (
            <div key={item.fileLabel} className="new-topic-page__snippet">
              <div className="new-topic-page__snippet-header">
                <code>{item.fileLabel}</code>
                <div className="new-topic-page__snippet-actions">
                  <button type="button" onClick={() => handleCopy(index, item.code)}>
                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                  </button>
                  <button type="button" onClick={() => handleDownload(item.fileLabel, item.code)}>
                    Download
                  </button>
                </div>
              </div>
              <pre>{item.code}</pre>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
