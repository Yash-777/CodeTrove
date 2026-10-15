# Merge branches and resolve conflicts

`git merge <branch>` integrates the named branch into the **currently checked-out branch**. Git may fast-forward the current branch when it has no unique commits, or create a merge commit when both histories have advanced. A merge does not normally rewrite the existing commits.

```bash
git switch main
git fetch origin
git merge feature/search-filter
```

The example merges your **local** `feature/search-filter` into your local `main`. If you want the latest hosted `main`, fetch first, then merge `origin/main` instead. Always check which branch is current with `git status -sb` before merging.

![A merge joins two lines of commits and preserves both histories.](git-diagram:merge)

![When both branches change the same line, Git asks the user to resolve the conflict and continue the merge.](git-diagram:conflict)

## Why a conflict happens

Git can combine many edits automatically. A conflict occurs when it cannot determine the intended result, for example when both branches replace the same line differently:

> ```text
> <<<<<<< HEAD
> Title: Local draft
> =======
> Title: Reviewed draft
> >>>>>>> feature/correct-title
> ```

`HEAD` labels the current checked-out side (often called “ours”); the other marker names the incoming side (often called “theirs”). Marker text can vary by operation and options. The middle `=======` separates the two versions. This file is not valid final source until you remove all markers and choose or compose the correct result.

For example, if both changes are useful, the resolved file could be:

```text
Title: Reviewed draft
Subtitle: Reviewed locally
```

Do not blindly pick “ours” or “theirs.” Understand the requirement, retain the intended behavior from both edits if appropriate, and run the relevant tests.

## Complete a merge conflict

```bash
git status                         # list paths needing resolution
# edit each conflicted file; remove markers and make the intended result
git diff                           # review the resolution
git add path/to/resolved-file      # mark that path resolved
git status
git merge --continue               # or git commit if your Git prompts for it
```

If you decide to cancel the merge and return to the state before starting it:

```bash
git merge --abort
```

Check for unrelated edits before beginning. Aborting an operation restores its pre-merge state, including the state of files at merge start; it is not a general undo for arbitrary later work.

## References

- [Git `merge`](https://git-scm.com/docs/git-merge)
- [Git merge conflicts overview](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

## Questions and answers

<details>
<summary>Does Git choose the latest timestamp when the same line changes on both branches?</summary>

No. A conflict is about incompatible edits relative to a merge base, not which edit is newer by wall-clock time. A person must choose the correct final content or combine both changes.
</details>

<details>
<summary>What do <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> and <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> mean?</summary>

They bracket competing versions in a conflicted file. The section after `<<<<<<<` is the current side; the section after `=======` is the incoming side, ending at `>>>>>>>`. Exact labels depend on the operation. Remove every marker after constructing the desired final content, then stage the resolved file.
</details>

<details>
<summary>Can I abort a merge after I have staged a conflict resolution?</summary>

`git merge --abort` attempts to return to the state before the merge began. If you have made important additional edits while resolving, save or review them first. For difficult states, inspect `git status` and a backup copy before aborting.
</details>
