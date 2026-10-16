# Publish a branch and set its upstream

A local branch is not automatically present on GitHub, GitLab, or Bitbucket. To publish a new feature branch and remember which hosted branch it tracks, use `-u` (same as `--set-upstream`):

```bash
git switch -c feature/add-search
git status -sb
git push -u origin feature/add-search
```

The first command creates a branch locally. The final command sends its commits to `origin` and requests the remote branch `feature/add-search` be updated or created. If accepted, Git configures the upstream relationship. Later, plain `git push` and `git pull` can infer the remote and branch.

![A local feature branch is pushed to a new hosted branch, which becomes its upstream tracking branch.](git-diagram:publish-branch)

Inspect the tracking configuration:

```bash
git branch -vv
git status -sb
git remote -v
```

The upstream is normally shown as `origin/feature/add-search`. It is still a local remote-tracking reference for the hosted branch's last fetched state; fetch to refresh it.

## Create a pull request or merge request

After publishing, open the repository on the hosting service and create a pull request (GitHub) or merge request (GitLab/Bitbucket, depending on product). Choose the target base branch (often `main`) and source branch (`feature/add-search`). Review the diff, tests, and required policies. The hosting UI/API creates a collaboration request; `git push` by itself does not create or approve it.

## If the remote branch already exists

Fetch before publishing, and inspect whether your branch is based on the right commits:

```bash
git fetch origin
git branch -vv
git log --oneline --graph --decorate --all -15
git push -u origin feature/add-search
```

If Git reports a non-fast-forward update, integrate the remote branch rather than overwriting it. See [fetch, pull, and push](/content/tree/git-collaboration/git/remotes/fetch-pull-push).

## References

- [Git `push`](https://git-scm.com/docs/git-push)
- [Git `branch`](https://git-scm.com/docs/git-branch)
- [GitHub: creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)

## Questions and answers

<details>
<summary>What does <code>-u</code> do in <code>git push -u origin feature/add-search</code>?</summary>

It sets the upstream tracking relationship for the local branch to the pushed remote branch. This lets later `git push` and `git pull` commands infer their destination/source when configuration permits.
</details>

<details>
<summary>Does pushing a branch open a pull request automatically?</summary>

Usually not. Push publishes commits and a branch. A pull request or merge request is a separate object created through the host UI, CLI, or API. Some hosts show a shortcut after a push, but the review request still needs to be created.
</details>

<details>
<summary>Can a teammate see my unpushed local branch?</summary>

No. Local branch names and commits remain on your computer until you push them to a shared remote or transfer them some other way. A hosted review request also requires a reachable source branch.
</details>
