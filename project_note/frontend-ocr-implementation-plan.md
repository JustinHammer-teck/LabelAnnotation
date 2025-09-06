# Frontend Multi-Page OCR-Assisted Labeling Implementation Plan

**Date**: December 2024  
**Status**: Planning Phase

## Executive Summary

This document outlines the implementation plan for integrating OCR-assisted labeling functionality into the Label Studio frontend. The backend OCR extraction is already complete and operational, storing character-level data with coordinates and confidence scores. The frontend needs to display this OCR data as an overlay and enable click-to-annotate functionality for efficient labeling.

## Current State Analysis

### Backend OCR Implementation (Completed)
- **OCRCharacterExtraction Model**: Stores character-level OCR results
  - Character text, confidence scores, and normalized coordinates (0.0-1.0)
  - Page number tracking for multi-page documents
  - Full Chinese character support with EasyOCR
- **Task Metadata**: OCR status tracking (processing/completed/failed)
- **PDF Processing**: Automatic conversion to images with page relationships
- **Background Processing**: Asynchronous OCR extraction to prevent timeouts

### Frontend Infrastructure (Existing)
- **Multi-page Support**: Complete implementation via `valueList` parameter
- **Pagination System**: `PagedView` component with keyboard navigation
- **Canvas System**: Konva-based Stage/Layer architecture for overlays
- **Annotation Tools**: RectangleLabels, PolygonLabels, TextArea components
- **Region Management**: Established system for managing annotation regions

## Implementation Architecture

### Data Flow
```
Backend OCR Data → API Endpoint → Frontend Store → React Components → Canvas Overlay
                                        ↓                               ↓
                                  Cache Management            User Interactions
                                        ↓                               ↓
                                  Page Navigation           Click-to-Annotate
```

## Detailed Implementation Plan

### Phase 1: OCR Data API Integration

#### 1.1 Create OCR API Endpoint
**Location**: `label_studio/tasks/api.py`

```python
# GET /api/tasks/{task_id}/ocr-extractions
# Query params: page (optional)
# Returns: List of OCR characters for specified page or all pages
```

**Response Structure**:
```json
{
  "task_id": 123,
  "page_number": 1,
  "total_pages": 5,
  "ocr_status": "completed",
  "characters": [
    {
      "id": 1,
      "character": "字",
      "confidence": 0.95,
      "x": 0.15,
      "y": 0.20,
      "width": 0.05,
      "height": 0.06,
      "page_number": 1
    }
  ]
}
```

#### 1.2 Frontend Data Fetching
**Location**: `web/libs/editor/src/stores/TaskStore.js`

- Add OCR data fetching to existing task loading flow
- Implement caching mechanism per page
- Handle loading, error, and success states
- Integrate with existing task data structure

### Phase 2: OCR Character Overlay Component

#### 2.1 OCROverlay Component Structure
**Location**: `web/libs/editor/src/components/ImageView/OCROverlay.jsx`

```jsx
// Component responsibilities:
// - Render character bounding boxes on canvas
// - Handle coordinate transformation (normalized to canvas)
// - Manage visibility toggle
// - Handle user interactions (hover, click, drag)
```

**Key Features**:
- Semi-transparent character boxes
- Confidence-based color coding (high: green, medium: yellow, low: red)
- Hover effects showing character and confidence
- Selection highlighting

#### 2.2 Integration with ImageView
**Location**: `web/libs/editor/src/components/ImageView/ImageView.jsx`

- Add OCROverlay as a new Konva Layer
- Position between image and annotation layers
- Handle zoom/pan transformations
- Sync with existing transform controls

### Phase 3: Click-to-Annotate Integration

#### 3.1 Character Selection to Region Creation
**Workflow**:
1. User clicks on OCR character(s)
2. System creates temporary selection
3. User can expand selection by dragging
4. On release, create Rectangle region with bounds
5. Auto-select active label from RectangleLabels

#### 3.2 Word-Level Grouping Algorithm
```javascript
// Group adjacent characters into words based on:
// - Horizontal proximity (gap < avg_char_width * 0.5)
// - Similar baseline (y-coordinate variance < threshold)
// - Same page number
```

#### 3.3 TextArea Auto-Population
When region created from OCR:
- Extract selected characters' text
- Populate perRegion TextArea automatically
- Mark as "OCR-suggested" for user review

### Phase 4: Multi-Page Navigation Enhancement

#### 4.1 OCR Status Indicators
**Location**: `web/libs/editor/src/common/Pagination/Pagination.tsx`

Visual indicators per page:
- 🔄 Processing (spinning icon)
- ✅ Completed (green checkmark)
- ❌ Failed (red X)
- ⏳ Pending (gray clock)

#### 4.2 Performance Optimizations
- **Lazy Loading**: Load OCR data only for visible page
- **Preloading**: Fetch adjacent pages in background
- **Virtual Rendering**: For pages with >1000 characters
- **Debounced Updates**: Batch UI updates during interactions

## User Interface Design

### OCR Control Panel
```
┌─────────────────────────────────┐
│ OCR Controls                    │
├─────────────────────────────────┤
│ [✓] Show OCR Overlay            │
│ [✓] Enable Click-to-Annotate    │
│ [ ] Show Low Confidence (<0.5)  │
│                                 │
│ Confidence Threshold: [====] 0.7│
│                                 │
│ OCR Status: ✅ Completed        │
│ Characters: 1,234 detected      │
└─────────────────────────────────┘
```

### Visual Overlay Design
- Character boxes: 1px border, 10% opacity fill
- Selected characters: 2px border, 20% opacity fill
- Hover state: Show tooltip with character and confidence
- Colors based on confidence scores

## Configuration Examples
### Multi-Page Document with OCR and Transcription
```xml
<View>
  <!-- 
    The RectangleLabels tag provides the tools to draw bounding boxes on the images.
    The `toName` attribute must match the `name` of the Image tag below.
    With OCR overlay, clicking on detected text will auto-create rectangles.
  -->
  <RectangleLabels name="box" toName="pages">
    <Label value="Title" background="red"/>
    <Label value="Text Paragraph" background="blue"/>
    <Label value="Image" background="green"/>
    <Label value="Table" background="orange"/>
  </RectangleLabels>

  <!-- 
    The TextArea tag is optional. It allows annotators to transcribe text for each bounding box.
    `perRegion="true"` links each transcription to a specific bounding box.
    When OCR is enabled, this will be auto-populated with detected text.
  -->
  <TextArea name="transcription" toName="pages" 
            editable="true" 
            perRegion="true" 
            required="false" 
            maxSubmissions="1" 
            rows="3" 
            placeholder="OCR-detected text will appear here..." 
            displayMode="region-list"/>
            
  <!-- 
    The Image tag displays the images. The `valueList` parameter enables multi-page annotation.
    It expects task data with a "pages" key containing a list of image URLs.
    OCR overlay will be rendered on top of each image page.
  -->
  <Image name="pages" valueList="$pages" zoom="true" zoomControl="true"/>
</View>
```

### Task Data Format for Multi-Page OCR
```json
{
  "data": {
    "pages": [
      "https://storage.example.com/page-1.png",
      "https://storage.example.com/page-2.png",
      "https://storage.example.com/page-3.png"
    ]
  },
  "meta": {
    "ocr_status": "completed",
    "ocr_summary": {
      "total_characters": 1234,
      "pages_processed": 3
    }
  }
}
```

## Technical Specifications

### OCR Character Data Structure
```typescript
interface OCRCharacter {
  id: number;
  character: string;
  confidence: number;
  x: number;        // Normalized 0.0-1.0
  y: number;        // Normalized 0.0-1.0
  width: number;    // Normalized 0.0-1.0
  height: number;   // Normalized 0.0-1.0
  page_number: number;
}
```

### Coordinate System
- Backend stores normalized coordinates (0.0 to 1.0)
- Frontend converts to canvas coordinates
- Transformation formula: `canvas_x = normalized_x * image_width`

### Event Handling
```javascript
// Click handler pseudocode
onCharacterClick(character) {
  if (isMultiSelect) {
    addToSelection(character);
  } else {
    createRegionFromCharacter(character);
  }
}

// Drag selection
onDragSelect(startChar, endChar) {
  const chars = getCharactersBetween(startChar, endChar);
  createRegionFromCharacters(chars);
}
```

## Performance Considerations

### Rendering Optimization
- Use Canvas for character rendering (not DOM elements)
- Implement viewport culling (only render visible characters)
- Batch render operations in animation frames
- Use Web Workers for heavy computations

### Memory Management
- Clear OCR data when switching tasks
- Limit cache size to N pages
- Use WeakMap for component references
- Implement cleanup in useEffect hooks

### Network Optimization
- Compress API responses with gzip
- Implement request debouncing
- Cache responses with proper TTL
- Use pagination for large datasets

## Testing Strategy

### Unit Tests
- OCR data parsing and transformation
- Coordinate conversion functions
- Character grouping algorithms
- Selection logic

### Integration Tests
- API endpoint communication
- Store updates and state management
- Component rendering with mock data
- User interaction flows

### E2E Tests
- Complete OCR-assisted labeling workflow
- Multi-page navigation with OCR
- Performance with large character sets
- Error handling scenarios

## Migration and Rollout

### Feature Flags
```javascript
if (featureFlags.isEnabled('ff_ocr_overlay')) {
  // Show OCR overlay components
}
```

### Gradual Rollout
1. Internal testing with sample projects
2. Beta release to selected users
3. Full release with documentation

## Future Enhancements

### Phase 5 (Future)
- Text line detection and grouping
- Paragraph-level selection
- OCR confidence editing
- Custom OCR model integration
- Export OCR data with annotations

### Phase 6 (Future)
- Real-time OCR processing
- OCR correction interface
- Language-specific optimizations
- Table structure detection

## Success Metrics

### Performance KPIs
- Page load time with OCR < 2 seconds
- Character rendering < 16ms (60 FPS)
- Memory usage < 200MB for 10k characters

### User Experience KPIs
- Click-to-annotate accuracy > 95%
- Time saved vs manual annotation > 50%
- User satisfaction score > 4.5/5

## Dependencies

### Frontend Libraries
- Existing: React, Konva, MobX
- No new dependencies required

### Backend Requirements
- OCRCharacterExtraction model (completed)
- API endpoint implementation (Phase 1)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large character sets impact performance | High | Implement virtual rendering |
| OCR accuracy affects user experience | Medium | Allow manual correction |
| Complex coordinate transformations | Medium | Extensive testing and validation |
| Browser compatibility issues | Low | Use standard Canvas API |

## Implementation Timeline

- **Week 1**: API endpoint and data fetching
- **Week 2**: OCROverlay component development
- **Week 3**: Click-to-annotate integration
- **Week 4**: Multi-page enhancements and testing
- **Week 5**: Performance optimization and bug fixes
- **Week 6**: Documentation and release preparation

## Conclusion

This implementation plan provides a comprehensive approach to adding OCR-assisted labeling to Label Studio's frontend. By leveraging existing infrastructure and following a phased approach, we can deliver a robust solution that significantly improves labeling efficiency for document annotation tasks.