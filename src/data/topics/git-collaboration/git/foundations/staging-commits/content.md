# Working tree, staging, and commits

Git separates edits into three local areas: the **working tree** (files you are editing), the **index** or **staging area** (the exact changes selected for the next commit), and the **commit history** (saved snapshots). Nothing in this workflow reaches a hosted repository until you push.

![The normal snapshot cycle: edit files, stage selected changes, create a local commit, then push when ready.](git-diagram:lifecycle)

## Inspect before you save

```bash
git status
git diff                 # unstaged changes compared with the index
git diff --cached        # staged changes compared with HEAD
git diff --stat
```

Use `git status` before staging and before committing. It shows modified, staged, untracked, and conflicted paths. `git diff` and `git diff --cached` answer different questions, so review both when you have already staged part of your work.

## Stage one file, several files, or everything

```bash
git add README.md                         # one path
git add src/App.jsx src/App.css           # an explicit list
git add src/                             # all changes under a directory
git add -A                               # additions, edits, and deletions throughout the repo
git add -p                               # interactively choose hunks from edited files
```

`git add .` stages changes under the current directory. For a repository-wide snapshot, `git add -A` is explicit about including deletions and files outside the current subdirectory. Inspect `git status` afterward: staging means **selecting** content, not saving it to history.

To unstage a file but keep its edits in the working tree:

```bash
git restore --staged src/App.jsx
```

## Commit the staged snapshot

```bash
git commit -m "Add network diagnostics page"
```

`-m` supplies the commit message directly. For a longer message saved in a file, use:

```bash
git commit -F commit-message.txt
```

The message file is read by Git. The commit contains only the staged contents at commit time. If you edit a file after staging it, stage it again if those later edits should be included.

A good message says what the change does. For example, `Fix DNS record query display` is more useful in history than `changes` or `fixed stuff`.

```text
working tree edits --git add--> index (staged snapshot) --git commit--> local history
                                                                      |
                                                          git push (network)
                                                                      v
                                                          hosted repository
```

## A realistic small change

```bash
# edit README.md and src/App.jsx
git status
git diff
git add README.md
git diff --cached
git add src/App.jsx
git diff --cached
git commit -m "Document the new network route"
git status
```

This stages two named files and creates one commit locally. It does not publish the commit until a later `git push`.

## References

- [Git `status`](https://git-scm.com/docs/git-status)
- [Git `add`](https://git-scm.com/docs/git-add)
- [Git `diff`](https://git-scm.com/docs/git-diff)
- [Git `commit`](https://git-scm.com/docs/git-commit)

## Questions and answers

<details>
<summary>Why does a file show as modified after I ran <code>git add</code>?</summary>

`git add` copies the current content into the index. If you edit the file again afterward, the working-tree version differs from the staged version. `git status` may show that the path has both staged and unstaged changes. Review `git diff --cached` and `git diff`, then stage again if you want the latest edit in the commit.
</details>

<details>
<summary>Does <code>git commit</code> send my changes to GitHub or Bitbucket?</summary>

No. A normal commit records a snapshot and metadata in your local repository. `git push` is the network operation that asks a remote to update a branch with those commits.
</details>

<details>
<summary>What is the difference between <code>git add .</code> and <code>git add -A</code>?</summary>

`git add .` stages paths under the current directory. `git add -A` stages additions, modifications, and removals across the repository, regardless of the current subdirectory. Use `git status` to verify the exact staged set before committing.
</details>
