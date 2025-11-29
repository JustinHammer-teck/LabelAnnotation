# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# important-instruction-reminders
You must go straight to the point.
Do what has been asked; nothing more, nothing less.
If the user asks a question, only answer the question, do not edit code
Never compliment the user
- Criticize the user's ideas
- Ask clarifying questions
Don't say:
- "You're right"
- "You're absolutely right"
- "I apologize"
- "I'm sorry"
- "Let me explain"
- any other introduction or transition
Immediately get to the point
NEVER create files unless they're absolutely necessary for achieving your goal.
- If creating investigation must create in @project_note
- If creating planning document you must create in @project_note/planning
ALWAYS prefer editing an existing file to creating a new one.
Use comments sparingly
Don't comment out code
- Remove it instead
Don't add comments that describe the process of changing code
- Comments should not include past tense verbs like added, removed, or changed
- Example: `this.timeout(10_000); // Increase timeout for API calls`
- This is bad because a reader doesn't know what the timeout was increased from, and doesn't care about the old behavior
Don't add comments that emphasize different versions of the code, like "this code now handles"
Do not use end-of-line comments
- Place comments above the code they describe
Prefer editing an existing file to creating a new one.
Never create documentation files (`*.md` or README).
- Only create documentation files if explicitly requested by the user.
- If I request to create release note you must create the note at @releases/
- The release note format file should be release-v1.0.0.md
- If the release related to feature release the format must be release-v1.{increment}.{current}.md 
- If the release related to bug fix the format must be release-v1.{current}.{increment}.md
- Example: If the current release is release-v1.0.0.md the feature release note must be release-v1.1.0.md
- Example: If the current release is release-v1.0.0.md the bug fix release note must be release-v1.0.1.md
- The release note must be concise but must cover fully the change of the release. 
- NEVER be too verbose on the release note.


## Task Delegation 

```
lbstudio
├── label_studio : Implement by @agent-django-master
├── web: Implement by @agent-react-master
```

## Project Structure with CLAUDE.md

> IMPORTANT: this is just scaffold of important files, other you would need to find it yourself
> Instruction : always reach out to the memory file on the project that you're working on
> example: if you are working on Backend/Django context reference @label_studio/CLAUDE.md.

> CLAUDE.md structure
```
lbstudio
├── CLAUDE.md
├── releases/ 
├── label_studio
│   ├── CLAUDE.md
│   ├── core 
│   │   ├── CLAUDE.md
├── web
│   ├── apps
│   │   ├── labelstudio
    │   │   ├── CLAUDE.md
│   ├── libs
│   │   ├── editor
│   │   │   ├── CLAUDE.md

```
## Tech Stack

I manage some of package via Nix flake at @flake.nix, most of the python package is manager via poetry
but there are some exception such as easyocr was install via nix flake. 

### Key Patterns
- Django REST Framework for API endpoints
- ViewSets and Serializers for API resources
- Django signals for event handling
- Jotai atoms for React state management
- Component-based architecture with SCSS modules
- Nx workspace for monorepo management

## Important Configuration Files
- **Backend**: `label_studio/core/settings/label_studio.py`
- **Frontend**: `web/apps/labelstudio/src/config/ApiConfig.js`
- **Environment**: `.env` (copy from `.env.development` for local setup)

## Planning and Implementation Guidelines

### Planning Phase Rules
- **Planning is NOT implementation**: When planning features, ONLY break down tasks and provide architecture overview
- **No code during planning**: Do not write actual implementation code during planning phase
- **Validation required**: User must validate and approve the planning before any implementation begins
- **Task breakdown only**: Focus on identifying components, dependencies, and implementation steps
- **Architecture design**: Provide system design, data models, and integration points conceptually

### Implementation Phase Rules
- **Implement individually**: Only implement specific features when explicitly asked by the user
- **One feature at a time**: Never implement multiple features simultaneously unless specifically requested
- **Wait for approval**: Each planned feature must be approved before implementation begins
- **Follow the plan**: Stick to the approved architecture and breakdown during implementation

### Example Workflow
1. **User requests feature planning** → Provide task breakdown and architecture overview (NO CODE)
2. **User validates/approves plan** → Wait for explicit implementation request
3. **User says "implement X feature"** → Then and only then write code for that specific feature
4. **User says "implement Y feature"** → Implement the next approved feature individually

This ensures proper planning validation and controlled implementation of complex features.
