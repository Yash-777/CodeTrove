# Rebase: replay commits onto a new base

`git rebase <new-base>` takes commits that are unique to your current branch and replays their changes on top of another commit. This can produce a linear-looking history, but replayed commits are new commit objects and normally have **different hashes** from the original commits.

Example: `main` has gained two commits since `feature/report` began. Rebase the feature on the fetched main tip:

```bash
git fetch origin
git switch feature/report
git rebase origin/main
```

Before rebase:

```text
A---B---C  main
     \
      D---E  feature/report
```

After rebase, D and E are replayed as new commits D′ and E′:

```text
A---B---C  main
         \
          D′---E′  feature/report
```

![Rebase replays feature commits onto the target branch, producing new commit IDs.](git-diagram:rebase)

## Resolve a rebase conflict

```bash
git status
# edit the conflicted file and remove markers
git add path/to/resolved-file
git rebase --continue
```

Repeat for each conflict. To cancel the in-progress rebase and restore the branch to its pre-rebase position:

```bash
git rebase --abort
```

`git rebase --skip` omits the current commit's patch. Use it only when you intentionally do not want that change.

## Do not casually rewrite shared history

Rebasing unpublished local commits is a common way to update your feature branch. Rebasing commits already used by teammates rewrites shared history. They may have based work on the old commit IDs, so coordinate first. If you have already pushed the branch, publishing rewritten history may require a force update; see the [force-push safety lesson](/content/tree/git-collaboration/git/remotes/force-push).

## References

- [Git `rebase`](https://git-scm.com/docs/git-rebase)
- [Atlassian: Git rebase](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)

## Questions and answers

<details>
<summary>Does rebase move the commits from one branch onto another?</summary>

Conceptually it replays the changes introduced by your branch's commits on a new base. Git creates new commit objects for the replayed commits. The original commits are not mutated, but your branch reference moves to the newly created commits.
</details>

<details>
<summary>Is rebase always better than merge because the graph is linear?</summary>

No. A linear graph can be easier to read, while a merge preserves the integration event and original commit identities. Team policy, review requirements, release workflows, and whether history is already shared should guide the choice.
</details>

<details>
<summary>What should I do if a rebase stops at a conflict?</summary>

Inspect `git status`, resolve the listed files, stage each resolved path, and run `git rebase --continue`. Use `git rebase --abort` if you decide not to proceed. Avoid `--skip` unless that commit's change should be intentionally omitted.
</details>
