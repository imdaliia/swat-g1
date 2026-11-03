# Contributing

`master` is protected: nobody can push to it directly. Every change goes through a **branch** and a **pull request**.

This is a short summary, **read the full guide first:** [How to contribute to the GitHub repository](docs/contributing/git-guide.pdf).

## Setup (once)

1. Accept the invitation to the repo (email or GitHub notifications).
2. Configure git:
   ```
   git config --global user.name "Name Surname"
   git config --global user.email "you@example.com"
   git config --global pull.rebase false
   ```
3. Clone the repo, only once:
   ```
   git clone https://github.com/imdaliia/swat-g1.git
   ```

## For every task

```
git checkout master
git pull
git checkout -b yoursurname/what-you-do
```

Work on the files, then:

```
git add <files>
git commit -m "edit: menu colors"
git push -u origin yoursurname/what-you-do
```

Then open the pull request on GitHub (**Compare & pull request**) and send the link in the group chat. If the reviewer asks for changes, fix them on the same branch and `git push` again. Once it's approved and merged, start the next task from the top with a new branch.

## Commit messages
 
Every commit message is `type: what you did`, in English, lowercase, short.
 
| Type | When | Example |
|---|---|---|
| `add` | new files or new content | `add: home page` |
| `edit` | changes to something that already exists | `edit: menu colors` |
| `fix` | something was broken and now works | `fix: menu on mobile` |
| `rm` | removing files or content | `rm: old footer images` |
| `docs` | README, CONTRIBUTING, the guide | `docs: add commit rules` |
 
- One commit is one change. If you did two different things, make two commits.
- The message says **what** changed, not "update", "changes", "final" or "asdf".
- Before `git add .`, run `git status` and check you're not committing files by accident.

## Rules

- Never commit on `master`.
- One task, one branch, one PR.
- Always start a new branch from an updated `master`.
- Never reuse a branch after it's been merged.
- Branch names: `yoursurname/what-you-do`, lowercase, words separated by `-`.
- Never use `--force`.
- When in doubt: do `git status` , then ask in the group chat.

Conflicts, committing on `master` by mistake and everything else are explained in the [full guide](docs/contributing/git-guide.pdf).