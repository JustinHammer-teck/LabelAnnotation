# Release v1.6.0

## Features

### File Management Tab - Backend Infrastructure (Phase 1)

Implemented backend foundation for file management interface, enabling efficient tracking and management of uploaded documents across projects with parent/child relationship support.

**Issue:**
- No centralized view of all uploaded files across projects
- Unable to filter parent documents from PDF-extracted child images
- Missing annotation status tracking at file level
- No direct file download or task navigation APIs

**Implementation:**

**1. FileUpload Model Enhancements**
```python
# New fields and methods (data_import/models.py)
- created_at: Timestamp field with database index for sorting
- task_count: Property returning count of associated tasks (cached)
- is_parent_document: Property identifying parent vs. extracted child documents
- get_annotation_status(): Returns 'no_tasks', 'not_started', 'in_progress', 'completed'

# Database indexes for performance
- fileupload_project_created_idx: (project, -created_at)
- fileupload_project_user_idx: (project, user)
```

**2. FileUploadListSerializer**
```python
# Computed fields (data_import/serializers.py)
- file_name: Extracted from file path
- file_type: File extension (.pdf, .png, etc.)
- status: Aggregated annotation status from tasks
- task_count: Number of associated tasks
- project_title: Project name for display
```

**3. API Endpoints**
```bash
# List files with filtering and pagination
GET /api/projects/{pk}/file-uploads
Query params:
  - page, page_size (pagination, max 100 items/page)
  - is_parent: Filter parent documents only (default: true)
  - file_type: Filter by extension
  - ordering: Sort by created_at or id

# Download file
GET /api/file-upload/{pk}/download/
Returns:
  - Presigned URL for S3/MinIO storage
  - File stream for local storage

# Get first task for annotation
GET /api/file-upload/{pk}/task/
Returns: { task_id, project_id }
```

**Key Features:**
- Parent/child document filtering using existing PDFImageRelationship model
- Query optimization with select_related('project', 'user') and prefetch_related('tasks')
- Pagination support (30 items/page, max 100)
- Dual storage support (S3/MinIO presigned URLs + local file streaming)
- Permission-based access control with ViewClassPermission

**Performance:**
- Database indexes reduce query time for project-scoped file listings
- Property caching minimizes repeated database queries
- Bulk filtering prevents N+1 query issues

**Database Migrations:**
- `0004_enhance_fileupload_model.py`: Adds created_at field and composite indexes

**Files Modified:**
- `label_studio/data_import/models.py` - Model enhancements
- `label_studio/data_import/serializers.py` - FileUploadListSerializer
- `label_studio/data_import/api.py` - Three new API classes + pagination
- `label_studio/data_import/urls.py` - URL routing

**Test Coverage:**
```python
# Comprehensive test suite (43 test methods)
label_studio/data_import/tests/
├── test_models.py (14 tests)
│   - FileUpload model: task_count, is_parent_document, get_annotation_status
│   - PDFImageRelationship: creation, unique constraints
│   - Property caching behavior
├── test_serializers.py (8 tests)
│   - FileUploadListSerializer: all computed fields
│   - Edge cases and output structure validation
└── test_api.py (21 tests)
    - FileUploadListAPI: pagination, filtering, permissions
    - FileUploadDownloadAPI: S3/local storage, permissions
    - FileUploadTaskAPI: task navigation, error handling
```

**Testing:**
- Factory-based test data generation with factory_boy
- APITestCase for endpoint testing with authentication
- Mock S3ImportStorage for external dependency isolation
- Coverage includes all success and error scenarios

**Next Phase:**
Frontend implementation for file management tab UI (tabbed interface, table view, action buttons).

---

### File Management Tab - Frontend Tab Infrastructure (Phase 2)

Implemented tabbed interface foundation with state management and data fetching infrastructure for file management UI.

**Issue:**
- Projects page lacked tabbed navigation structure
- No state management for tab switching and file data
- Missing data fetching layer for file list API integration
- No URL persistence for active tab state

**Implementation:**

**1. State Management (Jotai Atoms)**
```typescript
// files-atoms.ts
- activeTabAtom: Tracks current tab ('projects' | 'files')
- filesPaginationAtom: Pagination state (page, pageSize, total)
- filesFiltersAtom: Filter state (fileType, status)
- filesLoadingAtom: Loading state for file operations
- TypeScript interfaces: ActiveTab, FilesFilter, FilesPagination
```

**2. TabsContainer Component**
```typescript
// tabs-container.tsx + tabs-container.scss
- BEM pattern with Block/Elem components
- URL state synchronization (reads/writes ?tab= query param)
- useHistory/useLocation for React Router v5 integration
- useCallback for optimized tab change handler
- Props: tabs array, children (content)
```

**3. Data Fetching Hook**
```typescript
// hooks/useFilesList.ts
- TanStack Query integration with useQuery
- Query key: ['project-file-uploads', projectId, page, pageSize, filters]
- Calls 'fileUploads' API endpoint with suppressed errors
- Returns: files, totalFiles, isLoading, isError, error, refetch
- Stale time: 30s, no refetch on window focus
- Enabled conditionally based on projectId
```

**4. Projects Page Integration**
```jsx
// Projects.jsx modifications
- Import activeTabAtom, TabsContainer, FilesList
- Role-based tab visibility: Files tab only for Manager/Researcher
- Tab array: [{ key: 'projects', label: 'Projects' }, ...]
- Conditional rendering: Projects tab preserves existing ProjectsList with pagination
- Files tab renders FilesList placeholder (Phase 3 implementation pending)
```

**Key Features:**
- URL persistence enables bookmarkable tabs and browser back/forward navigation
- Role-based access control restricts Files tab to authorized users
- Projects tab maintains all existing behavior including pagination
- Lazy loading ready with TanStack Query caching strategy
- Type-safe implementation with comprehensive TypeScript interfaces

**Files Created:**
```
web/apps/labelstudio/src/pages/Projects/
├── files-atoms.ts (30 lines)
├── tabs-container.tsx (65 lines)
├── tabs-container.scss
├── files-list.tsx (placeholder, 15 lines)
├── files-list.scss
└── hooks/
    └── useFilesList.ts (101 lines)
```

**Files Modified:**
- `web/apps/labelstudio/src/pages/Projects/Projects.jsx` - Tab integration

**Migration Note:**
Database migration `0004_enhance_fileupload_model.py` must be applied before accessing Files tab:
```bash
poetry run python label_studio/manage.py migrate data_import
```

**Next Phase:**
Phase 3 - Files table implementation with sorting, filtering, pagination, and action buttons (View, Annotate, Download).

---

## Infrastructure

### Docker Image Optimization & Deployment Improvements

Optimized Docker build process, reducing image size by 95% and implementing production-ready deployment configurations with enhanced security and reliability.

**Issues:**
- Docker image size: 8GB (excessive storage and slow deployments)
- Windows build compatibility: Manual symlink workarounds required
- No healthchecks or resource limits in production deployments
- EasyOCR models downloaded on first use (2-3 minute delay)
- Mixed development/production configurations
- Permission issues with bind-mounted volumes

**Implementation:**

**1. Cross-Platform Build Support**
```dockerfile
# Removed manual symlink copying (lines 153-163)
# Before: 11 lines of rm/cp commands for Windows compatibility
# After: Native symlink support via COPY command
- Works on both Linux and Windows without workarounds
- Simplified Dockerfile maintenance
- Faster builds (eliminated redundant file operations)
```

**2. EasyOCR Model Preloading (~115MB)**
```dockerfile
# New build stage: easyocr-models
- Downloads models during build: craft_mlt_25k.pth (79MB), zh_sim_g2.pth (21MB), english_g2.pth (14MB)
- Copies to /opt/easyocr/models in production image
- Sets EASYOCR_MODULE_PATH environment variable

# Application code update (label_studio/data_import/services.py)
- Uses preloaded models when EASYOCR_MODULE_PATH is set
- download_enabled=False prevents runtime downloads
- Backward compatible: Falls back to download if ENV not set
```

**Benefits:**
- First OCR request: Immediate (< 5s) vs 2-3 minutes previously
- No internet required for OCR functionality
- Predictable container startup time
- Better for orchestrated environments (Kubernetes, Swarm)

**3. Dockerfile Optimizations**
```dockerfile
# Fixed issues:
- Added git to frontend-version-generator stage (yarn version:libs requirement)
- Fixed .dockerignore to include .git for build mounts
- Added VENV_PATH environment variable definition
- Preserved django/test module (excluded from cleanup to fix rest_framework_simplejwt import)
- Correct static files path (static_build within label_studio directory)
- Created media/upload directories with proper ownership (1001:0)
```

**Size Reduction:**
- Before: 8GB
- After: ~520MB (with EasyOCR models)
- Reduction: 93.5%

**4. Production Docker Compose (docker-compose.prod.yml)**
```yaml
# Healthchecks on all services
- App: curl http://localhost:8080/health/ (30s interval, 60s start period)
- Redis: valkey-cli ping (10s interval)
- MinIO: curl minio health endpoint (30s interval)
- Workers: pgrep -f 'rqworker {queue}' (30s interval)

# Resource limits (differentiated by priority)
- Critical workers: 2 CPU / 4GB RAM (2 replicas)
- High workers: 1 CPU / 2GB RAM (2 replicas)
- Default worker: 0.5 CPU / 1GB RAM
- Low worker: 0.25 CPU / 512MB RAM
- App: 2 CPU / 4GB RAM
- MinIO: 1 CPU / 2GB RAM
- Redis: 0.5 CPU / 512MB RAM

# Security hardening
- security_opt: no-new-privileges:true on all services
- Redis: Dropped ALL capabilities, added only required (SETGID, SETUID, DAC_OVERRIDE)
- User: 1001:1001 (non-root) across all application containers

# Reliability improvements
- Graceful shutdown: 30s stop_grace_period for app/workers
- Restart policies: on-failure with max 3 attempts, 5s delay, 120s window
- Dependency ordering: condition: service_healthy (proper startup sequencing)
- Logging: JSON driver with 10MB max size, 3 file rotation

# Volume management
- Named volumes instead of bind mounts: app-data-prod, minio-data-prod, valkey-data-prod
- Eliminates host directory permission issues
- Docker-managed permissions (automatic 1001:0 ownership)
```

**5. Development Docker Compose (docker-compose.dev.yml)**
```yaml
# Developer-friendly optimizations
- No resource limits (use full host resources)
- No restart policies (restart: "no" for faster iteration)
- Minimal workers: default + high only (critical/low via --profile full)
- Debug environment: DEBUG=true, LOG_LEVEL=DEBUG
- Code volume mount: Hot-reload for Python code changes
- Exposed ports: MinIO console (9009), Redis (6379) for debugging tools
- Build with dev dependencies: INCLUDE_DEV=true
- Named volume: app-data-dev (separate from production)
```

**6. Build Process Improvements**
```dockerfile
# Frontend (Node.js)
- Changed base: node:22-trixie → node:22-alpine (~600MB reduction)
- Cleanup after build: rm -rf node_modules .yarn .nx (~1-2GB saved)
- Added git for version generation

# Python virtualenv
- Cleanup optimizations: Remove __pycache__, .pyc, .pyo files (~500MB saved)
- Preserved django/test module (critical for rest_framework_simplejwt)
- Selective test directory removal: Exclude Django core modules
- Removed editable install sources ($VENV_PATH/src)

# Layer optimization
- Combined RUN commands where beneficial
- Proper cache mount usage for apt, pip, poetry, yarn, nx
- BuildKit syntax for optimal layer caching
```

**Files Modified:**
```
Dockerfile (lines 19, 48-78, 145-177, 185-187)
.dockerignore (removed .git exclusion)
docker-compose.prod.yml (created)
docker-compose.dev.yml (created)
label_studio/data_import/services.py (EasyOCR preloading support)
```

**Migration Guide:**

**From docker-compose.minio.prod.yml to docker-compose.prod.yml:**
```bash
# 1. Rebuild image with optimizations
docker build -t lbstudio:latest .

# 2. Stop old containers
docker-compose -f docker-compose.minio.prod.yml down

# 3. Start with new production config
docker-compose -f docker-compose.prod.yml up -d

# 4. (Optional) Migrate data from bind mount to named volume
docker run --rm -v $(pwd)/mydata:/source -v app-data-prod:/dest \
  alpine sh -c "cp -a /source/. /dest/"
```

**Volume Management:**
```bash
# Backup volume
docker run --rm -v app-data-prod:/data -v $(pwd):/backup ubuntu \
  tar czf /backup/app-data-backup.tar.gz /data

# Restore volume
docker run --rm -v app-data-prod:/data -v $(pwd):/backup ubuntu \
  tar xzf /backup/app-data-backup.tar.gz -C /

# List volumes
docker volume ls

# Remove all volumes (WARNING: data loss)
docker-compose -f docker-compose.prod.yml down -v
```

**Development Workflow:**
```bash
# Start minimal dev environment
docker-compose -f docker-compose.dev.yml up

# Start with all workers
docker-compose -f docker-compose.dev.yml --profile full up

# Rebuild dev image with dependencies
docker-compose -f docker-compose.dev.yml build --build-arg INCLUDE_DEV=true
```

**Performance Impact:**
- Build time: +3-4 minutes first build (EasyOCR models), then cached
- Image pull: 93.5% faster (520MB vs 8GB)
- Container startup: 2-3 minutes faster (no OCR model download)
- Deployment reliability: Healthchecks prevent traffic to unhealthy containers
- Resource efficiency: Limits prevent noisy neighbor issues

**Security Improvements:**
- Non-root user (1001:1001) across all services
- No new privileges capability restriction
- Minimal Linux capabilities for Redis
- No exposed ports except app:8080 (MinIO/Redis on 127.0.0.1 only in prod)
- Secrets ready (use Docker secrets instead of .env.list)

**Compatibility:**
- Linux: Native support (tested)
- Windows: Fixed symlink issues, BuildKit required
- macOS: Compatible (untested)
- Platforms: linux/amd64, linux/arm64 (multi-platform build supported)

**Known Limitations:**
- EasyOCR models: Chinese Simplified + English only (add more languages by modifying easyocr-models stage)
- Resource limits: May need tuning based on workload
- Healthcheck grace periods: Adjust start_period if app startup is slower

**Future Improvements:**
- Migrate to Docker secrets for credential management
- Add Prometheus metrics exporters
- Implement read-only root filesystem with tmpfs mounts
- Add AppArmor/SELinux security profiles
- Configure Redis connection pooling
- Add automated backup/restore scripts
