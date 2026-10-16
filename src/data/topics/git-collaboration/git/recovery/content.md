# Stash, patches, and recovery

Git provides several ways to preserve, transfer, or undo work. They are not interchangeable:

- A **stash** saves temporary local changes for later application.
- A **patch** describes file changes that another worktree can check and apply.
- **Restore**, **reset**, and **revert** act on different states and have different risks.
- Conflict recovery finishes or aborts an operation already in progress.
- `git bisect` narrows down which commit introduced a failing result.

Read [stash local work](/content/tree/git-collaboration/git/recovery/stash), [create and apply patches](/content/tree/git-collaboration/git/recovery/patches), [undo safely](/content/tree/git-collaboration/git/recovery/undo-reset-revert), and [conflict recovery and bisect](/content/tree/git-collaboration/git/recovery/debugging). Review `git status` before and after any recovery operation.

![A local stash can be reapplied; a patch transfers a diff; reset and revert have different history effects.](git-diagram:recovery)

## Questions and answers

<details>
<summary>Should I use stash as long-term backup?</summary>

Usually not. Stashes are local and can be forgotten or cleared. For work you need to preserve or share, make a WIP commit on a branch, push that branch if appropriate, or create a patch and store it safely.
</details>

<details>
<summary>Can one command safely undo every kind of Git change?</summary>

No. Unstaged edits, staged changes, local commits, and published commits require different handling. Inspect the state first and choose the operation based on what you want to preserve.
</details>