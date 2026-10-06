# CodeTrove — Modular React Static GitHub Pages Architecture

## Branch

`feat/modular-react-static-ghpages`

## Target

Static React/Vite deployment to:

`https://yash-777.github.io/CodeTrove/#/`

## What changed

This change converts the CodeTrove application shell to a modular architecture suitable for GitHub Pages static hosting while keeping existing pages, routes, sidebar behavior, and component imports intact.

### 1. GitHub Pages routing

- Replaced `BrowserRouter` with `HashRouter` in `src/App.jsx`.
- Existing route definitions remain unchanged.
- Static URLs use the hash portion, for example:
  - `/#/`
  - `/#/signin`
  - `/#/content/tree/...`
- Vite uses `/CodeTrove/` as the production base only when `GITHUB_PAGES=true`.
- Local development continues to use `/` as the base.

### 2. Vite configuration

Updated `vite.config.js` to:

- remove the Express `/api` proxy
- remove the CSV test-user Vite plugin
- use `base: '/CodeTrove/'` for GitHub Pages
- use `base: '/'` locally
- keep `dist` as the output directory
- add aliases:
  - `@modules`
  - `@components`
  - `@utils`
  - `@data`
- preserve configurable source-map behavior

### 3. Modular authentication

Added:

```text
src/modules/auth/
├── AuthContext.jsx
└── services/
    ├── testAuthService.js
    └── firebaseAuthService.js
```

`AuthContext` owns the application authentication state and delegates authentication operations to a service.

The default service is `testAuthService`.

The future Firebase migration is intentionally isolated to the service selection in `AuthContext.jsx`:

```js
import { testAuthService } from './services/testAuthService.js';
// import { firebaseAuthService } from './services/firebaseAuthService.js'
```

Test accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@test.com` | `admin123` |
| Editor | `editor@test.com` | `editor123` |
| Viewer | `viewer@test.com` | `viewer123` |

Authentication state is persisted with:

`codetrove_current_user`

Async authentication operations simulate a 500 ms network delay.

### Compatibility API

The new auth context exposes the requested API:

- `user`
- `isAuthenticated`
- `loading`
- `error`
- `signIn()`
- `signUp()`
- `signOut()`
- `hasRole()`

It also exposes compatibility values used by existing CodeTrove pages:

- `profile`
- `role`
- `signOutCurrentDevice()`
- `signOutOtherDevices()`

This avoids changing existing pages/components unnecessarily.

### Existing context imports

Existing files that still import:

```text
src/context/AuthContext.jsx
src/context/ThemeContext.jsx
```

continue to work through lightweight re-export compatibility modules. No application-page refactor is required.

### Firebase placeholder

`src/modules/auth/services/firebaseAuthService.js` provides the same core service interface and currently throws:

`Error('Firebase auth not yet implemented')`

No Firebase SDK is required by the static build.

### Existing UsersPage compatibility

`UsersPage` previously imported Firestore directly. Rather than modifying that existing page, the Vite configuration maps:

```text
firebase/firestore
```

to a local static compatibility adapter:

```text
src/firebase/firestore.js
```

The adapter reads and updates users through the test authentication store. This keeps the existing page source unchanged while removing the Firebase dependency from the build.

## 4. Theme module

Added:

```text
src/modules/theme/ThemeContext.jsx
```

Supported themes:

- `light`
- `dark`
- `system`

Persisted using:

`codetrove_theme`

The module:

- updates `document.documentElement[data-theme]`
- detects `prefers-color-scheme`
- listens for system theme changes when `system` is selected
- exposes `setTheme()`
- exposes `cycleTheme()`

Compatibility aliases `mode` and `setMode` remain available for existing components.

## 5. Package changes

Removed runtime dependencies:

- `firebase`
- `firebase-admin`
- `express`
- `cors`
- `express-rate-limit`
- `dotenv`

Removed the `server` npm script.

Added:

```json
"build:ghpages": "GITHUB_PAGES=true vite build"
```

Existing React/Vite/content dependencies remain.

## 6. Development script

`scripts/dev.js` no longer starts or advertises Firebase authentication or the CSV authentication plugin.

The existing source-map command remains supported, including:

```bash
npm run dev generate_sourcemap=true
npm run dev generate_sourcemap=false
```

The normal development application uses the browser-local test authentication service.

## 7. GitHub Actions

Added:

```text
.github/workflows/deploy-ghpages.yml
```

The workflow runs for:

- pushes to `feat/modular-react-static-ghpages`
- manual `workflow_dispatch`

---

Build steps:

1. Checkout
2. Node.js 20
3. Install dependencies -> `npm install`

4. `npm run`
<table>
<thead>
<tr>
<td>Development</td>
<td>Production Build (GitHub Pages)</td>
</tr>
</thead>
<tbody>
<tr>
<td>

```bash
# Run dev server (http://localhost:5173)
npm run dev

# Test routes work with hash routing
# Navigate to: http://localhost:5173/#/learn/java
```

</td>
<td>

```bash
# Build exactly as GitHub Pages will
npm run build:ghpages

# Preview the production build
npm run preview

# Then visit: http://localhost:4173/#/
```

5. Upload `./dist`
6. Deploy with `actions/deploy-pages@v4`

The GitHub Pages environment receives the generated deployment URL.

</td>
</tr>
</tbody>
</table>




---

## 8. Static deployment architecture

```text
Browser
  │
  ├── HashRouter
  │     └── /CodeTrove/#/...
  │
  ├── React UI
  │
  ├── AuthContext
  │     └── testAuthService
  │           └── localStorage
  │
  ├── ThemeContext
  │     └── localStorage + system preference
  │
  └── Static content
        └── JSON / Markdown / bundled application assets

GitHub Pages
  └── dist/
```

There is no Express API dependency in the static deployment path.

## 9. Existing functionality preserved

The change intentionally does not rewrite existing application pages such as:

- Dashboard
- CategoryPage
- TopicPage
- NavigationPage
- Sidebar
- Header
- compiler/tools pages
- store pages
- authentication forms

Existing route definitions remain intact.

## 10. Validation performed

### Patch validation

- `git apply --check` — passed
- Patch applied cleanly to a fresh copy of the supplied CodeTrove ZIP.
- `git diff --check` — passed
- No forbidden Firebase/Express dependencies remain in `package.json`.
- `BrowserRouter` is no longer used in `src/App.jsx`.
- Required module files exist.
- GitHub Pages workflow exists.

### Build limitation in this environment

The actual Vite build could not be executed in the generation environment because npm dependencies were not cached and access to the npm registry timed out.

Run locally after applying the patch:

```bash
npm install
npm run build:ghpages
```

Then verify the generated `dist/` directory.

## 11. Local verification checklist

```bash
npm install
npm run build:ghpages
npm run dev
```

Verify:

- `http://localhost:5173/#/`
- `http://localhost:5173/#/signin`
- `admin@test.com / admin123`
- refresh keeps the authenticated user
- editor/viewer roles enforce existing `RequireRole` routes
- theme selection persists after refresh
- existing content routes load using hash URLs

For GitHub Pages, verify:

`https://yash-777.github.io/CodeTrove/#/`

## 12. Firebase migration path

When Firebase is ready:

1. Implement the methods in `src/modules/auth/services/firebaseAuthService.js`.
2. Switch the service used by `AuthContext.jsx`.
3. Keep the existing component API unchanged.
4. Deploy using the same GitHub Actions workflow.

The UI should continue consuming the authentication abstraction rather than depending directly on Firebase.
