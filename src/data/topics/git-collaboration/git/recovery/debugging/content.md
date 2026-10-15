# Conflict recovery and find a breaking commit

A conflict means Git cannot combine changes automatically. The correct next command depends on the operation in progress. First inspect:

```bash
git status
git diff --name-only --diff-filter=U
git diff
```

Open each conflicted file, understand both changes, remove conflict markers, and write the correct combined content. Stage each resolved path with `git add <file>` so Git knows it is resolved.

## Continue or abort the right operation

```bash
git merge --continue          # finish a merge after resolving files
git rebase --continue         # continue replaying commits after a rebase conflict
git cherry-pick --continue    # continue the selected commit after a conflict
git am --continue             # continue applying a mailbox patch after a conflict
```

To stop, use the corresponding operation's `--abort` command, such as `git merge --abort`, `git rebase --abort`, `git cherry-pick --abort`, or `git am --abort`. Check `git status` to determine which operation is in progress. If you are unsure, do not mix `--continue` and `--abort` commands from different operations.

## Understand the history before changing it

```bash
git log --oneline --decorate --graph --all -20
git show --stat a1b2c3d
git diff main...feature/report
```

The graph helps distinguish “my branch is ahead” from “both branches have unique commits.” Review the base commit and changed paths before merging, rebasing, resetting, or applying a patch.

## Find a regression with bisect

If you know a good commit and a later bad commit, Git can use binary search over history:

```bash
git bisect start
git bisect bad                 # current commit fails
git bisect good v1.4.0         # known-good tag
# test the checked-out commit, then tell Git:
git bisect good                # or: git bisect bad
git bisect reset               # return to the original branch
```

Git checks out candidate commits. Do not make normal feature commits during bisect. If the test can be automated, `git bisect run <test-command>` can repeat it; ensure the test returns exit status 0 for good and nonzero for bad.

## References

- [Git `status`](https://git-scm.com/docs/git-status)
- [Git `bisect`](https://git-scm.com/docs/git-bisect)
- [Git merge conflict guidance](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

## Questions and answers

<details>
<summary>Why do conflict markers sometimes say <code>HEAD</code> and sometimes show a branch name?</summary>

Labels depend on the operation and its options. During a merge, `HEAD` commonly identifies the checked-out side and the other label identifies the merged side. During rebase and cherry-pick, the labels can be less intuitive. Use the operation context and `git status`; do not decide based only on the words “ours” or “theirs.”
</details>

<details>
<summary>When should I run <code>git merge --abort</code> versus <code>git rebase --abort</code>?</summary>

Use the abort command for the operation currently in progress. `git status` typically says whether a merge, rebase, cherry-pick, or `am` is underway. The matching abort tries to restore the pre-operation state.
</details>

<details>
<summary>Can <code>git bisect</code> prove which code line caused a bug?</summary>

It identifies a commit boundary between a known-good and known-bad result according to your test. You still need to inspect the commit and verify the test was reliable. If behavior is nondeterministic, environment-dependent, or multiple changes interact, bisect's candidate needs human investigation.
</details>
