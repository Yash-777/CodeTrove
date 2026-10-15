# Cherry-pick one commit

`git cherry-pick <commit>` applies the change introduced by one existing commit to your current branch and records a **new commit**. It is useful when you need one isolated fix without merging every commit from the source branch.

```bash
git switch release/2.x
git cherry-pick a1b2c3d
```

First confirm the destination branch with `git status -sb` and inspect the candidate with `git show a1b2c3d`. The resulting commit usually has a different hash because it has a different parent, even when its file change is identical.

![Cherry-pick transfers one selected change to another line of history as a new commit.](git-diagram:cherry-pick)

## If it conflicts

```bash
git status
# edit the conflicted file; remove markers and preserve the intended behavior
git add path/to/resolved-file
git cherry-pick --continue
```

Cancel the in-progress operation with:

```bash
git cherry-pick --abort
```

`--skip` discards the current commit's change from the sequence. Avoid cherry-picking a range or series without checking which commits are already present; duplicated changes can create confusing history or conflicts.

## Cherry-pick versus merge

- **Cherry-pick** selects commit changes, creating new commits on the destination branch.
- **Merge** integrates the branch history, preserving the relationship between the source and destination lines.

For routine ongoing collaboration, merging or rebasing the branch is usually easier for teammates to understand. Cherry-pick is often a targeted backport or hotfix mechanism.

## References

- [Git `cherry-pick`](https://git-scm.com/docs/git-cherry-pick)
- [Atlassian: Git cherry-pick](https://www.atlassian.com/git/tutorials/cherry-pick)

## Questions and answers

<details>
<summary>Does cherry-pick move the original commit to my current branch?</summary>

No. It applies that commit's change and creates another commit on the current branch. The source branch and its original commit stay where they were.
</details>

<details>
<summary>Why does the cherry-picked commit have a different hash?</summary>

The new commit has a different parent and may have a different author/committer date or message. Commit identity incorporates its contents and metadata, so the hash generally changes even when the patch is equivalent.
</details>

<details>
<summary>Should I cherry-pick every commit from a teammate's feature branch?</summary>

Usually not. If you need the branch as a whole, merge or rebase it so the relationship is represented coherently. Cherry-pick is most useful for a small, deliberately selected change such as a release fix.
</details>
