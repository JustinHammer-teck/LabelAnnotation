### DJANGO project Structure

```
lbstudio/label_studio
├── annotation_templates
├── core
│   ├── asgi.py
│   ├── wsgi.py
│   ├── label_config.py
│   ├── settings
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── label_studio.py
├── data_export
├── data_import
├── data_manager
├── io_storages
├── jwt_auth
├── labels_manager
├── ml
├── notifications
├── organizations
├── projects
├── tasks
├── users
├── webhooks
├── manage.py
└── server.py
```

### Backend
- **Framework**: Django 5.1.x with Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Package Manager**: Poetry
- **Python Version**: >=3.10, <4
- **Background Jobs**: Redis + RQ (Redis Queue)

## Common Development Commands
### Backend Commands

```bash
# If you want to access manage.py
poetry run python ./label_studio/manage.py runserver
# Main Django / Python Package Manager, Do not use pip to install package
poetry add guardian

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


