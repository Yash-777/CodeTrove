# Create or clone a repository

A **repository** is the project history and metadata Git manages. A folder becomes a local Git repository when `git init` creates a hidden `.git` directory inside it. The project files remain ordinary files in the working tree; Git's object database, references, index, and configuration live under `.git/`.

## Start a repository locally

```bash
mkdir demo-app
cd demo-app
git init
```

Git prints the location of the new repository. On modern Git, the initial branch name may be `master` or be configured as `main`. You can set a preferred default with:

```bash
git config --global init.defaultBranch main
```

The `--global` option configures your user account on this computer. To configure only the current repository, omit `--global`.

Check the result:

```bash
git status
git rev-parse --show-toplevel
git rev-parse --git-dir
```

`git status` may say there are no commits yet. That is expected: `git init` creates repository metadata but does not automatically snapshot the files or publish them anywhere.

## Clone an existing hosted repository

```bash
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
git remote -v
```

`clone` creates a new local directory, downloads the repository's reachable history and files, checks out the default branch, and normally configures a remote named `origin`. The alias `origin` points to the URL shown by `git remote -v`; you can rename it or add other remotes. It is a local name, not the server itself.

```text
Your computer                                  Hosted service
┌─────────────────────────────┐                ┌──────────────────────┐
│ project files + .git/       │  HTTPS or SSH  │ GitHub / GitLab /    │
│ local commits and branches  │ ◄────────────► │ Bitbucket repository │
└─────────────────────────────┘                └──────────────────────┘
```

![A local repository and hosted remote are separate repository copies connected over the network.](git-diagram:local-remote)

## Configure commit identity

Each commit records author and committer names and email addresses. Set identity once for your user account, or use repository-only settings when work requires a different identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --local user.name "Work Identity"
git config --local user.email "you@company.example"
git config --show-origin --get-regexp '^user\.'
```

Repository-local configuration takes precedence over global values. Identity is descriptive commit metadata. Authentication to a hosted service is separate and uses its configured credential helper, SSH key, browser flow, or token.

## What happens locally and remotely?

| Command | Effect |
| --- | --- |
| `git init` | Creates repository metadata locally. |
| `git clone URL` | Downloads a hosted repository to a new local directory and sets up `origin`. |
| `git remote add origin URL` | Stores a remote URL in local configuration; it does not create the hosted repository. |
| `git commit` | Creates a local commit. It does not send it to the server. |
| `git push` | Connects to the remote and attempts to update a hosted reference with local commits. |

If you create an empty project on GitHub first and have a local repository already, connect it and publish a branch with:

```bash
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

Replace `main` if your local branch has another name. `-u` records the upstream relationship for later `git push` and `git pull` commands.

## References

- [Git `init`](https://git-scm.com/docs/git-init)
- [Git `clone`](https://git-scm.com/docs/git-clone)
- [Git `remote`](https://git-scm.com/docs/git-remote)
- [Git configuration](https://git-scm.com/docs/git-config)

## Questions and answers

<details>
<summary>Does <code>git init</code> upload my folder or create a GitHub repository?</summary>

No. It creates the `.git/` repository database on your computer. To host a copy, create or choose a remote repository, configure its URL with `git remote add`, and push a branch. Hosting providers may also let you create the remote repository through their web interface.
</details>

<details>
<summary>Is <code>origin</code> a special server name?</summary>

No. It is a conventional local alias for a remote URL. A clone usually creates the alias automatically, but you may rename it or add another remote such as `upstream`. The hosted service is identified by the URL and credentials, not by the word `origin`.
</details>

<details>
<summary>Are my Git commit identity and GitHub login the same thing?</summary>

No. `user.name` and `user.email` are written into commits. Authentication controls whether you can read from or write to a hosted repository. A commit can be created while offline, even if no GitHub account is configured on the machine.
</details>
