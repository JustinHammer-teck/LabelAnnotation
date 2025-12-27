---
allowed-tools: Read, Glob, Task, Agent, TodoWrite, SlashCommand, Bash(ls:*), Edit, Bash(pytest:*), Bash(cd label_studio && pytest:*), Bash(cd web && yarn:test:*), Bash(cd web && yarn:*:unit), Bash(cd web && yarn:*:e2e), Bash(cd web && yarn:*:integration), Bash(cd web && nx:test:*), Bash(cd web && nx:run:*:unit)
argument-hint: [feature-name] or leave empty to auto-detect from progress.md
description: Execute ONE phase of a planned task, then report progress and stop
---

# Single Phase Executor

Executes ONE phase at a time from planning documents, delegates to the assigned agent, reports progress, then STOPS.

## CRITICAL RULES

1. **ONE PHASE ONLY** - Execute only the next pending phase, then stop
2. **NEVER write code yourself** - You are an orchestrator only
3. **ALWAYS delegate** to the agent specified in the phase document
4. **ALWAYS report progress** after phase completion via `/progress-report`
5. **STOP after reporting** - User will run command again for next phase

## Input

- Feature name: $ARGUMENTS
- If no name provided, auto-detect from `.claude/progress.md`

---

## Step 1: Read Current Progress

**ALWAYS start by reading:**
```
Read .claude/progress.md
```

This tells you:
- What feature is being worked on
- Which phases are already complete
- Current blockers or context

---

## Step 2: Determine Feature Name

**If `$ARGUMENTS` provided:** Use that feature name

**If `$ARGUMENTS` empty:**
1. Check progress.md for `Scope:` field or `[IN-PROGRESS]` items
2. List planning directories: `ls .claude/planning/`
3. If one directory, use that
4. If multiple and unclear, ask user to specify

---

## Step 3: Load Planning Documents

1. Read `.claude/planning/{feature-name}/00-overview.md`
2. Identify the Phase Overview table
3. Find the FIRST phase with status `pending`

If no pending phases:
```
All phases complete for "{feature-name}".
Run final verification or start a new task.
```
Then STOP.

---

## Step 4: Execute Single Phase

### 4a. Read Phase Document AND Context Files

Read the phase document and context files (if they exist):

```
# Phase document
Read .claude/planning/{feature-name}/{phase-number}-phase-{name}.md

# Context files (check if context/ directory exists first)
Read .claude/planning/{feature-name}/context/00-shared.md
Read .claude/planning/{feature-name}/context/context-{phase-name}.md
```

**Backward compatibility:** If `context/` directory doesn't exist (older planning documents), proceed without context files. Add a note in output:
```
Note: No context files found. Consider regenerating with /break-task for improved agent performance.
```

### 4b. Update Phase Status
Edit the phase document frontmatter: `status: pending` → `status: in-progress`

### 4c. Delegate to Assigned Agent

Look at `assigned_agent` in frontmatter and use corresponding `subagent_type`:

| Phase `assigned_agent` | Task `subagent_type` |
|------------------------|----------------------|
| `@django-master` | `django-master` |
| `@react-master` | `react-master` |
| `@python-master` | `python-pro` |
| `@code-reviewer` | `code-reviewer` |
| `@devops-master` | `devops-engineer` |
| `@technical-writer` | `technical-writer` |
| `@ux-master` | `ux-master` |

**Delegation prompt:**
```
Execute Phase {N}: {Phase Title} for the "{feature-name}" task.

## CRITICAL: Read Context Files First

BEFORE writing any code, read these files in order:

1. **Shared context** (common patterns, imports, test setup):
   `.claude/planning/{feature-name}/context/00-shared.md`

2. **Phase context** (exact file paths for this phase):
   `.claude/planning/{feature-name}/context/context-{phase-name}.md`

3. **Phase document** (TDD requirements and deliverables):
   `.claude/planning/{feature-name}/{phase-file}.md`

## Why This Order Matters

The context files contain:
- EXACT file paths (no need to explore with `ls` or `Glob`)
- Import statements ready to copy
- Code patterns to follow (5-10 lines each)
- Supplementary files that show related context
- Test mock setup to copy
- Test commands to run

**Do NOT use Bash(ls), Glob, or Grep to discover files.** The context files have everything you need.

## Context from Progress
{paste relevant info from .claude/progress.md}

## Requirements
1. Read all context files BEFORE writing any code
2. Use the exact file paths from context files
3. Follow TDD cycle exactly as documented in phase file
4. Run ALL tests (this phase + previous phases)
5. Report: files modified, test results, any issues

Do NOT skip reading context files. They eliminate the need for file discovery.
```

### 4d. Review Agent Output

Check:
- [ ] All phase tests pass
- [ ] All previous phase tests pass (cumulative)
- [ ] Deliverables completed

### 4e. Code Review Gate

Delegate to code-reviewer:
```
Review Phase {N} implementation for "{feature-name}".

Read: .claude/planning/{feature-name}/{phase-file}.md

Check:
- TDD compliance (tests first?)
- Code quality (follows CLAUDE.md conventions?)
- Security (no vulnerabilities?)
- All tests passing?

Return: APPROVED or CHANGES_REQUESTED with specifics
```

### 4f. Handle Review

**If CHANGES_REQUESTED:**
- Delegate back to implementation agent with feedback
- Repeat review until approved

**If APPROVED:**
- Edit phase document: `status: in-progress` → `status: completed`
- Update overview table to mark phase completed

---

## Step 5: Report Progress and STOP

After phase is complete and approved:

1. Run `/progress-report Phase {N} of {feature-name} completed`

2. Output summary:
```
Phase {N}: {Phase Title} - COMPLETED

Agent used: @{agent-name}
Tests: {pass/fail count}
Review: APPROVED by @code-reviewer

Next phase: {N+1}: {Next Phase Title} (assigned to @{next-agent})

Run `/execute-plan {feature-name}` to continue with next phase.
```

3. **STOP** - Do not automatically proceed to next phase

---

## Example Flow

```
> /execute-plan

Reading .claude/progress.md...
Scope: "user-authentication implementation"
Loading: .claude/planning/user-authentication/00-overview.md

Phase Status:
  01: backend-models     - completed
  02: api-endpoints      - pending  ← NEXT
  03: frontend-types     - pending
  04: ui-components      - pending

Executing Phase 02: api-endpoints
  Assigned agent: @django-master
  Delegating...

[Agent completes implementation]

  Tests: 8 passed, 0 failed
  Code review: APPROVED

Updating phase status to 'completed'...
Generating progress report...

Phase 02: api-endpoints - COMPLETED

Agent used: @django-master
Tests: 8 passed
Review: APPROVED by @code-reviewer

Next phase: 03: frontend-types (assigned to @react-master)

Run `/execute-plan user-authentication` to continue with next phase.
```

---

## Parallel Phase Handling

If the current phase is part of a `parallel_group`:

1. Identify ALL phases in the same parallel group
2. Launch all agents in ONE message (parallel Task calls)
3. Wait for all to complete
4. Review all in sequence
5. Mark all as completed
6. Report progress for the entire parallel group
7. STOP

---

## Enforcement

**NEVER:**
- Execute more than one phase (or one parallel group)
- Write implementation code yourself
- Skip delegation to assigned agent
- Skip code review
- Continue to next phase automatically

**ALWAYS:**
- Read progress.md first
- Delegate to the correct agent
- Wait for review approval
- Update phase status in document
- Call /progress-report
- STOP and wait for user