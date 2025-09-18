# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# important-instruction-reminders
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


## Project Overview

Label Studio is an open-source data labeling platform with a Django backend and React frontend. The project uses a monorepo structure with Python (Django) backend and TypeScript/React frontend components.

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
├── web
│   ├── apps
│   │   ├── labelstudio
    │   │   ├── CLAUDE.md
│   ├── libs
│   │   ├── editor
    │   │   ├── CLAUDE.md

```
## Tech Stack

I manage some of package via Nix flake at @flake.nix, most of the python package is manager via poetry
but there are some exception such as easyocr was install via nix flake. 

### Backend
- **Framework**: Django 5.1.x with Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Package Manager**: Poetry
- **Python Version**: >=3.10, <4
- **Background Jobs**: Redis + RQ (Redis Queue)

### Frontend
- **Framework**: React 18.x with TypeScript
- **Build Tool**: Nx monorepo with Webpack
- **State Management**: Jotai atoms, MobX State Tree (legacy)
- **UI Libraries**: Ant Design v4, Custom UI components in `web/libs/ui`
- **Styling**: SCSS modules, Tailwind CSS

## Common Development Commands


### Backend Commands

```bash

# If you want to access manage.py

poetry run python ./label_studio/manage.py runserver

# Main Django / Python Package Manager, Do not use pip to install package

poetry add guardian

# Main Web Package Manager

yarn add i18next

```


```bash
# Install dependencies
poetry install

# Run Django development server with SQLite
make run-dev
# Or directly:
DJANGO_DB=sqlite DJANGO_SETTINGS_MODULE=core.settings.label_studio poetry run python label_studio/manage.py runserver

# Run migrations
make migrate-dev

# Create new migrations
make makemigrations-dev

# Run tests
cd label_studio && DJANGO_DB=sqlite pytest -v -m "not integration_tests"

# Run a single test
cd label_studio && DJANGO_DB=sqlite pytest -v path/to/test.py::TestClass::test_method

# Format Python code
make fmt  # Format changed files
make fmt-all  # Format all files

# Check linting
make fmt-check
```

### Frontend Commands
```bash
# Install dependencies
cd web && yarn install --frozen-lockfile

# Run development server (HMR mode)
cd web && yarn dev

# Watch and build continuously
cd web && yarn watch

# Build production bundle
cd web && yarn build

# Run linting
cd web && yarn lint
cd web && yarn lint-scss

# Run tests
cd web && yarn test:unit
cd web && yarn ls:unit  # Label Studio unit tests
cd web && yarn lsf:unit  # Label Studio Frontend (editor) unit tests
cd web && yarn dm:unit   # Data Manager unit tests

### Docker Commands
```bash
# Run with Docker Compose (includes Nginx + PostgreSQL)
docker-compose up

# Run with MinIO for S3 storage testing
docker compose -f docker-compose.yml -f docker-compose.minio.yml up -d
```

## Architecture Overview

### Backend Structure
- **`label_studio/core/`**: Core Django app with settings, middleware, and utilities
- **`label_studio/projects/`**: Project management and configuration
- **`label_studio/tasks/`**: Task and annotation management
- **`label_studio/users/`**: User authentication and management
- **`label_studio/organizations/`**: Organization and team management
- **`label_studio/ml/`**: Machine learning integration
- **`label_studio/io_storages/`**: Cloud storage integrations (S3, GCS, Azure)
- **`label_studio/data_manager/`**: Data Manager backend API
- **`label_studio/webhooks/`**: Webhook notifications
- **`label_studio/notifications/`**: SSE-based notification system

### Frontend Structure
- **`web/apps/labelstudio/`**: Main Label Studio application
- **`web/libs/editor/`**: Annotation editor library
- **`web/libs/datamanager/`**: Data Manager library
- **`web/libs/ui/`**: Shared UI components
- **`web/libs/core/`**: Core utilities and helpers
- **`web/libs/app-common/`**: Shared application components

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

## Testing Approach
- Backend: pytest with Django test client
- Frontend: Jest + React Testing Library
- E2E: Cypress for integration testing

## React Component Guidelines
- Use functional components with hooks
- Follow kebab-case naming for files: `list-item.tsx`
- Co-locate SCSS modules: `list-item.module.scss`
- Add Storybook stories: `list-item.stories.tsx`
- Use Jotai atoms for global state (not Context API)
- Implement proper TypeScript types
- Follow accessibility standards (WCAG 2.1 AA)

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
