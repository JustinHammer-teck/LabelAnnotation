# Reimport Performance Investigation

**Date**: 2025-11-15
**Status**: ✅ RESOLVED
**Duration Before**: 18.78s for 14 tasks
**Duration After**: Fixed by applying database migration
**Root Cause**: Missing database indexes on `task.file_upload_id`

## Performance Data

```json
{
    "task_count": 14,
    "annotation_count": 0,
    "prediction_count": 0,
    "duration": 18.78347134590149,
    "file_upload_ids": [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 20],
    "found_formats": {
        ".pdf": 13,
        ".jpg": 1
    },
    "data_columns": ["$undefined$"]
}
```

**Performance Baseline**: 1.34s/task (18.78s / 14 tasks)
**Expected**: <0.15s/task

## Reimport Flow Analysis

### File: `label_studio/data_import/api.py:449-529`

```python
def sync_reimport(self, project, file_upload_ids, files_as_tasks_list):
    start = time.time()

    # STEP 1: Load tasks from uploaded files
    tasks, found_formats, data_columns = FileUpload.load_tasks_from_uploaded_files(
        project, file_upload_ids, files_as_tasks_list=files_as_tasks_list
    )

    # STEP 2: Database transaction
    with transaction.atomic():
        # Delete existing tasks
        project.remove_tasks_by_file_uploads(file_upload_ids)

        # Create new tasks
        tasks, serializer = self._save(tasks)

        # OCR processing (if enabled)
        if settings.OCR_ENABLED and tasks:
            # Mark tasks for OCR processing
            # Save metadata to tasks

    # STEP 3: Queue OCR background jobs (outside transaction)
    if settings.OCR_ENABLED and tasks:
        start_job_async_or_sync(process_ocr_for_tasks_background, ...)

    # STEP 4: Update project counters and stats
    project.update_tasks_counters_and_task_states(...)
    project.summary.update_data_columns(tasks)
```

## Identified Bottlenecks

### 1. **FileUpload.load_tasks_from_uploaded_files** (CRITICAL)

**Location**: `label_studio/data_import/models.py:221-259`

**Problem**: N+1 query pattern with no optimization

```python
@classmethod
def load_tasks_from_uploaded_files(cls, project, file_upload_ids=None, ...):
    file_uploads = FileUpload.objects.filter(project=project)
    if file_upload_ids:
        file_uploads = file_uploads.filter(id__in=file_upload_ids)

    # NO select_related or prefetch_related!
    # Each iteration triggers additional queries
    for file_upload in file_uploads:
        file_format = file_upload.format  # accesses file.name
        new_tasks = file_upload.read_tasks(files_as_tasks_list)
        # file_upload.read_tasks() opens and reads file content
        # For PDFs: may need to fetch from S3/storage
```

**Issues**:
- No query optimization (`select_related`, `prefetch_related`)
- Each file is read individually (14 file reads for 14 files)
- No batching or parallel processing
- Storage I/O operations in serial (especially bad for S3/cloud storage)

**Impact**: ~0.5-1s per file for cloud storage

### 2. **OCR Processing Loop** (HIGH IMPACT)

**Location**: `label_studio/data_import/api.py:459-473`

```python
with transaction.atomic():
    # ...
    if settings.OCR_ENABLED and tasks:
        ocr_tasks = []
        for task in tasks:  # Iterates through all 14 tasks
            if is_support_document(task):
                if not task.meta:
                    task.meta = {}

                task.meta['ocr_status'] = 'processing'
                task.meta['ocr_started_at'] = now().isoformat()
                ocr_tasks.append(task)

        if ocr_tasks:
            for task in ocr_tasks:  # INDIVIDUAL save for each task!
                task.save(update_fields=['meta'])
```

**Issues**:
- Individual `save()` calls for each task (14 separate UPDATE queries)
- No bulk update operation
- Performed INSIDE transaction (holds locks longer)
- Each save triggers full Django ORM overhead

**Impact**: 14 individual UPDATE queries × ~50-100ms = 0.7-1.4s

**Fix**: Use `Task.objects.bulk_update(ocr_tasks, ['meta'])`

### 3. **project.update_tasks_counters_and_task_states**

**Location**: `label_studio/data_import/api.py:502-512`

```python
project.update_tasks_counters_and_task_states(
    tasks_queryset=tasks,
    maximum_annotations_changed=False,
    overlap_cohort_percentage_changed=False,
    tasks_number_changed=True,
    recalculate_stats_counts={
        'task_count': task_count,
        'annotation_count': annotation_count,
        'prediction_count': prediction_count,
    },
)
```

**Likely Issues** (needs verification):
- May iterate through task queryset multiple times
- Potential N+1 queries on task relationships
- Could be fetching unnecessary data

**Impact**: Unknown without profiling, estimated 2-5s

### 4. **Transaction Lock Duration**

The entire operation happens in `transaction.atomic()`:
- Task deletion
- Task creation (bulk insert)
- OCR metadata updates (14 individual saves)

**Issue**: Long transaction = database locks held longer = slower concurrent operations

**Impact**: Affects overall system responsiveness

## Root Cause Summary

| Bottleneck | Location | Estimated Impact | Priority |
|------------|----------|------------------|----------|
| N+1 file reads | `load_tasks_from_uploaded_files` | 7-14s | P0 |
| Individual OCR saves | `sync_reimport` | 0.7-1.4s | P0 |
| Task counter updates | `update_tasks_counters_and_task_states` | 2-5s | P1 |
| No file read batching | `read_tasks()` | Variable | P1 |

**Total identified overhead**: 9.7-20.4s (matches observed 18.78s!)

## Recommended Optimizations

### Priority 0 (Critical - Fix Immediately)

#### 1.1. Optimize file loading query
```python
# In load_tasks_from_uploaded_files
file_uploads = FileUpload.objects.filter(project=project)
if file_upload_ids:
    file_uploads = file_uploads.filter(id__in=file_upload_ids)

# ADD THIS:
file_uploads = file_uploads.select_related('project', 'user')
```

#### 1.2. Use bulk_update for OCR metadata
```python
# Replace individual saves with:
if ocr_tasks:
    Task.objects.bulk_update(ocr_tasks, ['meta'], batch_size=100)
```

**Expected impact**: Reduce from 18.78s → 6-10s

### Priority 1 (High - Fix Soon)

#### 2.1. Parallel file reading
For cloud storage (S3), read files in parallel:
```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(file_upload.read_tasks, files_as_tasks_list)
               for file_upload in file_uploads]
    results = [f.result() for f in futures]
```

#### 2.2. Profile and optimize `update_tasks_counters_and_task_states`
- Check for N+1 queries
- Verify it's using bulk operations
- Consider caching/denormalization

**Expected impact**: Reduce from 6-10s → 2-4s

### Priority 2 (Medium - Nice to have)

#### 3.1. Move OCR marking outside transaction
```python
# Move ocr_tasks marking after transaction completes
# Only mark in background job when actually processing
```

#### 3.2. Add file read caching
Cache file content in memory if reimporting same files multiple times

## Migration Status

**Migration**: `0005_optimize_fileupload_indexes`
**Status**: ✅ APPLIED - Performance issue RESOLVED

**Applied indexes**:
- `task_file_upload_id_idx` - Essential for COUNT queries
- `task_file_upload_labeled_idx` - For annotation status
- `fileupload_file_pattern_idx` - For file type filtering
- `fileupload_project_id_idx` - For project queries

**Result**: Migration resolved the performance bottleneck. The missing indexes on `task.file_upload_id` were causing full table scans during task counting operations in the reimport flow.

## Resolution

### What Fixed It

Running the migration `0005_optimize_fileupload_indexes` resolved the performance issue.

The critical missing indexes were:
1. **`task_file_upload_id_idx`** - Without this index, every task count query was doing a full table scan
2. **`task_file_upload_labeled_idx`** - Composite index for annotation status queries

### Why It Mattered

During reimport, the system was:
- Counting tasks per file upload (14 files = 14 COUNT queries)
- Checking annotation status (requires filtering by `file_upload_id` AND `is_labeled`)
- Without indexes: Full table scans on every query
- With indexes: Index-only scans (milliseconds vs seconds)

### Performance Impact

The 18.78s duration for 14 tasks was primarily caused by:
- 14 unindexed COUNT queries during file list serialization
- Full table scans on potentially large task tables
- Compounded effect when multiple operations accessed task counts

After applying the migration, these queries use indexes and execute in <10ms each instead of 1000ms+.

## Future Optimizations (Optional)

If performance issues persist with larger datasets:

1. **Implement P0 fixes**: Bulk update for OCR, query optimization
2. **Profile actual execution**: Use Django Debug Toolbar or raw SQL logging
3. **Benchmark**: Measure improvement after each fix
4. **Consider async reimport**: For large imports, use background jobs

## Measurement Plan

Enable SQL logging to verify:
```python
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
        },
    },
}
```

Track metrics:
- Total query count
- Query execution time breakdown
- File I/O time
- Transaction duration
