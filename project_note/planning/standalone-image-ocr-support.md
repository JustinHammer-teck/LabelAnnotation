# Standalone Image OCR Support

## Problem
Standalone images (PNG/JPG/JPEG/TIFF/BMP) don't display in OCR template. Only PDF-extracted images work because they have `PDFImageRelationship` entries that populate `task.data['pages']`.

## Current Behavior

### PDF Import
1. PDF uploaded → `FileUpload` created
2. `convert_pdf_to_images_simple()` extracts pages
3. Each page creates:
   - New `FileUpload` for image → MinIO
   - `PDFImageRelationship(pdf_file=pdf, image_file=page_image, page_number=N)`
4. `process_ocr_for_tasks_after_import()` finds relationships → sets `task.data['pages'] = [urls]`
5. OCR template displays images from `pages` field ✅

### Standalone Image Import (Broken)
1. Image uploaded → `FileUpload` created
2. No `PDFImageRelationship` created ❌
3. OCR extraction runs ✅
4. `task.data['pages']` never set ❌
5. Image doesn't display in template ❌

## Solution
Create self-referencing `PDFImageRelationship` for standalone images to reuse existing `pages` mechanism.

## Implementation

### File: `data_import/services.py`
**Function**: `process_ocr_for_tasks_after_import()` (line 358-369)

**Add after line 357**:
```python
elif file_upload.file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
    # Create self-referencing relationship for standalone images
    PDFImageRelationship.objects.get_or_create(
        pdf_file=file_upload,
        image_file=file_upload,
        page_number=1,
        defaults={
            'image_format': file_upload.format.lstrip('.'),
            'resolution_dpi': 300
        }
    )

    # Set pages field for OCR template
    if not task.data:
        task.data = {}
    task.data['pages'] = [file_upload.url]
    task.save(update_fields=['data'])

    # Continue with OCR extraction...
    try:
        file_upload.file.seek(0)
        image_content = file_upload.file.read()
        characters = extract_characters_from_image_content(image_content, 1)

        if characters:
            save_ocr_extractions_for_task(task, file_upload, characters)
            logger.info(f"Task {task.id}: Extracted {len(characters)} chars from image")
            ocr_processed_count += 1
    except Exception as e:
        logger.error(f"Failed to read image from MinIO: {e}")
```

## Key Points
- Self-reference: `pdf_file` and `image_file` both point to same `FileUpload`
- `page_number` always = 1 for standalone images
- Reuses existing display logic (no template changes needed)
- OCR extraction continues to work as before

## Testing
1. Import standalone PNG/JPG
2. Verify `PDFImageRelationship` created with self-reference
3. Verify `task.data['pages']` contains image URL
4. Verify image displays in OCR template
5. Verify OCR characters extracted