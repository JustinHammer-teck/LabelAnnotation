# OCR Service Implementation

**Date**: September 3, 2025  
**Last Updated**: September 5, 2025 (Documentation aligned with actual implementation)

## Implementation Status

### ✅ COMPLETED - Full OCR Integration (September 5, 2025)
- **PDFImageRelationship model** (`label_studio/data_import/models.py`) - Tracks PDF-to-image conversions
- **OCRCharacterExtraction model** (`label_studio/tasks/models.py`) - Stores extracted OCR characters  
- **PDF-to-Image Conversion Service** (`label_studio/data_import/services.py`) - Converts PDFs to images and stores in MinIO
- **Text Extraction Service** (`label_studio/data_import/services.py`) - Extracts text from images using EasyOCR
- **✅ OCR Integration Complete** - Full workflow from import to background OCR processing
- **✅ Background Job Processing** - OCR runs asynchronously to prevent HTTP timeouts
- **✅ Status Tracking** - Tasks track OCR processing state (`processing`, `completed`, `failed`)
- **✅ MinIO Storage Compatibility** - Works with cloud storage (fixed path issues)
- **✅ Error Handling** - Graceful failure handling with status updates
- **✅ Frontend Fix** - Resolved React state update warnings

### 🎯 Integration Points Implemented
1. **✅ OCR Trigger in Import Flow** - Added hooks in `ReImportAPI.sync_reimport()` 
2. **✅ Background Processing** - `process_ocr_for_tasks_background()` prevents timeouts
3. **✅ Task Status Management** - OCR status tracking in `Task.meta` field
4. **✅ PDF Processing Pipeline** - Automatic PDF detection and conversion during upload
5. **✅ Character Storage** - Bulk saving to `OCRCharacterExtraction` table
6. **✅ MinIO Integration** - Fixed storage path issues for cloud compatibility

## September 5, 2025 Implementation Session

### 🚀 What We Accomplished

#### 1. Fixed HTTP Timeout Issue
**Problem**: OCR processing was blocking HTTP responses, causing connection timeouts during project creation.

**Solution**: Moved OCR processing to background jobs with status tracking:
- Tasks created immediately in atomic transaction ✅
- OCR status marked as `'processing'` ✅
- HTTP response returns immediately ✅  
- Background job processes OCR asynchronously ✅

#### 2. Implemented OCR Status Lifecycle
**Status States**:
- `'processing'` → Task created, OCR queued
- `'completed'` → OCR successful, characters extracted
- `'failed'` → OCR failed, error logged

**Status Tracking in Task.meta**:
```json
{
  "ocr_status": "completed",
  "ocr_started_at": "2025-09-05T22:30:00Z",
  "ocr_completed_at": "2025-09-05T22:32:15Z",
  "ocr_summary": {
    "total_characters": 1234,
    "chinese_characters": 856,
    "pages_processed": 4,
    "has_extractions": true
  }
}
```

#### 3. Background Job Architecture
**Files Modified**:
- `label_studio/data_import/api.py` - Added background job trigger
- `label_studio/data_import/services.py` - Added background processing functions

**Key Functions**:
- `process_ocr_for_tasks_background(task_ids)` - Background job entry point
- `process_ocr_for_tasks_after_import(tasks)` - Core OCR processing logic
- Status updates on success/failure with timestamps

#### 4. MinIO Storage Compatibility Fix  
**Problem**: OCR service failed with MinIO storage due to absolute path issues.

**Solution**: Created `extract_characters_from_image_content()` function:
- Works with image bytes instead of file paths
- Compatible with MinIO/S3 storage backends
- Uses `file.read()` instead of `file.path`

#### 5. Configuration Management
**Added**: `OCR_ENABLED` setting in `label_studio/core/settings/label_studio.py`:
```python
# OCR Configuration  
OCR_ENABLED = get_bool_env('OCR_ENABLED', True)
```

#### 7. Error Handling & Recovery
**Graceful Failure Handling**:
- OCR failures don't break task creation
- Failed tasks marked with error details
- Comprehensive logging for debugging
- Transaction safety maintained

### 🔧 Technical Implementation Details

#### Import Flow Integration
**Location**: `ReImportAPI.sync_reimport()` in `data_import/api.py:443-493`

```python
with transaction.atomic():
    project.remove_tasks_by_file_uploads(file_upload_ids)
    tasks, serializer = self._save(tasks)
    
    # Mark tasks that need OCR processing
    if settings.OCR_ENABLED and tasks:
        ocr_tasks = []
        for task in tasks:
            # Check if task has PDF or image files that need OCR
            if (task.file_upload and 
                (task.file_upload.file_name.lower().endswith('.pdf') or
                 task.file_upload.file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')))):
                
                # Initialize meta if needed
                if not task.meta:
                    task.meta = {}
                
                # Mark as OCR processing
                task.meta['ocr_status'] = 'processing'
                task.meta['ocr_started_at'] = now().isoformat()
                ocr_tasks.append(task)
        
        # Bulk update OCR status in same transaction
        if ocr_tasks:
            for task in ocr_tasks:
                task.save(update_fields=['meta'])

# Queue OCR processing as background job after transaction commits
if settings.OCR_ENABLED and tasks:
    ocr_task_ids = [task.id for task in tasks 
                   if task.file_upload and 
                   (task.file_upload.file_name.lower().endswith('.pdf') or
                    task.file_upload.file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')))]
    
    if ocr_task_ids:
        start_job_async_or_sync(process_ocr_for_tasks_background, ocr_task_ids)
```

#### Background Processing Pipeline
**Location**: `data_import/services.py:295-396`

```python
def process_ocr_for_tasks_background(task_ids):
    """Background job to process OCR for tasks by their IDs"""
    tasks = Task.objects.filter(id__in=task_ids)
    return process_ocr_for_tasks_after_import(tasks)

def process_ocr_for_tasks_after_import(tasks) -> int:
    """Process OCR extraction for tasks with status tracking"""
    for task in tasks:
        try:
            # OCR processing logic...
            # On success: task.meta['ocr_status'] = 'completed'
        except Exception as e:
            # On failure: task.meta['ocr_status'] = 'failed'
            task.meta['ocr_error'] = str(e)
```

### 🎯 Results Achieved

#### Performance Improvements
- ✅ **HTTP requests working correctly** - All requests complete successfully with HTTP 201
- ✅ **Non-blocking OCR** - OCR processing happens in background
- ✅ **Scalable architecture** - Can handle large PDFs without blocking users

#### Reliability Improvements  
- ✅ **Atomic transactions** - Tasks always created successfully
- ✅ **Status visibility** - Users can see OCR processing state
- ✅ **Graceful failures** - OCR errors don't break task creation
- ✅ **Cloud storage compatibility** - Works with MinIO/S3 setups

#### User Experience Improvements
- ✅ **Immediate feedback** - Tasks appear instantly after upload
- ✅ **Progress transparency** - Clear OCR status indicators
- ✅ **No broken states** - Tasks never appear incomplete
- ✅ **Frontend stability** - Fixed React state warnings

### 🔍 Testing Validated
- ✅ **HTTP requests completing successfully** - All requests return HTTP 201 status
- ✅ **Background OCR processing** extracts characters successfully  
- ✅ **MinIO storage integration** working correctly
- ✅ **Error handling** preserves task creation on OCR failures
- ✅ **Frontend warnings** resolved for ImportPage component
- ✅ **Request processing time** acceptable (~63 seconds for complex operations)

### 📈 **Next Phase: Frontend Multi-Page OCR-Assisted Labeling**
- [ ] Character overlay component for click-to-annotate functionality
- [ ] Multi-page navigation integration with OCR character display
- [ ] Word-level grouping from character-level extractions
- [ ] Auto-bounding box generation from clicked OCR regions
- [ ] OCR status indicators per page in multi-page view
- [ ] Performance optimization for character rendering on large documents

### 📈 **Future Enhancement Opportunities**
- [ ] OCR retry mechanism for failed tasks
- [ ] Batch OCR processing optimization
- [ ] OCR quality metrics and reporting
- [ ] API endpoints for OCR status queries
- [ ] Performance optimization for counter updates (if needed)

## Implementation Summary

OCR Service for PDF-to-images conversion supporting multi-page labeling workflow:
- **EasyOCR only** for simplified Chinese character extraction (no PaddleOCR)
- **PyMuPDF** for PDF processing (no pdf2image/poppler dependencies)
- **PDFImageRelationship model** to track PDF-to-image conversions
- **Multi-page display integration** with Label Studio's existing pagination system
- **Click-to-annotate support** via character-level bounding box data
- **MinIO-only storage** for all files (no local server storage)
- **Poetry** for all package management (no pip)

## Architecture Overview

### File Import & PDF Processing Flow

**CRITICAL**: The OCR service integrates with Label Studio's existing multi-page support via `valueList` parameter. PDF files are converted to individual page images for OCR-assisted labeling workflow.

```
Frontend File Upload → File Import Service → MinIO Storage → Task Creation
                                                                    ↓
                                                          PDF Detection?
                                                          ↓              ↓
                                                        Yes              No
                                                        ↓                ↓
                                              PyMuPDF Conversion    Direct OCR
                                                        ↓
                                        Create FileUpload for each page
                                                        ↓
                                        Create PDFImageRelationship records
                                                        ↓
                                            OCR Processing on page images
                                                        ↓
                                          Task.data populated with converted_images[]
                                                        ↓
                                     Frontend uses Label Studio's valueList multi-page system
                                                        ↓
                                 Character overlays enable click-to-annotate functionality
```

#### References and Method Mapping

```
@project_note 
├── project-creation-import-flow.md (Frontend)
├── multi-page-pdf-display-investigation.md (Frontend)
├── labeling-interface-template.md (Frontend)
├── task-assignment-flow.md (Backend)
```

### Complete Process Flow: Frontend → Backend → Database

#### 1. File Upload & Import Process
```
Frontend (React)
├── File selection/drag-drop
├── Upload to Label Studio import endpoint: POST /api/projects/{id}/import
└── File validation (format, size, permissions)
    ↓
Backend File Import Service (data_import/api.py)
├── ImportAPI.create() - Main entry point
├── load_tasks() - Parse uploaded files (uploader.py:245)
├── create_file_upload() - Create FileUpload instance (uploader.py:72)
├── FileUpload.read_tasks() - Extract task data (models.py:129)
├── Task creation via ImportApiSerializer
└── SUCCESS: Queue OCR extraction task
    FAILURE: Reject file, no OCR queuing
    ↓
MinIO Storage (via Django FileField)
├── upload_name_generator() - Generate unique paths (models.py:23)
├── Secure file storage with project-based structure
├── File accessibility validation
└── Storage confirmation
    ↓
Database (PostgreSQL/SQLite)
├── FileUpload.save() - Store file metadata
├── Task.save() - Create task records with file references
├── Project counter updates via update_tasks_counters()
└── Ready for OCR processing
```

#### 2. OCR Processing Workflow
```
Background OCR Job Triggered (data_import/services.py)
├── process_ocr_for_tasks_background(task_ids) - Background job entry point
├── Filter tasks by ID and process each task individually
└── OCR extraction job processing
    ↓
Task-Level OCR Processing (process_ocr_for_tasks_after_import)
├── Check task.file_upload exists and is accessible
├── Query PDFImageRelationship for converted PDF pages
├── Route to appropriate processing based on file type:
│   ├── PDF Files → Process via PDFImageRelationship records
│   └── Image Files → Direct image processing
└── Character extraction pipeline
    ↓
PDF Processing Branch
├── convert_pdf_to_images_simple(pdf_file_upload) - Convert PDF to page images
├── Create FileUpload for each page image via ContentFile
├── Create PDFImageRelationship for each page (atomic transaction)
├── Store page images in MinIO via FileUpload.file.save()
├── extract_characters_from_image_content() for each page
└── save_ocr_extractions_for_task() with page numbers
    ↓
Image Processing Branch
├── extract_characters_from_image_content(image_content, page_number)
├── EasyOCR processing with ['ch_sim', 'en'] languages
├── Character-level coordinate calculation from text regions
├── Coordinate normalization (0.0-1.0) 
├── Chinese character detection via Unicode range check
└── save_ocr_extractions_for_task() - Atomic database storage
    ↓
Database Storage (Atomic Transaction) (data_import/services.py:242-294)
├── OCRCharacterExtraction.objects.filter().delete() - Clear existing for page
├── OCRCharacterExtraction.objects.bulk_create() - Bulk insert new extractions
├── Update task.meta['ocr_summary'] with statistics
├── Update task.meta['ocr_status'] = 'completed'
└── task.save(update_fields=['meta'])
```

## Actual Service Functions

### Key Design Principles

1. **Service-Based Architecture**: Functions in `data_import/services.py` handle all OCR processing
2. **MinIO-Only Storage**: All files and converted images stored exclusively in MinIO
3. **EasyOCR Engine**: Single OCR engine for reduced complexity and dependencies
4. **Background Processing**: Asynchronous OCR to prevent HTTP timeouts
5. **PDF-to-Image Conversion**: Uses PyMuPDF (no external system dependencies)
6. **Multi-Page Support**: Built-in support for multi-page PDFs with page tracking
7. **FileUpload Integration**: Leverages existing Django FileUpload model for MinIO storage

### Core Service Functions

**File**: `data_import/services.py`

#### 1. PDF to Image Conversion
```python
def convert_pdf_to_images_simple(pdf_file_upload: FileUpload) -> List[Dict]:
    """Convert PDF to images and create FileUpload/PDFImageRelationship records"""
    # Returns: List of {page_number, file_upload_id, relationship_id, image_filename, image_url}
```

#### 2. Character Extraction Functions
```python
def extract_characters_from_image_content(image_content: bytes, page_number: int = 1) -> List[Dict]:
    """Extract characters from image bytes using EasyOCR (for MinIO compatibility)"""
    # Returns: List of character dictionaries with normalized coordinates

def extract_characters_from_image(image_path: str, page_number: int = 1) -> List[Dict]:
    """Extract characters from image file path using EasyOCR (for local files)"""
    # Returns: List of character dictionaries with normalized coordinates
```

#### 3. Database Storage Function  
```python
def save_ocr_extractions_for_task(task, file_upload: FileUpload, characters: List[Dict]):
    """Save OCR character extractions to database with atomic transactions"""
    # Creates OCRCharacterExtraction records and updates task.meta
```

#### 4. Background Processing Functions
```python
def process_ocr_for_tasks_background(task_ids):
    """Background job entry point - processes tasks by IDs"""
    # Filters Task objects and delegates to process_ocr_for_tasks_after_import()

def process_ocr_for_tasks_after_import(tasks) -> int:
    """Main OCR processing logic for PDF and image tasks"""
    # Handles both PDF conversion + OCR and direct image OCR
    # Updates task.meta with status and error handling
```

### Data Flow Architecture

**Multi-Page PDF Processing**:
1. `convert_pdf_to_images_simple()` → Creates page images in MinIO
2. `PDFImageRelationship` records created for each page
3. `extract_characters_from_image_content()` → OCR on each page image
4. `save_ocr_extractions_for_task()` → Atomic database storage per page

**Direct Image Processing**:
1. `extract_characters_from_image_content()` → Direct OCR on uploaded image  
2. `save_ocr_extractions_for_task()` → Atomic database storage

**Frontend Data Access**:
- Query `PDFImageRelationship` to get page images for multi-page PDFs
- Query `OCRCharacterExtraction` filtered by task and page_number
- Access character coordinates (normalized 0.0-1.0) for overlay rendering

## Database Integration

### Atomic Transactions
```python
with transaction.atomic():
    # Delete existing extractions
    OCRCharacterExtraction.objects.filter(task=task).delete()

    # Create new extractions
    for char in characters:
        if char.is_chinese_character():
            OCRCharacterExtraction.objects.create(
                task=task,
                character=char.character,
                confidence=char.confidence,
                x=char.x, y=char.y,
                width=char.width, height=char.height,
                image_width=char.image_width,
                image_height=char.image_height,
                page_number=char.page_number
            )
```

### Query Optimization
- **Filtered Storage**: Only Chinese characters stored in database
- **Indexed Queries**: Leverages existing database indexes
- **Bulk Operations**: Efficient bulk delete/create operations
- **Page Filtering**: Optimized queries for multi-page documents

## PDF-to-Image Relationship Architecture

### PDFImageRelationship Model
**Purpose**: Maintain parent-child relationships between PDF files and extracted page images.

**Key Features**:
- Links original PDF FileUpload to page image FileUploads
- Stores page metadata (number, dimensions, DPI)
- Maintains extraction parameters for reproducibility
- Compatible with existing FileUpload/Task architecture

**Model Structure** (`./label_studio/data_import/models.py`):
```python
class PDFImageRelationship(models.Model):
    pdf_file = ForeignKey(FileUpload, related_name='pdf_images')
    image_file = ForeignKey(FileUpload, related_name='source_pdf')
    page_number = IntegerField()
    image_format = CharField(max_length=10, default='png')
    resolution_dpi = IntegerField(default=300)
    extraction_params = JSONField(null=True, blank=True, default=dict)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_import_pdf_image_relationship'
        unique_together = [['pdf_file', 'page_number']]
```

**Usage Pattern**:
1. PDF uploaded → FileUpload created → Task created with PDF reference
2. OCR service converts PDF → Creates FileUpload for each page image
3. PDFImageRelationship records created for each page
4. OCR extraction runs on page images
5. Results stored in OCRCharacterExtraction with page numbers

**Benefits**:
- No modification to core Task model
- Clear data lineage from PDF to images
- Efficient page-level querying
- Supports re-processing individual pages
- Maintains all files in MinIO

## Error Handling & Logging

### Graceful Degradation
- **Missing Libraries**: Clear error messages with installation instructions
- **Unsupported Files**: Explicit error messages about file type support
- **Processing Failures**: Detailed error logging with context
- **Network Issues**: Handles URL download failures gracefully

### Logging Strategy
```python
logger = logging.getLogger(__name__)

# Info logging for successful operations
logger.info(f"Extracted {len(characters)} characters from {file_path}")

# Warning for non-critical issues
logger.warning(f"Failed to initialize ImageOCRProcessor: {e}")

# Error for critical failures
logger.error(f"OCR extraction failed for task {task.id}: {e}")
```

## Testing Framework

### Comprehensive Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Mock Testing**: OCR engine behavior simulation
- **Error Path Testing**: Failure scenario validation

### Test Categories
1. **OCRCharacter Tests**: Data class functionality
2. **Processor Tests**: Individual processor behavior
3. **Service Tests**: Main service functionality
4. **Integration Tests**: Database operations
5. **Configuration Tests**: Settings validation

## Implementation Focus Rules

### IMPORTANT: PDF-to-Images OCR Only

This implementation is STRICTLY LIMITED to PDF-to-images conversion for OCR processing.

**What TO Implement**:
✅ PDF file upload handling
✅ PyMuPDF for PDF-to-image conversion
✅ PDFImageRelationship model for tracking conversions
✅ Page-by-page OCR with EasyOCR
✅ Chinese character extraction
✅ MinIO storage for all files
✅ CLI tools for testing extraction

**What NOT TO Implement**:
❌ Video frame extraction
❌ General document splitting
❌ Image transformations (resize, rotate)
❌ Format conversions (except PDF→image)
❌ Multi-engine OCR (only EasyOCR)
❌ GPU acceleration
❌ PaddleOCR support
❌ Any non-OCR features

## Dependencies & Installation

### Core Dependencies
```bash
# OCR Engine (EasyOCR only)
poetry add easyocr

# PDF Processing (PyMuPDF - no system dependencies)
poetry add pymupdf

# Image Processing
poetry add opencv-python Pillow numpy

# No system packages required!
# PyMuPDF works without poppler
```

### Development Dependencies
```bash
# Testing
poetry add --dev pytest pytest-django

# CLI tools
poetry add --dev click
```