# Adding topics and subtopics

The sidebar is generated from Markdown paths. React components do not contain individual Git or SourceTree topic lists.

## Canonical SourceTree structure

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

## Expected navigation

```text
Git
├── Branching Strategy
├── Clone Repository
├── Common Commands
├── Service Account From GitHub Secrets
├── Ssh Authentication
├── Undo Things
└── SourceTree
    ├── Getting Started
    ├── SSH Key Setup
    └── Diff Limits
```

The important rule is that the parent and children share the same route prefix:

```text
git/source-tree
git/source-tree/getting-started
git/source-tree/ssh-key-setup
git/source-tree/diff-limits
```

`src/data/topics/discovery.js` creates a real `git/source-tree` node from the parent `content.md`, then attaches each child using its `parentPath`.

## Add a new child topic

Create a folder and add `content.md`:

```text
src/data/topics/git/source-tree/branches/content.md
```

It automatically becomes:

```text
Git
└── SourceTree
    └── Branches
```

Optional frontmatter controls the label, order, and summary:

```md
---
title: Branches
order: 40
description: Manage branches in SourceTree.
---

# Branches
```

Use lowercase kebab-case for folders and always use `content.md` as the document filename.
