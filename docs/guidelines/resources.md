# Resources — GitHub CLI Cheat Sheet

Local reference for common `gh` commands. No external links.

## Pull Requests

```bash
gh pr create --title "title" --body "body"   # Create PR
gh pr list                                    # List open PRs
gh pr view <number>                           # View PR details
gh pr checkout <number>                       # Checkout a PR
gh pr merge <number> --squash                 # Merge PR (squash)
gh pr close <number>                          # Close PR without merging
gh pr review <number> --approve               # Approve PR
gh pr review <number> --request-changes -b "reason"  # Request changes
gh pr diff <number>                           # View PR diff
```

## Issues

```bash
gh issue create --title "title" --body "body"  # Create issue
gh issue list                                   # List open issues
gh issue view <number>                          # View issue details
gh issue close <number>                         # Close issue
gh issue comment <number> --body "comment"      # Comment on issue
gh issue edit <number> --add-label "bug"        # Edit labels
```

## Repository

```bash
gh repo view                        # View current repo info
gh repo clone <owner>/<repo>        # Clone repo
gh repo fork                        # Fork current repo
gh repo create <name> --public      # Create new repo
```

## Releases

```bash
gh release create v1.0.0 --title "v1.0.0" --notes "notes"  # Create release
gh release list                                               # List releases
gh release view v1.0.0                                        # View release
gh release upload v1.0.0 ./dist/*.zip                        # Upload assets
```

## Workflows (GitHub Actions)

```bash
gh workflow list                              # List workflows
gh workflow run <workflow-name>               # Trigger workflow manually
gh run list                                   # List recent runs
gh run view <run-id>                          # View run details
gh run watch <run-id>                         # Follow run in real time
```

## Utilities

```bash
gh auth status                    # Check authentication
gh api /repos/:owner/:repo        # Direct GitHub API call
gh browse                         # Open repo in browser
gh gist create <file>             # Create gist
```
