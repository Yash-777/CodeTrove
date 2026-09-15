/**
 * src/data/topics/git.js
 * ------------------------------------------------------------------
 * Same shape/rules as java.js - see that file's header comment.
 * Covers the "Git" category.
 */

const gitTopics = [
  {
    slug: 'common-commands',
    title: 'Everyday Git commands',
    summary: 'The 90% of Git you use daily, in one place.',
    tags: ['git'],
    gifUrl: null,
    relatedTool: null,
    body: `git status                 -> what changed, what's staged
git add <file>              -> stage a file
git commit -m "message"     -> commit staged changes
git push                    -> upload commits to remote
git pull                    -> download + merge remote changes
git checkout -b <branch>    -> create and switch to a new branch
git log --oneline --graph   -> compact visual history`,
  },
  {
    slug: 'undo-things',
    title: 'Undoing things',
    summary: 'reset vs revert vs checkout - which one to use when.',
    tags: ['git'],
    gifUrl: null,
    relatedTool: null,
    body: `git restore <file>          -> discard uncommitted changes to a file
git commit --amend          -> edit the last commit (message or contents)
git reset --soft HEAD~1     -> undo last commit, keep changes staged
git revert <commit>         -> make a NEW commit that undoes an old one
                                (safe for already-pushed/shared history)`,
  },
  {
    slug: 'branching-strategy',
    title: 'A simple branching strategy',
    summary: 'main + short-lived feature branches - enough for most teams.',
    tags: ['git', 'workflow'],
    gifUrl: null,
    relatedTool: null,
    body: `main                -> always deployable
feature/add-login   -> branch off main, work, open a PR, merge back, delete

git checkout main
git pull
git checkout -b feature/add-login
# ...commits...
git push -u origin feature/add-login
# open a Pull Request, merge when approved
git branch -d feature/add-login`,
  },
];

export default gitTopics;
