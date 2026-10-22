# CodeTrove — UI and Design Guide

## Design intent

CodeTrove should feel like a calm, practical developer workspace: content is easy to scan, tools look trustworthy, and the interface does not compete with the user's code or learning material. Keep page-specific layouts distinct where they serve a real task, while sharing the same theme, shell, controls, and interaction language.

Design from the user's point of view: make page purpose, next action, input/output, option effects, and status immediately understandable. Avoid decorative UI that makes developer tasks harder to read.

## Global tokens

The canonical tokens are in `src/index.css`. Use these variables rather than duplicating theme values:

| Token | Light theme | Dark theme | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#f7f8fb` | `#14161c` | Main app/page background |
| `--color-sidebar-bg` | `#eef0f5` | `#1b1e26` | Sidebar surface |
| `--color-paper` | `#ffffff` | `#1e212a` | Cards and raised inputs |
| `--color-border` | `#dde1ea` | `#2c303c` | Borders and separators |
| `--color-text` | `#1f2430` | `#e8e9ee` | Primary text |
| `--color-muted` | `#6b7280` | `#9aa0ae` | Secondary/helper text |
| `--color-accent` | `#ff6a3d` | `#ff8a63` | Primary interactive emphasis |
| `--color-accent-soft` | `#ffe4d9` | `#3a2620` | Soft accent surface |

Typography uses `--font-sans` for interface/content and `--font-mono` for code, editors, and technical values. The sidebar widths are exposed as `--sidebar-width` and `--sidebar-width-collapsed`. Respect the dark theme, which switches token values through `[data-theme='dark']`.

## Shared shell and page composition

`src/layout/AppLayout.jsx` owns the shared Header, Sidebar, and Outlet. The sidebar/header relationship and active navigation are part of the application structure; feature pages should not create a competing global shell.

Use the existing `src/pages/build/` and `src/pages/content/` examples as the visual reference for their respective page families. A typical utility page has:

1. A short page heading and purpose statement.
2. A bordered, rounded workspace card.
3. Clear labels and grouped controls above or beside the working area.
4. Input/output areas that preserve readable code/text spacing.
5. Primary and secondary actions with consistent states.
6. Live results, warnings, or a compact status message near the relevant control.
7. A reference or explanatory section below the workspace when it improves comprehension.

Use section headings, concise helper copy, and whitespace to establish hierarchy. Do not turn every page into the same generic grid; choose a layout based on the task and keep the component responsive.

## Surfaces, controls, and feedback

- Use a light border, rounded corners, and `--color-paper` surface for cards; prefer subtle shadows only for hierarchy, not decoration.
- Keep controls visibly interactive with hover and keyboard-focus states. Use the shared coral accent for primary action, focus, and selected state.
- Buttons need action-first labels. Icon-only buttons require an accessible name/title; use the installed `lucide-react` set where icons help recognition.
- Use native labels for text inputs, selects, and checkboxes. Put optional settings near the tool area they affect.
- Disable unavailable actions rather than leaving users to discover failure by clicking. Show success/failure feedback after copy, format, run, or transform actions.
- Give metrics, validation rules, and non-obvious terms concise tooltips. Tooltips supplement visible text and must also have an accessible name.
- Use readable monospace text in code/input panels. Keep textareas resizable where the existing page pattern does so.

## Learning pages and navigation

- Keep section/topic/page hierarchy visible. Use the shared breadcrumb component for content pages, and keep its entries navigable according to the current page pattern.
- Markdown content should have one clear title, descriptive section headings, readable paragraphs, and fenced code blocks with correct language identifiers.
- Diagrams and code examples should explain concepts rather than decorate the page. Use the existing Markdown renderer, CodeBlock, and RunnableCode patterns.
- Avoid unexplained external link lists. Label an external action and open it in the expected manner.

## Responsive behavior

The shared app shell changes layout around 720px in `src/layout/AppLayout.css`. Feature pages may have their own breakpoints, consistent with existing tool pages (commonly around 680–900px). On narrow screens:

- Collapse multi-column editor/results layouts into a readable vertical flow.
- Let action rows wrap; do not allow toolbar buttons to cover all usable input space.
- Keep metric cards and tables readable; use horizontal scrolling for genuinely wide data rather than clipping it.
- Preserve comfortable tap targets and visible focus rings.

Check the actual page at a narrow width whenever a layout change is substantial. Do not add device-specific behavior that cannot be tested.

## Accessibility and motion

- Prefer semantic `main`, `header`, `section`, headings, labels, buttons, and links.
- Keyboard users must be able to reach and understand every action. Focus styles must remain visible in both themes.
- Do not convey errors, limit status, or selection only through color. Pair color with a label or text.
- Use `role="status"` or a suitable live region for asynchronous feedback; do not announce every keystroke unnecessarily.
- Keep transitions short and subtle. Respect reduced-motion preferences if adding nontrivial animation.
- Avoid color/contrast regressions in both light and dark modes.

## Do not

- Hard-code light-only foreground/background colors in a themed page.
- Remove labels to save space or make an icon the only clue to an action.
- add commercial playgrounds or third-party services as a substitute for a requested local tool.
- Recreate the global header/sidebar in feature pages.
- Use fixed heights that hide user content, or create horizontal overflow on mobile.
- Change styles of unrelated pages to make one new page easier to implement.
