/**
 * src/pages/NotFound.jsx
 * ------------------------------------------------------------------
 * Matched by the catch-all route `path="*"` in App.jsx whenever the
 * URL doesn't match any other route (typo, dead link, etc.).
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to dashboard</Link>
      </p>
    </div>
  );
}
