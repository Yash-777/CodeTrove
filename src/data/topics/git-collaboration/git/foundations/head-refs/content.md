# HEAD, branch references, and commit hashes

A **commit** is an immutable history object containing a snapshot, parent commit reference(s), author/committer metadata, and a message. Git identifies it by a hash. Most repositories use SHA-1 object IDs; repositories created with SHA-256 object format use SHA-256 IDs. A short ID such as `a1b2c3d` is convenient, but Git may require more characters if that prefix is ambiguous.

A **branch** is a movable reference to a commit. When you commit on a branch, that branch reference advances. `HEAD` tells Git what you currently have checked out. Normally it points to a branch name, which then points to a commit. This is called **attached HEAD**.

![HEAD points to the current branch; each branch name points to a commit, while a commit hash identifies a specific history object.](git-diagram:head-branches)

## Inspect history and references

```bash
git log --oneline --decorate --graph --all
git show --stat a1b2c3d
git rev-parse HEAD
git branch -vv
git show-ref --heads --remotes
```

`HEAD` is a symbolic pointer in the usual case. `HEAD~1` means the first parent of `HEAD`; `HEAD~2` means two first-parent steps back. `HEAD^` is the first parent. These are revision expressions, not literal branch names.

## Inspect an old commit safely

Use `git switch --detach <commit>` to inspect a historical snapshot without moving a branch. Your `HEAD` then points directly to the commit. If you make a commit in detached mode, it is not attached to your named branch; create a branch before committing work you want to keep:

```bash
git switch --detach a1b2c3d
# inspect or run tests
git switch -c rescue-work
```

If you meant to move a branch to an earlier commit, that is a different and potentially destructive operation. Read the undo lesson before using `reset` or `branch -f`.

## Local branch and remote-tracking reference are different

For a tracking branch, `main` is your local branch. `origin/main` is your local record of the remote branch's last fetched position. It does not update continuously while someone else pushes. Run `git fetch origin` to refresh remote-tracking refs.

## References

- [Git `revisions`](https://git-scm.com/docs/gitrevisions)
- [Git `log`](https://git-scm.com/docs/git-log)
- [Git `switch`](https://git-scm.com/docs/git-switch)
- [Git `checkout`](https://git-scm.com/docs/git-checkout)

## Questions and answers

<details>
<summary>Does a commit hash change when I rename the branch?</summary>

No. The branch name is a movable reference. A commit's hash is calculated from its content and metadata, including its parent reference. Renaming a branch changes the reference name, not the commit object.
</details>

<details>
<summary>What does “detached HEAD” mean, and is it an error?</summary>

It means `HEAD` points directly to a commit instead of following a local branch. It is useful for read-only inspection or tests. A commit made there can become hard to find after switching away, so create a branch with `git switch -c name` before keeping new work.
</details>

<details>
<summary>Can I use a short commit hash in a command?</summary>

Usually. Git accepts a unique prefix of an object ID. If two objects share that prefix, Git reports ambiguity and you need to supply more characters. Copy the ID from `git log --oneline` or `git rev-parse` rather than guessing.
</details>
