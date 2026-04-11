Stage all changes, write a commit message based on the diff, commit, and push to the current branch.

Steps:
1. Run `git status` and `git diff` to understand what changed
2. Run `git log -5 --oneline` to match the existing commit message style
3. Stage all changes with `git add -A`
4. Write a concise commit message that captures *why* the changes were made (not just what)
5. Commit with that message (include the Co-Authored-By trailer per the standard commit instructions)
6. Push to the current branch with `git push`

If there is nothing to commit, say so and stop.
