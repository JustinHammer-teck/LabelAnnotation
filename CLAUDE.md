# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Label Studio is an open-source data labeling platform with a Django backend and React frontend. The project uses a monorepo structure with Python (Django) backend and TypeScript/React frontend components.

## Project Structure with CLAUDE.md

>IMPORTANT: this is just scaffold of important files, other you would need to find it yourself
>

```
.
├── CLAUDE.md
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

#### Annotation Editor

This is a scaffold without test directory
## Tech Stack

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

# Run Storybook
cd web && yarn storybook:serve
```

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
