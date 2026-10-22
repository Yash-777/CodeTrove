# CodeTrove — Product Requirements Document

## Product summary

CodeTrove is a developer dashboard for learning software concepts, using practical coding and text tools, and organizing a personal professional workspace. It brings those activities into one navigable application instead of presenting an unstructured collection of links.

This document describes product intent and acceptance expectations. The current application source is authoritative for what is already implemented. A route, card, or link is not evidence that a feature is complete; inspect and exercise the actual page before describing it as working.

## Problem and users

Developers often switch among tutorials, reference notes, formatters, validators, compilers, and career documents. That fragmentation makes it harder to move from understanding a concept to trying it and retaining useful notes.

CodeTrove serves:

- Learners who need a clear path from a broad subject to focused concepts and examples.
- Working developers who need quick, reliable utilities and a place to test or inspect code.
- Contributors and educators who organize learning content into searchable, maintainable pages.
- Developers who want one workspace for profile and career materials, where those functions are available.

## Product outcomes

1. Help a user find a subject through recognizable categories, nested topics, search, and navigable breadcrumbs.
2. Pair explanations with concrete examples and appropriate tools so a user can move from reading to trying.
3. Make developer utilities straightforward to understand: show input/output boundaries, options, status, and limitations.
4. Keep learning content, routes, and source files aligned so new material can be added without breaking existing paths.
5. Prefer browser-local processing and open-source/local implementations for utilities where practical. Explain clearly when a function calls an external compiler or service.
6. Make the application usable in light and dark themes and at desktop and mobile widths.

## Product areas

### Learn

Users browse a hierarchical learning tree and metadata-driven category pages. Learning pages are Markdown-backed and may contain explanations, examples, diagrams, links, expandable answers, or runnable code. The route and navigation data must lead to an existing, non-empty article. Breadcrumbs should describe the hierarchy and remain navigable where the page pattern supports them.

### Build

Users open the compiler and focused tools from the Build area. Examples in the current source include text utilities, a character counter, SQL playground, network tools, formatters/converters, cryptography and JWT tools. A tool should communicate what it processes, which options affect results, whether work stays in the browser, and how to copy or clear results. Tool cards that say “internal” must resolve to a real registered route; external links must be explicit and intentional.

### Store

The application exposes profile and career-workspace routes such as profile, resume, certificates, and career history. The actual feature status and persistence model must be checked in the current page code before promising behavior. Do not imply that a placeholder or demo adapter is production storage.

### Shared application shell

The shared shell contains the header, sidebar, Learn/Build/Store navigation, active-page area, theme selection, and search/recent navigation affordances. The shell should remain predictable while users move between product areas.

## Core user journeys

### Find and learn a topic

1. Open Learn and choose a section or category.
2. Expand the topic hierarchy or use search.
3. Open the requested topic or page.
4. Use the breadcrumb to understand location and navigate back up the hierarchy.
5. Read examples and, where present, run or copy them.

### Use a developer tool

1. Open Build → Tools and select a category.
2. Open an internal tool from its card.
3. Enter or load sample input; adjust options with labels that explain their effect.
4. Review live metrics, validation, or output and any warning/error state.
5. Copy or clear the result. For any external processing, disclose the provider/data flow in the UI.

### Add or improve learning content

1. Identify the correct content route and source folder.
2. Add or edit topic metadata and the Markdown article.
3. Update every navigation representation that serves that route.
4. Verify that clicking the parent navigation reaches the article and that all referenced assets resolve.

## Functional requirements

- **Navigation:** Use the route model already used by the target page. Visible labels, route segments, keys/slugs, content keys, and file paths must agree.
- **Learning content:** Render Markdown through the existing content components. Use the supported Markdown syntax and runnable-code flow; do not introduce a parallel renderer without a requirement.
- **Tool pages:** Reuse the existing Build tool shell and page styling. Provide useful empty, sample, success, error, and copy feedback states as applicable.
- **Local-first behavior:** Keep a utility's processing in the browser unless its existing purpose requires an external service. Never send user input to a new service without a requirement and clear disclosure.
- **External resources:** Prefer an in-app or open-source/local implementation. Do not add commercial playground links unless the user explicitly requests them.
- **Accessibility and themes:** Controls need visible labels or accessible names; interactive feedback must be announced when appropriate. Use theme tokens instead of fixed light-only colors.
- **Reliability:** Preserve current routes and behavior outside the requested scope. A change is complete only after relevant tests, build checks, and clean-worktree patch checks pass.

## Quality expectations

The UI should answer, without guesswork: What page am I on? What can I enter? What does this option change? Where did the result come from? What happened after I clicked? Can I recover or clear the input?

Documentation and status text must distinguish implemented behavior from planned work. Do not invent performance, privacy, security, or availability guarantees. State limitations beside the affected feature.

## Scope boundaries

This PRD is not approval to add a backend, a paid dependency, an external playground, a new design system, or broad refactors. Implement only what the current task asks for, plus the small routing, tests, or accessibility work required to make that request complete.