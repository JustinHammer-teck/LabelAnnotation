# Rectangle Tool + OCR Overlay Integration Plan

## Overview
This document outlines the integration plan for combining the Rectangle drawing tool with OCR overlay functionality to enable automatic word snapping during text annotation. This feature will allow users to accurately annotate words by automatically adjusting rectangle boundaries to match OCR-detected word boundaries.

## Objective
Enable the Rectangle tool to intelligently snap to word boundaries detected by OCR, providing a more efficient and accurate text annotation workflow.

## Current State Analysis

### Rectangle Tool Architecture
- **Location**: `web/libs/editor/src/tools/Rect.js`
- **Base Class**: `TwoPointsDrawingTool` (from `DrawingTool.js`)
- **Key Methods**:
  - `mousedownEv()`: Initiates drawing
  - `mousemoveEv()`: Updates rectangle during drag
  - `mouseupEv()`: Finalizes rectangle
  - `draw()`: Core drawing logic
  - `updateDraw()`: Throttled draw updates

### Drawing Flow
```
mousedown → startDrawing() → mousemove → updateDraw() → draw() → mouseup → finishDrawing()
```

## Integration Architecture

### 1. OCR Word Detection Service
Create utility module: `web/libs/editor/src/utils/ocrWordDetection.js`

```javascript
export const OCRWordDetection = {
  // Find the closest word to a given point
  findNearestWord(x, y, ocrData, threshold = 10),

  // Get exact bounding box of a word
  getWordBoundingBox(word),

  // Find all words within a rectangular region
  findWordsInRegion(x1, y1, x2, y2, ocrData),

  // Adjust rectangle to snap to word boundaries
  snapToWordBoundaries(rect, ocrData, snapThreshold),

  // Calculate if point is near a word
  isNearWord(x, y, word, threshold)
}
```

### 2. Modified Rectangle Tool Drawing Logic

#### Enhanced TwoPointsDrawingTool
```javascript
// In DrawingTool.js - TwoPointsDrawingTool.draw()
draw(x, y) {
  const shape = self.getCurrentArea();
  if (!shape) return;

  // Calculate base coordinates
  let { x1, y1, x2, y2 } = calculateCoordinates(shape, x, y);

  // OCR word snapping integration
  if (self.shouldSnapToOCR()) {
    const snappedBounds = self.snapToWords(x1, y1, x2, y2);
    if (snappedBounds) {
      ({ x1, y1, x2, y2 } = snappedBounds);
      self.showSnapFeedback(snappedBounds);
    }
  }

  shape.setPositionInternal(x1, y1, x2 - x1, y2 - y1, shape.rotation);
}
```

### 3. OCR Data Structure

#### Enhanced Data Structure for Sentence Composition
```javascript
{
  // Raw character data from OCR API
  characters: [
    {
      id: "char_001",
      character: "H",
      x: 100,
      y: 50,
      width: 10,
      height: 15,
      confidence: 0.95
    }
    // ... more characters
  ],

  // Processed word-level data with spatial and reading order information
  words: [
    {
      id: "word_001",
      text: "example",
      bbox: {
        x: 100,      // top-left x
        y: 50,       // top-left y
        width: 80,   // width in pixels
        height: 20   // height in pixels
      },
      confidence: 0.95,
      lineIndex: 0,        // Which line this word belongs to (for reading order)
      wordIndex: 0,        // Position within the line (for word ordering)
      characterIds: ["char_001", "char_002", ...] // Links to original characters
    }
    // ... more words
  ],

  // Line-level organization for sentence reconstruction
  lines: [
    {
      id: "line_001",
      bbox: { x: 100, y: 50, width: 500, height: 20 },
      words: ["word_001", "word_002", "word_003"], // Word IDs in reading order
      text: "example sentence text",  // Pre-composed line text for efficiency
      lineIndex: 0,
      wordCount: 3
    }
    // ... more lines
  ],

  // Spatial index for fast rectangle queries (built on demand)
  spatialIndex: null // R-tree or quad-tree structure
}

// Storage in Image Model (volatile store - not persisted)
{
  ocrData: {
    characters: [],     // Raw character data
    words: [],         // Processed words with indices
    lines: [],         // Line-level organization
    spatialIndex: null // Fast spatial lookups
  },

  // Region-based word highlights with composed text
  wordHighlightsByRegion: new Map([
    ["region_123", {
      words: ["word_001", "word_002", "word_003"],
      lines: ["line_001"],
      composedText: "example sentence text", // Ready for TextArea
      wordCount: 3,
      lineCount: 1
    }]
  ]),

  ocrOverlayVisible: true,
  ocrLoading: false,
  ocrFetchError: null,
  regionTextCache: new Map() // Cache composed text per region
}
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create OCR word detection utilities
2. Add OCR data storage to Image model
3. Implement basic word boundary detection

### Phase 2: Rectangle Tool Enhancement
1. Add snap-to-word configuration options
2. Implement snapping logic in draw methods
3. Add threshold and sensitivity controls

### Phase 3: Visual Feedback System
1. Word highlighting during hover
2. Snap indicator overlays
3. Preview boundaries before commit
4. Different styling for snapped rectangles

### Phase 4: Advanced Features
1. Multi-word selection support
2. Line-level snapping option
3. Block-level snapping for paragraphs
4. Smart expansion to include punctuation

## Configuration Options

### XML Configuration
```xml
<View>
  <Rectangle
    name="rect"
    toName="image"
    snapToOCR="true"
    snapThreshold="10"
    snapMode="word"  <!-- word | line | block -->
    highlightWords="true"
    showSnapIndicators="true"
  />
  <Image name="image" value="$image" />
</View>
```

### User Settings
```javascript
{
  rectangle: {
    ocrSnapping: {
      enabled: true,
      threshold: 10,     // pixels
      mode: "word",      // word | line | block
      autoExpand: true,  // expand to include nearby punctuation
      visualFeedback: {
        highlight: true,
        color: "#4CAF50",
        opacity: 0.3
      }
    }
  }
}
```

## Snapping Algorithm

### Word Detection Logic
```javascript
function snapToWords(x1, y1, x2, y2, ocrData, threshold) {
  // 1. Find all words intersecting with rectangle
  const intersectingWords = findIntersectingWords(x1, y1, x2, y2, ocrData);

  // 2. Find words near rectangle edges (within threshold)
  const nearbyWords = findNearbyWords(x1, y1, x2, y2, ocrData, threshold);

  // 3. Combine and calculate optimal boundaries
  const allWords = [...intersectingWords, ...nearbyWords];

  // 4. Calculate bounding box that encompasses all words
  const snappedBounds = calculateWordGroupBounds(allWords);

  // 5. Return adjusted coordinates
  return {
    x1: snappedBounds.x,
    y1: snappedBounds.y,
    x2: snappedBounds.x + snappedBounds.width,
    y2: snappedBounds.y + snappedBounds.height,
    words: allWords
  };
}
```

## Visual Feedback Components

### 1. Word Highlight Overlay
- Semi-transparent overlay on detected words
- Color changes based on selection state
- Smooth transitions during drawing

### 2. Snap Indicators
- Corner markers showing snap points
- Dotted lines connecting to word boundaries
- Magnetic effect animation

### 3. Preview Mode
- Ghost rectangle showing final position
- Word count indicator
- Confidence score display

## Integration Points

### Image Model Extension
```javascript
// In Image model
.volatile(() => ({
  ocrData: null,
  ocrOverlayVisible: false,
  wordHighlights: new Set()
}))
.actions(self => ({
  setOCRData(data) {
    self.ocrData = data;
  },
  toggleOCROverlay() {
    self.ocrOverlayVisible = !self.ocrOverlayVisible;
  },
  highlightWords(wordIds) {
    self.wordHighlights = new Set(wordIds);
  }
}))
```

### Rectangle Tool Extension
```javascript
// In Rect.js
.views(self => ({
  shouldSnapToOCR() {
    return self.control?.snapToOCR &&
           self.obj?.ocrData &&
           self.obj.ocrData.words?.length > 0;
  },
  getSnapThreshold() {
    return self.control?.snapThreshold || 10;
  }
}))
```

## Performance Considerations

1. **Spatial Indexing**: Use R-tree for efficient word lookup
2. **Throttling**: Limit snapping calculations during rapid mouse movement
3. **Caching**: Cache word boundary calculations
4. **Progressive Loading**: Load OCR data on-demand for large documents

## Testing Strategy

### Unit Tests
- Word detection algorithms
- Boundary calculation logic
- Snapping threshold behavior

### Integration Tests
- Rectangle tool with OCR data
- Visual feedback rendering
- Configuration option handling

### E2E Tests
- Complete annotation workflow
- Multi-word selection
- Edge cases (rotated text, different fonts)

## Success Metrics

1. **Accuracy**: 95%+ correct word boundary detection
2. **Performance**: <50ms snap calculation time
3. **User Efficiency**: 40% reduction in annotation time
4. **User Satisfaction**: Positive feedback on snapping behavior

## Future Enhancements

1. **Smart Text Recognition**
   - Automatic text extraction on rectangle creation
   - OCR confidence-based snapping strength

2. **Advanced Selection Modes**
   - Sentence-level snapping
   - Paragraph detection
   - Table cell recognition

3. **Machine Learning Integration**
   - Learn user preferences for snap behavior
   - Predict intended selection based on patterns

4. **Multi-language Support**
   - RTL text handling
   - Vertical text support
   - Complex script recognition

## Dependencies

- Existing Rectangle tool implementation
- OCR processing backend (already implemented)
- Image model and view components
- Konva.js for rendering

## Timeline Estimate

- Phase 1: 2-3 days
- Phase 2: 3-4 days
- Phase 3: 2-3 days
- Phase 4: 3-4 days
- Testing & Refinement: 2-3 days

**Total: ~2-3 weeks for full implementation**

## Notes

- Ensure backward compatibility with existing Rectangle annotations
- Consider adding feature flag for gradual rollout
- Document API changes for plugin developers
- Create user guide for new snapping features