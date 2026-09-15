
```
git restore <file>          -> discard uncommitted changes to a file
git commit --amend          -> edit the last commit (message or contents)
git reset --soft HEAD~1     -> undo last commit, keep changes staged
git revert <commit>         -> make a NEW commit that undoes an old one
                                (safe for already-pushed/shared history)
```