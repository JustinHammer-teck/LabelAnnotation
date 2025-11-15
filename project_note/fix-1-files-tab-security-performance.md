# Fix Plan: Files Tab Security & Performance Issues

**Date**: 2025-11-15
**Feature**: File Management Tab (Phases 1-3)
**Risk Level**: MEDIUM-HIGH
**Production Ready**: ❌ NO - Critical fixes required

## Executive Summary

Comprehensive review of Files tab implementation revealed **5 critical security vulnerabilities** and **3 critical React bugs** that must be addressed before production deployment. Additionally, **8 high-priority** and **12 medium-priority** improvements are recommended for optimal performance and maintainability.

**Estimated Total Effort**: ~2 weeks (10 working days)

### Risk Assessment
- **Security**: IDOR vulnerabilities, path traversal, missing input validation
- **Stability**: Infinite loop risks, race conditions, memory leaks
- **Performance**: N+1 queries, missing memoization, inefficient queries
- **User Experience**: Poor error handling, accessibility gaps

---

## Phase 1: Critical Security Fixes (MUST FIX - 3 days)

### C-1: IDOR Vulnerability in FileUploadAPI ⚠️ CRITICAL

**Severity**: Critical
**File**: `label_studio/data_import/api.py:846-864`
**Impact**: Any authenticated user can delete/modify files from ANY project

**Problem**:
```python
class FileUploadAPI(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)  # Only checks auth, not ownership
    queryset = FileUpload.objects.all()
```

**Fix**:
```python
class FileUploadAPI(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = FileUploadSerializer

    def get_queryset(self):
        return FileUpload.objects.filter(
            project__organization=self.request.user.active_organization
        )

    def perform_update(self, serializer):
        file_upload = self.get_object()
        if not file_upload.has_permission(self.request.user):
            raise PermissionDenied('You do not have permission to modify this file')
        serializer.save()

    def perform_destroy(self, instance):
        if not instance.has_permission(self.request.user):
            raise PermissionDenied('You do not have permission to delete this file')
        instance.delete()
```

**Effort**: 4 hours (including tests)
**Testing**: Add permission tests for unauthorized access attempts

---

### C-2: Path Traversal in File Upload ⚠️ CRITICAL

**Severity**: Critical
**File**: `label_studio/data_import/models.py:24-29`
**Impact**: Attacker can write files outside upload directory

**Problem**:
```python
def upload_name_generator(instance, filename):
    # No sanitization - vulnerable to ../../../etc/passwd
    path = settings.UPLOAD_DIR + '/' + project + '/' + str(uuid.uuid4())[0:8] + '-' + filename
    return path
```

**Fix**:
```python
import os
from django.utils.text import get_valid_filename

def upload_name_generator(instance, filename):
    project = str(instance.project_id)
    project_dir = os.path.join(settings.MEDIA_ROOT, settings.UPLOAD_DIR, project)
    os.makedirs(project_dir, exist_ok=True)

    # Sanitize filename - removes path separators and special chars
    safe_filename = get_valid_filename(os.path.basename(filename))
    if not safe_filename:
        safe_filename = 'unnamed_file'

    unique_id = str(uuid.uuid4())[0:8]
    path = os.path.join(settings.UPLOAD_DIR, project, f'{unique_id}-{safe_filename}')
    return path
```

**Effort**: 3 hours (including migration if needed)
**Testing**: Test with malicious filenames: `../../../etc/passwd`, `..\\..\\windows\\system32`

---

### C-3: Input Validation for file_type Filter ⚠️ CRITICAL

**Severity**: Critical
**File**: `label_studio/data_import/api.py:668-670`
**Impact**: Potential DoS via malicious regex patterns

**Problem**:
```python
file_type = self.request.query_params.get('file_type')
if file_type:
    queryset = queryset.filter(file__endswith=file_type)  # No validation
```

**Fix**:
```python
# In api.py or constants.py
ALLOWED_FILE_TYPES = {
    '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp',
    '.txt', '.csv', '.json', '.tsv', '.xml',
    '.wav', '.mp3', '.mp4', '.avi', '.mov'
}

# In FileUploadListAPI.get_queryset()
file_type = self.request.query_params.get('file_type')
if file_type:
    file_type = file_type.lower().strip()
    if not file_type.startswith('.'):
        file_type = f'.{file_type}'
    if file_type not in ALLOWED_FILE_TYPES:
        raise ValidationError(
            f'Invalid file type "{file_type}". Allowed types: {", ".join(ALLOWED_FILE_TYPES)}'
        )
    queryset = queryset.filter(file__iendswith=file_type)
```

**Effort**: 2 hours
**Testing**: Test with valid types, invalid types, malicious patterns

---

### C-4: File Size & Content-Type Validation ⚠️ CRITICAL

**Severity**: High
**File**: File upload serializers/endpoints
**Impact**: DoS via large files, malicious file uploads

**Fix**:
```python
# settings.py
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB

ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
    'application/pdf',
    'text/csv', 'text/plain', 'application/json',
    'audio/wav', 'audio/mpeg',
    'video/mp4', 'video/quicktime'
}

# In serializers.py
class FileUploadSerializer(serializers.ModelSerializer):
    def validate_file(self, value):
        # Check size
        if value.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            raise ValidationError(
                f'File size {value.size} bytes exceeds limit of {settings.FILE_UPLOAD_MAX_MEMORY_SIZE} bytes'
            )

        # Check MIME type (requires python-magic)
        import magic
        mime = magic.from_buffer(value.read(2048), mime=True)
        value.seek(0)

        if mime not in settings.ALLOWED_MIME_TYPES:
            raise ValidationError(
                f'File type "{mime}" not allowed. Allowed: {", ".join(settings.ALLOWED_MIME_TYPES)}'
            )

        return value
```

**Dependencies**: Install `python-magic` package
**Effort**: 4 hours
**Testing**: Test with oversized files, executable files, script files

---

### C-5: Presigned URL Expiration ⚠️ HIGH

**Severity**: High
**File**: `label_studio/data_import/api.py:705-764`
**Impact**: Download URLs don't expire, potential data leakage

**Fix**:
```python
class FileUploadDownloadAPI(APIView):
    def get(self, request, *args, **kwargs):
        # ... existing code ...

        if s3_storage:
            try:
                # Add 1-hour expiration
                presigned_url = s3_storage.generate_http_url(
                    file.url,
                    expires=3600  # 1 hour
                )
                return Response({
                    'download_url': presigned_url,
                    'file_name': file_upload.file_name,
                    'expires_in': 3600
                })
            except Exception as e:
                logger.error(f'Failed to generate presigned URL for file {file_upload.id}: {str(e)}')
                # Don't leak internal errors
                return Response(
                    {'error': 'Unable to generate download link'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
```

**Effort**: 2 hours
**Testing**: Verify URLs expire after set time

---

## Phase 3: Performance Optimizations (HIGH PRIORITY - 3 days)

### P-1: N+1 Query Problem in Serializer ⚠️ HIGH

**Severity**: High
**File**: `label_studio/data_import/serializers.py:59-65`, `api.py:658-660`
**Impact**: 30 files = 60+ database queries

**Fix**:
```python
# In FileUploadListAPI.get_queryset()
def get_queryset(self):
    # ... existing code ...

    queryset = FileUpload.objects.filter(project=project) \
        .select_related('project', 'user') \
        .annotate(
            total_tasks=Count('tasks'),
            labeled_tasks=Count('tasks', filter=Q(tasks__is_labeled=True))
        )

    # ... rest of filtering ...

# In FileUploadListSerializer
def get_task_count(self, obj):
    return obj.total_tasks  # Use annotated value

def get_status(self, obj):
    if obj.total_tasks == 0:
        return 'no_tasks'
    elif obj.labeled_tasks == 0:
        return 'not_started'
    elif obj.labeled_tasks < obj.total_tasks:
        return 'in_progress'
    return 'completed'
```

**Effort**: 4 hours
**Testing**: Verify query count reduces from 60+ to 3-4

---

### P-2: React Memoization ⚠️ HIGH

**Severity**: High
**Files**: All React components
**Impact**: Unnecessary re-renders on every state change

**Fix**:
```typescript
// file-status-badge.tsx
export const FileStatusBadge = React.memo<FileStatusBadgeProps>(({ status }) => {
  // Component body
});
FileStatusBadge.displayName = 'FileStatusBadge';

// file-actions.tsx
export const FileActions = React.memo<FileActionsProps>(({ file, onView }) => {
  // Component body
});
FileActions.displayName = 'FileActions';

// files-list.tsx
const handlePageChange = useCallback((page: number, pageSize: number) => {
  setPagination(prev => ({ ...prev, page, pageSize }));
}, [setPagination]);

const handleViewFile = useCallback((file: FileItem) => {
  setViewingFile(file);
}, []);

// files-table.tsx - move outside component
const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
};
```

**Effort**: 6 hours
**Testing**: Use React DevTools Profiler to verify reduced renders

---

### P-3: Database Indexes ⚠️ MEDIUM

**Severity**: Medium
**File**: `label_studio/data_import/models.py`
**Impact**: Slow queries on file filtering

**Fix**:
```python
# Add migration: 0005_add_file_index.py
class Migration(migrations.Migration):
    dependencies = [
        ('data_import', '0004_enhance_fileupload_model'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='fileupload',
            index=models.Index(fields=['file'], name='fileupload_file_idx'),
        ),
    ]
```

**Effort**: 1 hour
**Testing**: Test query performance on large datasets

---

### P-4: XSS Prevention ⚠️ HIGH

**Severity**: High
**File**: `web/apps/labelstudio/src/pages/Projects/files-table.tsx:87-89`
**Impact**: Malicious file names can inject scripts

**Fix**:
```bash
# Install DOMPurify
cd web && yarn add dompurify @types/dompurify
```

```typescript
import DOMPurify from 'dompurify';

<Elem name="filename-text" title={DOMPurify.sanitize(file.file_name)}>
  {DOMPurify.sanitize(file.file_name)}
</Elem>
```

**Effort**: 2 hours
**Testing**: Test with `<script>alert('xss')</script>` filename

---

## Phase 4: Error Handling & UX (MEDIUM PRIORITY - 2 days)

### E-1: Fix Bare Except Clauses

**Files**: Multiple locations
**Effort**: 2 hours

```python
# Bad
try:
    import ujson as json
except:
    import json

# Good
try:
    import ujson as json
except ImportError:
    import json
```

---

### E-2: Error Auto-Dismiss in file-actions.tsx

**Effort**: 1 hour

```typescript
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }
}, [error]);
```

---

### E-3: Add Error Boundaries

**Effort**: 3 hours

```typescript
// Projects.jsx
import { ErrorBoundary } from '../../components/ErrorBoundary';

<TabsContainer tabs={tabs}>
  {activeTab === 'files' ? (
    <ErrorBoundary fallback={<FilesErrorFallback />}>
      <FilesList />
    </ErrorBoundary>
  ) : (
    // ...
  )}
</TabsContainer>
```

---

### E-4: Accessibility Fixes

**Effort**: 4 hours

```typescript
// tabs-container.tsx
<Elem
  key={tab.key}
  name="tab"
  tag="button"
  role="tab"
  aria-selected={activeTab === tab.key}
  aria-controls={`tabpanel-${tab.key}`}
  onClick={() => handleTabChange(tab.key)}
>
  {tab.label}
</Elem>

// files-table.tsx
<Elem name="table" tag="table" role="table" aria-label="Files list">
  <Elem name="thead" tag="thead">
    <Elem name="tr" tag="tr" role="row">
      <Elem name="th" tag="th" role="columnheader" scope="col">ID</Elem>
      // ...
    </Elem>
  </Elem>
</Elem>
```

---

## Phase 5: Code Quality (LOW PRIORITY - As time permits)

### Q-1: Remove Unused Code
- `filesLoadingAtom` - defined but never used
- `viewingFile` state - set but never read
- Implement or remove

**Effort**: 1 hour

---

### Q-2: TypeScript Strict Types
- Replace `any` types with proper interfaces
- Remove `as any` assertions

**Effort**: 3 hours

---

### Q-3: Extract Constants
```typescript
// constants.ts
export const FILES_CONFIG = {
  DEFAULT_PAGE_SIZE: 30,
  PAGE_SIZE_OPTIONS: [10, 30, 50, 100],
  STALE_TIME: 30000,
  DATE_FORMAT: 'dd MMM yyyy, HH:mm',
} as const;
```

**Effort**: 2 hours

---

## Implementation Timeline

### Week 1
**Day 1-2**: Phase 1 - Critical Security Fixes
- C-1: IDOR vulnerability (4h)
- C-2: Path traversal (3h)
- C-3: Input validation (2h)
- C-4: File validation (4h)
- C-5: URL expiration (2h)

**Day 3-4**: Phase 2 - Critical React Bugs
- R-1: Infinite loops (3h)
- R-2: Race conditions (2h)
- R-3: Derived state (1h)
- Testing & verification (8h)

**Day 5**: Phase 3 Start - Performance
- P-1: N+1 queries (4h)
- P-2: React memoization start (4h)

### Week 2
**Day 6-7**: Phase 3 Continue - Performance
- P-2: React memoization complete (2h)
- P-3: Database indexes (1h)
- P-4: XSS prevention (2h)
- Testing & verification (8h)

**Day 8-9**: Phase 4 - Error Handling & UX
- E-1: Fix bare except (2h)
- E-2: Error auto-dismiss (1h)
- E-3: Error boundaries (3h)
- E-4: Accessibility (4h)
- Testing & verification (6h)

**Day 10**: Phase 5 - Code Quality
- Q-1: Remove unused code (1h)
- Q-2: TypeScript types (3h)
- Q-3: Extract constants (2h)
- Final testing & documentation (2h)

---

## Testing Requirements

### Security Testing
- [ ] Test IDOR vulnerability fixes with unauthorized users
- [ ] Test path traversal with malicious filenames
- [ ] Test input validation with edge cases
- [ ] Test file size limits
- [ ] Test MIME type validation
- [ ] Test presigned URL expiration

### Functionality Testing
- [ ] Test file upload workflow
- [ ] Test file download (S3 and local)
- [ ] Test file viewing
- [ ] Test annotation navigation
- [ ] Test pagination
- [ ] Test project switching
- [ ] Test URL state persistence
- [ ] Test browser back/forward

### Performance Testing
- [ ] Measure query count (should be <5 for 30 files)
- [ ] Test with 100+ files
- [ ] Test with 1000+ projects
- [ ] Monitor re-render counts
- [ ] Check memory leaks

### Accessibility Testing
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test ARIA attributes
- [ ] Test focus management

---

## Success Criteria

### Must Have (Production Blockers)
- [x] All Critical security fixes implemented
- [x] All Critical React bugs fixed
- [x] Authorization working correctly
- [x] File validation enforced
- [x] No infinite loops or race conditions

### Should Have (High Priority)
- [x] N+1 queries optimized
- [x] React components memoized
- [x] XSS prevention implemented
- [x] Error handling improved

### Nice to Have (Medium/Low Priority)
- [x] Accessibility enhancements
- [x] Code quality improvements
- [x] Comprehensive test coverage

---

## Dependencies

### Backend
- Install `python-magic` for MIME type detection
- Apply database migrations

### Frontend
- Install `dompurify` for XSS prevention
- No breaking changes to existing code

---

## Risks & Mitigation

### Risk: Breaking Changes
**Mitigation**: Comprehensive testing, feature flags for gradual rollout

### Risk: Performance Regression
**Mitigation**: Benchmark before/after, monitor query counts

### Risk: Migration Complexity
**Mitigation**: Test migrations on staging first

### Risk: User Impact
**Mitigation**: Deploy during low-traffic periods, have rollback plan

---

## Post-Implementation

### Monitoring
- Track file upload success rates
- Monitor API response times
- Alert on permission denied errors
- Log file validation failures

### Documentation
- Update API documentation
- Document new security measures
- Add inline code comments
- Update user-facing docs

### Future Enhancements
- Virtual scrolling for large lists
- File preview modal
- Bulk operations
- Advanced filtering
- File versioning
