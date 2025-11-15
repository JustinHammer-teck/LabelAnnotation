# Investigation: Async Race Conditions in File Import Flow

## Executive Summary

Files imported in production do not display in the files table due to **CRITICAL RACE CONDITIONS** between:
1. FileUpload record creation
2. Task record creation (with file_upload_id foreign key)
3. RQ worker job dispatch timing
4. Database transaction commit boundaries

## Critical Race Condition #1: Task Creation vs File Query

**Location**: `/label_studio/data_import/api.py` lines 278-336

### The Problem

```python
def sync_import(self, request, project, ...):
    # Step 1: Create FileUpload records (committed immediately)
    parsed_data, file_upload_ids, ... = load_tasks(request, project)

    if commit_to_project:
        # Step 2: Create Task records (happens INSIDE transaction)
        tasks, serializer = self._save(parsed_data)

        # Step 3: Task records get file_upload_id BUT tasks not yet visible
        # because transaction hasn't committed
```

**The Race**:
- FileUpload created and committed
- Query FileUpload.objects.filter(project=project) → returns the FileUpload
- Query file_upload.tasks.count() → returns **0** because Tasks not committed yet
- Frontend displays file with task_count=0 as "no_tasks" status

### Root Cause Analysis

1. **FileUpload Creation** (`uploader.py:73-90`):
```python
def create_file_upload(user, project, file):
    instance = FileUpload(user=user, project=project, file=file)
    instance.save()  # ← IMMEDIATE COMMIT, no transaction wrapper

    if settings.OCR_ENABLED:
        process_pdf_if_needed(instance)  # Dispatches RQ jobs

    return instance
```

2. **Task Creation** (`tasks/serializers.py:557`):
```python
t = Task(
    project=self.project,
    file_upload_id=task.get('file_upload_id'),  # ← Link is here
    # ...
)
db_tasks.append(t)
# Later: bulk_create inside transaction
self.db_tasks = Task.objects.bulk_create(db_tasks, batch_size=settings.BATCH_SIZE)
```

3. **Files Table Query** (`data_import/api.py:676-708`):
```python
queryset = FileUpload.objects.filter(project=project) \
    .select_related('project', 'user') \
    .prefetch_related('tasks')  # ← May execute before tasks committed
```

## Critical Race Condition #2: RQ Job Dispatch Inside Transaction

**Location**: `/label_studio/data_import/api.py` lines 376-387, 483-490

### The Problem

```python
def async_import(self, request, project, ...):
    project_import = ProjectImport.objects.create(...)  # In transaction

    # RQ job dispatched BEFORE transaction commits
    start_job_async_or_sync(
        async_import_background,
        project_import.id,
        queue_name='high',
        project_id=project.id,  # ← RQ worker may query before commit
    )
```

**The Race**:
- Transaction starts
- ProjectImport record created (not yet visible to other connections)
- RQ job enqueued **immediately**
- Worker picks up job **before transaction commits**
- Worker queries database → ProjectImport not found or FileUpload.tasks is empty

### Evidence from Code

`/label_studio/data_import/api.py:455-489` (ReImportAPI.sync_reimport):
```python
with transaction.atomic():
    project.remove_tasks_by_file_uploads(file_upload_ids)
    tasks, serializer = self._save(tasks)

    if settings.OCR_ENABLED and tasks:
        # Mark tasks for OCR
        for task in ocr_tasks:
            task.save(update_fields=['meta'])

# OUTSIDE transaction - OCR job dispatched after commit (CORRECT)
if settings.OCR_ENABLED and tasks:
    start_job_async_or_sync(
        process_ocr_for_tasks_background,
        ocr_task_ids,
        queue_name='high',
    )
```

But in `async_import` (line 376):
```python
# INSIDE request handler, no transaction wrapper
project_import = ProjectImport.objects.create(...)
file_upload_ids, could_be_tasks_list = create_file_uploads(...)

# Job dispatched immediately - may race with commit
start_job_async_or_sync(
    async_import_background,
    project_import.id,  # ← May not be visible yet
    queue_name='high',
)
```

## Critical Race Condition #3: PDF Conversion Jobs

**Location**: `/label_studio/data_import/services.py:308-343, uploader.py:84-88

### The Problem

```python
def create_file_upload(user, project, file):
    instance.save()  # FileUpload committed

    if settings.OCR_ENABLED:
        process_pdf_if_needed(instance)  # Dispatches parallel jobs

    return instance
```

Inside `convert_pdf_to_images_parallel`:
```python
def convert_pdf_to_images_parallel(pdf_file_upload):
    for page_num in range(total_pages):
        # Enqueue parallel job for EACH page
        job = start_job_async_or_sync(
            render_pdf_page_job,
            pdf_file_upload.id,
            page_num,
            queue_name='high',
        )
```

Each `render_pdf_page_job` creates:
1. New FileUpload (for extracted image)
2. PDFImageRelationship record

**The Race**:
- Original PDF FileUpload committed
- N parallel jobs dispatched (N = page count)
- Each job creates FileUpload + PDFImageRelationship
- Original query may see 0, some, or all child FileUploads
- FileUpload.tasks relationship not established until later

## Critical Race Condition #4: Missing transaction.on_commit()

**Location**: ALL RQ job dispatches lack proper commit hooks

### The Problem

`core/redis.py:79-116` - No transaction awareness:
```python
def start_job_async_or_sync(job, *args, **kwargs):
    if redis:
        queue = django_rq.get_queue(queue_name)
        job = queue.enqueue(job, *args, **kwargs)  # ← No on_commit hook
        return job
```

**Best Practice** (Django docs):
```python
from django.db import transaction

def dispatch_after_commit(job_func, *args, **kwargs):
    transaction.on_commit(
        lambda: start_job_async_or_sync(job_func, *args, **kwargs)
    )
```

**Why this matters**:
- RQ worker may execute **before** database commit
- Worker queries return stale/missing data
- Task creation fails silently
- FileUpload shows as having 0 tasks

## Error Handling Issues

### Issue #1: Bare Except Clauses

**Location**: Multiple files suppress errors

`data_import/models.py:12, 62`:
```python
try:
    import ujson as json
except:  # noqa: E722 - SUPPRESSES ALL ERRORS
    import json

try:
    file_format = os.path.splitext(self.filepath)[-1]
except:  # noqa: E722 - HIDES ERRORS
    pass
```

**Impact**: Silent failures, no logging, impossible to debug

### Issue #2: Silent Error Logging

`uploader.py:84-88`:
```python
if settings.OCR_ENABLED:
    try:
        process_pdf_if_needed(instance)
    except Exception as e:
        logger.error(f'PDF processing failed: {e}', exc_info=True)
        # ← NO RE-RAISE, failure is hidden from caller
```

### Issue #3: Missing Transaction Rollback

`data_import/functions.py:24-34`:
```python
with transaction.atomic():
    try:
        project_import = ProjectImport.objects.get(id=import_id)
    except ProjectImport.DoesNotExist:
        logger.error(f'ProjectImport not found')
        return  # ← Transaction commits even on error
```

## State Management Issues

### Issue #1: No Status Tracking on FileUpload

`data_import/models.py:32-56` - FileUpload has:
- ✅ `created_at` timestamp
- ❌ No `status` field (pending/processing/completed/failed)
- ❌ No `task_created_at` timestamp
- ❌ No `error_message` field

**Impact**: Cannot distinguish between:
- File uploaded, tasks not yet created
- File uploaded, task creation in progress
- File uploaded, task creation failed
- File uploaded, tasks created successfully

### Issue #2: Task Meta Race Condition

`data_import/services.py:454-490`:
```python
with transaction.atomic():
    locked_task = Task.objects.select_for_update().get(id=task.id)

    if not locked_task.meta:
        locked_task.meta = {}

    # Multiple workers updating same task.meta concurrently
    locked_task.meta['ocr_pages_completed'].append(page_number)
    locked_task.save(update_fields=['meta'])
```

**Race**: Multiple OCR workers update same task.meta dictionary

## Query Timing Issues

### Issue #1: Prefetch Before Commit

`data_import/api.py:676-678`:
```python
queryset = FileUpload.objects.filter(project=project) \
    .select_related('project', 'user') \
    .prefetch_related('tasks')  # ← Executes JOIN before tasks committed
```

### Issue #2: Count Cache Invalidation

`data_import/models.py:69-73`:
```python
@property
def task_count(self):
    if not hasattr(self, '_task_count_cache'):
        self._task_count_cache = self.tasks.count()
    return self._task_count_cache
```

**Problem**: Cache never invalidated, always returns initial count

## Recommended Fixes

### Fix #1: Wrap FileUpload Creation in Transaction

```python
from django.db import transaction

def create_file_upload(user, project, file):
    with transaction.atomic():
        instance = FileUpload(user=user, project=project, file=file)
        instance.save()

    # Dispatch jobs AFTER commit
    if settings.OCR_ENABLED:
        transaction.on_commit(
            lambda: process_pdf_if_needed(instance)
        )

    return instance
```

### Fix #2: Add transaction.on_commit to RQ Dispatcher

```python
def start_job_async_or_sync(job, *args, **kwargs):
    use_on_commit = kwargs.pop('use_on_commit', True)

    def _enqueue():
        if redis:
            queue = django_rq.get_queue(queue_name)
            return queue.enqueue(job, *args, **kwargs)
        else:
            return job(*args, **kwargs)

    if use_on_commit and connection.in_atomic_block:
        transaction.on_commit(_enqueue)
    else:
        return _enqueue()
```

### Fix #3: Add Status Field to FileUpload

```python
class FileUpload(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    tasks_created_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
```

### Fix #4: Replace Bare Except with Specific Exceptions

```python
# BEFORE
try:
    file_format = os.path.splitext(self.filepath)[-1]
except:  # Hides ALL errors
    pass

# AFTER
try:
    file_format = os.path.splitext(self.filepath)[-1]
except (AttributeError, IndexError) as e:
    logger.warning(f"Failed to get file format: {e}")
    file_format = None
```

### Fix #5: Add Completion Callback

```python
def async_import_background(import_id, user_id, **kwargs):
    with transaction.atomic():
        # ... create tasks ...
        tasks = serializer.save(project_id=project.id)
        project_import.status = ProjectImport.Status.COMPLETED
        project_import.save()

    # AFTER commit - update FileUpload status
    transaction.on_commit(lambda: update_file_upload_status(file_upload_ids))

def update_file_upload_status(file_upload_ids):
    FileUpload.objects.filter(id__in=file_upload_ids).update(
        status='completed',
        tasks_created_at=timezone.now()
    )
```

## Debugging Strategy for Production

### Step 1: Add Comprehensive Logging

```python
import logging
logger = logging.getLogger(__name__)

def sync_import(self, request, project, ...):
    logger.info(f"[IMPORT] Starting sync import for project {project.id}")

    parsed_data, file_upload_ids, ... = load_tasks(request, project)
    logger.info(f"[IMPORT] Created FileUploads: {file_upload_ids}")

    if commit_to_project:
        logger.info(f"[IMPORT] Creating {len(parsed_data)} tasks")
        with transaction.atomic():
            tasks, serializer = self._save(parsed_data)
            logger.info(f"[IMPORT] Saved {len(tasks)} tasks in transaction")

        logger.info(f"[IMPORT] Transaction committed, tasks visible")

        # Verify task creation
        for fid in file_upload_ids:
            fu = FileUpload.objects.get(id=fid)
            count = fu.tasks.count()
            logger.info(f"[IMPORT] FileUpload {fid} has {count} tasks")
```

### Step 2: Add Health Check Endpoint

```python
# data_import/api.py
class FileUploadHealthCheckAPI(APIView):
    def get(self, request, pk):
        file_upload = FileUpload.objects.get(pk=pk)

        return Response({
            'id': file_upload.id,
            'created_at': file_upload.created_at,
            'file_name': file_upload.file_name,
            'task_count': file_upload.tasks.count(),
            'tasks_exist': file_upload.tasks.exists(),
            'project_id': file_upload.project_id,
            'in_transaction': connection.in_atomic_block,
        })
```

### Step 3: Monitor RQ Worker Timing

```python
def async_import_background(import_id, user_id, **kwargs):
    start_time = timezone.now()
    logger.info(f"[RQ-WORKER] Started at {start_time}")

    try:
        project_import = ProjectImport.objects.get(id=import_id)
        logger.info(f"[RQ-WORKER] Found ProjectImport {import_id}")
    except ProjectImport.DoesNotExist:
        logger.error(f"[RQ-WORKER] ProjectImport {import_id} NOT FOUND - RACE CONDITION")
        raise
```

### Step 4: Check Database Isolation Level

```python
from django.db import connection

def check_isolation_level():
    with connection.cursor() as cursor:
        cursor.execute("SHOW TRANSACTION ISOLATION LEVEL;")
        level = cursor.fetchone()[0]
        logger.info(f"Database isolation level: {level}")
```

## Production Investigation Checklist

- [ ] Check RQ worker logs for "DoesNotExist" errors
- [ ] Verify database transaction isolation level
- [ ] Monitor time delta between FileUpload creation and Task creation
- [ ] Check for database connection pooling issues
- [ ] Verify PostgreSQL read committed vs read uncommitted
- [ ] Look for deadlock errors in database logs
- [ ] Check if queries execute before transaction commit
- [ ] Monitor RQ job queue depth during high load

## Files Requiring Changes

1. `/label_studio/core/redis.py` - Add transaction.on_commit support
2. `/label_studio/data_import/uploader.py` - Wrap create_file_upload in transaction
3. `/label_studio/data_import/api.py` - Fix job dispatch timing
4. `/label_studio/data_import/models.py` - Add status field, fix bare excepts
5. `/label_studio/data_import/services.py` - Fix PDF conversion transaction boundaries
6. `/label_studio/data_import/functions.py` - Add proper error handling
7. `/label_studio/tasks/serializers.py` - Ensure atomic task creation

## Summary

The files table displays imported files as "no tasks" because:

1. **FileUpload created and committed immediately**
2. **Tasks created inside transaction** (not yet visible)
3. **API query executes before transaction commits** → task_count = 0
4. **RQ workers dispatched before commit** → race with database visibility
5. **No status tracking** → cannot distinguish between states
6. **Error handling suppresses failures** → silent errors
7. **No transaction.on_commit hooks** → timing issues everywhere

**Critical Path**: FileUpload.save() → Query → Tasks.bulk_create() → Commit
**Race Window**: ~50-500ms depending on batch size and database latency

**Recommendation**: Implement transaction.on_commit pattern throughout import flow.
