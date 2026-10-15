# Create, check, apply, and reverse patches

A patch is a file describing changes. It can be used to transfer a work-in-progress change without pushing a branch. A patch is **not** a complete repository snapshot and may fail if its context does not match the recipient's files.

## Create a patch from working-tree changes

```bash
git diff --check
git diff > working-tree.patch
```

That captures unstaged changes to tracked files. To include staged changes instead:

```bash
git diff --cached > staged.patch
```

To make sure a new untracked file is represented in a plain diff, mark it intent-to-add first, then review carefully:

```bash
git add -N path/to/new-file
git diff > feature.patch
```

Alternatively, create a commit and use `git format-patch` when commit author/message metadata should travel with it:

```bash
git format-patch -1 --stdout HEAD > 0001-feature.patch
```

`git format-patch` output is normally applied with `git am`, which creates a commit from the mailbox-style patch. Plain `git diff` output is normally applied with `git apply`, which changes files but does not create a commit.

## Check and apply a plain patch

Run from the repository root on the receiving worktree:

```bash
git apply --check feature.patch
git apply feature.patch
git status
git diff --check
git diff
```

`--check` tests whether the patch applies; it does not change files. `git diff --check` scans the resulting changes for whitespace problems. Review the changed file list and run tests before committing.

## Reverse a patch

If the patch was applied to the intended files and you want to reverse that patch:

```bash
git apply -R feature.patch
git status
git diff
```

`-R` reverses the patch; it is not a general undo command. It can fail if files have changed since the patch was applied. Back up or commit unrelated work before reversing, and do not use `git apply -R` on a patch that was never applied.

## Send a commit with its metadata

```bash
git format-patch -1 HEAD --output-directory ../patches
# recipient, from a clean and appropriate branch:
git am ../patches/0001-*.patch
```

If `git am` encounters a conflict, inspect the files and use `git am --continue` after resolving, or `git am --abort` to stop. For a general binary-capable repository patch, a Git-generated `git diff --binary` patch may be used with `git apply`; ordinary text diffs may not represent binary changes.

![A plain diff patch changes files without creating a commit; a format-patch plus git am recreates a commit.](git-diagram:patch)

## References

- [Git `apply`](https://git-scm.com/docs/git-apply)
- [Git `diff`](https://git-scm.com/docs/git-diff)
- [Git `format-patch`](https://git-scm.com/docs/git-format-patch)
- [Git `am`](https://git-scm.com/docs/git-am)

## Questions and answers

<details>
<summary>Does <code>git apply</code> create a commit?</summary>

No. It applies patch content to the working tree. Review and stage the changes, then commit if desired. `git am` is designed for `git format-patch` output and creates a commit using the patch's author and message metadata.
</details>

<details>
<summary>What is the difference between <code>git apply --check</code> and <code>git diff --check</code>?</summary>

`git apply --check patch` tests whether an incoming patch applies cleanly without applying it. `git diff --check` scans the changes currently in your working tree or index for whitespace errors such as trailing spaces.
</details>

<details>
<summary>Can I safely run <code>git apply -R</code> to undo any change?</summary>

No. It reverses the specified patch if the current files still match its expected context. It does not roll back unrelated edits or commits. Use it only when you know that exact patch was applied and inspect the result afterward.
</details>
