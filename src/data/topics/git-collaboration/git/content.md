# Git & Collaboration

Git is a **distributed version-control system**. A repository stores committed snapshots and their history. Every clone has its own local repository. Git commands such as `init`, `add`, `commit`, `branch`, `merge`, `rebase`, and `stash` normally operate on your computer. GitHub, GitLab, and Bitbucket host another repository copy and add collaboration features such as reviews, permissions, and CI.

## Local machine versus hosted repository

| Name or action | Where it happens | What it means |
| --- | --- | --- |
| Working folder and `.git/` | Your computer | Files you edit, plus Git's local database of commits, refs, and configuration. `git init` creates `.git/`. |
| `git add` and `git commit` | Your computer | Choose changes for the next snapshot, then record that snapshot in local history. A commit does **not** upload anything. |
| `origin` | Local configuration alias | A conventional remote name, usually created by `git clone`. It points to a repository URL; it is not a special server or Git command. |
| `origin/main` | Your local repository | A **remote-tracking reference**: your last fetched view of the hosted `main` branch. It can be stale until you fetch. |
| GitHub/GitLab/Bitbucket repository | Hosted service | A repository reached over the network. `push` sends commits; `fetch` downloads objects and updates remote-tracking references. |
| Pull request / merge request | Hosted service | A review request for proposed changes. It is not the same operation as `git pull`. |

> **Rule of thumb:** `commit` saves history locally; `push` publishes commits to a remote. `fetch` downloads remote history without integrating it into your checked-out branch. `pull` fetches and then integrates by merge or, when requested/configured, rebase.

![Git moves from working files to staged changes to local commits; fetch and push connect the local repository to a hosted remote.](git-diagram:overview)

## Expand the Git lessons

### Foundations

- **[Create or clone a repository](/content/tree/git-collaboration/git/foundations/init-clone)** — what `git init` creates, what cloning downloads, and how local identity works.
- **[Working tree, staging, and commits](/content/tree/git-collaboration/git/foundations/staging-commits)** — `status`, `add` one or many files, inspect diffs, and commit with `-m` or `-F`.
- **[HEAD, refs, and commit hashes](/content/tree/git-collaboration/git/foundations/head-refs)** — branches, `HEAD`, full/short commit IDs, and safely checking out an old commit.

### Branching and history

- **[Create and switch branches](/content/tree/git-collaboration/git/branching/branch-switch)** — branch names, `switch`, and the older `checkout` forms.
- **[Merge and resolve conflicts](/content/tree/git-collaboration/git/branching/merge-conflicts)** — merge commits, fast-forwarding, conflict markers, and how to choose the correct combined result.
- **[Rebase](/content/tree/git-collaboration/git/branching/rebase)** — replay commits onto a new base and understand the rewritten IDs.
- **[Cherry-pick](/content/tree/git-collaboration/git/branching/cherry-pick)** — copy one selected change as a new commit.

### Remote collaboration

- **[Fetch, pull, and push](/content/tree/git-collaboration/git/remotes/fetch-pull-push)** — what network commands download, integrate, and publish.
- **[Publish a branch and set upstream](/content/tree/git-collaboration/git/remotes/publish-branch)** — push a new local feature branch and track its remote counterpart.
- **[Force push safely](/content/tree/git-collaboration/git/remotes/force-push)** — why rewritten history may need a force update and why `--force-with-lease` is safer.

### Stash, patches, and recovery

- **[Stash local work](/content/tree/git-collaboration/git/recovery/stash)** — save, inspect, apply, pop, export/import, and restore a single stashed file.
- **[Create and apply patches](/content/tree/git-collaboration/git/recovery/patches)** — make a patch, test it, apply/reverse it, and check whitespace.
- **[Undo safely: restore, reset, revert](/content/tree/git-collaboration/git/recovery/undo-reset-revert)** — select the right undo operation for the change's state.
- **[Conflict recovery and bisect](/content/tree/git-collaboration/git/recovery/debugging)** — continue or abort an interrupted operation, inspect history, and find a breaking commit.

Every lesson includes a diagram, copyable command examples, notes on whether a command changes local or hosted data, and expandable questions with answers.

## Practice with an open-source visualizer

In **Build → Tools → Git**, this branch adds a link to [Learn Git Branching](https://learngitbranching.js.org/). It is an open-source browser-based Git simulator: commands change a visible commit graph and interactive lessons teach branching and remote concepts. The sandbox is simulated; it does not read or modify your local repository or publish to your GitHub, GitLab, or Bitbucket account. Use it to visualize commands, then use the terminal examples here in a real repository.

## References

- [Git official cheat sheet](https://git-scm.com/cheat-sheet/) — commands grouped by common tasks.
- [GitHub Education Git cheat sheet (PDF)](https://education.github.com/git-cheat-sheet-education.pdf) — quick command reference.
- [Atlassian Git cheat sheet](https://www.atlassian.com/git/tutorials/atlassian-git-cheatsheet) — workflow-oriented command overview.
- [Git documentation](https://git-scm.com/docs) — official reference for individual commands.
- [Learn Git Branching source repository](https://github.com/pcottle/learnGitBranching) — visual simulator, tutorial, and source code.

## Questions and answers

<details>
<summary>What is the difference between a local branch and <code>origin/main</code>?</summary>

A local branch such as `main` is a reference in your repository that advances as you commit. `origin/main` is a local remote-tracking reference that records the last fetched state of the hosted branch. Fetch to refresh it; neither reference is the live hosted branch itself.
</details>

<details>
<summary>Which Git commands in this guide contact the hosted repository?</summary>

`clone`, `fetch`, `pull`, and `push` use a remote URL and network access. `init`, `status`, `add`, `commit`, `switch`, `merge`, `rebase`, `cherry-pick`, `stash`, and ordinary `log` inspection operate on the local repository. A pull request or merge request is created through the hosting service or its API.
</details>

<details>
<summary>Can I safely practice these commands in the open-source visualizer?</summary>

Yes, for learning the simulated command behavior and visual commit graph. The browser sandbox does not touch your local files or remote account. Use a throwaway local repository when you need to practice actual Git file operations.
</details>
