# Subtopic and nested topic guide

This project supports nested documentation directories where each folder can become a topic node in the sidebar.

## Recommended structure

```text
src/data/topics/
├── javascript/
│   ├── array/
│   │   └── content.md
│   └── async-generator/
│       ├── content.md
│       ├── next/
│       │   └── content.md
│       └── throw/
│           └── content.md
├── git/
│   ├── sourcetree/
│   │   └── content.md
│   └── source-tree/
│       ├── getting-started/
│       │   └── content.md
│       ├── ssh-key-setup/
│       │   └── content.md
│       └── diff-limits/
│           └── content.md
└── sub-topics/
    └── javascript/
        └── array-methods/
            └── content.md
```

## Rules

1. Put the main topic in its own folder with `content.md`.
2. Put child topics in subfolders beneath that parent.
3. Keep filenames as `content.md`.
4. Use frontmatter only when you need custom titles, order, or descriptions.
5. Keep folder names lowercase and slug-safe.

## Example

```md
---
title: SSH Key Setup
order: 20
description: Generate and add SSH keys for GitHub and GitLab.
---

# SSH Key Setup
```

## How the sidebar reads it

- `git/sourcetree/content.md` becomes the parent topic `Sourcetree`
- `git/source-tree/getting-started/content.md` becomes a nested child under the SourceTree section
- `git/source-tree/ssh-key-setup/content.md` becomes a sibling child item
- `git/source-tree/diff-limits/content.md` becomes another nested child

This keeps the main topic separate from the subtopic area while still representing the tree clearly.
