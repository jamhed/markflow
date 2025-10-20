# Pull Request Information

## PR Title (Semantic Release Format)

```
refactor: comprehensive TypeScript improvements and dependency updates
```

## How to Create/Update the Pull Request

### Option 1: Using GitHub CLI (Recommended)

If you have GitHub CLI installed and authenticated:

```bash
gh pr create \
  --title "refactor: comprehensive TypeScript improvements and dependency updates" \
  --body-file PR_DESCRIPTION.md \
  --base main
```

Or if the PR already exists, update it:

```bash
gh pr edit <PR_NUMBER> \
  --title "refactor: comprehensive TypeScript improvements and dependency updates" \
  --body-file PR_DESCRIPTION.md
```

### Option 2: Using GitHub Web Interface

1. Visit: https://github.com/jamhed/markflow/pull/new/claude/typescript-refactor-review-011CUK6cwJrwFFTwk7rVDsYY
2. Set the title to: `refactor: comprehensive TypeScript improvements and dependency updates`
3. Copy the contents of `PR_DESCRIPTION.md` into the description field
4. Click "Create pull request"

## Semantic Release Commit Format

This PR follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Messages in This PR:

1. `refactor: comprehensive TypeScript code improvements`
   - Type: `refactor`
   - Scope: Core TypeScript codebase
   - Breaking: No

2. `chore: update all dependencies to latest versions`
   - Type: `chore`
   - Scope: Dependencies
   - Breaking: No (compatible major updates)

### Why This Format?

Semantic release uses commit messages to determine:

- **Version bumping**: What version number to increment
- **Changelog generation**: Automatic changelog from commits
- **Release notes**: Formatted release documentation

### Commit Type Impact on Versioning:

- `fix:` → Patch version bump (0.0.x)
- `feat:` → Minor version bump (0.x.0)
- `BREAKING CHANGE:` or `!` → Major version bump (x.0.0)
- `refactor:`, `chore:`, `docs:`, etc. → No version bump (unless configured)

### Labels to Add (Optional):

- `refactor` - Code refactoring
- `dependencies` - Dependency updates
- `documentation` - Enhanced docs
- `performance` - Performance improvements
- `type-safety` - Type safety improvements

## Files Created for Your Use:

- `PR_DESCRIPTION.md` - Full PR description in Markdown
- `PR_INFO.md` - This file with instructions

You can delete these files after creating the PR.
