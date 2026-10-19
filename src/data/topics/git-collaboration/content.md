# Git & Collaboration

Git lets developers record project history, work on isolated branches, and exchange commits with one or more shared repositories. Most commands change only the **local repository on your computer**. Network commands such as `fetch`, `pull`, and `push` communicate with a remote hosted on GitHub, GitLab, Bitbucket, or another Git server.

## Start with Git

Open **Git & Collaboration → Git** in the Learn navigation for the full expandable lesson tree. It begins with repository setup, staging, commits, `HEAD`, branch names, and commit IDs. Later groups explain branch integration, remote collaboration, stash, patches, undo, conflicts, and debugging.

The most commonly used legacy Git lessons are now direct pages under this section:

- [Common Git Commands](/content/tree/git-collaboration/common-commands)
- [Undo Git Changes](/content/tree/git-collaboration/undo-things)
- [Branching Strategy](/content/tree/git-collaboration/branching-strategy)

SourceTree and the GitHub Secrets service-account guide remain separate sessions under **Git & Collaboration → Git**, so they can be opened independently:

- [SourceTree](/content/tree/git-collaboration/git/sourcetree)
- [Service Account from GitHub Secrets](/content/tree/git-collaboration/git/service-account-from-github-secrets)

![Git records local snapshots and communicates with hosted repositories only during remote operations.](git-diagram:overview)

| Work on your computer | Communicate with the host |
| --- | --- |
| `git init`, `git status`, `git add`, `git commit` | `git clone`, `git fetch`, `git pull`, `git push` |
| Create and switch local branches | Publish local branches to remote refs |
| Merge, rebase, cherry-pick local history | Review a pull/merge request in the host's service |

A hosted pull request (GitHub) or merge request (GitLab/Bitbucket) is a review workflow. It is distinct from the local `git pull` command. The detailed [Git guide](/content/tree/git-collaboration/git) provides the exact workflows and command examples.

## Open-source flow practice

For a visual, interactive sandbox, use **Build → Tools → Git → Learn Git Branching**. It visualizes simulated commit graphs and teaches commands with challenges. It does not access your local files or your hosted account.

## References

- [Official Git cheat sheet](https://git-scm.com/cheat-sheet/)
- [GitHub Education Git cheat sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Atlassian Git cheat sheet](https://www.atlassian.com/git/tutorials/atlassian-git-cheatsheet)
- [Learn Git Branching open-source project](https://github.com/pcottle/learnGitBranching)

## Questions and answers

<details>
<summary>Does saving a Git commit automatically back it up to GitHub?</summary>

No. A commit is created in the local repository. To publish it to a hosted repository, push the branch using a configured remote and valid permission. A local-only commit can be lost if the local repository is deleted before it is pushed or otherwise backed up.
</details>

<details>
<summary>Is GitHub required to use Git?</summary>

No. Git works locally without GitHub or any network connection. GitHub, GitLab, and Bitbucket are hosting and collaboration services that can store shared repositories and add review, access-control, issue, and automation features.
</details>
