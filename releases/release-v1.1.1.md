# Release v1.1.1

**Release Date**: 2025-01-18
**Type**: Bug Fix Release

## 🐛 Bug Fixes

### Standalone Image OCR Display
**Issue**: Standalone images (PNG/JPG/JPEG/TIFF/BMP) were not displaying in OCR annotation template despite successful OCR extraction.

**Root Cause**: Images uploaded without PDF conversion did not create `PDFImageRelationship` entries, preventing `task.data['pages']` from being populated for template rendering.

**Solution**:
- Implemented self-referencing `PDFImageRelationship` for standalone images where both `pdf_file` and `image_file` point to the same FileUpload
- Unified PDF and image processing into single code path by ensuring relationships exist before processing
- Refactored `process_ocr_for_tasks_after_import()` with extracted helper functions:
  - `_ensure_image_relationship_exists()` - Create relationship for standalone images
  - `_set_task_pages()` - Populate task.data['pages'] from relationships
  - `_extract_ocr_for_page()` - Extract OCR for single page
  - `_process_task_relationships()` - Process all pages uniformly
- Added constants `SUPPORTED_IMAGE_EXTENSIONS` and `DEFAULT_OCR_DPI`

**Files Modified**: `label_studio/data_import/services.py`

## ✅ Impact
- Standalone images now display correctly in OCR annotation template using `valueList="$pages"`
- OCR character extraction continues to work for both PDFs and standalone images
- Eliminated 60+ lines of duplicated processing logic
- Fixed inconsistent `ocr_processed_count` logic between PDFs and images
- Improved code maintainability and testability with single responsibility functions
- Single unified processing path reduces future maintenance burden

## 🚀 Deployment
**Requirements**: OCR_ENABLED=True (no additional dependencies)
**Compatibility**: ✅ Backward compatible, no database migration required
**Note**: Existing PDFImageRelationship model supports self-referencing foreign keys without schema changes
