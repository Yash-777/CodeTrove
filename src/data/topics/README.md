# Topic content architecture

CodeTrove uses a metadata-first content model. JavaScript metadata, Git metadata, and markdown are intentionally separate so content can grow without changing React components.

## Supported content roots

```text
src/data/topics/{category}/{slug}/content.md
src/data/topics/sub-topics/{category}/{slug}/content.md
src/data/topics/git/source-tree/{slug}/content.md
```

`contentRoot` in a topic descriptor selects the second or third form. Existing topic descriptors default to the first form, preserving backwards compatibility.

## Adding a topic

1. Add a descriptor to the category module (`javascript.js`, `git.js`, etc.).
2. Add its `content.md` at the matching path.
3. Use `subtopics` for children and `parentSlug` for dedicated content groups.
4. Keep slugs lowercase and URL-safe.

This makes sidebar, category pages, routing, and markdown loading read one consistent model.
