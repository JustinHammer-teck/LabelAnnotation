# Implementation Plan: Fix Async Race Conditions in File Import Flow

## Executive Summary

Production file imports display "no tasks" due to critical race conditions between FileUpload creation, Task creation, and RQ worker job dispatch. The core issue: FileUpload records commit immediately while Task records commit later, causing queries to return task_count=0. Additionally, RQ jobs dispatch before transaction commits, leading to worker query failures.

This plan phases fixes by criticality and risk, prioritizing immediate production stabilization followed by comprehensive architectural improvements. Estimated total effort: 3-4 days with gradual rollout strategy.

## Problem Statement

**Root Cause**: Seven interconnected race conditions in the file import flow:

1. **Transaction boundary mismatch**: FileUpload commits immediately, Tasks commit later
2. **RQ dispatch timing**: Jobs enqueued before database commits
3. **PDF parallel processing**: N parallel jobs create inconsistent state
4. **Missing transaction hooks**: No `transaction.on_commit()` usage
5. **No status tracking**: Cannot distinguish processing states
6. **Cache invalidation bug**: task_count cache never refreshes
7. **Missing response data**: Frontend doesn't know what to poll

**Impact**: Files appear with 0 tasks despite successful import. Race window: 50-500ms depending on batch size.

**Reference**: `/home/moritzzmn/projects/labelstudio/project_note/investigation-async-race-conditions.md`

---

## Implementation Phases

### Phase 1: Critical Fixes (Priority: CRITICAL | Effort: 1 day)

**Goal**: Eliminate race conditions preventing task display

**Rationale**: These fixes directly address the production bug with minimal risk and immediate impact.

#### Fix 1.1: Add transaction.on_commit() to RQ Dispatcher

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/core/redis.py`

**Changes**:
```python
def start_job_async_or_sync(job, *args, in_seconds=0, **kwargs):
    use_on_commit = kwargs.pop('use_on_commit', True)

    def _enqueue():
        redis = redis_connected() and kwargs.get('redis', True)
        queue_name = kwargs.get('queue_name', 'default')
        # ... existing enqueue logic ...

    if use_on_commit and connection.in_atomic_block:
        transaction.on_commit(_enqueue)
    else:
        return _enqueue()
```

**Risk**: Low - backwards compatible with opt-out flag
**Testing**: Unit tests + integration tests for atomic block detection
**Success Criteria**: RQ jobs execute only after transaction commits

#### Fix 1.2: Wrap FileUpload Creation in Transaction

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/uploader.py`

**Changes**:
- Wrap `create_file_upload()` in `transaction.atomic()`
- Move PDF processing dispatch to `transaction.on_commit()`
- Ensure Task creation occurs in same transaction

**Risk**: Low - contained change with clear boundaries
**Testing**: Test FileUpload + Task atomicity, verify rollback behavior
**Success Criteria**: FileUpload and initial Tasks visible together

#### Fix 1.3: Fix async_import Job Dispatch Timing

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/api.py:376-387`

**Changes**:
```python
def async_import(self, request, project, ...):
    with transaction.atomic():
        project_import = ProjectImport.objects.create(...)
        file_upload_ids, could_be_tasks_list = create_file_uploads(...)
        project_import.file_upload_ids = file_upload_ids
        project_import.save()

    # Dispatch AFTER transaction commits
    transaction.on_commit(
        lambda: start_job_async_or_sync(
            async_import_background,
            project_import.id,
            queue_name='high',
        )
    )
```

**Risk**: Low - fixes existing race condition
**Testing**: Verify ProjectImport visible to worker, test worker query timing
**Success Criteria**: Worker finds ProjectImport on first query attempt

#### Fix 1.4: Remove task_count Cache Bug

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/models.py:69-73`

**Changes**:
```python
@property
def task_count(self):
    # Remove cache - always query fresh count
    return self.tasks.count()
```

**Risk**: Very Low - performance impact negligible (already uses prefetch_related)
**Testing**: Verify count updates after task creation
**Success Criteria**: task_count reflects current database state

**Phase 1 Effort**: 8 hours development + 4 hours testing

**Phase 1 Success Criteria**:
- [ ] RQ jobs dispatch only after commit
- [ ] FileUpload + Task creation atomic
- [ ] task_count property returns fresh data
- [ ] No "DoesNotExist" errors in worker logs
- [ ] Files display correct task counts in UI

**Phase 1 Rollback Plan**:
- Revert `use_on_commit` default to `False`
- Keep transaction wrappers but remove `on_commit` calls
- Restore cache property if performance degrades

---

### Phase 2: High-Priority Improvements (Priority: HIGH | Effort: 1 day)

**Goal**: Add observability and error handling

#### Fix 2.1: Add Comprehensive Logging

**Files**:
- `/home/moritzzmn/projects/labelstudio/label_studio/data_import/api.py`
- `/home/moritzzmn/projects/labelstudio/label_studio/data_import/functions.py`
- `/home/moritzzmn/projects/labelstudio/label_studio/data_import/uploader.py`

**Changes**:
```python
logger.info(f"[IMPORT] Starting sync import for project {project.id}")
logger.info(f"[IMPORT] Created FileUploads: {file_upload_ids}")
logger.info(f"[IMPORT] Creating {len(parsed_data)} tasks")
logger.info(f"[IMPORT] Transaction committed, verifying task counts")

for fid in file_upload_ids:
    count = FileUpload.objects.get(id=fid).tasks.count()
    logger.info(f"[IMPORT] FileUpload {fid} has {count} tasks")
```

**Risk**: Very Low - logging only
**Testing**: Log output validation, performance impact check
**Success Criteria**: Can trace import flow end-to-end in logs

#### Fix 2.2: Replace Bare Except Clauses

**Files**:
- `/home/moritzzmn/projects/labelstudio/label_studio/data_import/models.py:12, 62`
- `/home/moritzzmn/projects/labelstudio/label_studio/data_import/uploader.py:84-88`

**Changes**:
```python
# BEFORE: except:
# AFTER:
except (ImportError, ModuleNotFoundError):
    import json

except (AttributeError, IndexError, OSError) as e:
    logger.warning(f"Failed to get file format: {e}")
```

**Risk**: Low - may expose previously hidden errors (good)
**Testing**: Test with malformed files, verify error messages
**Success Criteria**: Specific exceptions logged, no silent failures

#### Fix 2.3: Add Error Handling to PDF Processing

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/uploader.py`

**Changes**:
```python
if settings.OCR_ENABLED:
    try:
        process_pdf_if_needed(instance)
    except Exception as e:
        logger.error(f'PDF processing failed: {e}', exc_info=True)
        instance.status = 'failed'
        instance.error_message = str(e)
        instance.save(update_fields=['status', 'error_message'])
        raise  # Re-raise to propagate failure
```

**Risk**: Medium - changes error propagation behavior
**Testing**: Test PDF failures, verify rollback, check error display
**Success Criteria**: PDF failures don't leave orphaned records

#### Fix 2.4: Add Database Isolation Level Check

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/core/utils/common.py`

**Changes**:
```python
def check_db_isolation_level():
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SHOW TRANSACTION ISOLATION LEVEL;")
        level = cursor.fetchone()[0]
        logger.info(f"Database isolation level: {level}")
        return level
```

**Risk**: Very Low - diagnostic only
**Testing**: Run on PostgreSQL and SQLite
**Success Criteria**: Log confirms READ COMMITTED isolation

**Phase 2 Effort**: 6 hours development + 2 hours testing

**Phase 2 Success Criteria**:
- [ ] All import operations logged with timestamps
- [ ] No bare except clauses in import flow
- [ ] PDF failures properly logged and handled
- [ ] Database isolation level verified

**Phase 2 Rollback Plan**:
- Remove logging statements if performance degrades
- Revert error handling if causes unexpected failures
- Diagnostic functions can remain

---

### Phase 3: Status Tracking & State Management (Priority: MEDIUM | Effort: 1.5 days)

**Goal**: Add explicit status field for reliable state tracking

#### Fix 3.1: Add Status Field to FileUpload Model

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/models.py`

**Changes**:
```python
class FileUpload(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
        help_text='Processing status of the file upload'
    )
    tasks_created_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When tasks were successfully created'
    )
    error_message = models.TextField(
        null=True,
        blank=True,
        help_text='Error message if processing failed'
    )
```

**Migration**:
```python
# Migration: 0006_fileupload_status_tracking.py
operations = [
    migrations.AddField(
        model_name='fileupload',
        name='status',
        field=models.CharField(
            choices=[...],
            default='pending',
            max_length=20,
            db_index=True,
        ),
    ),
    migrations.AddField(...),  # tasks_created_at
    migrations.AddField(...),  # error_message
    # Backfill existing records
    migrations.RunPython(backfill_status_field),
]

def backfill_status_field(apps, schema_editor):
    FileUpload = apps.get_model('data_import', 'FileUpload')
    for fu in FileUpload.objects.all():
        if fu.tasks.exists():
            fu.status = 'completed'
            fu.tasks_created_at = fu.created_at
        else:
            fu.status = 'pending'
        fu.save(update_fields=['status', 'tasks_created_at'])
```

**Risk**: Medium - schema migration on production table
**Testing**: Test migration on copy of production data, verify backfill
**Success Criteria**: Status field accurately reflects processing state

#### Fix 3.2: Update Status on Task Creation

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/api.py`

**Changes**:
```python
def sync_import(self, request, project, ...):
    if commit_to_project:
        with transaction.atomic():
            tasks, serializer = self._save(parsed_data)

            # Mark FileUploads as completed
            FileUpload.objects.filter(id__in=file_upload_ids).update(
                status=FileUpload.STATUS_COMPLETED,
                tasks_created_at=timezone.now()
            )
```

**Risk**: Low - status update in same transaction
**Testing**: Verify status transitions, test failure rollback
**Success Criteria**: Status transitions from pending → completed atomically

#### Fix 3.3: Update Serializer to Include Status

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/serializers.py`

**Changes**:
```python
class FileUploadListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileUpload
        fields = [
            'id', 'file', 'file_name', 'created_at',
            'task_count', 'annotation_status',
            'status', 'tasks_created_at', 'error_message',  # New fields
            'is_parent_document'
        ]
```

**Risk**: Low - additive change
**Testing**: API response validation
**Success Criteria**: Frontend receives status field

#### Fix 3.4: Frontend Status Handling

**File**: `/home/moritzzmn/projects/labelstudio/web/apps/labelstudio/src/pages/DataManager/FileManager/FileTable.tsx`

**Changes**:
- Display "Processing..." for `status=processing`
- Display "Failed: {error_message}" for `status=failed`
- Poll for updates when `status=pending`

**Risk**: Low - improves UX
**Testing**: Manual testing of all status states
**Success Criteria**: Clear visual feedback for all states

**Phase 3 Effort**: 8 hours development + 4 hours testing + 2 hours migration

**Phase 3 Success Criteria**:
- [ ] Migration runs successfully on production data
- [ ] Status field updates atomically with task creation
- [ ] Frontend displays processing state accurately
- [ ] Failed imports show error messages
- [ ] Pending imports trigger polling

**Phase 3 Rollback Plan**:
- Status field can be ignored if migration fails
- Default value allows backward compatibility
- Frontend can gracefully handle missing field

---

### Phase 4: Testing & Validation (Priority: HIGH | Effort: 0.5 days)

**Goal**: Comprehensive test coverage for race conditions

#### Test 4.1: Unit Tests

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/tests/test_race_conditions.py` (new)

**Test Cases**:
```python
class TestRaceConditions(TestCase):
    def test_transaction_on_commit_wrapper(self):
        """Verify start_job_async_or_sync respects transaction boundaries"""

    def test_fileupload_task_atomic_creation(self):
        """Verify FileUpload and Tasks created in same transaction"""

    def test_task_count_reflects_current_state(self):
        """Verify task_count property returns fresh count"""

    def test_rq_job_executes_after_commit(self):
        """Verify RQ jobs don't execute before transaction commit"""

    def test_pdf_processing_transaction_boundaries(self):
        """Verify PDF child files created atomically"""

    def test_status_transitions(self):
        """Verify status transitions: pending → processing → completed"""

    def test_concurrent_task_creation(self):
        """Verify no race conditions with concurrent imports"""
```

**Effort**: 3 hours
**Success Criteria**: All tests pass, >90% coverage on changed code

#### Test 4.2: Integration Tests

**File**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/tests/test_api.py`

**Test Cases**:
```python
def test_sync_import_transaction_atomicity(self):
    """Full sync import with transaction verification"""

def test_async_import_worker_timing(self):
    """Verify worker doesn't execute before commit"""

def test_pdf_import_parallel_processing(self):
    """Test PDF with multiple pages imports correctly"""

def test_import_failure_rollback(self):
    """Verify transaction rollback on failure"""
```

**Effort**: 2 hours
**Success Criteria**: Integration tests cover full import flow

#### Test 4.3: Load Testing

**Tool**: Locust or Django test runner with concurrent threads

**Test Scenarios**:
- 100 concurrent file uploads
- Large batch import (1000+ tasks)
- PDF with 50+ pages
- Mixed file formats
- Rapid sequential imports

**Metrics to Monitor**:
- Race condition occurrence rate
- Task count accuracy
- RQ job success rate
- Transaction deadlock count
- Database connection pool usage

**Effort**: 2 hours
**Success Criteria**: Zero race conditions under load

**Phase 4 Effort**: 4 hours

**Phase 4 Success Criteria**:
- [ ] Unit test coverage >90% on changed files
- [ ] Integration tests pass consistently
- [ ] Load tests show zero race conditions
- [ ] No performance regressions

---

### Phase 5: Deployment & Monitoring (Priority: CRITICAL | Effort: 0.5 days)

**Goal**: Safe production rollout with observability

#### Step 5.1: Pre-Deployment Checklist

- [ ] All tests passing on CI/CD
- [ ] Database migration dry-run successful
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboards configured
- [ ] Feature flag enabled (if using)

#### Step 5.2: Database Migration Strategy

**Approach**: Zero-downtime migration

1. **Phase A - Add Columns** (backward compatible):
   ```sql
   ALTER TABLE data_import_fileupload
   ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
   ADD COLUMN tasks_created_at TIMESTAMP NULL,
   ADD COLUMN error_message TEXT NULL;

   CREATE INDEX fileupload_status_idx ON data_import_fileupload(status);
   ```

2. **Phase B - Backfill Data** (background job):
   ```python
   # Run as RQ job to avoid blocking
   start_job_async_or_sync(
       backfill_fileupload_status,
       queue_name='low',
       job_timeout=3600
   )
   ```

3. **Phase C - Deploy Code** (uses new columns)
4. **Phase D - Verify** (monitor for 24 hours)

**Effort**: 2 hours
**Risk**: Low - additive changes only

#### Step 5.3: Gradual Rollout Plan

**Stage 1 - Canary** (10% traffic, 2 hours):
- Deploy to single app server
- Monitor error rates, task count accuracy
- Rollback trigger: Error rate >1% OR task count mismatches >5%

**Stage 2 - Partial** (50% traffic, 12 hours):
- Deploy to half of app servers
- Monitor RQ job success rate, transaction deadlocks
- Rollback trigger: RQ job failure rate >2% OR deadlock count >10/hour

**Stage 3 - Full** (100% traffic, ongoing):
- Deploy to all servers
- Monitor for 48 hours
- Keep rollback plan ready for 1 week

**Effort**: 2 hours monitoring

#### Step 5.4: Monitoring & Alerts

**Metrics to Track**:
```python
# Custom Django management command
class Command(BaseCommand):
    def handle(self):
        # FileUpload status distribution
        status_counts = FileUpload.objects.values('status').annotate(count=Count('id'))

        # Files stuck in processing (>10 minutes)
        stuck_files = FileUpload.objects.filter(
            status='processing',
            created_at__lt=timezone.now() - timedelta(minutes=10)
        ).count()

        # Task count mismatches
        mismatches = FileUpload.objects.annotate(
            db_task_count=Count('tasks')
        ).exclude(
            status='completed',
            db_task_count__gt=0
        ).count()

        # Log metrics for monitoring system
        logger.info(f"FileUpload status: {status_counts}")
        logger.info(f"Stuck files: {stuck_files}")
        logger.info(f"Count mismatches: {mismatches}")
```

**Alerts**:
- **Critical**: Stuck files >10 (10 min window)
- **Warning**: Task count mismatches >5 (1 hour window)
- **Info**: Status distribution anomalies

**Dashboard**:
- FileUpload status distribution (pie chart)
- Task creation timing histogram
- RQ job success rate (time series)
- Transaction commit duration (percentiles)

**Effort**: 2 hours setup

**Phase 5 Success Criteria**:
- [ ] Migration completes without errors
- [ ] Zero downtime during deployment
- [ ] Error rate remains <0.1%
- [ ] Task count accuracy 100%
- [ ] No stuck files after 24 hours
- [ ] Monitoring dashboards operational

**Phase 5 Rollback Plan**:

**Immediate Rollback** (if critical issues):
```bash
# 1. Deploy previous code version
git revert <commit-hash>
git push production

# 2. Disable new code paths via feature flag
python manage.py set_feature_flag async_race_fix_enabled False

# 3. Monitor recovery
tail -f /var/log/labelstudio/import.log
```

**Database Rollback** (if needed):
```sql
-- Status field can remain (backward compatible default)
-- No data loss, new code will repopulate

-- If must remove (not recommended):
ALTER TABLE data_import_fileupload DROP COLUMN status;
ALTER TABLE data_import_fileupload DROP COLUMN tasks_created_at;
ALTER TABLE data_import_fileupload DROP COLUMN error_message;
```

---

## Risk Assessment & Mitigation

### High Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration fails on large table | Low | High | Test on production data copy, use pt-online-schema-change |
| transaction.on_commit breaks existing flows | Low | Critical | Comprehensive testing, feature flag rollout |
| Performance degradation from transaction overhead | Medium | Medium | Benchmark before/after, optimize transaction scope |

### Medium Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Backfill job takes too long | Medium | Low | Run during low-traffic period, batch processing |
| Status field conflicts with existing logic | Low | Medium | Code review, integration tests |
| Logging overhead impacts performance | Low | Low | Use async logging, adjust log levels |

### Low Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Frontend doesn't handle new status field | Very Low | Low | Graceful degradation, default values |
| Error messages expose sensitive data | Low | Low | Sanitize error messages |

---

## Dependencies & Constraints

### Technical Dependencies

1. **Django Transaction Support**: Requires PostgreSQL (READ COMMITTED isolation)
2. **RQ Worker Version**: Must support job cancellation
3. **Database Connection Pool**: Sufficient connections for transaction duration
4. **Redis Availability**: Required for RQ job dispatch

### Constraints

1. **Zero Downtime Requirement**: Migration must be additive only
2. **Backward Compatibility**: API must support old clients
3. **Performance Budget**: <10% overhead on import operations
4. **Database Size**: FileUpload table may have millions of rows

### External Dependencies

1. **Frontend Changes**: Phase 3 requires frontend deployment
2. **Monitoring Infrastructure**: Phase 5 requires metrics collection
3. **CI/CD Pipeline**: Must support gradual rollout

---

## Timeline & Milestones

### Week 1

**Day 1 - Phase 1 (Critical Fixes)**
- Morning: Implement transaction.on_commit wrapper
- Afternoon: Fix FileUpload/Task atomicity
- Evening: Testing and verification

**Day 2 - Phase 2 (Logging & Error Handling)**
- Morning: Add comprehensive logging
- Afternoon: Replace bare except clauses
- Evening: Error handling improvements

**Day 3 - Phase 3 (Status Field)**
- Morning: Design and implement migration
- Afternoon: Update serializers and API
- Evening: Frontend integration (coordinate with frontend team)

**Day 4 - Phase 4 (Testing)**
- Morning: Unit tests
- Afternoon: Integration and load tests
- Evening: Bug fixes from testing

**Day 5 - Phase 5 (Deployment)**
- Morning: Database migration execution
- Afternoon: Canary deployment
- Evening: Monitoring and verification

### Week 2

**Day 6-7 - Monitoring Period**
- Monitor production metrics
- Address any edge cases
- Performance tuning

---

## Monitoring & Validation Strategy

### Pre-Deployment Validation

```python
# Management command: validate_import_flow.py
class Command(BaseCommand):
    def handle(self):
        # Test 1: Verify transaction.on_commit works
        with transaction.atomic():
            fu = FileUpload.objects.create(...)
            assert connection.in_atomic_block

        # Test 2: Verify RQ dispatcher detects transactions
        result = start_job_async_or_sync(test_job, use_on_commit=True)
        assert result is None  # Job deferred

        # Test 3: Verify status field exists
        assert hasattr(FileUpload, 'status')

        self.stdout.write(self.style.SUCCESS('Validation passed'))
```

### Post-Deployment Validation

**Automated Checks** (run every 5 minutes):
```python
# Healthcheck endpoint: /api/health/import-flow
{
    "status": "healthy",
    "checks": {
        "task_count_accuracy": "pass",  # No mismatches
        "stuck_files": 0,
        "rq_job_success_rate": 0.998,
        "avg_import_duration_ms": 850
    }
}
```

**Manual Validation** (first 24 hours):
- [ ] Upload test file, verify tasks appear immediately
- [ ] Check logs for transaction commit timing
- [ ] Verify no RQ worker errors
- [ ] Test PDF import (multi-page)
- [ ] Test concurrent imports (10 simultaneous)
- [ ] Check database for orphaned FileUploads

### Success Metrics

**Primary Metrics**:
- **Task Count Accuracy**: 100% (zero mismatches)
- **Import Success Rate**: >99.9% (currently ~95%)
- **Race Condition Rate**: 0% (currently ~5-10%)
- **Time to Display**: <500ms p95 (currently inconsistent)

**Secondary Metrics**:
- **RQ Job Success Rate**: >99% (currently ~97%)
- **Transaction Commit Duration**: <100ms p95
- **Database Lock Contention**: <5 locks/hour
- **Error Rate**: <0.1%

**Observability Metrics**:
- Log volume increase: <20%
- Monitoring overhead: <1% CPU
- Storage overhead: ~50MB for status field (estimated)

---

## Appendix: Code Changes Summary

### Files Modified (7 files)

1. **`/home/moritzzmn/projects/labelstudio/label_studio/core/redis.py`**
   - Add `transaction.on_commit()` support
   - ~20 lines added

2. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/uploader.py`**
   - Wrap `create_file_upload` in transaction
   - Move PDF dispatch to `on_commit`
   - ~15 lines modified

3. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/api.py`**
   - Fix `async_import` dispatch timing
   - Add comprehensive logging
   - Update status on task creation
   - ~40 lines modified

4. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/models.py`**
   - Add status, tasks_created_at, error_message fields
   - Remove task_count cache
   - Replace bare excepts
   - ~30 lines added, ~10 modified

5. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/serializers.py`**
   - Add status fields to serializer
   - ~5 lines modified

6. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/functions.py`**
   - Add logging and error handling
   - ~20 lines modified

7. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py`**
   - Fix PDF processing transactions
   - ~15 lines modified

### Files Added (3 files)

1. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/migrations/0006_fileupload_status_tracking.py`**
   - Migration for status fields
   - ~100 lines

2. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/tests/test_race_conditions.py`**
   - Comprehensive race condition tests
   - ~300 lines

3. **`/home/moritzzmn/projects/labelstudio/label_studio/data_import/management/commands/validate_import_flow.py`**
   - Validation command
   - ~100 lines

### Database Schema Changes

```sql
ALTER TABLE data_import_fileupload
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL,
ADD COLUMN tasks_created_at TIMESTAMP NULL,
ADD COLUMN error_message TEXT NULL;

CREATE INDEX fileupload_status_idx ON data_import_fileupload(status);
```

**Estimated Schema Impact**:
- Column additions: 3
- Index additions: 1
- Estimated storage: ~50MB (for 1M records)
- Migration duration: ~5 minutes (for 1M records)

---

## Conclusion

This plan systematically eliminates all seven identified race conditions through:

1. **Phase 1**: Immediate fixes to transaction boundaries and job dispatch timing
2. **Phase 2**: Observability improvements for debugging and monitoring
3. **Phase 3**: Explicit state management for reliable tracking
4. **Phase 4**: Comprehensive testing to prevent regressions
5. **Phase 5**: Safe production deployment with monitoring

**Total Effort**: 3-4 days (1 developer)
**Risk Level**: Low-Medium (mitigated through gradual rollout)
**Expected Impact**: 100% task count accuracy, zero race conditions

**Next Steps**:
1. Review and approve plan
2. Begin Phase 1 implementation
3. Schedule deployment window for migration
4. Coordinate frontend changes for Phase 3
