# Force-push and shared history

Normally, Git refuses a push that would move a remote branch backward or replace commits the local branch does not contain. This **non-fast-forward** check protects commits already on the hosted branch.

A history rewrite such as rebasing published commits or amending a commit can give those changes new IDs. The local and remote branches then diverge, so a normal push may be rejected. If the branch is yours and the team workflow explicitly permits rewriting it, use the safer compare-before-replace form:

```bash
git fetch origin
git log --oneline --graph --decorate --all -15
git push --force-with-lease origin feature/search
```

`--force-with-lease` asks Git to update the remote only if its current reference still matches the expected remote-tracking value you observed. It helps avoid overwriting a teammate's intervening push. It does **not** make force-push harmless: a stale or updated tracking ref can still make an unexpected overwrite possible, and branch protections may reject it.

![A normal push refuses to erase unseen remote commits; force-with-lease checks that the remote tip has not changed from the expected value.](git-diagram:force-push)

## When not to force-push

Do not force-push shared branches such as `main`, release branches, or a teammate's work unless an authorized workflow explicitly requires it. Prefer merge or a follow-up revert commit on published shared history. If anyone may have based work on the branch, coordinate, identify the exact remote branch, fetch first, and explain the impact before rewriting it.

Avoid plain `git push --force` when `--force-with-lease` is available. Plain force tells Git to overwrite the remote ref without the safety comparison.

## References

- [Git `push` — `--force-with-lease`](https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-lease)
- [Atlassian: force-pushing](https://www.atlassian.com/git/tutorials/rewriting-history)

## Questions and answers

<details>
<summary>Why would a force push be needed after a rebase?</summary>

Rebase creates new commit IDs. The hosted branch still points to the old history, so the rewritten local branch may not be a fast-forward from that remote tip. On a private feature branch where rewriting is allowed, a force update can replace the old tip with the new history.
</details>

<details>
<summary>Does <code>--force-with-lease</code> guarantee nobody loses work?</summary>

No. It checks that the remote ref matches the expected value available to Git. Fetching in the background can update remote-tracking refs, and team policies or unusual workflows can complicate the expectation. Inspect the remote graph and coordinate before rewriting published history.
</details>

<details>
<summary>Should I force-push to fix a mistake on a shared main branch?</summary>

Normally no. Use a corrective commit or `git revert` so the shared history remains intact. Follow the repository's incident and branch-protection policy if a maintainer directs a history rewrite.
</details>
