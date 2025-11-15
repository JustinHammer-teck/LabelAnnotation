# File Management Tab Feature Planning

## Feature Overview
Add a tabbed interface to the Projects page with two tabs:
1. **Projects Tab** (Default): Display existing ProjectsList
2. **Files Tab**: Display all uploaded files across projects

## Architecture Overview

### Frontend Architecture

#### Component Structure
```
ProjectsPage (Modified)
├── TabsContainer (New)
│   ├── Tab: Projects
│   │   └── ProjectsList (Existing)
│   └── Tab: Files
│       └── FilesTable (New)
│           ├── FileTableHeader
│           ├── FileTableRow
│           ├── FileActions
│           └── FileTablePagination
```

#### Key Frontend Components

1. **TabsContainer Component**
   - Location: `/web/apps/labelstudio/src/pages/Projects/tabs-container.tsx`
   - **Note**: Verify available tab component (check if Ant Design or custom tabs exist in project)
   - Manages active tab state with Jotai atom
   - Lazy loads Files tab content

2. **FilesTable Component**
   - Location: `/web/apps/labelstudio/src/pages/Projects/files-table.tsx`
   - Table columns: Id, File Title, File Type, Uploaded Date, Status, Actions
   - Implements pagination, sorting, and filtering
   - Uses Jotai atoms for state management

3. **FileActions Component**
   - Location: `/web/apps/labelstudio/src/pages/Projects/file-actions.tsx`
   - Three action buttons: View, Annotate, Download
   - Handles action dispatching and navigation

### Backend Architecture

**Use Existing `data_import` App** - Do NOT create new `files` app

#### Data Models

1. **FileUpload Model Enhancement**
   - Located at: `label_studio/data_import/models.py` (already exists)
   - Add new methods to existing model:
     ```python
     @property
     def task_count(self):
         """Count of tasks associated with this upload"""
         return self.tasks.count()

     @property
     def is_parent_document(self):
         """Check if this is a parent document (not extracted child)"""
         # Uses existing PDFImageRelationship model
         return not hasattr(self, 'source_pdf') or not self.source_pdf.exists()

     def get_annotation_status(self):
         """Get aggregated annotation status from associated tasks"""
         # Returns: 'no_tasks', 'not_started', 'in_progress', 'completed'
     ```

2. **Leverage Existing PDFImageRelationship Model**
   - Located at: `label_studio/data_import/models.py` (lines 226-322)
   - Already tracks parent PDF → extracted image relationships
   - Has fields: `pdf_file`, `image_file`, `page_number`
   - Use this for parent/child document logic instead of meta fields

#### API Endpoints

**Follow existing URL patterns from `data_import/urls.py`**

1. **Files List API** (Extends existing pattern)
   ```python
   GET /api/projects/{project_pk}/file-uploads?is_parent=true&page=1&page_size=30
   Query params:
   - page: int (page number)
   - page_size: int (items per page, max 100)
   - is_parent: boolean (default: true) - filter for parent documents only
   - file_type: string (optional) - filter by file extension
   - ordering: string (optional) - e.g., '-created_at'

   Response:
   {
     "count": 150,
     "next": "...",
     "previous": "...",
     "results": [...]
   }
   ```

2. **File Download API**
   ```python
   GET /api/file-upload/{file_id}/download/
   - Permission check: ViewClassPermission(projects_view)
   - For S3/MinIO: Returns presigned URL via S3StorageMixin.generate_http_url()
   - For local storage: Uses RangedFileResponse
   ```

3. **File Task Navigation API**
   ```python
   GET /api/file-upload/{file_id}/task/
   - Returns first associated task ID
   - Frontend redirects to: /projects/{project_id}/data?task={task_id}
   ```

### Data Flow

#### Parent Document Identification

**Use Existing PDFImageRelationship Model** (Located at `data_import/models.py`)

**Parent Documents:**
- FileUpload records that are NOT referenced as extracted images in PDFImageRelationship
- Query: `FileUpload.objects.exclude(source_pdf__isnull=False)`
- These are originally uploaded files, not derived/extracted

**Child Documents:**
- Images extracted from PDFs via PDFImageRelationship
- Referenced by `image_file` foreign key in PDFImageRelationship
- Have `page_number` associated with parent PDF

**Implementation:**
```python
# In FileUploadListAPI queryset
if is_parent:
    queryset = queryset.exclude(
        id__in=PDFImageRelationship.objects.values_list('image_file_id', flat=True)
    )
```

#### File Status Determination
Status is calculated based on:
- Associated tasks completion status (using `task.is_labeled`)
- Aggregated from all tasks linked to the FileUpload
- Status values: `no_tasks`, `not_started`, `in_progress`, `completed`

### Backend Summary

**Key Points:**
- ✅ Use existing `data_import` app (DO NOT create new `files` app)
- ✅ Extend `FileUpload` model with new methods
- ✅ Use `PDFImageRelationship` for parent/child logic
- ✅ Follow `/api/projects/{pk}/file-uploads` endpoint pattern
- ✅ Use `generics.ListAPIView` and `APIView` (NOT ModelViewSet)
- ✅ Implement `ViewClassPermission` for all endpoints
- ✅ Add database indexes and query optimizations
- ✅ Handle both S3/MinIO and local storage for downloads

### State Management Architecture

#### Jotai Atoms Structure
Following the project's state management pattern using Jotai atoms (NOT Redux or Context API):

1. **Files State Atoms**
   - Location: `/web/apps/labelstudio/src/pages/Projects/files-atoms.ts`
   - Atoms to define:
     ```typescript
     // Base atom for files data
     export const filesAtom = atom<File[]>([]);

     // Pagination state
     export const filesPaginationAtom = atom({ page: 1, pageSize: 30, total: 0 });

     // Active tab state
     export const activeTabAtom = atom<'projects' | 'files'>('projects');

     // Loading state
     export const filesLoadingAtom = atom(false);

     // Filters state
     export const filesFiltersAtom = atom({ fileType: null, status: null });
     ```

2. **API Integration with TanStack Query (Recommended Pattern)**
   - Use `useQuery` from `@tanstack/react-query` directly in components
   - Follows pattern from `useProjectPermissions.ts` in TaskAssignmentSettings
   - Keep pagination/filter state in Jotai atoms, but use TanStack Query for data fetching
   - Example pattern:
     ```typescript
     // In custom hook: hooks/useFilesList.ts
     import { useQuery } from '@tanstack/react-query';
     import { useAPI } from '@/providers/ApiProvider';

     export const useFilesList = ({ projectId, page, pageSize, filters }) => {
       const api = useAPI();

       const { data, isLoading, error, refetch } = useQuery({
         queryKey: ['project-file-uploads', projectId, page, pageSize, filters],
         queryFn: async () => {
           const result = await api.callApi('projectFileUploads', {
             params: {
               pk: projectId,
               page,
               page_size: pageSize,
               is_parent: true,
               ...filters
             }
           });
           return result;
         },
       });

       return {
         files: data?.results || [],
         totalFiles: data?.count || 0,
         isLoading,
         error,
         refetch
       };
     };
     ```

   - Alternative: Use `atomWithQuery` for simpler cases (CreateProject pattern)
     ```typescript
     export const filesQueryAtom = atomWithQuery((get) => {
       const pagination = get(filesPaginationAtom);
       const filters = get(filesFiltersAtom);
       const projectId = get(currentProjectIdAtom); // Get from context or route

       return {
         queryKey: ['project-file-uploads', projectId, pagination, filters],
         queryFn: async () => {
           const response = await API.invoke('projectFileUploads', {
             params: {
               pk: projectId,
               page: pagination.page,
               page_size: pagination.pageSize,
               is_parent: true,
               ...filters
             }
           });
           return response;
         }
       };
     });
     ```

### URL State Management

**Persisting Active Tab in URL**:
```tsx
import { useHistory, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { activeTabAtom } from './files-atoms';

export const TabsContainer = () => {
  const history = useHistory();
  const location = useLocation();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  // Initialize from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get('tab') as 'projects' | 'files' | null;
    if (tabFromUrl && (tabFromUrl === 'projects' || tabFromUrl === 'files')) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (newTab: 'projects' | 'files') => {
    setActiveTab(newTab);

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', newTab);
    history.push({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  return (
    // Tab implementation
  );
};
```

**Benefits**:
- Users can bookmark specific tabs
- Browser back/forward navigation works correctly
- Tab state persists on page refresh
- Shareable URLs with specific tab selected

### Coding Standards Compliance

Following project's React Component Guidelines from CLAUDE.md:

1. **File Naming**: kebab-case (e.g., `files-table.tsx`, `file-actions.tsx`)
2. **Component Type**: Functional components with hooks (NOT class components)
3. **TypeScript**: Proper TypeScript interfaces for all props and state
4. **Styling**: Co-located SCSS modules (e.g., `files-table.scss`)
5. **State Management**: Jotai atoms for global state (NOT Context API, NOT Redux)
6. **API Integration**: Use `useAPI()` hook from `/web/apps/labelstudio/src/providers/ApiProvider.tsx`
7. **Accessibility**: Follow WCAG 2.1 AA standards

### Error Handling Strategy

**Inline Error Handling** (Preferred for component-level errors):
```typescript
import { useAPI } from '@/providers/ApiProvider';

const api = useAPI();

const handleDownload = async (fileId: number) => {
  try {
    const result = await api.callApi('downloadFile', {
      params: { pk: fileId },
      suppressError: true  // Prevents global error modal
    });

    if (result.error) {
      // Handle error inline
      setErrorMessage('Failed to download file');
      return;
    }

    // Success handling
    window.open(result.download_url, '_blank');
  } catch (error) {
    setErrorMessage('Failed to download file');
  }
};
```

**Error States in Components**:
```tsx
<Oneof value={loadingState}>
  <Elem name="error" case="error">
    <Elem name="error-message">
      {errorMessage || 'Failed to load files'}
    </Elem>
    <Elem name="error-action" tag={Button} onClick={refetch}>
      Retry
    </Elem>
  </Elem>
</Oneof>
```

**TanStack Query Error Handling**:
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['files'],
  queryFn: async () => {
    const result = await api.callApi('files', {
      params: { ... },
      suppressError: true
    });

    if (!result || result.error) {
      throw new Error('Failed to fetch files');
    }

    return result;
  },
});

// In component
if (error) {
  setLoadingState('error');
}
```

### BEM Component Pattern

The project uses `Block` and `Elem` components from `/web/libs/ui` for BEM (Block Element Modifier) pattern:

**Example: FilesTable Component Structure**
```tsx
import { Block, Elem } from '@/libs/ui';
import { Spinner } from '@/components/Spinner';
import { Oneof } from '@/components/Oneof';

export const FilesTable = () => {
  const [loadingState, setLoadingState] = useState('loading');

  return (
    <Block name="files-table">
      <Oneof value={loadingState}>
        <Elem name="loading" case="loading">
          <Spinner size={64} />
        </Elem>
        <Elem name="content" case="loaded">
          <Elem name="header">
            <Elem name="title" tag="h2">Files</Elem>
          </Elem>
          <Elem name="body">
            {/* Table content */}
          </Elem>
          <Elem name="footer">
            {/* Pagination */}
          </Elem>
        </Elem>
        <Elem name="error" case="error">
          <Elem name="error-message">Failed to load files</Elem>
        </Elem>
      </Oneof>
    </Block>
  );
};
```

**Corresponding SCSS** (`files-table.scss`):
```scss
.files-table {
  padding: 20px;

  &__loading {
    display: flex;
    justify-content: center;
    padding: 40px;
  }

  &__header {
    margin-bottom: 20px;
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
  }

  &__body {
    // Table styles
  }

  &__footer {
    margin-top: 20px;
  }

  &__empty-state {
    padding: 60px 20px;
    text-align: center;
  }

  &__empty-title {
    font-size: 18px;
    margin-bottom: 12px;
    color: #666;
  }

  &__empty-description {
    color: #999;
    margin-bottom: 20px;
  }
}
```

### Empty State Pattern

**Empty State Component** (Following `EmptyProjectsList` pattern):
```tsx
import { Block, Elem } from '@/libs/ui';
import { Button } from '@/components/Button';

export const EmptyFilesList = () => {
  return (
    <Block name="empty-files-page">
      <Elem name="icon">
        {/* Icon or illustration */}
      </Elem>
      <Elem name="title" tag="h2">
        No files uploaded yet
      </Elem>
      <Elem name="description" tag="p">
        Files uploaded to your projects will appear here.
      </Elem>
    </Block>
  );
};
```

**Usage in FilesTable**:
```tsx
<Oneof value={loadingState}>
  <Elem name="content" case="loaded">
    {files.length === 0 ? (
      <EmptyFilesList />
    ) : (
      <Elem name="body">
        {/* Table with files */}
      </Elem>
    )}
  </Elem>
</Oneof>
```

## Component Breakdown

### Frontend Components

1. **TabsContainer**
   - File: `tabs-container.tsx` (kebab-case naming)
   - State Management: Jotai atom for active tab
   - Styling: Co-located `tabs-container.scss`
   - Methods: `handleTabChange()`

2. **FilesTable**
   - File: `files-table.tsx` (kebab-case naming)
   - State Management: Jotai atoms for files data, pagination, filters
   - Props: TypeScript interface for type safety
   - Styling: Co-located `files-table.scss`
   - Methods:
     - `fetchFiles()`: Uses API integration
     - `handleSort()`
     - `handleFilter()`
     - `handleActionClick()`

3. **FileViewer Modal**
   - Reuse existing PDF viewer (`<embed>` tag implementation)
   - Location: `/web/libs/editor/src/tags/object/Pdf.jsx`
   - Extend to support other document types

4. **FileActions**
   - File: `file-actions.tsx` (kebab-case naming)
   - Component Type: Functional component with hooks
   - Props: TypeScript interface defining file object and callbacks
   - Styling: Co-located `file-actions.scss`
   - Methods:
     - `handleView()`: Opens file viewer modal
     - `handleAnnotate()`: Navigates to task annotation
     - `handleDownload()`: Triggers file download

### Backend Components

**All components go in existing `label_studio/data_import/` app**

1. **FileUploadListAPI** (follows Label Studio pattern)
   - Location: `label_studio/data_import/api.py` (extend existing file)
   - Inherits from: `generics.ListAPIView` (NOT ModelViewSet)
   - Serializer: `FileUploadListSerializer`
   - Permission: `ViewClassPermission(GET=all_permissions.projects_view)`
   - Queryset filtering: parent documents using PDFImageRelationship exclusion
   - Pagination: `FileUploadPagination` (page_size=30, max=100)
   - Includes: `select_related('project', 'user')` for performance

2. **FileUploadListSerializer** (extends existing)
   - Location: `label_studio/data_import/serializers.py` (extend existing file)
   - Base: Extends or adds to existing `FileUploadSerializer`
   - Fields: `id`, `file_name`, `file_type`, `created_at`, `status`, `task_count`, `project_title`, `uploaded_by`
   - Uses `SerializerMethodField` for computed fields (status, task_count, file_type)

3. **FileUploadDownloadAPI**
   - Location: `label_studio/data_import/api.py`
   - Inherits from: `APIView`
   - Permission: `ViewClassPermission(GET=all_permissions.projects_view)`
   - Handles both S3/MinIO (presigned URLs) and local storage (RangedFileResponse)

4. **FileUploadTaskAPI**
   - Location: `label_studio/data_import/api.py`
   - Inherits from: `APIView`
   - Returns first associated task ID for navigation

## Backend Permissions & Security

**Follow existing `ViewClassPermission` pattern from Label Studio**

### Permission Checks
```python
from core.permissions import all_permissions, ViewClassPermission

class FileUploadListAPI(generics.ListAPIView):
    permission_required = ViewClassPermission(
        GET=all_permissions.projects_view,
    )
```

### Security Considerations
1. **Project Access Verification**
   - Verify user has access to the project before returning files
   - Use existing project permission system

2. **Download Security**
   - Generate time-limited presigned URLs (S3/MinIO)
   - Check file access permissions before generating URL
   - For local files, use `RangedFileResponse` with permission checks

3. **File Type Validation**
   - Validate file extensions
   - Sanitize file names before display

## Database Optimizations

### Indexes for Performance
```python
# Add to FileUpload model Meta class
class Meta:
    indexes = [
        models.Index(fields=['project', '-created_at']),
        models.Index(fields=['project', 'user']),
    ]
```

### Query Optimizations
```python
# In FileUploadListAPI
queryset = FileUpload.objects.filter(project_id=project_pk) \
    .select_related('project', 'user') \
    .prefetch_related('tasks') \
    .order_by('-id')
```

### Pagination
```python
from rest_framework.pagination import PageNumberPagination

class FileUploadPagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 100
```

## URL Routing Structure

**Add to `label_studio/data_import/urls.py`**

```python
# Project-scoped routes
_api_projects_urlpatterns = [
    # ... existing routes
    path('<int:pk>/file-uploads', api.FileUploadListAPI.as_view(),
         name='api:project-file-uploads'),
]

# Global file upload routes
_api_urlpatterns = [
    path('file-upload/<int:pk>/download/',
         api.FileUploadDownloadAPI.as_view(),
         name='api:file-upload-download'),
    path('file-upload/<int:pk>/task/',
         api.FileUploadTaskAPI.as_view(),
         name='api:file-upload-task'),
]
```

## Internationalization (i18n)

### Required Translation Keys

Add the following keys to `/web/apps/labelstudio/src/locales/en/translation.json`:

```json
{
  "files_page": {
    "tab_title": "Files",
    "table_header": {
      "id": "ID",
      "file_title": "File Title",
      "file_type": "File Type",
      "uploaded_date": "Uploaded Date",
      "status": "Status",
      "actions": "Actions"
    },
    "actions": {
      "view": "View",
      "annotate": "Annotate",
      "download": "Download"
    },
    "status": {
      "not_started": "Not Started",
      "in_progress": "In Progress",
      "completed": "Completed",
      "reviewed": "Reviewed"
    },
    "empty_state": {
      "title": "No files uploaded yet",
      "description": "Files uploaded to your projects will appear here."
    },
    "errors": {
      "load_failed": "Failed to load files",
      "download_failed": "Failed to download file",
      "view_failed": "Failed to open file viewer"
    },
    "loading": "Loading files...",
    "pagination_label": "Files"
  }
}
```

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

export const FilesTable = () => {
  const { t } = useTranslation();

  return (
    <Block name="files-table">
      <Elem name="title">{t('files_page.tab_title')}</Elem>
      <Elem name="empty-state">
        {t('files_page.empty_state.title')}
      </Elem>
    </Block>
  );
};
```

## Integration Points

### Existing Systems to Integrate

1. **MinIO/S3 Storage**
   - Use `S3StorageMixin` from `io_storages/s3/models.py`
   - Leverage existing presigned URL generation
   - Handle both local and cloud storage

2. **Task Navigation**
   - Link files to tasks via `file_upload` foreign key
   - Use existing task routing: `/projects/{id}/data?task={task_id}`

3. **PDF Viewer**
   - Current implementation uses `<embed>` tag
   - Consider enhancing with PDF.js for better control
   - Support page navigation for multi-page documents

4. **Permissions**
   - Use existing ViewClassPermission system
   - Check project access permissions
   - Verify file download permissions

## Implementation Tasks

### Phase 1: Backend Infrastructure (2-3 days)
1. **Extend FileUpload Model** (`data_import/models.py`)
   - Add `task_count`, `is_parent_document` properties
   - Add `get_annotation_status()` method
   - Add database indexes for performance

2. **Create FileUploadListSerializer** (`data_import/serializers.py`)
   - Extend existing FileUploadSerializer
   - Add SerializerMethodField for computed values (status, file_type, task_count)

3. **Implement API Classes** (`data_import/api.py`)
   - `FileUploadListAPI` (generics.ListAPIView)
   - `FileUploadDownloadAPI` (APIView)
   - `FileUploadTaskAPI` (APIView)
   - Add ViewClassPermission to all
   - Use PDFImageRelationship for parent/child filtering

4. **Add URL Routes** (`data_import/urls.py`)
   - Project-scoped: `/api/projects/{pk}/file-uploads`
   - Global: `/api/file-upload/{pk}/download/`, `/api/file-upload/{pk}/task/`

5. **Implement Pagination**
   - Create FileUploadPagination class (page_size=30, max=100)

6. **Write Unit Tests**
   - Test parent/child filtering
   - Test permissions
   - Test download URL generation

### Phase 2: Frontend Tab Structure (2 days)
1. Create Jotai atoms in `/web/apps/labelstudio/src/pages/Projects/files-atoms.ts`
2. Create custom hook `hooks/useFilesList.ts` with TanStack Query pattern
3. Modify ProjectsPage to add tabs
4. Create TabsContainer component (kebab-case: `tabs-container.tsx`)
5. Implement tab switching logic with Jotai atoms
6. Add routing for tab state persistence
7. Style tabs with co-located SCSS to match existing UI

### Phase 3: Files Table Implementation (3-4 days)
1. Create FilesTable component (kebab-case: `files-table.tsx`)
2. Define TypeScript interfaces for File and props at `types.ts`:
   ```typescript
   export interface FileItem {
     id: number;
     title: string;
     file_type: string;
     uploaded_date: string;
     status: string;
     project_id: number;
   }

   export interface FilesResponse {
     results: FileItem[];
     count: number;
   }
   ```
3. Implement table columns using available UI library (verify Ant Design or create custom table)
4. Connect to Jotai atoms for data and state
5. Add pagination using existing Pagination component:
   ```tsx
   import { Pagination } from '@/components/Pagination';

   <Pagination
     name="files-list"
     label="Files"
     page={currentPage}
     totalItems={totalFiles}
     pageSize={pageSize}
     urlParamName="page"
     pageSizeOptions={[10, 30, 50, 100]}
     onPageLoad={async (page, pageSize) => {
       // Fetch files with new page/pageSize
       refetch();
     }}
   />
   ```
6. Implement sorting and filtering with Jotai atoms
7. Add loading states using `Oneof` component
8. Create empty states following existing patterns

### Phase 4: File Actions (2-3 days)
1. Create FileActions component (kebab-case: `file-actions.tsx`)
2. Define TypeScript interface for file and action handlers
3. Create View action with modal integration
4. Integrate existing PDF viewer from `/web/libs/editor`
5. Implement Annotate navigation using React Router
6. Add Download functionality with MinIO presigned URLs
7. Handle action permissions using existing permission system
8. Add co-located `file-actions.scss` for styling

### Phase 5: Integration & Polish (2 days)
1. Connect frontend to backend APIs using `useAPI()` hook
2. Set up TanStack Query with `useQuery` for data fetching
3. Add error handling with `suppressError: true` option
4. Implement loading states with `Oneof` component
5. Add internationalization using react-i18next (already in project)
6. Performance optimization (memoization, lazy loading)
7. Cross-browser testing
8. Ensure WCAG 2.1 AA accessibility compliance

### Phase 6: Testing & Documentation (1-2 days)
1. Write frontend component tests
2. Add E2E tests for tab functionality
3. Test MinIO download integration
4. Update API documentation
5. Create user documentation

## Dependencies

### Technical Dependencies
**All dependencies already exist in the project - NO new packages required**

- **State Management**: Jotai (v2.11.3) - already in package.json
- **Data Fetching**: @tanstack/react-query - already in package.json
- **UI Components**: **Verify availability** (check if Ant Design exists or use custom components from `/web/libs/ui`)
- **Routing**: React Router v5 - already in package.json
- **TypeScript**: v4.8.3 - already in package.json
- **Pagination Component**: Existing in `/web/apps/labelstudio/src/components/Pagination`
- **PDF Viewer**: Existing in `/web/libs/editor/src/tags/object/Pdf.jsx`
- **S3/MinIO**: Existing storage configuration in backend
- **BEM Components**: `Block` and `Elem` from `/web/libs/ui` for BEM pattern

### Data Dependencies
- FileUpload model (already exists with project relationship)
- Task model already has `file_upload` foreign key
- PDFImageRelationship model (already exists for parent/child tracking)
- No schema changes required - all models already in place

### System Dependencies
- MinIO/S3 must be configured and accessible
- Storage permissions properly configured
- CORS settings for direct file access

## Considerations

### Responsive Design

**Table Responsiveness**:
```scss
.files-table {
  &__body {
    overflow-x: auto;

    // Mobile: horizontal scroll for table
    @media (max-width: 768px) {
      table {
        min-width: 800px;
      }
    }

    // Tablet: adjust column widths
    @media (min-width: 769px) and (max-width: 1024px) {
      table {
        font-size: 14px;
      }
    }

    // Desktop: full layout
    @media (min-width: 1025px) {
      table {
        width: 100%;
      }
    }
  }

  // Alternative: Card view for mobile
  &__card-view {
    display: none;

    @media (max-width: 768px) {
      display: block;

      .file-card {
        border: 1px solid #ddd;
        padding: 16px;
        margin-bottom: 12px;
        border-radius: 8px;
      }
    }
  }
}
```

**Responsive Actions**:
- Desktop: Show all action buttons inline
- Tablet: Show icons with tooltips
- Mobile: Use dropdown menu for actions

**Tab Layout**:
- Desktop: Horizontal tabs with full labels
- Mobile: Full-width stacked tabs or dropdown selector

### Performance
- Implement pagination to handle large file lists
- Use virtual scrolling for very large datasets
- Cache file metadata to reduce API calls
- Lazy load tab content

### Security
- Verify user has project access before showing files
- Generate time-limited presigned URLs for downloads
- Sanitize file names before display
- Check file type restrictions

### User Experience
- Remember user's last active tab
- Provide clear loading indicators
- Show meaningful empty states
- Add search and filter capabilities
- Support bulk operations in future

### Scalability
- Design API to support filtering by project
- Consider adding Redis caching for file lists
- Plan for supporting millions of files
- Design for horizontal scaling

### Future Enhancements
- Bulk file operations (download, delete)
- File preview for more formats
- File versioning support
- Advanced search with full-text search
- File tagging and categorization
- Export file list to CSV

## Risk Mitigation

1. **Large File Handling**
   - Risk: Large files may timeout during download
   - Mitigation: Use streaming downloads with progress indication

2. **PDF Viewer Compatibility**
   - Risk: Current `<embed>` tag may not work in all browsers
   - Mitigation: Plan to integrate PDF.js as fallback

3. **Parent Document Identification**
   - Risk: No clear marker for parent vs child documents
   - Mitigation: Leverage existing PDFImageRelationship model - no migration needed

4. **Performance with Many Files**
   - Risk: Table may be slow with thousands of files
   - Mitigation: Implement server-side pagination and filtering

## Success Criteria

1. Users can switch between Projects and Files tabs
2. Files table displays all parent documents across projects
3. View action opens PDF viewer for PDF files
4. Annotate action navigates to correct task
5. Download action provides file from MinIO storage
6. Table supports pagination and sorting
7. Performance remains acceptable with 10,000+ files
8. All existing functionality remains intact

## Timeline Estimate

Total estimated time: **12-15 days**

- Backend Development: 3 days
- Frontend Development: 6-7 days
- Integration & Testing: 2-3 days
- Documentation & Polish: 1-2 days

## Questions for Validation

1. Should the Files tab be visible to all users or restricted by role?
Answer: Should only allow for Manager and Researcher to access
2. What file types should be supported for viewing beyond PDF?
Answer: Image View,
3. Should we show files from all projects or add project filtering?
Answer: Should show files from all projects that user has access to (should consider the assigned_to_project permission)
4. How should we handle files that don't have associated tasks?
Answer: Don't include it in
5. What status values should be displayed (e.g., "Annotated", "In Progress", "Not Started")?
Answer: Yes
6. Should bulk operations be included in the initial version?
Answer: Enhance later
7. How many files per page should be the default?
Answer: use default implement from other component
8. Should file search be included in the initial implementation?
Answer: enhance later