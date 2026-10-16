# Remote collaboration

A **remote** is a named URL for another Git repository. It may be hosted by GitHub, GitLab, Bitbucket, a company server, or another developer's machine. The name `origin` is conventional, not mandatory. `git remote -v` shows the configured fetch and push URLs.

Git uses remote-tracking references such as `origin/main` to remember the last fetched state of a remote branch. These references are local snapshots; they do not update just because a teammate pushed. Fetching connects to the host and updates them.

![Fetch updates local remote-tracking refs. Pull then integrates; push sends local commits to a remote branch.](git-diagram:remote-flow)

Learn each workflow:

- [Fetch, pull, and push](/content/tree/git-collaboration/git/remotes/fetch-pull-push)
- [Publish a feature branch and set upstream](/content/tree/git-collaboration/git/remotes/publish-branch)
- [Force-push safely after rewriting history](/content/tree/git-collaboration/git/remotes/force-push)

The hosted service is more than a bare Git remote: it may provide permissions, protected branches, merge requests, CI, issues, and review. Git's `fetch` and `push` transfer repository data; opening a review request is a separate host feature.

## Questions and answers

<details>
<summary>Does <code>origin/main</code> automatically show the latest server-side main branch?</summary>

No. It is your local remote-tracking reference, updated when you fetch (or when a command such as pull performs a fetch). Until then, it shows the last state your local repository learned about.
</details>

<details>
<summary>Is a pull request the same thing as <code>git pull</code>?</summary>

No. A pull request or merge request is a hosted review workflow asking that changes be reviewed and integrated. `git pull` is a local Git command that fetches from a configured remote and integrates the selected remote branch into your current local branch.
</details>