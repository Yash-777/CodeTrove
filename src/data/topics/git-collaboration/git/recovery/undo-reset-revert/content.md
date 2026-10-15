# Undo safely: restore, reset, and revert

Pick an undo command based on **where the change is**: unstaged in the working tree, staged in the index, or already committed. Check `git status`, `git diff`, and `git diff --cached` before changing anything. If the work matters, make a backup branch or copy first.

## Discard an unstaged edit to one file

```bash
git restore --worktree -- src/config.yml
```

This replaces that working-tree file with the index version. It discards its unstaged edits. Do not run it if you need those edits.

## Unstage a file but keep its edits

```bash
git restore --staged -- src/config.yml
```

This moves the index version back to `HEAD` while leaving the working-tree edits in place.

## Move the current branch tip with reset

```bash
git reset --soft HEAD~1    # move branch; keep changes staged
git reset --mixed HEAD~1   # default; move branch; keep changes unstaged
git reset --hard HEAD~1    # move branch and overwrite tracked working files
```

`--hard` can discard staged and unstaged tracked changes. It is destructive and does not mean “undo safely.” Untracked files are not generally removed by reset-hard, but do not rely on that as a protection. Never run `git clean -fd` casually; it deletes untracked files.

## Revert an already shared commit

```bash
git revert a1b2c3d
```

Revert creates a new commit that applies the inverse of a chosen commit. It is usually the safer way to undo a change that has already been pushed to a shared branch because it preserves the existing history. Reverting a merge commit requires choosing a mainline parent (`-m`) and can affect future merges; inspect the merge carefully before proceeding.

| Situation | Typical command |
| --- | --- |
| Discard unstaged edit to one file | `git restore --worktree -- file` |
| Unstage a file but keep edits | `git restore --staged -- file` |
| Move local branch while keeping content | `git reset --soft` or `--mixed` |
| Undo a published commit without rewriting history | `git revert <commit>` |

## References

- [Git `restore`](https://git-scm.com/docs/git-restore)
- [Git `reset`](https://git-scm.com/docs/git-reset)
- [Git `revert`](https://git-scm.com/docs/git-revert)

## Questions and answers

<details>
<summary>Which command should I use to undo a commit already pushed to a shared branch?</summary>

Usually `git revert <commit>`, because it adds a new inverse commit without changing the published commit history. Follow team policy, especially for merge commits or release branches.
</details>

<details>
<summary>What does <code>git reset --hard</code> destroy?</summary>

It moves the current branch and index to the target commit and replaces tracked working-tree files to match it. Staged and unstaged tracked changes can be lost. Confirm `git status` and preserve important work before using it.
</details>

<details>
<summary>Does <code>git restore --staged file</code> delete my edits?</summary>

No. It removes the file from the staging area while leaving its working-tree edits. By contrast, `git restore --worktree file` replaces the working-tree version with the index version and discards unstaged edits for that path.
</details>
