# Label Studio Django Backend

Django REST Framework backend for Label Studio annotation platform.

## Tech Stack

- **Framework**: Django 5.1.x + Django REST Framework
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Background Jobs**: Redis + RQ
- **Package Manager**: Poetry (never use pip)
- **Python**: >=3.10

## Directory Structure

```
label_studio/
├── core/           # Settings, middleware, utilities, label_config parsing
├── projects/       # Project CRUD and configuration
├── tasks/          # Task, Annotation, Prediction models
├── users/          # User authentication
├── organizations/  # Multi-tenancy
├── data_import/    # File upload, task creation
├── data_export/    # Export formats and jobs
├── data_manager/   # Filtering, ordering, query building
├── io_storages/    # Cloud storage (S3, GCS, Azure)
├── ml/             # ML backend HTTP integration
├── ml_models/      # LLM/prompt-based model integration
├── webhooks/       # Event webhooks
├── notifications/  # SSE notifications
├── aviation/       # Aviation domain extension
├── manage.py       # Django CLI
└── server.py       # Custom startup script
```

## Commands

```bash
poetry run python ./label_studio/manage.py runserver
poetry add <package>
```

## API Patterns

### View Pattern (use Generic APIViews, NOT ViewSets)

```python
from rest_framework import generics
from core.permissions import ViewClassPermission, all_permissions

class ProjectListAPI(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
        POST=all_permissions.projects_create,
    )

    def get_queryset(self):
        return Project.objects.filter(
            organization=self.request.user.active_organization
        )
```

### Serializer Pattern

```python
from rest_flex_fields import FlexFieldsModelSerializer

class ProjectSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

    def validate_field(self, value):
        if invalid:
            raise serializers.ValidationError('Error message')
        return value
```

### Webhook Decorator

```python
from webhooks.utils import api_webhook
from webhooks.models import WebhookAction

@api_webhook(WebhookAction.PROJECT_CREATED)
def post(self, request, *args, **kwargs):
    return super().post(request, *args, **kwargs)
```

### Swagger Documentation

```python
from drf_yasg.utils import swagger_auto_schema

@swagger_auto_schema(tags=['Projects'], operation_summary='List projects')
def get(self, request):
    pass
```

## Model Patterns

### Custom Manager

```python
class ProjectManager(models.Manager):
    def for_user(self, user):
        return self.filter(organization=user.active_organization)

    def with_counts(self, fields=None):
        queryset = self.get_queryset()
        for field, func in self.ANNOTATED_FIELDS.items():
            if fields is None or field in fields:
                queryset = func(queryset)
        return queryset

class Project(models.Model):
    objects = ProjectManager()
```

### Cached Properties

```python
from django.utils.functional import cached_property

@cached_property
def computed_field(self):
    return expensive_computation()
```

### Signals

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Annotation)
def annotation_post_save(sender, instance, created, **kwargs):
    instance.task.update_is_labeled()
```

## Background Jobs

**Always use `start_job_async_or_sync`, never raw django-rq.**

```python
from core.redis import start_job_async_or_sync

start_job_async_or_sync(
    job_function,
    arg1, arg2,
    queue_name='low',
    job_timeout=3600,
    use_on_commit=True,
)
```

| Queue | Use Case | Timeout |
|-------|----------|---------|
| critical | Time-sensitive | 180s |
| high | Important ops | 180s |
| default | Exports | 180s |
| low | Storage sync | 10h |

### Job Utilities

```python
from core.redis import (
    redis_connected,
    is_job_in_queue,
    is_job_on_worker,
)
```

## Query Optimization

```python
# Always filter by organization
queryset.filter(organization=request.user.active_organization)

# Prefetch relations
queryset.prefetch_related('members').select_related('created_by')

# Use manager annotations
Project.objects.with_counts(fields=['task_number'])

# Complex filters
from django.db.models import Q, Subquery, OuterRef
queryset.filter(Q(project=project) | Q(project=None))
```

## Key Conventions

| Pattern | Convention |
|---------|------------|
| Views | Generic APIViews (not ViewSets) |
| Permissions | `ViewClassPermission` with method mapping |
| Queries | Always filter by `organization` |
| Mutations | Wrap in `transaction.atomic()` |
| Jobs | Use `start_job_async_or_sync()` |
| Signals | `@receiver(post_save, sender=Model)` |
| Docs | `@swagger_auto_schema(tags=[...])` |
| Webhooks | `@api_webhook(WebhookAction.*)` |

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Model | PascalCase singular | `Project`, `Task` |
| Manager | Model + Manager | `ProjectManager` |
| Serializer | Model + Serializer | `ProjectSerializer` |
| View | Resource + API | `ProjectListAPI` |
| URL name | kebab-case | `project-list` |

## Error Handling

```python
from rest_framework.exceptions import ValidationError, NotFound
from django.db import transaction, IntegrityError

raise ValidationError({'field': 'Error message'})
raise NotFound('Resource not found')

try:
    with transaction.atomic():
        instance.save()
except IntegrityError:
    raise ValidationError('Duplicate entry')
```

## Best Practices

- Pass model IDs to jobs, never instances
- Use `filter().first()` over `get()` when record may not exist
- Use `values_list('id', flat=True)` for ID-only queries
- Always specify `help_text` on model fields
- Use `JSONField` for structured data, not TextField
- Use `update_fields` parameter in `.save()` for performance
