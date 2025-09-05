### DJANGO project Structure

```
lbstudio/label_studio
├── annotation_templates
│   ├── computer-vision
│   │   └── object-detection-with-bounding-boxes
│   │       └── config.xml
│   ├── natural-language-processing
│   │   └── named-entity-recognition
│   │       └── config.xml
│   └── ... (and other labeling configuration templates)
├── core
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── urls.py
│   ├── label_config.py
│   ├── settings
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── label_studio.py
│   ├── models.py
│   ├── views.py
│   └── permissions.py
├── data_export
│   ├── api.py
│   ├── models.py
│   └── urls.py
├── data_import
│   ├── api.py
│   ├── models.py
│   ├── uploader.py
│   └── urls.py
├── data_manager
│   ├── api.py
│   ├── models.py
│   ├── actions
│   │   ├── __init__.py
│   │   ├── basic.py
│   │   └── predictions_to_annotations.py
│   └── urls.py
├── io_storages
│   ├── api.py
│   ├── models.py
│   └── urls.py
├── jwt_auth
│   ├── auth.py
│   ├── models.py
│   └── views.py
├── labels_manager
│   ├── api.py
│   ├── functions.py
│   ├── models.py
│   └── urls.py
├── ml
│   ├── api.py
│   ├── api_connector.py
│   ├── models.py
│   └── urls.py
├── notifications
│   ├── api.py
│   ├── app.py
│   ├── models.py
│   ├── services.py
│   └── urls.py
├── organizations
│   ├── api.py
│   ├── models.py
│   └── urls.py
├── projects
│   ├── api.py
│   ├── models.py
│   ├── functions
│   │   └── next_task.py
│   └── urls.py
├── tasks
│   ├── api.py
│   ├── models.py
│   ├── validation.py
│   └── urls.py
├── users
│   ├── api.py
│   ├── models.py
│   └── urls.py
├── webhooks
│   ├── api.py
│   ├── models.py
│   └── urls.py
├── manage.py
└── server.py

```

## OCR-Specific Project Rules

### Project Focus
**IMPORTANT**: This Label Studio instance is specialized for OCR (Optical Character Recognition) labeling only. All features, optimizations, and development should focus exclusively on OCR annotation workflows.

### OCR Template Configuration
The primary OCR template uses the following components:
- **Image**: Display component for OCR documents/images
- **Rectangle**: For drawing bounding boxes around text regions
- **Polygon**: For irregular text region selection
- **TextArea**: For transcribing recognized text (perRegion=true)
- **Labels**: For classifying text types (e.g., 'Text', 'Handwriting')

Standard OCR template structure:
```xml
<View>
  <Image name="image" value="$ocr"/>

  <Labels name="label" toName="image">
    <Label value="Text" background="green"/>
    <Label value="Handwriting" background="blue"/>
  </Labels>

  <Rectangle name="bbox" toName="image" strokeWidth="3"/>
  <Polygon name="poly" toName="image" strokeWidth="3"/>

  <TextArea name="transcription" toName="image"
            editable="true"
            perRegion="true"
            required="true"
            maxSubmissions="1"
            rows="5"
            placeholder="Recognized Text"
            displayMode="region-list"/>
</View>
```

### Django Development Rules for OCR

1. **Model Considerations**:
   - Focus on storing OCR-specific annotations (bounding boxes, polygons, transcribed text)
   - Optimize database queries for large document datasets
   - Store region coordinates efficiently (consider using JSONField for complex polygons)

2. **API Endpoints**:
   - Prioritize endpoints for OCR workflows (document upload, region annotation, text extraction)
   - Implement efficient pagination for large document sets
   - Add OCR-specific filters (by document type, transcription status, confidence scores)

3. **Performance Optimization**:
   - Cache OCR template configurations
   - Optimize image serving for large documents
   - Implement lazy loading for document pages
   - Use database indexes on OCR-specific fields

4. **Validation**:
   - Validate bounding box coordinates are within image bounds
   - Ensure transcribed text is associated with regions
   - Check polygon coordinates form valid shapes
   - Validate OCR confidence scores if applicable

5. **Storage**:
   - Configure appropriate storage backends for OCR documents (S3, GCS, Azure)
   - Implement efficient thumbnail generation for document previews
   - Support multi-page document formats (PDF, TIFF)

6. **Task Management**:
   - Implement OCR-specific task assignment strategies
   - Support batch operations for document sets
   - Track OCR annotation progress per document/page

### OCR-Specific Features to Prioritize

1. **Document Processing**:
   - Multi-page document support
   - Page navigation within tasks
   - Zoom and pan controls for detailed annotation
   - High-resolution image support

2. **Annotation Tools**:
   - Precise bounding box drawing
   - Polygon tool for irregular text regions
   - Text line detection helpers
   - Copy/paste region functionality
   - Bulk region operations

3. **Text Transcription**:
   - Inline text editing per region
   - Spell check integration
   - Special character support
   - RTL/LTR text direction support
   - Font/script type classification

4. **Quality Control**:
   - Confidence score tracking
   - Inter-annotator agreement for OCR tasks
   - Automatic validation of transcriptions
   - Region overlap detection

### Integration Points

1. **ML Backend**:
   - Pre-annotation with OCR engines (Tesseract, Cloud Vision API, etc.)
   - Active learning for difficult regions
   - Model training on corrected annotations

2. **Export Formats**:
   - COCO format for bounding boxes
   - Custom JSON with transcriptions
   - PAGE XML format
   - ALTO XML format
   - Plain text extraction

### Testing Guidelines for OCR Features

1. **Unit Tests**:
   - Test bounding box coordinate validation
   - Test polygon simplification algorithms
   - Test text encoding/decoding for various scripts
   - Test region-text association logic

2. **Integration Tests**:
   - Test full OCR annotation workflow
   - Test multi-page document handling
   - Test export in various OCR formats
   - Test ML backend integration

3. **Performance Tests**:
   - Test with large documents (100+ pages)
   - Test with high-resolution images
   - Test concurrent annotation sessions
   - Test export of large annotation sets

### Common OCR Use Cases to Support

1. **Document Digitization**:
   - Historical document transcription
   - Form data extraction
   - Invoice/receipt processing
   - Book/manuscript digitization

2. **Data Extraction**:
   - Table structure recognition
   - Key-value pair extraction
   - Signature detection
   - Stamp/seal recognition

3. **Multilingual OCR**:
   - Support for various scripts (Latin, Arabic, CJK, etc.)
   - Mixed language documents
   - Historical scripts and fonts

### Performance Metrics to Track

- Average time per document annotation
- Regions annotated per hour
- Characters transcribed per hour
- Annotation accuracy rates
- Model confidence improvements

### Security Considerations

- Sanitize OCR text inputs to prevent XSS
- Validate image uploads for security
- Implement rate limiting on OCR endpoints
- Secure storage of sensitive documents
- Audit logging for document access

### Do NOT Implement

- Audio/video annotation features
- NLP-only tasks without visual component
- Time series annotations
- 3D annotations
- Non-document image annotations (unless specifically requested)


## File Import Flow: From Project to MinIO Storage and Database

### Overview
This section documents the complete flow of file imports from project upload to external storage (MinIO/S3) and database persistence.

### 1. Configuration for MinIO Storage

MinIO is configured as an S3-compatible storage in `label_studio/core/settings/base.py`:

```python
# MinIO Configuration (S3-compatible)
if get_env('MINIO_STORAGE_ENDPOINT') and not get_bool_env('MINIO_SKIP', False):
    AWS_STORAGE_BUCKET_NAME = get_env('MINIO_STORAGE_BUCKET_NAME')
    AWS_ACCESS_KEY_ID = get_env('MINIO_STORAGE_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = get_env('MINIO_STORAGE_SECRET_KEY')
    AWS_S3_ENDPOINT_URL = get_env('MINIO_STORAGE_ENDPOINT')
    # Additional S3 settings apply to MinIO
```

Environment variables for MinIO:
- `MINIO_STORAGE_ENDPOINT`: MinIO server URL (e.g., http://localhost:9000)
- `MINIO_STORAGE_BUCKET_NAME`: Default bucket name
- `MINIO_STORAGE_ACCESS_KEY`: MinIO access key
- `MINIO_STORAGE_SECRET_KEY`: MinIO secret key

### 2. File Upload Entry Points

#### API Endpoint: `/api/projects/{id}/import`
- **Handler**: `label_studio/data_import/api.py::ImportAPI`
- **Methods**: POST (file upload), GET (retrieve imports)
- **Parsers**: MultiPartParser, FormParser, JSONParser

#### Key Components:
1. **FileUpload Model** (`data_import/models.py`):
   - Stores uploaded files temporarily
   - Links files to projects and users
   - Handles various formats (CSV, TSV, JSON, images, etc.)

2. **Task Model** (`tasks/models.py`):
   - Core data model for labeling tasks
   - References FileUpload through foreign key
   - Stores task data in JSONField

### 3. Import Flow Steps

#### Step 1: File Reception
```python
# data_import/api.py
class ImportAPI(APIView):
    def post(self, request, *args, **kwargs):
        # 1. Validate file size and extension
        # 2. Create FileUpload instances
        # 3. Process files based on type
```

#### Step 2: File Processing
```python
# data_import/uploader.py
def create_file_uploads(user, project, files):
    # For each uploaded file:
    # 1. Check file size limits (DATA_UPLOAD_MAX_MEMORY_SIZE)
    # 2. Validate extensions (SUPPORTED_EXTENSIONS)
    # 3. Create FileUpload instance
    # 4. Save to configured storage backend
```

#### Step 3: Storage Backend Routing

**Local Storage** (default):
- Files saved to: `MEDIA_ROOT/upload/{project_id}/{uuid}-{filename}`
- Served via Django media URLs

**MinIO/S3 Storage** (when configured):
- Uses `S3ImportStorage` model (`io_storages/s3/models.py`)
- Files uploaded to bucket with prefix structure
- Supports presigned URLs for direct access

#### Step 4: Task Creation
```python
# data_import/functions.py
def load_tasks(request, project, file_uploads):
    # For each FileUpload:
    # 1. Parse file content based on format
    # 2. Create Task instances with data
    # 3. Link tasks to FileUpload
    # 4. Update project counters
```

### 4. Database Models Structure

#### FileUpload Model
```python
class FileUpload(models.Model):
    user = ForeignKey('users.User')
    project = ForeignKey('projects.Project')
    file = FileField(upload_to=upload_name_generator)
    # Tracks uploaded files and their metadata
```

#### Task Model
```python
class Task(models.Model):
    data = JSONField()  # Actual task data
    meta = JSONField()  # Metadata
    project = ForeignKey('projects.Project')
    file_upload = ForeignKey('data_import.FileUpload')
    # Core task data with file reference
```

#### S3ImportStorage Model
```python
class S3ImportStorage(S3StorageMixin, ImportStorage):
    bucket = TextField()
    prefix = TextField()
    aws_access_key_id = TextField()
    aws_secret_access_key = TextField()
    s3_endpoint = TextField()  # MinIO endpoint
    # Manages S3/MinIO storage connections
```

#### S3ImportStorageLink Model
```python
class S3ImportStorageLink(ImportStorageLink):
    storage = ForeignKey(S3ImportStorage)
    key = TextField()  # S3 object key
    task = ForeignKey(Task)
    # Links tasks to S3 objects
```

### 5. MinIO-Specific Implementation

#### Connection Setup
```python
# io_storages/s3/models.py
class S3StorageMixin:
    def get_client_and_resource(self):
        # Creates boto3 client with MinIO endpoint
        return get_client_and_resource(
            self.aws_access_key_id,
            self.aws_secret_access_key,
            self.aws_session_token,
            self.region_name,
            self.s3_endpoint  # MinIO URL
        )
```

#### File Operations
```python
# Scanning for files
def iter_keys(self):
    # Lists all objects in MinIO bucket
    # Applies regex filters if configured
    # Yields keys for task creation

# Reading data
def get_data(self, key):
    # Fetches object from MinIO
    # Parses content based on format
    # Returns task data

# URL generation
def generate_http_url(self, url):
    # Creates presigned URLs for direct access
    # Configurable TTL for security
```

### 6. Import Workflow for OCR Documents

For OCR-specific imports:

1. **Image Upload**: 
   - Images uploaded via API or UI
   - Stored in MinIO with project prefix
   - FileUpload record created

2. **Task Creation**:
   - Task data contains S3 URL reference
   - Format: `{"ocr": "s3://bucket/path/to/image.jpg"}`
   - Task linked to FileUpload

3. **Storage Link**:
   - S3ImportStorageLink created
   - Maps task to MinIO object
   - Enables sync and updates

4. **Access Pattern**:
   - Frontend requests image URL
   - Backend generates presigned URL
   - Direct access from MinIO for performance

### 7. Async Processing

For large imports:
```python
# Background job processing
start_job_async_or_sync(
    async_import_background,
    project,
    file_upload_ids,
    user
)
```

### 8. Error Handling

- File size validation: `DATA_UPLOAD_MAX_MEMORY_SIZE`
- Extension validation: `SUPPORTED_EXTENSIONS`
- Duplicate detection via storage links
- Transaction rollback on failures

### 9. Key Configuration Settings

```python
# Important settings for imports
DATA_UPLOAD_MAX_MEMORY_SIZE = 250MB  # Max file size
DATA_UPLOAD_MAX_NUMBER_FILES = 100   # Max files per import
TASKS_MAX_NUMBER = 1000000           # Max tasks per project
TASKS_MAX_FILE_SIZE = 250MB          # Max total import size
SYNC_ON_TARGET_STORAGE_CREATION = True  # Auto-sync on storage creation
```

### 10. Docker Compose MinIO Setup

When running with docker-compose.minio.yml:
```yaml
minio:
  image: minio/minio
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data
  
app:
  environment:
    MINIO_STORAGE_ENDPOINT: http://minio:9000
    MINIO_STORAGE_BUCKET_NAME: label-studio
    MINIO_STORAGE_ACCESS_KEY: minioadmin
    MINIO_STORAGE_SECRET_KEY: minioadmin
```

### Common Import Patterns

1. **Direct File Upload**: File → FileUpload → Task → Database
2. **S3 Sync Import**: S3 Bucket → S3ImportStorage → Tasks → Database  
3. **Bulk Import**: Multiple Files → Background Job → Batch Task Creation
4. **Re-import**: Existing Storage → Scan for Changes → Update Tasks

### Debugging Import Issues

1. Check logs in: `/label-studio/data/logs/`
2. Verify MinIO connection: `boto3.client.list_buckets()`
3. Check FileUpload records: `FileUpload.objects.filter(project=project)`
4. Verify storage links: `S3ImportStorageLink.objects.filter(storage=storage)`
5. Monitor background jobs: Django RQ dashboard at `/django-rq/`
