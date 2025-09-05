# Project Creation and File Import Flow - Frontend Process

## Overview

This document details the complete frontend process when a user creates a new project in Label Studio, uploads files, and clicks the Import button. The process involves multiple components working together to manage project creation, file uploads, and data import.

## Key Components

### 1. CreateProject Component
**File**: `/web/apps/labelstudio/src/pages/CreateProject/CreateProject.jsx`

The main orchestrator component that manages the three-step project creation process:
- **Step 1**: Project Name (name configuration)
- **Step 2**: Data Import (file upload and import)
- **Step 3**: Labeling Setup (configuration)

### 2. ImportPage Component
**File**: `/web/apps/labelstudio/src/pages/CreateProject/Import/Import.jsx`

Handles the actual file upload interface with:
- Drag & drop functionality
- File browser upload
- URL import
- CSV handling options
- File list display

### 3. useImportPage Hook
**File**: `/web/apps/labelstudio/src/pages/CreateProject/Import/useImportPage.js`

Manages import state and provides functionality for:
- File upload status tracking
- CSV handling logic
- Import completion process

### 4. useDraftProject Hook
**File**: `/web/apps/labelstudio/src/pages/CreateProject/utils/useDraftProject.js`

Manages draft project creation and state.

## Complete Process Flow

### Phase 1: Initial Project Creation

1. **Component Mount** (`CreateProject.jsx`)
   - `useDraftProject` hook initializes
   - State variables initialized:
     - `step` = "name" (current wizard step)
     - `waiting` = false (loading state)
     - `name` = "" (project name)
     - `description` = "" (project description)

2. **Draft Project Creation** (`useDraftProject.js`)
   ```javascript
   // Endpoint: GET /api/projects
   const response = await api.callApi("projects");
   
   // Generate unique project name
   let projectName = `New Project #${projectNumber}`;
   
   // Endpoint: POST /api/projects
   const draft = await api.callApi("createProject", {
     body: { title: projectName }
   });
   ```

### Phase 2: Project Name Configuration (Step 1)

1. **Name Input** (`ProjectName` component)
   - User enters project name and description
   - Real-time validation occurs

2. **Name Save** (onBlur event)
   ```javascript
   // Endpoint: PATCH /api/projects/:pk (Raw version for immediate response)
   const res = await api.callApi("updateProjectRaw", {
     params: { pk: project.id },
     body: { title: name }
   });
   ```

3. **Step Transition**
   - User clicks on "Data Import" tab or completes name entry
   - `step` changes to "import"
   - Analytics event: `create_project.tab.data_import`

### Phase 3: File Upload and Import (Step 2)

#### 3.1 File Selection Methods

**Method A: Drag & Drop**
1. **File Drop Handler** (`Upload` component)
   ```javascript
   const onDrop = (e) => {
     getFiles(e.dataTransfer.items).then((files) => sendFiles(files));
   };
   ```

2. **File Processing**
   - `getFiles()` processes dropped items (handles folders recursively)
   - `traverseFileTree()` flattens directory structures
   - Hidden files (starting with `.`) are filtered out

**Method B: File Browser**
1. **File Input Trigger**
   ```javascript
   <input id="file-input" type="file" multiple onChange={onUpload} />
   ```

2. **File Selection Handler**
   ```javascript
   const onUpload = (e) => {
     sendFiles(e.target.files);
   };
   ```

**Method C: URL Import**
1. **URL Form Submission**
   ```javascript
   const onLoadURL = (e) => {
     const body = new URLSearchParams({ url });
     importFilesImmediately([{ name: url }], body);
   };
   ```

#### 3.2 File Upload Process

1. **File Validation**
   ```javascript
   // Supported extensions check
   const supportedExtensions = {
     text: ["txt"],
     audio: ["wav", "mp3", "flac", "m4a", "ogg"],
     video: ["mp4", "webm"],
     image: ["bmp", "gif", "jpg", "jpeg", "png", "svg", "webp"],
     html: ["html", "htm", "xml"],
     pdf: ["pdf"],
     structuredData: ["csv", "tsv", "json"]
   };
   ```

2. **FormData Creation**
   ```javascript
   const fd = new FormData();
   for (const f of files) {
     fd.append(f.name, f);
   }
   ```

3. **File Upload API Call**
   ```javascript
   // Endpoint: POST /api/projects/:pk/import?commit_to_project=false
   const res = await API.invoke("importFiles", 
     { pk: project.id, commit_to_project: "false" },
     { 
       headers: { "Content-Type": "multipart/form-data" }, 
       body: formData 
     }
   );
   ```

#### 3.3 Upload State Management

1. **State Updates During Upload**
   ```javascript
   // Upload start
   dispatch({ sending: files });  // Add to uploading array
   
   // Upload complete  
   dispatch({ sent: files });     // Remove from uploading array
   dispatch({ uploaded: files }); // Add to uploaded array
   dispatch({ ids: file_upload_ids }); // Store file IDs
   ```

2. **CSV Handling Detection**
   - If uploaded files include CSV/TSV files:
   ```javascript
   if (could_be_tasks_list && !csvHandling) {
     setCsvHandling("choose"); // Triggers CSV handling UI
   }
   ```

3. **File List Refresh**
   ```javascript
   // Endpoint: GET /api/projects/:pk/file-uploads?ids=[1,2,3]
   const files = await api.callApi("fileUploads", {
     params: { pk: project.id, ids: JSON.stringify(file_upload_ids) }
   });
   ```

#### 3.4 CSV Handling Options

When CSV files are detected, user must choose:

1. **List of Tasks** (`csvHandling = "tasks"`)
   - Each row becomes a separate task
   - Columns become data fields

2. **Time Series/Whole Text File** (`csvHandling = "ts"`)
   - Entire file treated as single entity
   - No column parsing

### Phase 4: Import Completion (Save Button Click)

#### 4.1 Final Import Process

1. **Import Finalization** (`finishUpload` from `useImportPage`)
   ```javascript
   // Endpoint: POST /api/projects/:pk/reimport
   const imported = await api.callApi("reimportFiles", {
     params: { pk: project.id },
     body: {
       file_upload_ids: fileIds,
       files_as_tasks_list: csvHandling === "tasks"
     }
   });
   ```

2. **Sample Dataset Upload** (if selected)
   ```javascript
   if (sample) await uploadSample(sample);
   
   // Sample upload process:
   // Endpoint: POST /api/projects/:pk/import?commit_to_project=false
   const body = new URLSearchParams({ url: sample.url });
   await importFiles({ files: [{ name: url }], body, project });
   ```

3. **Project Update with Final Configuration**
   ```javascript
   // Endpoint: PATCH /api/projects/:pk
   const response = await api.callApi("updateProject", {
     params: { pk: project.id },
     body: {
       title: name,
       description,
       label_config: project?.label_config ?? "<View></View>"
     }
   });
   ```

4. **Navigation to Project**
   ```javascript
   if (response !== null) {
     history.push(`/projects/${response.id}/data`);
   }
   ```

## API Endpoints Called

| Endpoint | Method | Purpose | When Called |
|----------|--------|---------|-------------|
| `/api/projects` | GET | List existing projects | Initial load for name generation |
| `/api/projects` | POST | Create draft project | Project initialization |
| `/api/projects/:pk` | PATCH (Raw) | Update project name | On name blur/save |
| `/api/projects/:pk/import` | POST | Upload files | During file upload |
| `/api/projects/:pk/file-uploads` | GET | Get uploaded files list | After upload, refresh file list |
| `/api/projects/:pk/reimport` | POST | Finalize import | On Save button click |
| `/api/projects/:pk` | PATCH | Final project update | Before navigation |

## State Management

### Component State

1. **CreateProject State**
   - `step`: Current wizard step ("name" | "import" | "config")
   - `waiting`: Global loading state
   - `name`: Project name
   - `description`: Project description
   - `error`: Validation errors

2. **ImportPage State**
   - `error`: Import-specific errors
   - `files`: File management state
     - `uploaded`: Successfully uploaded files
     - `uploading`: Currently uploading files
     - `ids`: File upload IDs

3. **useImportPage State**
   - `uploading`: Upload in progress flag
   - `fileIds`: Array of uploaded file IDs
   - `csvHandling`: CSV processing mode
   - `uploadDisabled`: Whether upload is blocked (CSV choice required)

### Global State (Jotai Atoms)

- `projectAtom`: Current project data
- `sampleDatasetAtom`: Sample dataset configuration

## Error Handling

1. **File Validation Errors**
   - Unsupported file types
   - File size limitations
   - Upload failures

2. **API Errors**
   - Network failures
   - Server-side validation errors
   - Authentication issues

3. **State Recovery**
   - Upload interruption handling
   - Failed import recovery
   - Draft project cleanup on cancel

## Key Features

1. **Drag & Drop Support**
   - Multi-file upload
   - Folder structure handling
   - Visual feedback during drag operations

2. **CSV Intelligence**
   - Automatic CSV detection
   - User choice for processing mode
   - Column extraction and preview

3. **Real-time Validation**
   - File type checking
   - Name uniqueness validation
   - Progress tracking

4. **Sample Datasets**
   - Pre-configured sample data
   - Feature flag controlled (`FF_SAMPLE_DATASETS`)

5. **URL Import**
   - Direct URL ingestion
   - Remote file processing

This flow ensures a smooth user experience from project creation through data import, with robust error handling and state management throughout the process.