# Create and switch branches

A branch is a **movable name for a commit**. Branches let people work on independent changes without immediately changing the branch they plan to release. A branch is local unless it is published to a remote.

## Create a feature branch from the current commit

```bash
git switch -c feature/search-filter
```

This creates `feature/search-filter` at the current `HEAD` and switches to it. The short form for switching to an existing branch is:

```bash
git switch main
git switch feature/search-filter
```

Older workflows often use `git checkout -b feature/search-filter` to create and switch, or `git checkout feature/search-filter` to switch. `git checkout` can also restore file contents, so newer Git provides `switch` for branch changes and `restore` for file restoration to make intent clearer.

## List and inspect branches

```bash
git branch                 # local branch names; * marks the current branch
git branch -a              # local and remote-tracking names
git branch -vv             # upstream and ahead/behind hints
git status -sb
```

A feature branch only exists on your computer until you publish it. Later, `git push -u origin feature/search-filter` creates or updates the hosted branch and sets the upstream. See the [remote publishing lesson](/content/tree/git-collaboration/git/remotes/publish-branch).

![Two branch names can point to different commits while sharing earlier history.](git-diagram:head-branches)

## Switch safely when files have edits

Git normally prevents a switch that would overwrite uncommitted changes. Commit the changes, stash them, or use a deliberate restore before switching. Do not reach for `git checkout -f` as a routine fix: force options can discard work in the paths being replaced.

Before switching, check:

```bash
git status
git diff
git diff --cached
```

## References

- [Git `switch`](https://git-scm.com/docs/git-switch)
- [Git `branch`](https://git-scm.com/docs/git-branch)
- [Git `checkout`](https://git-scm.com/docs/git-checkout)

## Questions and answers

<details>
<summary>Does <code>git switch -c feature/login</code> create a branch on GitHub?</summary>

No. It creates a local branch. To publish it, run `git push -u origin feature/login`. The remote branch appears only after that network operation succeeds and is allowed by the host's permissions and policies.
</details>

<details>
<summary>What is the difference between a branch name and a commit hash?</summary>

A branch name is a movable reference that normally advances when you commit. A commit hash identifies one specific commit object. Switching a branch changes which commit your working tree follows; the old commits remain in history unless they later become unreachable and are garbage-collected.
</details>

<details>
<summary>Should I use <code>checkout</code> or <code>switch</code>?</summary>

For changing branches, use `git switch`; for returning a file to a chosen version, use `git restore`. `checkout` remains supported and appears in many older tutorials, but it combines several jobs under one command.
</details>
