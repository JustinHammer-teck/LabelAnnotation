# Annotation Layer Architecture Analysis

**Date**: September 3, 2025  
**Context**: OCR Character Extraction Feature - Understanding Label Studio's multi-layer annotation system  
**Purpose**: Document the layer architecture to implement OCR character overlays effectively

## Investigation Summary

Analyzed Label Studio's comprehensive layer system to understand how multiple annotation layers are rendered, managed, and coordinated in the image editor. This investigation provides the foundation for implementing OCR character overlays as an additional layer.

## Architecture Overview

Label Studio uses **Konva.js** (React-Konva) for canvas-based rendering with a sophisticated multi-layer system that supports different types of annotations, overlays, and interactive elements.

### Main Rendering Structure

```
ImageView Component
├── Pagination Controls (if multi-page)
├── Image Container
│   ├── Base Image (HTML <img> or Image component)
│   ├── Canvas Overlay (for Magic Wand tool)
│   └── Konva Stage (EntireStage)
│       ├── StageContent
│       │   ├── Hack Layer (keeps stage in place)
│       │   ├── ImageGrid Layer (optional)
│       │   ├── TransformerBack Layer
│       │   ├── Region Layers (multiple types)
│       │   ├── Selection Layer
│       │   ├── Drawing Region Layer
│       │   └── Crosshair Layer (optional)
├── Toolbar (tools controls)
└── Gallery (if multi-image)
```

## Layer System Deep Dive

### 1. Stage Architecture

**File**: `web/libs/editor/src/components/ImageView/ImageView.jsx` (lines 1100-1128)

```javascript
<Stage
  ref={(ref) => item.setStageRef(ref)}
  width={size.width}
  height={size.height}
  scaleX={item.zoomScale}
  scaleY={item.zoomScale}
  x={position.x}
  y={position.y}
  rotation={item.rotation}
>
  <StageContent item={item} store={store} state={state} crosshairRef={crosshairRef} />
</Stage>
```

**Key Properties**:
- **Scaling**: Automatic zoom support via `scaleX`/`scaleY`
- **Positioning**: Supports pan/drag via `x`/`y`
- **Rotation**: Full 360-degree rotation support
- **Event Handling**: Mouse, keyboard, wheel events

### 2. Layer Types and Rendering Order

**Rendering Order** (bottom to top in `StageContent` - lines 1151-1190):

1. **Hack Layer** - Empty layer to maintain stage positioning
2. **ImageGrid Layer** - Optional grid overlay (opacity: 0.15)
3. **TransformerBack Layer** - Background for transformations
4. **Region Layers** (grouped by type):
   - **Brush Regions** - Painted/drawn regions (no individual layers)
   - **Shape Regions** - Geometric shapes (individual layers)
   - **Suggested Brush Regions** - AI suggestions (brush style)
   - **Suggested Shape Regions** - AI suggestions (shape style)
5. **Selection Layer** - Multi-region selection interface
6. **Drawing Region Layer** - Currently being drawn region
7. **Crosshair Layer** - Crosshair cursor overlay

### 3. Region Layer Management

**File**: `web/libs/editor/src/components/ImageView/ImageView.jsx` (lines 69-89)

```javascript
const RegionsLayer = memo(({ regions, name, useLayers, showSelected = false }) => {
  const content = regions.map((el) => <Region key={`region-${el.id}`} region={el} showSelected={showSelected} />);
  
  return useLayers === false ? content : <Layer name={name}>{content}</Layer>;
});

const Regions = memo(({ regions, useLayers = true, chunkSize = 15, suggestion = false, showSelected = false }) => {
  return (
    <ImageViewProvider value={{ suggestion }}>
      {(chunkSize ? chunks(regions, chunkSize) : regions).map((chunk, i) => (
        <RegionsLayer
          key={`chunk-${i}`}
          name={`chunk-${i}`}
          regions={chunk}
          useLayers={useLayers}
          showSelected={showSelected}
        />
      ))}
    </ImageViewProvider>
  );
});
```

**Layer Strategy**:
- **Brush Regions**: `useLayers={false}` - Rendered directly without individual layers for performance
- **Shape Regions**: `useLayers={true}` - Each chunk gets its own layer
- **Chunking**: Regions split into chunks of 15 for performance optimization
- **Dynamic Layer Names**: `chunk-0`, `chunk-1`, etc.

### 4. Layer-Specific Implementations

#### A. Grid Overlay Layer
**File**: `web/libs/editor/src/components/ImageGrid/ImageGrid.jsx`

```javascript
<Layer opacity={0.15} name="ruler">
  {Object.values(grid).map((n, i) => (
    <Rect
      key={i}
      x={n.x}
      y={n.y}
      width={item.gridsize}
      height={item.gridsize}
      stroke={item.gridcolor}
      strokeWidth={1}
    />
  ))}
</Layer>
```

**Features**:
- Fixed opacity (0.15)
- Named layer ("ruler")
- Grid cells as individual Rect components
- Responsive to stage dimensions

#### B. Selection Layer
**File**: `web/libs/editor/src/components/ImageView/ImageView.jsx` (lines 329-347)

```javascript
<Layer scaleX={scale} scaleY={scale}>
  {selectionArea.isActive ? (
    <SelectionRect item={selectionArea} />
  ) : !supportsTransform && item.selectedRegions.length > 1 ? (
    <SelectionBorders item={item} selectionArea={selectionArea} />
  ) : null}
  <ImageTransformer
    item={item}
    rotateEnabled={supportsRotate}
    supportsTransform={!disableTransform && supportsTransform}
    supportsScale={supportsScale}
    selectedShapes={item.selectedRegions}
    singleNodeMode={item.selectedRegions.length === 1}
    useSingleNodeRotation={item.selectedRegions.length === 1 && supportsRotate}
    draggableBackgroundSelector={`#${TRANSFORMER_BACK_ID}`}
  />
</Layer>
```

**Features**:
- Independent scaling for zoom compensation
- Conditional rendering based on selection state
- Integrated transformer controls
- Multiple selection support

#### C. Crosshair Layer
**File**: `web/libs/editor/src/components/ImageView/ImageView.jsx` (lines 397-435)

```javascript
<Layer name="crosshair" listening={false} opacity={visible ? 0.6 : 0}>
  <Group>
    <Line
      name="v-white"
      points={pointsH}
      stroke="#fff"
      strokeWidth={strokeWidth}
      strokeScaleEnabled={enableStrokeScale}
    />
    <Line
      name="v-black"
      points={pointsH}
      stroke="#000"
      strokeWidth={strokeWidth}
      dash={dashStyle}
      strokeScaleEnabled={enableStrokeScale}
    />
  </Group>
  {/* ... more lines for horizontal crosshair ... */}
</Layer>
```

**Features**:
- Non-interactive (`listening={false}`)
- Dynamic opacity based on visibility
- Multiple line components for styling effects
- Scale-independent stroke width

### 5. Overlay Systems

#### A. Canvas Overlay (Non-Konva)
**File**: `web/libs/editor/src/components/ImageView/ImageView.jsx` (lines 442-452)

```javascript
const CanvasOverlay = observer(({ item }) => {
  return (
    <canvas
      className={styles.overlay}
      ref={(ref) => {
        item.setOverlayRef(ref);
      }}
      style={item.imageTransform}
    />
  );
});
```

**Purpose**: HTML5 Canvas overlay for Magic Wand tool
**Position**: Outside Konva Stage, positioned with CSS transforms
**Synchronization**: Matches image transforms (zoom, pan, rotate)

#### B. Interactive Overlays (HTML/SVG)
**File**: `web/libs/editor/src/components/InteractiveOverlays/CommentsOverlay.tsx`

- **Position**: Absolute positioning outside Konva Stage
- **Coordination**: Uses bounding box calculations to align with regions
- **Interactivity**: Full DOM event handling
- **Examples**: Comments, relation connectors

## Performance Optimizations

### 1. Layer Chunking
- Regions split into chunks of 15 per layer
- Prevents single layers from becoming too heavy
- Balances rendering performance with layer management

### 2. Conditional Layer Creation
```javascript
return useLayers === false ? content : <Layer name={name}>{content}</Layer>;
```
- Brush regions bypass individual layers (painted directly)
- Shape regions get proper layer isolation
- Dynamic decision based on region type

### 3. Layer Reuse and Naming
- Consistent layer naming scheme: `chunk-0`, `chunk-1`, etc.
- Layers reused during re-renders
- Named layers for debugging and manipulation

### 4. Event Optimization
- Some layers marked `listening={false}` to prevent unnecessary event processing
- Event delegation where appropriate
- Efficient hit-testing through proper layer structure

## Multi-Page Considerations

### Page-Aware Layer Management
- Layers filtered by current page: `item.multiImage && item.currentImage !== region.item_index`
- Each page maintains independent layer state
- Region visibility controlled at render time

### Coordinate Systems
- Each page has independent coordinate system
- Stage transforms apply per page
- Layer positioning relative to current page dimensions

## Implementation Recommendations for OCR Overlay

### 1. Layer Integration Strategy

**Option A: Konva Layer** (Recommended)
```javascript
// Add to StageContent rendering order
{item.ocrEnabled && <OCRCharacterLayer item={item} />}
```

**Benefits**:
- Full integration with zoom/pan/rotate
- Automatic coordinate transformation
- Consistent with existing architecture
- High performance rendering

**Implementation**:
```javascript
const OCRCharacterLayer = observer(({ item }) => {
  const characters = item.currentPageCharacters;
  
  return (
    <Layer name="ocr-characters" opacity={0.8}>
      {characters.map((char) => (
        <Group key={char.id}>
          <Rect
            x={char.x * item.stageWidth}
            y={char.y * item.stageHeight}
            width={char.width * item.stageWidth}
            height={char.height * item.stageHeight}
            fill="rgba(255, 255, 0, 0.3)"
            stroke="rgba(255, 255, 0, 0.8)"
            strokeWidth={1}
            onClick={() => char.handleClick()}
            onMouseEnter={() => char.setHovered(true)}
            onMouseLeave={() => char.setHovered(false)}
          />
          {char.showText && (
            <Text
              x={char.x * item.stageWidth}
              y={char.y * item.stageHeight}
              text={char.character}
              fontSize={char.fontSize}
              fill="#000"
            />
          )}
        </Group>
      ))}
    </Layer>
  );
});
```

### 2. Layer Positioning

**Rendering Order**: Insert OCR layer between regions and selection:
```javascript
// In StageContent component (line ~1180)
{renderableRegions.map([...existing regions...])}
{item.ocrEnabled && <OCRCharacterLayer item={item} />}  // ← Insert here
<Selection item={item} isPanning={state.isPanning} />
<DrawingRegion item={item} />
```

**Rationale**:
- OCR characters render above regions (visible over annotations)
- OCR characters render below selection (don't interfere with selection UI)
- OCR characters render below drawing regions (don't interfere with active drawing)

### 3. Multi-Page Support

```javascript
const OCRCharacterLayer = observer(({ item }) => {
  // Filter characters for current page only
  const characters = item.ocrCharacters.filter(
    char => !item.multiImage || char.page_number === (item.currentImage + 1)
  );
  
  return (
    <Layer name={`ocr-characters-page-${item.currentImage}`} opacity={0.8}>
      {/* Character rendering... */}
    </Layer>
  );
});
```

### 4. Performance Considerations

**Character Chunking**:
```javascript
// Similar to region chunking strategy
const characterChunks = chunks(characters, 50); // More characters per chunk

return (
  <>
    {characterChunks.map((chunk, i) => (
      <Layer key={`ocr-chunk-${i}`} name={`ocr-chunk-${i}`}>
        {chunk.map((char) => (/* Character components */))}
      </Layer>
    ))}
  </>
);
```

**Lazy Loading**: Only render characters for visible viewport area when zoomed in

**Memory Management**: Unload character data for non-current pages

### 5. Interaction Handling

```javascript
// Character click handler
const handleCharacterClick = (character) => {
  // Add character to selected text
  item.addToSelectedText(character.character);
  
  // Update TextArea annotation
  const textAreaRegion = item.findTextAreaRegion();
  if (textAreaRegion) {
    textAreaRegion.appendText(character.character);
  }
};

// Character hover effects
const handleCharacterHover = (character, isHovered) => {
  character.setHighlighted(isHovered);
  
  // Show character info tooltip
  if (isHovered) {
    item.showCharacterTooltip(character);
  } else {
    item.hideCharacterTooltip();
  }
};
```

## Files Analyzed

### Core Architecture
- `web/libs/editor/src/components/ImageView/ImageView.jsx` - Main rendering and layer composition
- `web/libs/editor/src/components/ImageGrid/ImageGrid.jsx` - Grid overlay implementation
- `web/libs/editor/src/regions/RegionWrapper.jsx` - Region layer wrapping
- `web/libs/editor/src/regions/BrushRegion.jsx` - Brush region layering

### Interactive Overlays
- `web/libs/editor/src/components/InteractiveOverlays/CommentsOverlay.tsx` - HTML/SVG overlay example
- `web/libs/editor/src/components/ImageView/SuggestionControls.jsx` - Suggestion layer controls

### Layer Management
- `web/libs/editor/src/regions/AliveRegion.tsx` - Region lifecycle management

## Key Insights for OCR Implementation

1. **Layer Architecture**: Konva-based layer system with proper rendering order
2. **Performance Strategy**: Chunking and conditional rendering for optimization
3. **Multi-Page Support**: Built-in page awareness and filtering
4. **Coordinate System**: Automatic transformation handling for zoom/pan/rotate
5. **Integration Points**: Clear insertion points in existing render flow
6. **Event Handling**: Comprehensive mouse/keyboard interaction support

## Next Steps

1. **Create OCRCharacterLayer component** following the established patterns
2. **Integrate with existing StageContent rendering order**
3. **Implement character data management** with page awareness
4. **Add interaction handlers** for character selection and text building
5. **Optimize performance** with chunking and lazy loading strategies

---

**Status**: Architecture Analysis Complete ✅  
**Impact**: Clear roadmap for implementing OCR character overlay as a native Konva layer with full integration into Label Studio's existing multi-layer annotation system.

**Implementation Confidence**: High - The existing architecture provides all necessary hooks and patterns for seamless OCR overlay integration.