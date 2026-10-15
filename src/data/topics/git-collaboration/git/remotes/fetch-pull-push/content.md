# Fetch, pull, and push

These commands are where everyday Git work crosses the network boundary. Check `git status -sb` first so you know the current branch and whether local changes are present.

## Fetch: download and update remote-tracking refs

```bash
git fetch origin
git log --oneline --graph --decorate HEAD..origin/main
git diff HEAD..origin/main
```

`git fetch origin` downloads objects and updates local remote-tracking refs such as `origin/main`. It does **not** merge those commits into your checked-out local branch or overwrite your working files. Review what arrived before deciding how to integrate it.

## Pull: fetch, then integrate

```bash
git pull origin main
```

Pull fetches from the remote and then integrates the selected remote branch into your current branch. Depending on options and configuration, integration may use merge or rebase. Make the strategy explicit when you need predictable behavior:

```bash
git pull --rebase origin main
```

This rebases your local-only commits on the fetched remote branch. If there are uncommitted edits, Git may stop to avoid overwriting them. Commit or stash the work first; do not use reset-hard as a routine fix.

## Push: publish local commits

```bash
git push origin main
```

Push asks the server to update the named remote branch with reachable local commits. It can be rejected if the remote has commits you do not have, branch protection forbids the update, credentials lack permission, or required checks fail. Fetch and integrate remote work rather than overwriting it.

| Command | Network action | Local integration | Hosted branch change |
| --- | --- | --- | --- |
| `git fetch origin` | Downloads objects and refs | No merge into current branch | No |
| `git pull origin main` | Fetches remote objects | Yes: merge/rebase according to options/config | No |
| `git push origin main` | Sends local objects/ref update request | No | Yes, if accepted |

![The network round trip distinguishes fetch, pull's integration step, and push publication.](git-diagram:remote-flow)

## A safe update workflow

```bash
git status -sb
git fetch origin
git log --oneline --decorate --graph --all -12
git diff main..origin/main
git switch main
git merge --ff-only origin/main
```

`--ff-only` updates the local branch only if it can advance without creating a merge commit. If it refuses, inspect why local and remote histories diverged instead of forcing the update.

## References

- [Git `fetch`](https://git-scm.com/docs/git-fetch)
- [Git `pull`](https://git-scm.com/docs/git-pull)
- [Git `push`](https://git-scm.com/docs/git-push)

## Questions and answers

<details>
<summary>Does <code>git fetch</code> change my files?</summary>

It downloads commits/objects and updates local remote-tracking refs. It does not integrate the fetched branch into your current branch, so your checked-out project files are not replaced by the fetched changes. Inspect them, then choose merge or rebase when ready.
</details>

<details>
<summary>Can <code>git pull</code> create a merge conflict?</summary>

Yes. Pull integrates fetched changes with your current local branch. If edits overlap incompatibly, Git stops and asks you to resolve conflicts. `git pull --rebase` can also stop for conflicts while replaying local commits.
</details>

<details>
<summary>Why did my push get rejected as non-fast-forward?</summary>

The remote branch has history your local branch does not contain, or the update would discard remote commits. Fetch, inspect the divergence, and integrate the remote changes. Do not use `--force` just to silence the rejection.
</details>
