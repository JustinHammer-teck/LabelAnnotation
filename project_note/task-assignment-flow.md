# When Files Are Assigned to Tasks in Label Studio Backend

## Overview

This document explains exactly when and how uploaded files are converted into tasks in the Label Studio backend. Based on the analysis of the import flow, there are **two distinct phases** where tasks are created from uploaded files.

## Key Findings

### Phase 1: Initial Import (`/api/projects/:pk/import`)
**Files uploaded but NO tasks created yet**

- **Purpose**: Upload files and prepare them for task creation
- **File Storage**: Files are stored as `FileUpload` records
- **Task Creation**: **NO TASKS CREATED** when `commit_to_project=false` (default from frontend)
- **Response**: Returns file upload IDs and metadata about the files

### Phase 2: Reimport/Finalization (`/api/projects/:pk/reimport`)
**Tasks are actually created and assigned**

- **Purpose**: Convert uploaded files into actual tasks
- **Task Creation**: **TASKS ARE CREATED HERE** from the uploaded files
- **Assignment**: Each task gets linked to its source file via `file_upload_id`

## Detailed Flow Analysis

### 1. Import API Endpoint (`data_import/api.py::ImportAPI`)

#### URL Pattern
```
POST /api/projects/{project_id}/import?commit_to_project=false
```

#### Key Behavior
```python
def sync_import(self, request, project, preannotated_from_fields, commit_to_project, return_task_ids):
    # Load tasks from uploaded files
    tasks, file_upload_ids, found_formats, data_columns = load_tasks(request, project)
    
    if commit_to_project:  # This is FALSE from frontend
        # Create tasks in database
        tasks, serializer = self._save(tasks)
    else:
        # Only upload files, no task creation
        tasks = []
```

#### What Happens During Import:
1. **File Upload Processing** (`uploader.py::load_tasks`)
   ```python
   # For each uploaded file
   file_upload = create_file_upload(request.user, project, file)
   # Store file in FileUpload table with project and user reference
   # NO tasks created yet
   ```

2. **File Analysis**
   ```python
   # Check if files could be task lists (CSV/TSV)
   if file_upload.format_could_be_tasks_list:
       could_be_tasks_list = True
   
   # Extract data columns for CSV files
   data_columns.update(file_upload.get_data_columns())
   ```

3. **Response Structure**
   ```json
   {
     "task_count": 0,
     "file_upload_ids": [1, 2, 3],
     "could_be_tasks_list": true,
     "data_columns": ["column1", "column2"],
     "found_formats": ["csv", "jpg"]
   }
   ```

### 2. ReImport API Endpoint (`data_import/api.py::ReImportAPI`)

#### URL Pattern
```
POST /api/projects/{project_id}/reimport
```

#### Request Body
```json
{
  "file_upload_ids": [1, 2, 3],
  "files_as_tasks_list": true  // CSV processing mode
}
```

#### Task Creation Process
```python
def sync_reimport(self, project, file_upload_ids, files_as_tasks_list):
    # 1. Load tasks from FileUpload records
    tasks, found_formats, data_columns = FileUpload.load_tasks_from_uploaded_files(
        project, file_upload_ids, files_as_tasks_list=files_as_tasks_list
    )
    
    # 2. Remove existing tasks from these files (if any)
    with transaction.atomic():
        project.remove_tasks_by_file_uploads(file_upload_ids)
        
        # 3. CREATE TASKS IN DATABASE
        tasks, serializer = self._save(tasks)
```

### 3. Task Creation in Database (`tasks/serializers.py::TaskSerializerBulk`)

#### Critical Task Assignment Code
```python
def add_tasks(self, task_annotations, task_predictions, validated_tasks):
    db_tasks = []
    
    for i, task in enumerate(validated_tasks):
        t = Task(
            project=self.project,
            data=task['data'],                    # Actual task data
            file_upload_id=task.get('file_upload_id'),  # LINK TO SOURCE FILE
            inner_id=max_inner_id + i,           # Sequential task number
            total_annotations=total_annotations,
            total_predictions=len(task_predictions[i]),
            # ... other fields
        )
        db_tasks.append(t)
    
    # Bulk create all tasks
    self.db_tasks = Task.objects.bulk_create(db_tasks, batch_size=settings.BATCH_SIZE)
```

## File-to-Task Assignment Logic

### How Tasks Reference Files

Each task created gets a **direct reference** to its source file:

```python
# In Task model (tasks/models.py)
class Task(models.Model):
    file_upload = models.ForeignKey(
        'data_import.FileUpload',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text='Source file for this task'
    )
```

### File Upload Processing (`data_import/models.py::FileUpload`)

```python
@classmethod
def load_tasks_from_uploaded_files(cls, project, file_upload_ids=None, files_as_tasks_list=True):
    tasks = []
    
    # Process each uploaded file
    for file_upload in file_uploads:
        new_tasks = file_upload.read_tasks(files_as_tasks_list)
        for task in new_tasks:
            task['file_upload_id'] = file_upload.id  # ASSIGN FILE TO TASK
        
        tasks.extend(new_tasks)
    
    return tasks, formats, data_columns
```

## Different File Types and Task Creation

### 1. Image Files (JPG, PNG, etc.)
- **One file = One task**
- Task data: `{"image": "/upload/file_path.jpg"}`
- `file_upload_id` points to the FileUpload record

### 2. CSV/TSV Files
- **Depends on `files_as_tasks_list` setting:**

#### As Task List (`files_as_tasks_list=true`)
```python
# Each row becomes a separate task
# Row 1: {"text": "Hello world", "label": "positive"}  -> Task 1
# Row 2: {"text": "Bad service", "label": "negative"}  -> Task 2
# Both tasks have same file_upload_id
```

#### As Single File (`files_as_tasks_list=false`)
```python
# Entire file becomes one task
# {"csv": "/upload/data.csv"} -> Single Task
```

### 3. JSON Files
- **Can contain single task or array of tasks**
- Each task object becomes a separate Task record
- All share the same `file_upload_id`

### 4. URL Imports
```python
# URL gets converted to FileUpload first
file_upload = create_file_upload(user, project, SimpleUploadedFile(url, content))
# Then processed like any other file type
```

## Timeline Summary

| Step | Frontend Action | Backend Endpoint | Task Creation | Database State |
|------|----------------|------------------|---------------|----------------|
| 1 | User uploads files | `POST /import?commit_to_project=false` | **NO** | FileUpload records created |
| 2 | User clicks "Import" | `POST /reimport` | **YES** | Task records created with `file_upload_id` links |

## Key Database Relationships

```sql
-- FileUpload table stores uploaded files
FileUpload:
  - id (PK)
  - project_id (FK -> Project)
  - user_id (FK -> User)  
  - file (path to uploaded file)

-- Task table stores labeling tasks
Task:
  - id (PK)
  - project_id (FK -> Project)
  - file_upload_id (FK -> FileUpload)  -- CRITICAL LINK
  - data (JSONField with task data)
  - inner_id (sequential task number)
```

## Error Handling and Edge Cases

### 1. Task Limits
```python
# Maximum tasks per project
if len(tasks) > settings.TASKS_MAX_NUMBER:
    raise ValidationError(f'Maximum task number is {settings.TASKS_MAX_NUMBER}')
```

### 2. Duplicate Prevention
```python
# ReImport removes existing tasks first
project.remove_tasks_by_file_uploads(file_upload_ids)
# Then creates new ones
```

### 3. Atomic Operations
```python
# All task creation happens in database transaction
with transaction.atomic():
    project.remove_tasks_by_file_uploads(file_upload_ids)
    tasks, serializer = self._save(tasks)
```

## Conclusion

**Files are assigned to tasks during the REIMPORT phase**, specifically:

1. **Upload Phase**: Files stored as `FileUpload` records, NO tasks created
2. **Import Phase**: Tasks created from `FileUpload` records with explicit `file_upload_id` assignment
3. **Assignment**: Each `Task` gets `file_upload_id` foreign key linking it to source file
4. **Relationship**: One FileUpload can create multiple Tasks (CSV rows) or one Task (single image)

The critical assignment happens in `TaskSerializerBulk.add_tasks()` at line 557:
```python
file_upload_id=task.get('file_upload_id')
```

This creates the permanent link between uploaded files and the tasks created from them.