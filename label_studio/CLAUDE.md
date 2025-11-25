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

## Django-RQ Background Jobs

### Core Pattern
**ALWAYS use `start_job_async_or_sync` instead of raw django-rq operations.**

```python
from core.redis import start_job_async_or_sync

start_job_async_or_sync(
    job_function,
    arg1, arg2,
    queue_name='low',           # Optional, default='default'
    job_timeout=3600,            # Optional, in seconds
    in_seconds=0,                # Optional delay
    use_on_commit=True,          # Optional, waits for transaction.on_commit
    redis=True,                  # Optional, if False runs synchronously
    on_failure=failure_handler   # Optional callback for failures
)
```

**WRONG - Never use raw django-rq:**
```python
queue = django_rq.get_queue('low')
queue.enqueue(job_function, arg1, arg2)
```

### Queue Naming Conventions
- `critical` - High priority, time-sensitive operations (timeout: 180s)
- `high` - Important operations requiring quick execution (timeout: 180s)
- `default` - Standard background tasks like exports (timeout: 180s)
- `low` - Long-running tasks like storage sync (timeout: 180s)

### Job Definition Patterns

**Decorator Pattern (for storage sync jobs):**
```python
from django_rq import job
from django.conf import settings

@job('low', timeout=settings.RQ_LONG_JOB_TIMEOUT)
def import_sync_background(storage_class, storage_id, **kwargs):
    storage = storage_class.objects.get(id=storage_id)
    storage.scan_and_create_links()
```

**Direct Enqueue Pattern (for exports):**
```python
from core.redis import redis_connected
import django_rq

if redis_connected():
    queue = django_rq.get_queue('default')
    queue.enqueue(
        export_background,
        export_id,
        task_filter_options,
        on_failure=set_export_background_failure,
        job_timeout='3h'
    )
```

### Job Configuration
- `RQ_LONG_JOB_TIMEOUT` = 36000 seconds (10 hours) - for storage sync operations
- Default timeout per queue = 180 seconds
- Job timeouts can be specified as integers (seconds) or strings ('3h', '30m')

### Error Handling Pattern

**Failure Callbacks:**
```python
def storage_background_failure(*args, **kwargs):
    if isinstance(args[0], rq.job.Job):
        sync_job = args[0]
        storage_class = sync_job.args[0]
        storage_id = sync_job.args[1]
        storage = storage_class.objects.filter(id=storage_id).first()
        if storage:
            storage.info_set_failed()
```

Register failure handler:
```python
queue.enqueue(
    job_function,
    arg1, arg2,
    on_failure=failure_callback
)
```

### Transaction-Safe Job Enqueuing
The `start_job_async_or_sync` function automatically uses `transaction.on_commit` when inside an atomic block to prevent queueing jobs for uncommitted database changes.

```python
with transaction.atomic():
    storage.save()
    start_job_async_or_sync(
        import_sync_background,
        storage.__class__,
        storage.id,
        use_on_commit=True  # Default behavior
    )
```

### Job Deduplication Pattern
```python
from core.redis import is_job_in_queue, is_job_on_worker
import django_rq

queue = django_rq.get_queue('low')
meta = {'project': project.id, 'storage': storage.id}

if not is_job_in_queue(queue, 'import_sync_background', meta=meta) and \
   not is_job_on_worker(job_id=storage.last_sync_job, queue_name='low'):
    sync_job = queue.enqueue(
        import_sync_background,
        storage.__class__,
        storage.id,
        meta=meta
    )
    storage.info_set_job(sync_job.id)
```

### Testing Background Jobs
In tests, RQ queues run synchronously (configured in `conftest.py`):
```python
def pytest_configure():
    for q in settings.RQ_QUEUES.values():
        q['ASYNC'] = False
```

### Job Management Utilities
```python
from core.redis import (
    redis_connected,           # Check Redis availability
    is_job_in_queue,          # Check if job in queue
    is_job_on_worker,         # Check if job is running
    delete_job_by_id,         # Cancel and delete job
    get_jobs_by_meta          # Find jobs by metadata
)
```

### Common Patterns

**Storage Sync (long-running):**
- Queue: `low`
- Timeout: `settings.RQ_LONG_JOB_TIMEOUT`
- Failure handler: `storage_background_failure`
- Deduplication: Check queue and worker before enqueuing

**Data Export:**
- Queue: `default`
- Timeout: `'3h'` (3 hours)
- Failure handler: `set_export_background_failure`
- Status tracking: `IN_PROGRESS` → `COMPLETED`/`FAILED`

### Best Practices
- Always pass model IDs, never model instances to job functions
- Use `redis_connected()` to check Redis availability before enqueuing
- Provide fallback synchronous execution when Redis is unavailable
- Register `on_failure` callbacks for critical jobs
- Use job metadata for deduplication and tracking
- Store job IDs in model fields for status monitoring
- Set appropriate timeouts based on expected job duration

## Django Coding Standards

### API Views and ViewSets

**Use class-based APIViews and GenericAPIViews, NOT ViewSets:**
```python
from rest_framework.views import APIView
from rest_framework import generics

class ProjectListApiProxy(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.with_counts(fields=fields).filter(
            organization=self.request.user.active_organization
        )

class ProjectNextTaskAPI(GetParentObjectMixin, APIView):
    permission_classes = (ViewClassPermission,)

    def get(self, request, *args, **kwargs):
        project = self.get_parent_object()
        next_task = get_next_task(project, request.user)
        return Response(TaskSerializer(next_task).data)
```

**Permission Pattern:**
```python
from core.permissions import ViewClassPermission, all_permissions

permission_classes = (ViewClassPermission,)
permission_required = ViewClassPermission(
    GET=all_permissions.projects_view,
    PUT=all_permissions.projects_change,
    PATCH=all_permissions.projects_change,
    DELETE=all_permissions.projects_delete,
    POST=all_permissions.projects_create,
)
```

### Serializers

**Use FlexFieldsModelSerializer for complex serializers:**
```python
from rest_flex_fields import FlexFieldsModelSerializer
from rest_framework import serializers

class ProjectSerializer(FlexFieldsModelSerializer):
    task_number = serializers.IntegerField(default=None, read_only=True)
    created_by = UserSimpleSerializer(default=CreatedByFromContext())
    config_has_control_tags = serializers.SerializerMethodField()

    @staticmethod
    def get_config_has_control_tags(project):
        return len(project.get_parsed_config()) > 0

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
```

**Validation Pattern:**
```python
def validate_label_config(self, value):
    if not value or value.strip() == '':
        raise serializers.ValidationError('Label config cannot be empty')
    return value

def validate(self, data):
    if 'url' in data and not data['url'].startswith('http'):
        raise serializers.ValidationError({'url': 'Invalid URL format'})
    return data
```

**Custom create/update:**
```python
def create(self, validated_data):
    with transaction.atomic():
        instance = super().create(validated_data)
        instance.post_create_actions()
    return instance

def update(self, instance, validated_data):
    with transaction.atomic():
        instance = super().update(instance, validated_data)
        instance.post_update_actions()
    return instance
```

### Query Optimization

**Always use select_related and prefetch_related:**
```python
def get_queryset(self):
    return Project.objects.with_counts(fields=fields).filter(
        organization=self.request.user.active_organization
    ).prefetch_related('members', 'created_by')

queryset = Organization.objects.filter(user=user).prefetch_related('organization')
```

**Custom Manager with Annotations:**
```python
class ProjectManager(models.Manager):
    def for_user(self, user):
        return self.filter(organization=user.active_organization)

    def with_counts(self, fields=None):
        queryset = self.get_queryset()
        for field, annotate_func in self.ANNOTATED_FIELDS.items():
            if fields is None or field in fields:
                queryset = annotate_func(queryset)
        return queryset

class Project(models.Model):
    objects = ProjectManager()
```

**Custom QuerySet:**
```python
class TaskQuerySet(models.QuerySet):
    def prepared(self, prepare_params=None):
        queryset = self
        if prepare_params is None:
            return queryset

        project = Project.objects.get(pk=prepare_params.project)
        queryset = apply_filters(queryset, prepare_params.filters, project, request)
        queryset = apply_ordering(queryset, prepare_params.ordering, project, request)
        return queryset

class Task(models.Model):
    objects = TaskManager.from_queryset(TaskQuerySet)()
```

### Model Patterns

**Use class methods for creation:**
```python
@classmethod
def create_organization(cls, created_by=None, title='Your Organization', **kwargs):
    _create_organization = load_func(settings.CREATE_ORGANIZATION)
    return _create_organization(title=title, created_by=created_by, **kwargs)

@classmethod
def find_by_user(cls, user):
    memberships = OrganizationMember.objects.filter(user=user).prefetch_related('organization')
    if not memberships.exists():
        raise ValueError(f'No memberships found for user {user}')
    return memberships.first().organization
```

**Soft delete pattern:**
```python
def soft_delete(self):
    with transaction.atomic():
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])
        self.user.active_organization = self.user.organizations.filter(
            organizationmember__deleted_at__isnull=True
        ).first()
        self.user.save(update_fields=['active_organization'])
```

**Use cached_property for expensive computations:**
```python
from django.utils.functional import cached_property

@cached_property
def is_deleted(self):
    return bool(self.deleted_at)

@cached_property
def is_owner(self):
    return self.user.id == self.organization.created_by.id
```

### URL Routing

**Use path() with APIView.as_view():**
```python
from django.urls import path

urlpatterns = [
    path('', api.ProjectListApiProxy.as_view(), name='project-list'),
    path('<int:pk>/', api.ProjectAPIProxy.as_view(), name='project-detail'),
    path('<int:pk>/next/', api.ProjectNextTaskAPI.as_view(), name='project-next'),
    path('<int:pk>/summary/', api.ProjectSummaryAPI.as_view(), name='project-summary'),
]
```

### Webhook Decorators

**Use @api_webhook for automatic webhook emission:**
```python
from webhooks.utils import api_webhook, api_webhook_for_delete
from webhooks.models import WebhookAction

class ProjectAPI(APIView):
    @api_webhook(WebhookAction.PROJECT_CREATED)
    def post(self, request, *args, **kwargs):
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @api_webhook(WebhookAction.PROJECT_UPDATED)
    def patch(self, request, pk=None):
        pass

    @api_webhook_for_delete(WebhookAction.PROJECT_DELETED)
    def delete(self, request, pk=None):
        pass
```

### OpenAPI Documentation

**Use @swagger_auto_schema for API documentation:**
```python
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@swagger_auto_schema(
    tags=['Projects'],
    operation_summary='Get project next task',
    operation_description='Retrieve next task for labeling in project',
    manual_parameters=[
        openapi.Parameter(
            name='project',
            type=openapi.TYPE_INTEGER,
            in_=openapi.IN_QUERY,
            description='Project ID'
        ),
    ],
    responses={
        '200': openapi.Response(
            description='Next task',
            schema=TaskSerializer
        )
    }
)
def get(self, request, *args, **kwargs):
    pass
```

### Response Patterns

**Standard response format:**
```python
from rest_framework.response import Response
from rest_framework import status

return Response(serializer.data, status=status.HTTP_200_OK)
return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
return Response(status=status.HTTP_204_NO_CONTENT)
```

### Error Handling

**Use DRF exceptions:**
```python
from rest_framework.exceptions import ValidationError as RestValidationError, NotFound

if not project.label_config:
    raise RestValidationError('Label config is not set or is empty')

if not task:
    raise NotFound('Task not found')
```

**Try-except for database operations:**
```python
try:
    with transaction.atomic():
        project.save()
        project.update_tasks_states()
except IntegrityError:
    raise ProjectExistException('Project already exists')
```

### Signal Usage

**Use signals for decoupled operations:**
```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Project)
def project_post_save(sender, instance, created, **kwargs):
    if created:
        instance.organization.add_user(instance.created_by)

@receiver(post_delete, sender=Task)
def task_post_delete(sender, instance, **kwargs):
    instance.project.update_task_states()
```

### Transaction Safety

**Wrap mutations in atomic blocks:**
```python
from django.db import transaction

with transaction.atomic():
    om = OrganizationMember(user=user, organization=self)
    om.save()
    user.active_organization = self
    user.save()
```

### Complex Queries

**Use Q objects for complex filtering:**
```python
from django.db.models import Q

webhooks = Webhook.objects.filter(
    Q(organization=organization)
    & (Q(project=project) | Q(project=None))
    & Q(is_active=True)
    & (
        Q(send_for_all_actions=True)
        | Q(id__in=WebhookAction.objects.filter(action=action).values_list('webhook_id'))
    )
).distinct()
```

**Use Subquery and OuterRef for advanced queries:**
```python
from django.db.models import Subquery, OuterRef, Exists

newest_annotations = Annotation.objects.filter(task=OuterRef('pk')).order_by('-id')[:1]
queryset = queryset.annotate(completed_at=Subquery(newest_annotations.values('created_at')))

queryset = queryset.annotate(
    has_draft=Exists(AnnotationDraft.objects.filter(task=OuterRef('pk')))
)
```

### Best Practices

- Pass model IDs to serializers when crossing API boundaries, not instances
- Use `get_queryset()` instead of hardcoded querysets in views
- Always filter by `organization` or `project` to enforce data isolation
- Use `@method_decorator` for class-based view decorators
- Prefer `filter().first()` over `get()` when record may not exist
- Use `values_list('id', flat=True)` for ID-only queries
- Always specify `help_text` on model fields for auto-documentation
- Use `JSONField` instead of TextField for JSON data
- Leverage `load_func(settings.CUSTOM_FUNCTION)` for enterprise overrides


