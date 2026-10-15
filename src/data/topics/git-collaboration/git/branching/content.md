# Branching

Branches provide separate lines of work. Integration commands decide how those lines come together. **Merge** preserves existing commits and records their relationship. **Rebase** replays local commits on a new base and changes their IDs. **Cherry-pick** applies one selected change as a new commit.

Start with [creating and switching branches](/content/tree/git-collaboration/git/branching/branch-switch). Then learn [merge conflicts](/content/tree/git-collaboration/git/branching/merge-conflicts), [rebase](/content/tree/git-collaboration/git/branching/rebase), and [cherry-pick](/content/tree/git-collaboration/git/branching/cherry-pick). The sidebar groups these pages beneath Git → Branching and History.

![Merge preserves both branch histories, while rebase replays commits and cherry-pick transfers one chosen change.](git-diagram:integration)

## Questions and answers

<details>
<summary>Which operation should a new Git user learn first: merge, rebase, or cherry-pick?</summary>

Learn branch switching and merge first because merge integrates branch histories without rewriting existing commits. Then study rebase for local history cleanup and cherry-pick for deliberately selecting a change. Team rules decide which operation is appropriate on shared branches.
</details>

<details>
<summary>Do merge, rebase, or cherry-pick upload the result to a hosted repository?</summary>

No. Branch creation, merge, rebase, and cherry-pick update your local repository. A later `git push` publishes the resulting commits if the remote accepts the update.
</details>
