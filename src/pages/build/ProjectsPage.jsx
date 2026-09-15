/**
 * src/pages/build/ProjectsPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/projects (requires login - see App.jsx's RequireRole
 * usage, allowing any of admin/editor/viewer, i.e. "just signed in")
 * Placeholder for "save and revisit your own code/snippets/projects."
 * The real version needs its own Firestore collection (e.g.
 * `snippets/{uid}/{snippetId}`) - not built yet, but the route and
 * page exist so the IA matches the structure diagram.
 */

import { useAuth } from '../../context/AuthContext.jsx';

export default function ProjectsPage() {
  const { profile } = useAuth();
  return (
    <div className="content-page">
      <h1>My Projects</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Not built yet - this will hold code snippets and projects you save while
        using the tools and compiler, signed in as {profile?.email}. Planned storage:
        a Firestore collection scoped to your account, similar to how your profile
        and role are stored today.
      </p>
    </div>
  );
}
