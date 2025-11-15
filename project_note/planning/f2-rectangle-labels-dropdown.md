# Feature Planning: RectangleLabelsDropdown Component

## Overview

Create a new `RectangleLabelsDropdown` component that displays label selection as a dropdown instead of inline buttons, while maintaining full compatibility with existing RectangleLabels API and annotation workflow.

## Approach

**Decision**: Create a completely new component rather than modifying existing RectangleLabels

**Rationale**:
- Zero risk to existing RectangleLabels functionality
- Independent development and testing
- Cleaner separation of concerns
- No conditional rendering complexity
- Users can choose which component fits their use case

---

## Current Architecture

### RectangleLabels Component
**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/tags/control/RectangleLabels.jsx`

**State Management**: MobX State Tree
**Current Rendering**: Uses `HtxLabels` which renders children inline via `Tree.renderChildren()`

**Model Composition**:
- `ControlBase` - Base control functionality
- `LabelsModel` - Label selection and state management
- `RectangleModel` - Rectangle-specific properties (opacity, strokeWidth, fillColor)
- `LabelMixin` - Label-specific mixins
- `SelectedModelMixin` - Label selection state management

**Key Props**:
- `name` - Element identifier
- `toName` - Target image element
- `choice` - "single" | "multiple" (default: "single")
- `strokeWidth` - Rectangle stroke width
- `opacity` - Rectangle opacity
- `fillColor`, `strokeColor` - Rectangle colors
- `maxUsages` - Maximum label usage per task
- `showInline` - Display labels inline

### Labels State Management
**LabelsModel** provides:
- `tiedChildren` - All label children
- `selectedLabels` - Currently selected labels
- `unselectAll()` - Clear all selections
- `shouldBeUnselected` - Single vs multiple mode logic

**LabelModel** provides:
- `toggleSelected()` - Complex selection logic with validation
- `onClick()` - Entry point for user interaction
- `selected` - Observable state
- `canBeUsed()` - maxUsages validation

### Existing Dropdown Components
**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/common/Dropdown/`

- `Dropdown.tsx` - Main dropdown with positioning and portal rendering
- `DropdownTrigger.tsx` - Trigger wrapper with context
- `Menu.jsx` - Menu component with keyboard navigation

---

## Component Architecture

### 1. RectangleLabelsDropdown.jsx
**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/tags/control/RectangleLabelsDropdown.jsx`

**Responsibilities**:
- Define MobX model identical to RectangleLabels
- Use `HtxLabelsDropdown` view instead of `HtxLabels`
- Register as new XML tag in registry

**Model Structure**:
```javascript
const Model = types.model("RectangleLabelsDropdownModel", {
  type: "rectanglelabelsdropdown",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
  // ... same props as RectangleLabels
}).views(self => ({
  // ... same views as RectangleLabels
})).actions(self => ({
  // ... same actions as RectangleLabels
}));

const RectangleLabelsDropdownModel = types.compose(
  "RectangleLabelsDropdownModel",
  ControlBase,
  LabelsModel,
  RectangleModel,
  Model
);
```

### 2. HtxLabelsDropdown Component
**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/tags/control/Labels/LabelsDropdown.tsx`

**Responsibilities**:
- Render dropdown trigger with selected labels
- Render dropdown menu with all label options
- Handle label selection via MobX actions
- Preserve hotkey functionality
- Display label background colors

**Component Structure**:
```tsx
export const HtxLabelsDropdown: FC<{ item: LabelsModelType }> = observer(({ item }) => {
  return (
    <Block name="labels-dropdown">
      <Dropdown.Trigger content={
        <Dropdown alignment="bottom-left">
          <Menu closeDropdownOnItemClick={item.choice === "single"}>
            {item.tiedChildren.map(label => (
              <LabelMenuItem
                key={label.id}
                label={label}
                onClick={() => label.onClick()}
              />
            ))}
          </Menu>
        </Dropdown>
      }>
        <DropdownTriggerButton
          selectedLabels={item.selectedLabels}
          disabled={item.annotation?.isReadOnly()}
        />
      </Dropdown.Trigger>
    </Block>
  );
});
```

### 3. LabelMenuItem Component
**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/tags/control/Labels/LabelMenuItem.tsx`

**Responsibilities**:
- Render individual label in dropdown menu
- Display 4px color indicator bar
- Show hotkey if settings enabled
- Handle selection state styling
- Execute label onClick handler

**Props**:
```typescript
interface LabelMenuItemProps {
  label: LabelModelType;
  onClick: () => void;
}
```

**Visual Design**:
```
[█] Label Text                [Hotkey]
 ┃  Header                      (H)
```

### 4. DropdownTriggerButton Component
**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/tags/control/Labels/DropdownTriggerButton.tsx`

**Responsibilities**:
- Display current selection state
- Show placeholder when empty
- Handle multiple selection display
- Display color indicators

**Props**:
```typescript
interface DropdownTriggerButtonProps {
  selectedLabels: LabelModelType[];
  placeholder?: string;
  disabled?: boolean;
}
```

**Visual States**:
- **Empty**: "Select label..." (gray text)
- **Single**: "[█] Header"
- **Multiple**: "[█] Header [█] Content (+2 more)"

---

## XML Usage

### New Component
```xml
<View>
  <Image name="pages" value="$image" />
  <RectangleLabelsDropdown name="documentSections" toName="pages" choice="single">
    <Label value="Header" translationKey="labels.document_sections.header" background="#4A90E2" />
    <Label value="Content" background="#50C878" />
    <Label value="Footer" background="#FFB84D" />
  </RectangleLabelsDropdown>
</View>
```

### Existing Component (Unchanged)
```xml
<View>
  <Image name="pages" value="$image" />
  <RectangleLabels name="documentSections" toName="pages" choice="single">
    <Label value="Header" background="#4A90E2" />
  </RectangleLabels>
</View>
```

---

## State Management Integration

### No New State Management Required

All state management reuses existing MobX infrastructure:

**Selection Flow**:
1. User clicks dropdown trigger → Dropdown opens
2. User clicks label menu item → `label.onClick()` called
3. `onClick()` → `toggleSelected()` with validation
4. If single mode and different label → `labels.unselectAll()` → `self.setSelected(true)`
5. MobX observers re-render dropdown trigger
6. If single mode → Menu auto-closes
7. Region creation proceeds with selected label(s)

**Key Methods Used**:
- `label.onClick()` - User interaction entry point
- `label.toggleSelected()` - Selection state management
- `labels.unselectAll()` - Clear selections (single mode)
- `label.canBeUsed()` - maxUsages validation
- `item.annotation?.isReadOnly()` - Read-only state check

---

## Styling Approach

### File Structure
```
web/libs/editor/src/tags/control/Labels/
├── LabelsDropdown.module.scss
├── LabelMenuItem.module.scss
└── DropdownTriggerButton.module.scss
```

### Key Styles

**Dropdown Trigger**:
```scss
.trigger {
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border: 1px solid var(--color-neutral-border);
  border-radius: 4px;
  background: var(--color-neutral-bg);
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

**Color Indicator** (4px vertical bar):
```scss
.color-indicator {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}
```

**Menu Item**:
```scss
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;

  &--selected {
    background: var(--color-primary-bg-subtle);
  }

  &:hover {
    background: var(--color-neutral-bg-hover);
  }
}
```

---

## Implementation Tasks

### Phase 1: View Components
**Files**: LabelsDropdown.tsx, LabelMenuItem.tsx, DropdownTriggerButton.tsx + SCSS modules

1. Create `LabelsDropdown.tsx` with MobX observer
2. Import Dropdown and Menu from common
3. Implement dropdown structure connecting to `item.tiedChildren`
4. Create `LabelMenuItem.tsx` with color indicator and hotkey display
5. Create `DropdownTriggerButton.tsx` with selection states
6. Add SCSS modules for all components

### Phase 2: Model and Registration
**Files**: RectangleLabelsDropdown.jsx

1. Copy RectangleLabels.jsx structure
2. Change type to "rectanglelabelsdropdown"
3. Import HtxLabelsDropdown instead of HtxLabels
4. Update view component to use HtxLabelsDropdown
5. Register new tag in tag registry

### Phase 3: Styling and Polish
**Files**: All .module.scss files

1. Implement color indicator styling with dynamic background
2. Add hover and focus states
3. Handle long label names (text truncation)
4. Responsive design for narrow containers
5. Disabled state styling

### Phase 4: Testing
**Files**: Unit and integration tests

1. Unit: LabelsDropdown renders correctly
2. Unit: LabelMenuItem displays label properties
3. Unit: DropdownTriggerButton shows correct states
4. Integration: Single choice mode behavior
5. Integration: Multiple choice mode behavior
6. Integration: maxUsages constraint enforcement
7. Integration: Hotkeys work correctly
8. Integration: Read-only mode disables interaction
9. E2E: Full annotation workflow with dropdown

### Phase 5: Documentation
**Files**: README updates, example configs

1. Add XML usage example to documentation
2. Add to tag registry documentation
3. Create Storybook story (if applicable)

---

## Tag Registry Registration

**Location**: `/home/moritzzmn/projects/labelstudio/web/libs/editor/src/core/Tags.js`

Add new tag import and registration:
```javascript
import RectangleLabelsDropdown from "../tags/control/RectangleLabelsDropdown";

// In tag registration
Registry.addTag("rectanglelabelsdropdown", RectangleLabelsDropdown.model, RectangleLabelsDropdown.view);
```

---

## Key Implementation Decisions

### 1. Separate Component vs Modification
**Decision**: Create new component
**Rationale**: Zero risk to existing functionality, cleaner architecture

### 2. Model Reuse
**Decision**: Copy RectangleLabels model structure, only change view
**Rationale**: Maintains same API and behavior, only UI differs

### 3. Component Reuse
**Decision**: Use existing Dropdown and Menu components
**Rationale**: Consistent UX, proven positioning logic

### 4. Color Display
**Decision**: 4px vertical color indicator bars
**Rationale**: Space-efficient, maintains visual consistency

### 5. State Management
**Decision**: No new state management, use existing label.onClick()
**Rationale**: Preserves complex validation and selection logic

---

## Potential Challenges

### Challenge 1: Long Label Names
**Solution**: CSS text-overflow with ellipsis, tooltip on hover

### Challenge 2: Multiple Selection Display
**Solution**: Show first 2 labels, "+N more" for additional

### Challenge 3: Dropdown Positioning
**Solution**: Existing Dropdown component handles positioning automatically

### Challenge 4: Tag Registry
**Solution**: Ensure proper registration of new tag type

---

## Testing Strategy

### Unit Tests
- LabelsDropdown renders with empty/selected states
- LabelMenuItem displays value, color, hotkey
- DropdownTriggerButton displays correct visual states
- Component calls onClick handlers correctly

### Integration Tests
- Single choice mode deselects previous selection
- Multiple choice mode allows multiple selections
- maxUsages constraint enforced
- Hotkeys work when dropdown closed
- Read-only mode disables interaction
- Dropdown closes after selection in single mode

### E2E Tests
- Full annotation workflow with dropdown selection
- Rectangle creation with selected label
- Label color appears on created rectangle

---

## Success Criteria

1. ✓ New RectangleLabelsDropdown tag recognized in XML
2. ✓ Dropdown displays all labels from children
3. ✓ Label selection updates state correctly
4. ✓ Single/multiple choice modes work as expected
5. ✓ Hotkeys continue to function
6. ✓ Label colors display as indicators
7. ✓ Existing RectangleLabels unchanged
8. ✓ No performance degradation
9. ✓ Accessibility standards met
10. ✓ Tests pass with >90% coverage

---

## File Structure Summary

```
web/libs/editor/src/
├── tags/control/
│   ├── RectangleLabels.jsx                    (UNCHANGED)
│   ├── RectangleLabelsDropdown.jsx            (NEW - model + view)
│   └── Labels/
│       ├── Labels.jsx                         (UNCHANGED)
│       ├── LabelsDropdown.tsx                 (NEW - dropdown view)
│       ├── LabelsDropdown.module.scss         (NEW)
│       ├── LabelMenuItem.tsx                  (NEW)
│       ├── LabelMenuItem.module.scss          (NEW)
│       ├── DropdownTriggerButton.tsx          (NEW)
│       └── DropdownTriggerButton.module.scss  (NEW)
└── core/
    └── Tags.js                                (MODIFY - register new tag)
```

---

## Estimated Complexity

**Overall**: Medium

**Breakdown**:
- Component Development: Low-Medium (TypeScript, reusing patterns)
- State Integration: Low (uses existing MobX actions)
- Model Creation: Low (copy existing RectangleLabels)
- Styling: Medium (SCSS modules, responsive design)
- Testing: Medium (comprehensive coverage)
- Registration: Low (tag registry update)

**Estimated Time**: 2-3 days

---

## Future Extensibility

### Other Label Types
Pattern can be applied to create dropdown variants for:
- EllipseLabelsDropdown
- PolygonLabelsDropdown
- KeyPointLabelsDropdown
- BrushLabelsDropdown

### Additional Features (Future)
- Search/filter for large label lists
- Label grouping/categories
- Recently used labels section
- Bulk selection controls (Select All, Clear All)