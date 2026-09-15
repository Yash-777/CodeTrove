/**
 * src/pages/store/ResumePage.jsx
 * ------------------------------------------------------------------
 * Route: /store/resume (requires login)
 * Placeholder for the resume/CV builder. Not built yet - a real
 * version needs its own Firestore document per user (work history,
 * skills, templates) plus a PDF export step, which is a project of
 * its own rather than a quick addition.
 */

export default function ResumePage() {
  return (
    <div className="content-page">
      <h1>Resume Builder</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Not built yet. Planned: a structured form (experience, skills, education)
        saved to your account, rendered into a downloadable PDF using a couple of
        selectable templates.
      </p>
    </div>
  );
}
