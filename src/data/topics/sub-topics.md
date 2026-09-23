# Adding topics and subtopics

Documentation navigation is generated from Markdown file paths. React components should not contain individual Git, SourceTree, JavaScript, or JWT topic lists.

## Canonical SourceTree structure

Use **one consistent parent directory** for the SourceTree section:

```text
src/data/topics/git/source-tree/
├── content.md
├── getting-started/
│   └── content.md
├── ssh-key-setup/
│   └── content.md
└── diff-limits/
    └── content.md
```

Do not place the parent page in `git/sourcetree/`. The legacy `git/sourcetree/` location is ignored by discovery to prevent a duplicate `Sourcetree` item in the Git menu.

## Result in the sidebar

```text
Git
├── Branching Strategy
├── Common Commands
├── Service Account From GitHub Secrets
├── Undo Things
└── SourceTree
    ├── Getting Started
    ├── SSH Key Setup
    └── Diff Limits
```

The parent and children must share the same path prefix:

```text
git/source-tree
git/source-tree/getting-started
git/source-tree/ssh-key-setup
git/source-tree/diff-limits
```

The discovery layer calculates `parentPath` from these route segments and attaches each child to the `source-tree` node automatically.

## Add a new topic

1. Create a directory under the category.
2. Add `content.md`.
3. Optionally add frontmatter for `title`, `description`, and `order`.
4. Start the development server or rebuild the app.
5. The topic appears automatically in the sidebar and route.

Example:

```text
src/data/topics/git/source-tree/branches/content.md
```

This becomes:

```text
Git
└── SourceTree
    └── Branches
```

## Frontmatter

```md
---
title: Branches
description: Create, compare, and merge branches in SourceTree.
order: 40
---

# Branches

Your Markdown content goes here.
```

## Naming rules

- Use lowercase kebab-case for directories.
- Always use `content.md` for the document.
- Use `source-tree`, not `source tree` or `sourcetree`, for the filesystem parent slug.
- Keep the parent topic at the same path level as its children.
