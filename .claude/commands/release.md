---
allowed-tools: Bash(git:*), Bash(ls:*), Bash(cat:*), Bash(date:*), Read, Write, Edit, Glob
argument-hint: [version] or leave empty to auto-detect
description: Generate release notes following semantic versioning
---

# Release Note Generator

## Input
- User-specified version: $ARGUMENTS
- If no version provided, analyze commits to determine release type

## Current State
- Current date: !`date "+%Y-%m-%d"`
- Existing releases: !`ls -1 releases/release-v*.md 2>/dev/null | sort -V | tail -5 || echo "No releases found"`
- Latest release: !`ls -1 releases/release-v*.md 2>/dev/null | sort -V | tail -1 || echo "None"`
- Latest git tag: !`git describe --tags --abbrev=0 2>/dev/null || echo "No tags found"`
- Recent commits (last 15): !`git log --oneline -15`

## Version Detection Rules (when no version specified)

Analyze commit messages for:

| Pattern | Version Bump | Example Commits |
|---------|--------------|-----------------|
| `BREAKING CHANGE:`, `!:` in type | MAJOR (X.0.0) | `feat!: remove deprecated API` |
| `feat:`, `feature:` | MINOR (1.X.0) | `feat: add OAuth support` |
| `fix:`, `bugfix:`, `hotfix:` | PATCH (1.0.X) | `fix: resolve memory leak` |

If mixed: prioritize MAJOR > MINOR > PATCH

## Workflow

1. **Parse version argument or detect from commits**
   - If `$ARGUMENTS` provided → use that version directly
   - If empty → analyze commits and calculate next version

2. **Calculate new version**
   - Extract current version from latest release filename
   - Apply versioning rules:
     - MAJOR: increment major, reset minor.patch → `vX.0.0`
     - MINOR: increment minor, reset patch → `v1.X.0`  
     - PATCH: increment patch → `v1.0.X`

3. **Generate release note**
   - Create file: `releases/release-v{X}.{Y}.{Z}.md`
   - Keep content concise but complete

## Output Template

```markdown
# Release v{X}.{Y}.{Z}

**Date:** {YYYY-MM-DD}
**Type:** Feature | Bug Fix | Breaking Change

## Changes
- {action verb} {concise description}

## Commits
- `{short_hash}` {commit message}
- `{short_hash}` {commit message}
```

## Style Rules

- One line per change
- Start with action verbs: Add, Fix, Remove, Update, Refactor
- No fluff or redundancy
- Include migration notes only for MAJOR releases
- **Always list all commit hashes** related to this release under "## Commits" section
- Format commits as: `- \`{7-char hash}\` {commit message}`

## Examples

**Auto-detect from commits:**
```
> /release
# Analyzes commits, determines type, generates release-v1.2.0.md
```

**Explicit version:**
```
> /release 2.0.0
# Creates releases/release-v2.0.0.md directly
```

**Example output:**
```markdown
# Release v1.2.0

**Date:** 2025-01-15
**Type:** Feature

## Changes
- Add user authentication via OAuth2
- Add rate limiting middleware

## Commits
- `a1b2c3d` feat: add OAuth2 authentication flow
- `e4f5g6h` feat: implement rate limiting middleware
- `i7j8k9l` test: add auth integration tests
```
