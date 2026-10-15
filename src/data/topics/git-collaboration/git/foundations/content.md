# Git foundations

These lessons establish the mental model used by every later Git command. Git keeps a repository on your computer, records snapshots as commits, and uses references such as branch names and `HEAD` to identify the current history position. A hosted remote is another repository copy; it is not where ordinary `git add` or `git commit` operate.

Start with [creating or cloning a repository](/content/tree/git-collaboration/git/foundations/init-clone), then learn [working tree, staging, and commits](/content/tree/git-collaboration/git/foundations/staging-commits). Finish by understanding [HEAD, refs, and commit hashes](/content/tree/git-collaboration/git/foundations/head-refs).

![Local file changes become staged content and a local commit. Network commands are a separate step.](git-diagram:lifecycle)

## Questions and answers

<details>
<summary>What is the first thing to check before running a Git command in an unfamiliar folder?</summary>

Run `git status` and `git rev-parse --show-toplevel`. The first shows the repository state; the second identifies the root directory Git considers part of the repository. This helps avoid accidentally staging files from the wrong project.
</details>

<details>
<summary>Which commands in this section contact GitHub, GitLab, or Bitbucket?</summary>

`git init`, `git add`, `git commit`, `git log`, and local branch inspection work on local repository data. `git clone`, `git fetch`, `git pull`, and `git push` use a remote URL and network access. Hosted pull-request creation is performed in the hosting service or its API.
</details>