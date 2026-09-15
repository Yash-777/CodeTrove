/**
 * src/pages/store/CertificatesPage.jsx
 * ------------------------------------------------------------------
 * Route: /store/certificates (requires login)
 * Placeholder for storing earned certificates (course completions,
 * certifications). Not built yet - would need file upload support
 * (Firebase Storage, not currently wired into this project) plus a
 * Firestore collection of certificate metadata per user.
 */

export default function CertificatesPage() {
  return (
    <div className="content-page">
      <h1>Certificates</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Not built yet. Planned: upload and store certificates/completions tied to
        your account, with a public/private toggle per certificate for sharing on
        your resume.
      </p>
    </div>
  );
}
