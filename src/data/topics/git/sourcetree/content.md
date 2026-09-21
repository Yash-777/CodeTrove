# Sourcetree

Sourcetree is a Git GUI that helps you visualize branches, commits, merges, and pull requests without needing to memorize every command.

## Why teams use it

- easier branch inspection
- visual commit history
- drag-and-drop merge workflows
- a friendlier way to learn Git concepts

## Common Sourcetree flow

1. Clone the repo
2. Create a feature branch
3. Commit changes
4. Push branch to remote
5. Open a pull request
6. Merge and delete the feature branch

## Typical Git actions in Sourcetree

```bash
git checkout main
git pull
git checkout -b feature/my-change
git add .
git commit -m "Add my change"
git push -u origin feature/my-change
```

## Git GUI vs command line

The GUI is great for:
- visualizing history
- resolving conflicts
- reviewing branches quickly

The terminal is still best for:
- scripting
- automation
- advanced git operations

## Best practice

Use Sourcetree as a visual layer on top of Git, not as a replacement for understanding Git fundamentals. Branch naming, commits, rebases, and pull requests still matter the same way they do in the terminal.
