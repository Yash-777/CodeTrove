# CodeTrove — Architecture

## Current-state rule

This guide was written against the current repository source. Source files, `package.json`, and the actual route/content behavior take precedence over older architecture notes when they disagree. In particular, older notes may describe moved folders, placeholder services, or scripts that are no longer present. Re-check before relying on them.

## Runtime and entry flow

CodeTrove is a React 18 single-page application built with Vite. `react-router-dom` uses `HashRouter` so static hosting can serve one HTML entry point without server-side route rewrites. The GitHub Pages base path is selected in `vite.config.js` when `GITHUB_PAGES=true`.

```text
index.html
  └─ src/main.jsx
      ├─ ThemeProvider
      ├─ AuthProvider
      └─ src/App.jsx (HashRouter + route table)
          └─ AppLayout (Header + Sidebar + Outlet)
              └─ matched page / feature
```

- `src/main.jsx` mounts the app and global providers.
- `src/App.jsx` is the explicit route registry. A page component existing on disk does not register its route.
- `src/layout/AppLayout.jsx` composes the shared header, sidebar, and nested page outlet.
- `src/index.css` defines the global theme tokens and base styles. Feature CSS is commonly imported beside its page component.

## Source layout

```text
src/
├── App.jsx                    # Explicit HashRouter routes
├── main.jsx                   # React root and providers
├── layout/                    # AppLayout, Header, Sidebar and shell CSS
├── pages/
│   ├── content/               # Category, topic and navigation views
│   ├── learn/                 # Practice/learning activities
│   ├── build/                 # Compiler, tools and Build landing pages
│   ├── store/                 # Profile and career workspace pages
│   ├── auth/                  # Sign-in and sign-up pages
│   └── admin/                 # Draft, authoring and user administration
├── components/                # Shared rendering, breadcrumbs, guards, runners
│   └── CodeRunner/            # Runnable examples and SQL playground
├── data/
│   ├── navigation.js          # Primary content-tree navigation
│   └── topics/                # Category metadata, Markdown loader, content maps
├── modules/                   # Auth and theme providers/services
├── firebase/                  # Compatibility adapter/config paths
└── utils/                     # Shared parsing, formatting, clipboard and API logic

server/                         # Optional local Express API for draft workflow
scripts/                        # Asset preparation and regression checks
docs/                           # Project documentation and diagrams
public/                         # Static assets copied into the built application
```

Use the actual nearby folder and file naming pattern when adding a feature. Do not follow an old sample path if it does not exist in the current source tree.

## Routing and navigation

### Application routes

`src/App.jsx` declares page routes under the shared `AppLayout`. Common families include:

- `/` — dashboard.
- `/content/...` and `/content/tree/...` — learning content.
- `/learn/practice` — practice page.
- `/build/compiler`, `/build/tools`, and `/build/tools/<tool-slug>` — compiler and tools.
- `/build/projects` — projects area.
- `/store/...` — profile and career pages.
- `/signin`, `/signup`, `/preferences`, and `/admin/...` — account and administration pages.

When adding a page, import it into `src/App.jsx` and add the intended explicit route. Internal links must use the same path/slug. Keep hash routing intact for static deployment.

### Learning navigation is data-driven in more than one way

Do not update a navigation file by name alone. Trace the page component and route to the data source it reads.

| Use | Source of truth | Responsibility |
| --- | --- | --- |
| `/content/tree/...` learning tree | `src/data/navigation.js` | Hierarchical tree, labels/keys/content keys, tree search and path lookup |
| Category metadata and Build tools list | `src/data/topics/index.js` plus category files | `CATEGORIES`, topic metadata, colors and tool registry consumed by category/dashboard/tool views |
| Metadata-driven documentation grouping | `src/data/topics/navigation.js` | `DOCUMENTATION_NAVIGATION` and `getDocumentationRoute()` for topic-style routes |
| Markdown file discovery and content | `src/data/topics/contentLoader.js` plus `src/data/topics/**/*.md` | Eager raw Markdown imports and helpers that return content or an explicit missing-file message |
| Page route/rendering | `src/App.jsx`, `src/pages/content/*` | Route match, breadcrumb/page selection and Markdown rendering |

For navigation-tree pages, `contentKey` resolves to `src/data/topics/<contentKey>/content.md` (or an explicit `.md` key). For category topics, content normally resides at `src/data/topics/<category>/<topic>/content.md`; some categories use `src/data/topics/languages/<category>/<topic>/content.md`, and category-level fallback content may be `content_info.md`. Confirm the exact lookup path in `contentLoader.js` before adding content.

A complete learning-page change must align the visible label, key/slug, URL, content key, Markdown path, and any internal links/breadcrumbs. Test the click path from its parent in addition to opening the URL directly.

### Build tool registration

The Build tools directory reads category `tools` arrays from `src/data/topics/index.js`. For an in-app tool:

1. Put the component and page-specific stylesheet in `src/pages/build/` following neighboring page conventions.
2. Add an explicit route in `src/App.jsx`.
3. Register the tool under the correct category with `internalTool` matching the route slug.
4. Confirm the card's link opens the correct page.
5. Add or update shared utility modules in `src/utils/` when logic is reusable or independently testable.

External tools use `externalUrl`; keep such links intentional, descriptive, and consistent with user constraints. Do not include commercial playground links unless explicitly requested.

## Content and rendering

- Topic metadata is kept in category files and assembled through `src/data/topics/index.js`.
- Markdown is discovered by `src/data/topics/contentLoader.js` using Vite's eager raw-file glob.
- `src/components/MarkdownContent.jsx` handles the application's Markdown rendering and supported extensions.
- `src/components/ContentBreadcrumbs.jsx` renders breadcrumb navigation.
- `src/components/CodeRunner/RunnableCode.jsx` owns the runnable-example UI; compiler/runtime calls live in the relevant utility/provider files.
- Static diagrams and other public assets live under `public/`; use the app's base-path-aware URL pattern when a static deployment prefix matters.

Avoid a second Markdown renderer or duplicate topic store unless a task requires one. Read the existing parser, loader, and representative article before extending Markdown syntax.

## State, services, and trust boundaries

- `ThemeProvider` in `src/modules/theme/` owns app-wide theme behavior; components should read the shared CSS tokens rather than implement isolated theme values.
- `AuthContext.jsx` currently selects `testAuthService` by default. It is a demo/test authentication service, not proof of production authentication.
- `src/components/RequireRole.jsx` is a user-interface guard. A client-side role check is not a security boundary.
- `server/` contains an Express draft API with rate limiting and server-side auth/role checks. `server/index.js` binds port 4000 and expects the documented server credentials. Check `package.json` before assuming a convenience launch script exists; the source comment and current package scripts may differ.
- Some compiler pages call external runtime APIs through `src/utils/*Api.js`. Treat those differently from browser-local formatters, validators, and utilities. Never claim all tool input stays local unless the code confirms it.
- Never place private API keys, service-account keys, or privileged credentials in browser code or `VITE_*` variables. Anything bundled into the client is public.

## Build and checks

The current package scripts include:

```bash
npm ci
npm run build
npm run build:ghpages
npm run test:pom
npm run test:config-converter
```

`prebuild` copies parser/WASM assets before Vite builds. Run relevant regression suites with the build. Add focused checks for new pure utility behavior or route/content mappings when appropriate. Review the script list in `package.json` before documenting or running a command; do not assume an old script remains available.

## Change boundaries

Keep changes small and local to the feature. Prefer modifying a nearby component/helper over replacing an entire subsystem. Preserve established routes, metadata shapes, local behavior, and styling unless the request explicitly changes them. For patch delivery and clean-tree validation, follow [`AI.md`](AI.md) and [`RULES.md`](RULES.md).