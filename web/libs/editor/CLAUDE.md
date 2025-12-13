# Label Studio Editor (LSF)

Annotation engine for Label Studio. Parses XML configuration and renders interactive labeling interfaces.

## Important Instructions

NEVER use inline require:
```javascript
// BAD
const { OCRWordDetection } = require("../utils/ocrWordDetection");

// GOOD
import { OCRWordDetection } from "../utils/ocrWordDetection";
```

## Entry Points

| File | Purpose |
|------|---------|
| `src/index.js` | Module entry, exports LabelStudio |
| `src/LabelStudio.tsx` | Main class, standalone instantiation |
| `src/Component.jsx` | React component wrapper |
| `src/configureStore.js` | Store initialization |

## Architecture

### State Management: MobX-State-Tree

```
AppStore (root)
├── annotationStore → Annotation[] (with regionStore, relationStore)
├── commentStore → Comment[]
├── task → TaskStore
├── project → ProjectStore
├── settings → SettingsStore
└── user → UserStore
```

**Pattern:**
```javascript
const Model = types
  .model("Name", { field: types.string })
  .views(self => ({ computed() { return self.field; } }))
  .actions(self => ({ update(val) { self.field = val; } }));
```

**Usage in components:**
```javascript
@inject("store")
@observer
class MyComponent extends Component { ... }
```

### Registry Pattern

`core/Registry.ts` registers tags, models, views, tools for dynamic instantiation from XML config.

### Mixins

Behavioral composition in `src/mixins/`:
- `AnnotationMixin` - annotation access
- `AreaMixin` - region base behavior
- `KonvaRegion` - canvas rendering
- `Required`, `ReadOnlyMixin` - validation

## Directory Structure

```
src/
├── components/      # React UI (App, TopBar, BottomBar, SidePanels, Timeline)
├── common/          # Reusable UI (Button, Dropdown, Modal, Input)
├── stores/          # MobX-State-Tree models
│   ├── AppStore.js
│   ├── Annotation/
│   ├── Comment/
│   └── RegionStore.js
├── tags/            # XML tag implementations
│   ├── control/     # Labels, Choices, Rectangle, Polygon, Brush, etc.
│   ├── object/      # Image, Text, Audio, Video, Paragraphs
│   └── visual/      # View, Header, Collapse, Repeater
├── regions/         # Annotation region models (RectRegion, BrushRegion, etc.)
├── tools/           # Drawing tools (Rect, Polygon, Brush, MagicWand)
├── mixins/          # Shared model behaviors
├── core/            # Engine (Tree.tsx, Registry.ts, Hotkey.ts)
├── lib/AudioUltra/  # Audio waveform/spectrogram processing
├── hooks/           # React hooks (useHotkey, useToggle, useFullscreen)
├── utils/           # Utilities (bem.ts, colors.js, canvas.js)
├── assets/styles/   # Global SCSS (_variables, _mixins)
└── examples/        # XML config examples
```

## Domain Concepts

### Tags (XML Configuration)

**Object Tags** - Data sources:
- `Image`, `Text`, `Audio`, `Video`, `Paragraphs`, `TimeSeries`

**Control Tags** - Annotation controls:
- Classification: `Labels`, `Choices`, `Taxonomy`, `Rating`
- Drawing: `Rectangle`, `Polygon`, `Ellipse`, `KeyPoint`, `Brush`
- Text: `TextArea`, `DateTime`, `Number`
- Relations: `Relations`

**Visual Tags** - Layout:
- `View`, `Header`, `Collapse`, `Repeater`, `Style`

### Regions (Annotation Results)

| Region | Use Case |
|--------|----------|
| `RectRegion` | Bounding boxes |
| `PolygonRegion` | Polygon shapes |
| `BrushRegion` | Segmentation masks |
| `KeyPointRegion` | Keypoints/pose |
| `AudioRegion` | Audio time ranges |
| `TextRegion` | Text spans |

### Result Format

```json
{
  "id": "region_1",
  "from_name": "label",
  "to_name": "image",
  "type": "rectanglelabels",
  "value": {
    "x": 10, "y": 20, "width": 100, "height": 50,
    "rectanglelabels": ["Person"]
  }
}
```

## Coding Standards

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DetailsPanel.tsx` |
| Utilities | camelCase | `utilities.ts` |
| Stores | PascalCase + Store | `AppStore.js` |
| Mixins | PascalCase + Mixin | `AnnotationMixin.js` |
| Tests | *.test.ts/tsx | `Controls.test.tsx` |

### TypeScript

- `.ts/.tsx` for new code (preferred)
- `.js/.jsx` for existing code
- `strict: true` enabled
- `allowJs: true` for gradual migration

### CSS

BEM naming via `src/utils/bem.ts`:
```javascript
import { cn } from "../utils/bem";
const block = cn("button");
// block.elem("text").mod({ active: true }) → "dm-button__text dm-button__text_active"
```

Prefix: `dm-`

### Component Patterns

```typescript
// Functional with observer
export const MyComponent: FC<Props> = observer(({ store }) => {
  return <div>...</div>;
});

// With injection
@inject("store")
@observer
class MyComponent extends Component<Props> { ... }
```

## Testing

- **Unit**: Jest with `__tests__/` directories
- **E2E**: Cypress (`cypress.config.ts`)
- **Coverage**: NYC/Istanbul

## Build

- **Bundler**: Nx + Webpack
- **Dev server**: `nx serve editor` (port 3000)
- **Build**: `nx build editor`

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `mobx-state-tree@3.16` | State management |
| `mobx-react@6` | React bindings |
| `konva@8.1` | Canvas drawing |
| `antd@4.3` | UI components |
| `wavesurfer.js@6` | Audio visualization |
