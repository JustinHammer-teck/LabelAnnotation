# Release v1.8.0

## Features

### RectangleLabelsDropdown Tag

New dropdown-based labeling interface for bounding box annotation with select-first workflow.

**Overview:**

The `RectangleLabelsDropdown` tag provides an alternative to `RectangleLabels` with a dropdown selector instead of inline buttons. Users select labels from a dropdown menu before drawing rectangles, improving UI efficiency for projects with many labels.

**Key Features:**

**1. Select-First Workflow**
- Click dropdown to select label(s)
- Draw rectangle on image
- Selected label automatically applied to region
- Supports both single and multiple label selection

**2. Clean UI for Many Labels**
- Dropdown interface scales better than inline buttons
- Color indicators show label colors
- Hotkey display when enabled in settings
- Shows selected labels in trigger button
- "+N more" indicator for multiple selections

**3. Full Feature Parity with RectangleLabels**
- All RectangleLabels features supported
- Rotation control (`canRotate`)
- Custom colors (`fillColor`, `strokeColor`)
- Opacity and stroke width configuration
- Maximum usage limits (`maxUsages`)
- Choice modes: single/multiple selection

**Configuration Example:**

```xml
<View>
  <RectangleLabelsDropdown name="labels" toName="image" choice="single">
    <Label value="Person" background="#FF0000" />
    <Label value="Vehicle" background="#00FF00" />
    <Label value="Animal" background="#0000FF" />
    <Label value="Building" background="#FFFF00" />
  </RectangleLabelsDropdown>
  <Image name="image" value="$image" />
</View>
```

**Implementation Details:**

**Tag Registration** (`web/libs/editor/src/tags/control/RectangleLabelsDropdown.jsx`)
- Composed from `LabelsModel` + `RectangleModel` + `SelectedModelMixin`
- Type: `rectanglelabelsdropdown`
- Renders using shared `HtxLabelsDropdown` component

**Dropdown Component** (`web/libs/editor/src/tags/control/Labels/LabelsDropdown.tsx`)
- Uses Ant Design Dropdown (same pattern as Taxonomy tag)
- Manual state management for open/close behavior
- Click outside detection for automatic closing
- Single/multiple selection modes via `closeOnClick`
- Read-only mode support

**Trigger Button** (`web/libs/editor/src/tags/control/Labels/DropdownTriggerButton.tsx`)
- Displays up to 2 selected labels with color indicators
- Shows "+N more" for additional selections
- Placeholder text when no selection
- Disabled state styling
- Chevron icon for dropdown affordance

**Menu Items** (`web/libs/editor/src/tags/control/Labels/LabelMenuItem.tsx`)
- Color indicator (4px vertical bar)
- Label text with ellipsis overflow
- Hotkey display (when enabled)
- MobX store integration for settings

**Result Serialization** (`web/libs/editor/src/regions/Result.js:46,80`)
- Added `rectanglelabelsdropdown` to valid result types
- Results serialize with same format as `rectanglelabels`
- Compatible with existing annotation pipelines

**Files Created:**
- `web/libs/editor/src/tags/control/RectangleLabelsDropdown.jsx`
- `web/libs/editor/src/tags/control/Labels/LabelsDropdown.tsx`
- `web/libs/editor/src/tags/control/Labels/LabelsDropdown.module.scss`
- `web/libs/editor/src/tags/control/Labels/DropdownTriggerButton.tsx`
- `web/libs/editor/src/tags/control/Labels/DropdownTriggerButton.module.scss`
- `web/libs/editor/src/tags/control/Labels/LabelMenuItem.tsx`
- `web/libs/editor/src/tags/control/Labels/LabelMenuItem.module.scss`

**Files Modified:**
- `web/libs/editor/src/regions/Result.js` - Added result type support
- `web/libs/editor/src/tags/control/index.js` - Tag registration

**Technical Architecture:**

**Component Hierarchy:**
```
RectangleLabelsDropdownModel (MST)
  ├── LabelsModel (label management)
  ├── RectangleModel (rectangle tool)
  ├── SelectedModelMixin (selection state)
  └── HtxLabelsDropdown (React view)
      ├── Ant Design Dropdown
      ├── DropdownTriggerButton
      └── Menu with LabelMenuItem components
```

**State Management:**
- MobX-State-Tree for model state
- React useState for dropdown open/close
- MobX observer for reactive updates
- Store injection for global settings

**Dropdown Pattern:**
- Follows Taxonomy component implementation
- Ant Design Dropdown with `overlay` prop
- Manual visibility control via `visible` prop
- Click outside handler for UX
- Disabled state prevents opening

---

## Migration Guide

### For Existing Projects

**No breaking changes:**
- Existing `RectangleLabels` tags continue working unchanged
- New `RectangleLabelsDropdown` tag is purely additive

**To adopt dropdown interface:**

Replace `RectangleLabels` with `RectangleLabelsDropdown` in your labeling config:

```xml
<!-- Before -->
<RectangleLabels name="labels" toName="image">
  <Label value="Person" />
  <Label value="Vehicle" />
</RectangleLabels>

<!-- After -->
<RectangleLabelsDropdown name="labels" toName="image">
  <Label value="Person" />
  <Label value="Vehicle" />
</RectangleLabelsDropdown>
```

**When to use RectangleLabelsDropdown:**
- Projects with 5+ labels (dropdown scales better)
- Limited screen space (compact UI)
- Preference for select-then-draw workflow

**When to use RectangleLabels:**
- Projects with 2-4 labels (buttons are faster)
- Preference for draw-then-select workflow
- Need for always-visible label options

---

## Benefits

**UI Efficiency:**
- Dropdown uses less screen space than inline buttons
- Scales to dozens of labels without UI clutter
- Consistent with other dropdown-based tags (Taxonomy, Choices)

**Workflow Flexibility:**
- Select-first workflow suits certain annotation styles
- Multiple label selection before drawing
- Single click to change active label

**Code Reusability:**
- Shared dropdown components across label types
- Consistent patterns with existing codebase
- Modular architecture enables future tags

---

## Known Limitations

**Workflow Differences:**
- Select-first only (cannot draw then select)
- Requires extra click vs. hotkey-only workflow
- Dropdown must be opened to see available labels

**UI Considerations:**
- Selected labels in trigger limited to 2 visible
- Very long label names may truncate
- Dropdown requires adequate screen space below trigger

---

## Future Enhancements

- [ ] Keyboard navigation within dropdown
- [ ] Search/filter for large label sets
- [ ] Drag-and-drop label reordering
- [ ] Label grouping in dropdown
- [ ] Recently used labels section
- [ ] Configurable trigger button style
