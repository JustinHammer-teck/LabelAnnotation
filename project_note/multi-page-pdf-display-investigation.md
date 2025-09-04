# Multi-Page PDF Display Investigation

**Date**: September 3, 2025  
**Context**: OCR Character Extraction Feature - Understanding existing multi-page support

## Investigation Summary

Investigated how Label Studio's editor handles multi-page PDF/image display to understand the architecture for implementing OCR character overlays that work across multiple pages.

## Key Findings

### 1. Multi-Page Configuration

Label Studio supports multi-page documents through the `valueList` parameter:

```xml
<!-- Single image -->
<Image name="image" value="$url"/>

<!-- Multi-page document -->
<Image name="image" valueList="$images"/>
```

Data structure for multi-page:
```json
{
  "data": {
    "images": [
      "page1.jpg",
      "page2.jpg", 
      "page3.jpg"
    ]
  }
}
```

### 2. Architecture Components

#### Image Entity Management
- **File**: `web/libs/editor/src/tags/object/Image/ImageEntityMixin.js`
- Each page becomes an `ImageEntity` in the `imageEntities` array
- `currentImageEntity` tracks the active page
- `currentImage` index (0-based) for current page number
- Each entity maintains independent state (zoom, rotation, dimensions)

#### Navigation Controls
- **File**: `web/libs/editor/src/components/ImageView/ImageView.jsx` (lines 970-984)
- Pagination component at top of image view
- Keyboard shortcuts: `image:prev` and `image:next`
- Thumbnail gallery at bottom for direct page access
- Page switching: `item.setCurrentImage(n - 1)`

#### Page State Management
- **File**: `web/libs/editor/src/tags/object/Image/Image.js` (lines 763-790)
- `setCurrentImage()` method handles page switching
- Preloading strategy: `IMAGE_PRELOAD_COUNT = 3` adjacent pages
- Each page retains independent viewport state

### 3. Region Management Across Pages

- Regions store `item_index` to associate with specific page
- Cross-page drawing prevention: `item.multiImage && item.currentImage !== region.item_index`
- Auto-navigation to page when region selected
- Coordinates relative to each page's dimensions

### 4. Performance Optimizations

- **Lazy Loading**: Non-current pages loaded on demand
- **Image Preloading**: Adjacent pages preloaded for smooth navigation
- **Efficient Re-rendering**: Only current page fully rendered
- **State Persistence**: Each page maintains zoom/rotation/brightness

### 5. Template Support

Label Studio includes dedicated multi-page document template:
- Location: `annotation_templates/computer-vision/multipage-documents/`
- Demonstrates best practices for multi-page annotation workflows

## Implementation Implications for OCR Feature

### Character Overlay Requirements

1. **Page Awareness**: Character overlays must respect `currentImage` index
2. **Data Association**: Store character data with `page_number` matching `item_index`
3. **Navigation Integration**: Update overlays when page changes via `setCurrentImage()`

### Database Schema Alignment

Our `OCRCharacterExtraction` model already includes:
```python
page_number = models.IntegerField(default=1, help_text="Page number (1-based, for PDF support)")
```

This aligns perfectly with Label Studio's multi-page architecture.

### Frontend Integration Points

1. **Character Rendering**: Check current page before rendering overlays
2. **Page Change Handling**: Listen for page navigation events
3. **Lazy Loading**: Load character data per page as needed
4. **Coordinate Mapping**: Ensure character coordinates match page dimensions

### Code Integration Examples

```javascript
// Check if character should be displayed on current page
if (item.multiImage && character.page_number !== (item.currentImage + 1)) {
  return null; // Don't render on this page
}

// Listen for page changes to update character overlays
useEffect(() => {
  // Reload character data for new page
  loadCharactersForPage(item.currentImage + 1);
}, [item.currentImage]);
```

## Next Steps for OCR Implementation

1. **Character Overlay Component**: Create React component that respects multi-page structure
2. **Page Navigation Integration**: Hook into `setCurrentImage` to update character display
3. **Performance Optimization**: Implement lazy loading for character data per page
4. **Coordinate System**: Ensure character bounding boxes align with page-specific coordinate space

## Files Analyzed

- `web/libs/editor/src/tags/object/Image/Image.js` - Main image component with multi-page logic
- `web/libs/editor/src/tags/object/Image/ImageEntityMixin.js` - Image entity management
- `web/libs/editor/src/components/ImageView/ImageView.jsx` - Pagination controls and rendering
- `web/libs/editor/src/tags/object/PagedView.jsx` - Paginated view component
- `web/libs/editor/src/tags/object/MultiItemObjectBase.js` - Multi-item interface
- `web/libs/editor/src/common/Pagination/Pagination.tsx` - Pagination UI component

## Related Planning Documents

- `OCR_CHARACTER_EXTRACTION_PLANNING.md` - Original feature planning with multi-page support
- `label_studio/tasks/ocr_models.py` - Database models with page_number support
- `label_studio/tasks/tests/test_ocr_models.py` - Tests for multi-page functionality

---

**Status**: Investigation Complete ✅  
**Impact**: Confirmed that Label Studio's existing multi-page architecture fully supports our OCR character overlay requirements. No architectural changes needed - we can build on top of the existing pagination and image entity system.