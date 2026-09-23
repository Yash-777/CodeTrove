# Documentation tree architecture

The documentation UI is filesystem-driven:

```text
src/data/topics/**/*.md
          ↓ import.meta.glob
src/data/topics/discovery.js
          ↓ normalized TopicNode tree
src/data/topics/index.js
          ↓
Sidebar / routes / document viewer
```

## Content conventions

A Markdown file creates a topic automatically:

```text
src/data/topics/javascript/async-generator/content.md
src/data/topics/javascript/async-generator/next/content.md
```

The second path becomes a child of the first. Optional frontmatter controls presentation without duplicating content metadata:

```md
---
title: AsyncGenerator.next
order: 10
description: Returns the next async generator result.
---
```

Git SourceTree content uses the same model:

```text
src/data/topics/git/source-tree/getting-started/content.md
src/data/topics/git/source-tree/getting-started/clone-repository/content.md
```

Topic counts are calculated only from actual discovered child nodes. No visual or fake counts are stored in React components.
