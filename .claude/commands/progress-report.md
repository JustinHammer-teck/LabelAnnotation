---
allowed-tools: Bash(git:*), Bash(date:*), Read, Write, Edit, Glob, Grep, Task
argument-hint: [description of what you want the report to cover]
description: Generate a progress report with git context and semantic tags
---

# Progress Report Generator

## Input
- Report scope/focus: $ARGUMENTS
- If no scope provided, generate a general project progress report

## Current Context (Raw)
- Current date: !`date "+%Y-%m-%d %H:%M:%S"`
- Current branch: !`git branch --show-current`
- Recent commits (last 10): !`git log --oneline -10`
- Modified files: !`git status --short`
- Uncommitted changes summary: !`git diff --stat HEAD 2>/dev/null || echo "No uncommitted changes"`

## Workflow

1. **Gather Context**
   - Collect git information (branch, commits, modified files)
   - Identify scope from `$ARGUMENTS` or use general project scope

2. **Optimize Context** (via @context-master agent)
   Use the Task tool with `subagent_type: "context-manager"` to optimize the raw context:
   - Remove redundant information (duplicate commit prefixes, noise)
   - Group related commits by feature/type
   - Extract key patterns and themes
   - Structure for fast AI retrieval
   - Apply semantic categorization

3. **Analyze Progress**
   Using the optimized context:
   - Categorize commits by type (feat, fix, refactor, etc.)
   - Identify completed work items
   - Detect in-progress or blocked work
   - Note any risks or issues

4. **Generate Report**
   - Write to `.claude/progress.md` (MUST overwrite existing file)
   - Use semantic tags for AI-optimized retrieval
   - Keep content concise and actionable

## Output Template

Write the following structure to `.claude/progress.md`:

```markdown
# Progress Report

**Date:** {YYYY-MM-DD}
**Branch:** {current branch}
**Scope:** {from $ARGUMENTS or "General Project Progress"}
**Author:** Claude Code

## Summary

{2-3 sentence executive summary of progress}

## Status Overview

| Area | Status | Notes |
|------|--------|-------|
| {area} | [STATUS] | {brief note} |

## Key Accomplishments

- [COMPLETE] {completed item with commit reference}
- [COMPLETE] {completed item}

## Current Work

- [IN-PROGRESS] {active work item}
- [TODO] {planned but not started}

## Blockers & Risks

- [BLOCKED] {blocked item and reason}
- [RISK] {potential issue}

## Next Steps

- [ACTION] {prioritized next action}
- [ACTION] {next action}

## Metrics

- Commits this session: {count}
- Files modified: {count}
- Lines changed: +{added} / -{removed}
```

## Semantic Tags Reference

| Tag | Use For |
|-----|---------|
| `[COMPLETE]` | Finished work items |
| `[IN-PROGRESS]` | Currently active work |
| `[TODO]` | Planned but not started |
| `[BLOCKED]` | Blocked by external factors |
| `[RISK]` | Potential issues |
| `[ACTION]` | Required next steps |
| `[STATUS]` | General status indicators |

## Style Rules

- One line per item, start with semantic tag
- Use action verbs: Add, Fix, Remove, Update, Implement
- Include commit hashes where relevant (7 chars)
- No fluff or redundancy
- Quantify progress where possible
- Be specific about blockers and their causes

## Context Optimization Prompt

When invoking the context-manager agent, use this prompt pattern:

```
Optimize the following git context for a progress report on "{scope}":

RAW CONTEXT:
{paste raw git data here}

OPTIMIZE BY:
1. Remove noise (merge commits, trivial changes)
2. Group commits by feature/module
3. Identify: [COMPLETE], [IN-PROGRESS], [BLOCKED] items
4. Extract metrics (commit count, files changed)
5. Flag any risks or blockers

Return structured, concise context ready for report generation.
```

## Examples

**General progress report:**
```
> /progress-report
# Generates report covering all recent activity
```

**Focused report:**
```
> /progress-report authentication module implementation
# Generates report focused on auth-related work
```

**Sprint report:**
```
> /progress-report sprint 5 deliverables
# Generates report on sprint 5 items
```