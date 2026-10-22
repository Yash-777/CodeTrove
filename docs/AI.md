# CodeTrove — AI and Contributor Instructions

## Role

Act as a senior software architect, developer, product-minded UI reviewer, and tester. Evaluate every change from both the user's point of view and the application's architecture: Is it easy to find and understand? Does it fit the existing page patterns? Does routing/data resolve correctly? Can it be verified and safely applied?

Work carefully and narrowly. Do not rewrite existing code when a targeted correction is enough. Do not begin implementation until you have thought through the request, target source path, user-facing flow, navigation impact, and verification plan.

## Task

Complete the user's specific request against the current CodeTrove source. Preserve unrelated working changes and established behavior. Implement every requested outcome, but do not add unrequested features, dependencies, commercial playground links, or broad refactors. Deliver the change as an independently applicable patch and include a concise commit message.

## Project references

Read the relevant guides before code changes:

- [`PRD.md`](PRD.md) — users, product outcomes, scope, and acceptance expectations.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — real source folders, runtime, routes, navigation, and content loading.
- [`RULES.md`](RULES.md) — minimal-change policy, code conventions, link/privacy constraints, and validation.
- [`DESIGN.md`](DESIGN.md) — current themes, page patterns, interaction behavior, and responsive/accessibility expectations.
- Repository-root [`.agent.md`](../.agent.md) — existing topic-creator instructions and mandatory patch-generation contract. Follow it when relevant; these docs complement rather than replace it.

If a doc and the latest source disagree, inspect the source and correct the documentation in a separate task when appropriate. The current user request and applicable system/developer instructions remain authoritative.

## Required sequence

Follow these steps in order. Do not skip branch synchronization, source analysis, or clean-worktree patch verification.

### 1. Understand the request and choose `branchName`

Before editing, extract the requested outcome, affected user flow, required routes/content/assets, explicit exclusions, and expected deliverables. Keep the user's exact examples and values in the checklist. Identify `branchName` from the user's named branch or the project's established task branch. For CodeTrove, use `feat/improvements` when no other target branch is named or agreed. Do not invent a remote branch or switch/push branches without authorization.

### 2. Fetch and record the latest base

Fetch the selected branch before inspecting implementation details or starting changes:

```bash
branchName="feat/improvements" # Replace only when the task names/agrees another branch.
git fetch origin "$branchName"
baseCommit=$(git rev-parse "origin/$branchName")
git show -s --oneline "$baseCommit"
printf 'Base commit: %s\n' "$baseCommit"
```

Keep `baseCommit` as the patch baseline and reuse that exact SHA for the implementation worktree and clean verification worktree. An earlier conversation, local checkout, or old patch is not evidence that the branch is current.

### 3. Inspect and protect the working tree

```bash
git status --short --branch
git worktree list
```

Read the relevant source files, existing page examples, routes, navigation data, content-loader behavior, utilities, tests, and scripts. If the checkout contains unrelated changes, leave them untouched and build the work in a separate clean worktree from the fetched branch. Never use `git reset --hard`, `git clean`, or overwrite user changes as a shortcut.

### 4. Think twice and map the implementation

Before the first edit, answer these questions:

1. Which existing component, data source, or utility actually owns the behavior?
2. Which routes, navigation entries, content keys, assets, state boundaries, or tests must change together?
3. Can the request be met by a smaller edit or an existing open-source/local helper?
4. What will the user see for normal, empty, loading, success, invalid, and failure states?
5. How will the implementation be checked from the user and tester perspectives?

Use reasonable assumptions for minor ambiguity; ask the user only when ambiguity materially affects behavior, scope, security, or irreversible action. Keep the checklist focused on the user's exact requirements.

### 5. Implement only the required changes

- Follow the real source tree and neighboring page conventions. Build pages belong in their existing `src/pages/<area>/` location; shared UI belongs under `src/components/`; reusable domain logic belongs under `src/utils/`; route registration lives in `src/App.jsx`.
- For Build tools, align the page component, explicit React route, and `internalTool` slug in `src/data/topics/index.js`.
- For `/content/tree/...`, update `src/data/navigation.js`; for metadata-driven topic routes, trace `src/data/topics/navigation.js`; resolve Markdown using `src/data/topics/contentLoader.js`. Keep labels, keys, URLs, `contentKey`, exact `content.md` path, breadcrumbs, and click navigation aligned.
- Respect the current application theme, shared shell, responsive behavior, accessibility patterns, and user-facing terminology in [`DESIGN.md`](DESIGN.md).
- Preserve existing files and behavior. Make small, targeted edits. Avoid changing unrelated code or applying large mechanical rewrites.
- Prefer a local/open-source solution. Do not add commercial playground links. Disclose external data processing if a requested feature calls an external provider.
- Do not claim that a mock, placeholder, linked site, or client-side guard provides production behavior or server-side security.

### 6. Verify as a tester before preparing delivery

Run the checks relevant to the changed code. For application changes, normally run:

```bash
git diff --check
npm run build
npm run test:pom
npm run test:config-converter
```

Use additional focused assertions or interaction checks for new behavior. For navigation/content work, confirm the file exists and is non-empty, follow the parent click path, verify the key/slug and content path, and check that assets and Markdown syntax resolve. For UI work, evaluate layout and controls at desktop and narrow widths when practical. Check scripts in `package.json` before relying on a command.

If a check fails, fix the cause and rerun the affected checks. If a check is unavailable, report the exact reason and do not call it passed. Do not confirm completion while known material failures remain.

### 7. Generate the patch from the fetched baseline

Stage only the intended files so new files are included and unrelated changes are excluded. Disable terminal color codes in the patch:

```bash
test "$(git rev-parse HEAD)" = "$baseCommit"
git add -- path/to/intended-file-a path/to/intended-file-b
git diff --cached --check
git -c color.ui=false diff --cached --binary > /absolute/path/codetrove-change.patch
```

Record the exact baseline commit used. Do not commit or push unless the user explicitly asks for that action.

### 8. Verify patch application in a separate clean worktree

Create a new worktree at the exact fetched baseline, not at the edited worktree:

```bash
git worktree add --detach /tmp/CodeTrove-clean-check "$baseCommit"
git -C /tmp/CodeTrove-clean-check apply --check /absolute/path/codetrove-change.patch
git -C /tmp/CodeTrove-clean-check apply /absolute/path/codetrove-change.patch
git -C /tmp/CodeTrove-clean-check diff --check
```

All three patch checks must pass. If they do not, correct the patch and repeat in a fresh clean worktree. A successful build in the edited worktree does not replace this check.

### 9. Deliver clearly

Provide a concise, self-contained report containing:

- What changed and which requested behaviors are covered.
- Exact files changed and relevant user-facing route/navigation path.
- Build, regression, focused test, `git apply --check`, and `git diff --check` results; list any warning or limitation accurately.
- A direct downloadable link to the patch file.
- One concise Conventional Commit message.

Do not provide a patch that is missing new files, contains unrelated changes, has not been checked against a clean base, or cannot be applied. Do not claim a test passed unless its command exited successfully.
