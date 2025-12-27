---
allowed-tools: Bash(git:*), Bash(ls:*), Bash(date:*), Bash(mkdir .claude/planning/*), Bash(rm -rf .claude/planning/*), Bash(mv .claude/planning/*), Bash(cp .claude/planning/*), Read, Write, Edit, Glob, Grep, Task
argument-hint: [task description, e.g., "Add user authentication"]
description: Decompose a task into TDD-driven phases with agent assignments
---

# Task Breakdown Generator

Decomposes a task into TDD-driven phases using @knowledge-master, @context-master, @planning-orchestrator, and @agent-organizer. Generates planning documents in `.claude/planning/{feature-name}/`.

## Input

- Task description: $ARGUMENTS
- If no description provided, respond with usage guidance

## Current Context (Raw)

- Current date: !`date "+%Y-%m-%d %H:%M:%S"`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

---

## Workflow

### Step 1: Validate Input

If `$ARGUMENTS` is empty, respond with:

```
Usage: /break-task <task description>

Examples:
  /break-task Add user authentication to aviation module
  /break-task Fix label sync bug in editor
  /break-task Implement export functionality for annotations
```

Do NOT proceed if no task description is provided.

### Step 2: Generate Feature Name

Convert the task description to a kebab-case feature name:

1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters (keep only alphanumeric and hyphens)
4. Truncate at 50 characters maximum
5. Remove leading/trailing hyphens

Examples:
- "Add User Authentication" → `user-authentication`
- "Fix aviation label sync bug" → `fix-aviation-label-sync-bug`
- "Implement dark mode UI" → `implement-dark-mode-ui`

### Step 3: Context Acquisition (via @context-master)

Use the Task tool with `subagent_type: "context-manager"` to analyze the codebase:

**Prompt:**
```
Analyze this task for context: "$ARGUMENTS"

Examine the codebase and return STRUCTURED context with EXACT file paths (not patterns).

## 1. Domain Classification
- `frontend` | `backend` | `full-stack`
- Primary module path(s)

## 2. Affected Modules (with CLAUDE.md references)
- List each module that will be modified
- Include path to relevant CLAUDE.md file
- Extract 3-5 most relevant sections from each CLAUDE.md

## 3. File Inventory (EXACT ABSOLUTE PATHS REQUIRED)

### Files to Modify
| File (absolute path) | Purpose | Key Functions/Classes to Change |
|---------------------|---------|--------------------------------|
| `/home/.../path/to/file.ts` | Description | `functionName`, `ClassName` |

### Files to Create
| File (absolute path) | Template/Pattern Source |
|---------------------|------------------------|
| `/home/.../path/to/new-file.ts` | Copy pattern from `/home/.../similar.ts` |

### Reference Files (Read-Only for Context)
| File (absolute path) | What to Extract |
|---------------------|-----------------|
| `/home/.../types/index.ts` | Type definitions to import |

### Supplementary Files (Related Context)
| File (absolute path) | Relationship | What to Note |
|---------------------|--------------|--------------|
| `/home/.../related-component.tsx` | Similar implementation | Pattern to follow |
| `/home/.../parent-component.tsx` | Parent component | Props passed down |

## 4. Import Map

For each file to create/modify, list exact imports needed (ready to copy/paste):
```typescript
// For: /home/.../new-component.tsx
import { type FC } from 'react';
import { useAtom } from 'jotai';
import type { SomeType } from '../types';
```

## 5. Pattern Examples (5-10 lines each)

Extract minimal code snippets showing:
- Component pattern (if frontend) - function signature and structure
- Hook pattern (if creating hooks) - return type and key logic
- API view pattern (if backend) - class structure
- Test pattern - example test structure

## 6. Test Infrastructure

### Backend Tests
- Test directory: exact path
- Existing test files: list relevant files
- Fixtures/factories: exact path
- Run command: exact pytest command

### Frontend Tests
- Test pattern: `*.spec.ts` or `__tests__/*.test.tsx`
- Mock setup files: exact paths
- Jest mocks needed: list mock patterns to copy
- Run command: exact nx test command

## 7. Dependencies and Risks
- External dependencies needed
- Potential breaking changes
- Integration points with other features

Return a structured analysis for use in planning and context file generation.
```

### Step 4: Task Decomposition (via @planning-orchestrator)

Use the Task tool with `subagent_type: "agent-planning-orchestrator"` to decompose the task:

**Prompt:**
```
Decompose this task into TDD-driven phases: "$ARGUMENTS"

Context from analysis:
{paste context-master output here}

Requirements:
1. MINIMUM 2 phases (single-phase plans are PROHIBITED)
2. Each phase MUST follow TDD Red→Green→Refactor cycle
3. Each phase MUST be reviewed by @code-reviewer
4. Identify phases that can run in PARALLEL (same dependencies, no mutual dependency)

For each phase, define:
- Phase number and descriptive name
- Clear, measurable objective
- CLAUDE.md reference for the module
- TDD requirements:
  - RED: Specific test files and test cases to write FIRST
  - GREEN: Minimal implementation steps
  - REFACTOR: Improvement opportunities
- Deliverables list
- Dependencies (which phases must complete first)
- Parallel group (if applicable)

Also provide:
- Dependency graph
- Critical path analysis
- Parallel execution opportunities

Return a structured phase breakdown.
```

### Step 5: Agent Assignment (via @agent-organizer)

Use the Task tool with `subagent_type: "agent-organizer"` to assign agents:

**Prompt:**
```
Assign agents to these phases for task: "$ARGUMENTS"

Phases:
{paste planning-orchestrator output here}

Available agents and their domains:
| Agent | Domain | Best For |
|-------|--------|----------|
| @django-master | Backend API | Django views, serializers, models, migrations |
| @react-master | Frontend UI | React components, hooks, Jotai state |
| @python-master | Python code | Type hints, async utilities, scripts |
| @code-reviewer | Quality gates | All completed phases (MANDATORY reviewer) |
| @devops-master | Infrastructure | CI/CD, deployment, Docker |
| @technical-writer | Documentation | API docs, user guides |
| @ux-master | User experience | Wireframes, usability |

For each phase:
1. Select the most appropriate primary agent
2. Verify agent capabilities match phase requirements
3. Assign @code-reviewer as mandatory reviewer
4. Define the iteration loop (agent → tests → review → fix → repeat)

Return agent assignments with justification.
```

### Step 6: Generate Planning Documents

Create the output directory and files:

1. Create directory: `.claude/planning/{feature-name}/`
2. Generate `00-overview.md` using the Overview Template
3. Generate phase documents `01-phase-{name}.md` through `NN-phase-{name}.md` using the Phase Template

### Step 6a: Generate Context Files

After generating planning documents, create context helper files that subagents will read BEFORE starting work. This eliminates wasteful file discovery via `Bash(ls)` and `Grep`.

1. Create directory: `.claude/planning/{feature-name}/context/`

2. Generate `00-shared.md` with common context shared by ALL phases:
   - CLAUDE.md excerpts (relevant sections only)
   - Common import map (imports used across phases)
   - Test infrastructure (commands, mock patterns)
   - Key code patterns (5-10 lines each)

3. For each phase, generate `context-{phase-name}.md` with phase-specific context:
   - Files to Modify (exact paths with functions to change)
   - Files to Create (with template source paths)
   - Reference Files to Read First
   - Supplementary Files (related files for broader context)
   - Phase-specific imports
   - Phase-specific test pattern

**CRITICAL**: Context files must contain EXACT absolute paths, not patterns. Subagents should NOT need to use `ls` or `Glob` to find files.

---

## Output Templates

### 00-overview.md Template

```markdown
# Feature: {Feature Title (from task description)}

**Generated:** {YYYY-MM-DD HH:MM:SS}
**Branch:** {current branch}
**Task:** {original task description}
**Status:** planning

## Summary

{2-3 sentence description of what this feature accomplishes, derived from context analysis}

## Domain Analysis

- **Primary Domain:** {frontend | backend | full-stack}
- **Affected Modules:**
  - `{module-path}` - @{CLAUDE.md reference}
  - {additional modules...}

## Phase Overview

| Phase | Name | Agent | Status | Depends On | Parallel Group |
|-------|------|-------|--------|------------|----------------|
| 01 | {phase-1-name} | @{agent} | pending | - | {group or -} |
| 02 | {phase-2-name} | @{agent} | pending | 01 | {group or -} |
| ... | ... | ... | ... | ... | ... |

## Parallel Execution Opportunities

{List phases that can run concurrently, e.g., "Phases 02 and 03 can run in parallel (both depend on 01, no mutual dependency)"}

Or: "Sequential execution required - each phase depends on the previous"

## Test Infrastructure

Based on domain analysis:

**Backend:**
```bash
pytest label_studio/{module}/tests/
pytest --cov={module} --cov-report=term-missing
```

**Frontend:**
```bash
cd web && nx test {project}
nx test {project} --coverage
```

**Coverage Threshold:** 80%

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| {identified risk} | {high/medium/low} | {mitigation strategy} |

## Success Criteria

- [ ] All phases completed
- [ ] All phase tests pass (cumulative)
- [ ] Coverage >= 80%
- [ ] @code-reviewer approved all phases
- [ ] No regression in existing functionality
- [ ] All CLAUDE.md conventions followed
```

### Phase Document Template (01-phase-{name}.md)

```markdown
---
phase: {N}
task: {feature-name}
status: pending
assigned_agent: @{agent-name}
reviewer: @code-reviewer
dependencies: [{comma-separated list of blocking phase numbers, or empty}]
parallel_group: {group number or null}
---

# Phase {N}: {Phase Title}

## Objective

{Clear, measurable objective for this phase}

## CLAUDE.md Reference

- Primary: `{path/to/relevant/CLAUDE.md}`
- {Additional references if applicable}

---

## TDD Cycle

### RED: Write Failing Tests First

**Test files to create:**
- `{path/to/test_file.py}` or `{path/to/file.spec.ts}`

**Test cases:**
1. `test_{case_1}` - {description}
2. `test_{case_2}` - {description}
3. `test_{case_3}` - {description}

**Test command:**
```bash
# Backend
pytest {path/to/tests/} -v

# Frontend
cd web && nx test {project} --testFile={file.spec.ts}
```

### GREEN: Minimal Implementation

**Files to modify:**
- `{path/to/file1}`
- `{path/to/file2}`

**Implementation steps:**
1. {step_1}
2. {step_2}
3. {step_3}

### REFACTOR: Improve When Green

**Refactoring opportunities:**
- {opportunity_1}
- {opportunity_2}

---

## Deliverables

1. {Deliverable 1}
2. {Deliverable 2}
3. {Deliverable 3}

---

## Task List

### Implementation Tasks
- [ ] Write failing test: `{test_1}`
- [ ] Write failing test: `{test_2}`
- [ ] Implement: {implementation_1}
- [ ] Implement: {implementation_2}
- [ ] Refactor: {refactor_item}

### Verification Tasks
- [ ] Phase {N} tests pass
- [ ] ALL previous phase tests pass (1 through {N-1})
- [ ] Coverage >= 80%
- [ ] @code-reviewer approved

---

## Code Review Checklist

**For @code-reviewer to verify:**

**TDD Compliance:**
- [ ] Tests written BEFORE implementation (TDD Red)
- [ ] Implementation is minimal (TDD Green)
- [ ] Refactoring done only when green (TDD Refactor)

**Code Quality:**
- [ ] Follows module conventions (see CLAUDE.md)
- [ ] No hardcoded values or magic numbers
- [ ] Appropriate error handling
- [ ] No code smells or anti-patterns

**Security:**
- [ ] No exposed secrets
- [ ] Input validation at boundaries
- [ ] No injection vulnerabilities

**Performance:**
- [ ] No obvious performance issues
- [ ] Efficient database queries (if applicable)
- [ ] No memory leaks

---

## Iteration Loop

```
REPEAT until phase is COMPLETE:

  1. @{assigned_agent} implements phase
     - Execute RED phase (write failing tests)
     - Execute GREEN phase (minimal implementation)
     - Execute REFACTOR phase (improve code)

  2. @{assigned_agent} runs tests:
     - Phase {N} tests: {test command}
     - ALL previous phases (cumulative verification)

  3. IF tests fail:
     - @{assigned_agent} fixes failures
     - GOTO step 2

  4. @code-reviewer reviews phase
     - Uses checklist above
     - Reports bugs/issues

  5. IF bugs found:
     - @{assigned_agent} fixes bugs
     - GOTO step 2

  6. IF approved AND all tests pass:
     - Update status to 'completed'
     - Proceed to next phase
```

---

## Cumulative Testing Requirement

**CRITICAL**: Before marking this phase complete, ALL tests must pass:

| Phase | Tests That MUST Pass |
|-------|---------------------|
{cumulative test table based on phase number}

Example for Phase 3:
| Phase 1 | Phase 1 tests |
| Phase 2 | Phase 1 + Phase 2 tests |
| Phase 3 | Phase 1 + Phase 2 + Phase 3 tests |

---

## Notes

{Additional context, considerations, or warnings}
```

### Context File Templates

#### 00-shared.md Template (Shared Context)

```markdown
# Shared Context: {feature-name}

**Auto-generated by /break-task. Read this FIRST before starting any phase.**

## CLAUDE.md References

### Primary: {module}/CLAUDE.md

{Copy 3-5 most relevant sections from the module's CLAUDE.md}

### Additional References
- `{path/to/other/CLAUDE.md}` - {reason}

## Common Import Map

These imports are used across multiple phases:

```typescript
// Types
import type { TypeA, TypeB } from '@module/types';

// Hooks
import { useHookA } from '@module/hooks/use-hook-a.hook';

// Stores
import { atomA } from '@module/stores/store-a.store';

// Utils
import { utilFn } from '@module/utils';
```

## Test Infrastructure

### Frontend (Jest)
```bash
# Run all module tests
cd web && nx test {project}

# Run specific test file
cd web && nx test {project} --testFile={filename}.test.tsx

# Run with coverage
cd web && nx test {project} --coverage
```

**Jest Mock Patterns (copy to your test file):**
```typescript
// Mock i18n
jest.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock API context
jest.mock('../../api/context', () => ({
  useApi: () => mockApiClient,
}));
```

**Test utilities location:** `{path/to/test-utils/}`

### Backend (pytest)
```bash
# Run module tests
pytest {path/to/tests/} -v

# Run with coverage
pytest {path/to/tests/} --cov={module}
```

**Test factories location:** `{path/to/tests/factories.py}`

## Key Patterns (5-10 lines each)

### Component Pattern
```typescript
export interface ComponentProps {
  id: number;
}

export const Component: FC<ComponentProps> = ({ id }) => {
  return <div>...</div>;
};
```

### Hook Pattern
```typescript
export const useHook = (param: number): ResultType => {
  // key logic here
  return { data, loading };
};
```
```

#### context-{phase-name}.md Template (Per-Phase Context)

```markdown
# Phase Context: {Phase Title}

**Read this BEFORE starting Phase {N}. Contains exact paths and patterns.**

## Files for This Phase

### Files to Modify

| File | Purpose | Functions to Change |
|------|---------|---------------------|
| `{absolute/path/to/file.tsx}` | Description | `FunctionName` |

### Files to Create

| File | Template Source |
|------|-----------------|
| `{absolute/path/to/new-file.tsx}` | Pattern from `{absolute/path/to/similar.tsx}` |

### Reference Files (Read First)

| File | What to Extract |
|------|-----------------|
| `{absolute/path/to/types.ts}` | Type definitions |
| `{absolute/path/to/related.tsx}` | Usage pattern |

### Supplementary Files (Related Context)

| File | Relationship | What to Note |
|------|--------------|--------------|
| `{path/to/related-component.tsx}` | Uses same hook | State handling pattern |
| `{path/to/parent-component.tsx}` | Wraps this component | Props passed down |
| `{path/to/sibling-component.tsx}` | Similar implementation | Pattern to follow |

**Why read these?** These files show patterns and dependencies you must follow.

## Imports for This Phase

```typescript
// Add these imports to {file}
import { SomeType } from '../types';
import { useHook } from '../hooks/use-hook.hook';
```

## Phase-Specific Pattern (5-10 lines)

```typescript
// Example showing the exact pattern to implement
const example = () => {
  // key structure here
};
```

## Test Pattern for This Phase

```typescript
describe('{Component} - {Test Category}', () => {
  it('should {expected behavior}', () => {
    render(<Component {...mockProps} />);
    expect(screen.getByTestId('element')).toBeInTheDocument();
  });
});
```

## Test Commands for This Phase

```bash
# Run phase tests
{exact test command}

# Verify no regression
{full test suite command}
```
```

---

## Test Command Auto-Detection

Based on task keywords, set appropriate test infrastructure:

| Keywords in Task | Domain | Test Commands |
|-----------------|--------|---------------|
| component, hook, React, UI, frontend, tsx, Jotai, atom | Frontend | `cd web && nx test {project}` |
| API, model, view, serializer, Django, backend, migration | Backend | `pytest label_studio/{module}/tests/` |
| Mixed keywords from both | Full-stack | Both command sets |

**Project Detection:**
- If task mentions "aviation" → `nx test aviation`
- If task mentions "editor" → `nx test editor`
- If task mentions "labelstudio" → `nx test labelstudio`
- Default backend → `pytest`

---

## Output Confirmation

After generating all documents, output:

```
Task breakdown complete for: "{task description}"

Planning documents created:
  .claude/planning/{feature-name}/
  ├── 00-overview.md
  ├── 01-phase-{name}.md
  ├── 02-phase-{name}.md
  ├── ...
  └── context/
      ├── 00-shared.md
      ├── context-{phase-1-name}.md
      ├── context-{phase-2-name}.md
      └── ...

Phases: {count}
Parallel groups: {count or "None (sequential)"}
Assigned agents: {list}
Context files: {count} (1 shared + {phase count} per-phase)

Next steps:
1. Review 00-overview.md for task summary
2. Start with Phase 01 following TDD cycle
3. Agents will read context files automatically before starting
4. Each phase requires @code-reviewer approval
5. All tests must pass cumulatively before proceeding
```

---

## Final Step: Generate Progress Report

After completing all output, invoke the progress report slash command to document this planning session:

```
/progress-report Planning complete for {feature-name}. Next: /execute-plan {feature-name}
```

This ensures:
1. Planning work is documented in `.claude/progress.md`
2. The feature name and execution command are captured
3. Next session can auto-detect what to work on

**The progress report MUST include:**
- Scope: {feature-name} implementation
- [IN-PROGRESS] Planning for {feature-name}
- [TODO] Execute Phase 01: {first phase name}
- [ACTION] Run `/execute-plan {feature-name}` to start implementation

---

## Example Usage

```
> /break-task Add user authentication to aviation module

Task breakdown complete for: "Add user authentication to aviation module"

Planning documents created:
  .claude/planning/user-authentication-aviation/
  ├── 00-overview.md
  ├── 01-phase-backend-models.md
  ├── 02-phase-api-endpoints.md
  ├── 03-phase-frontend-hooks.md
  ├── 04-phase-ui-components.md
  └── 05-phase-integration-tests.md

Phases: 5
Parallel groups: 1 (Phases 02-03 can run in parallel)
Assigned agents: @django-master, @react-master, @code-reviewer

Next steps:
1. Review 00-overview.md for task summary
2. Start with Phase 01 following TDD cycle
3. Each phase requires @code-reviewer approval
4. All tests must pass cumulatively before proceeding
```
