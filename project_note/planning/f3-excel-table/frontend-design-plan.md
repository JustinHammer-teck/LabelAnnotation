# Aviation Safety Event Annotation System - Frontend Design Plan

**Project**: Label Studio Aviation Annotation Module
**Design Reference**: image-1.png
**Architecture Reference**: aviation-annotation-architecture.md
**Planning Date**: 2025-11-25
**Status**: Planning Phase - Awaiting Implementation Approval

---

## 1. Component Architecture

### 1.1 Top-Level Page Structure

```
AviationAnnotationPage/
├── AviationAnnotationPage.tsx          # Main container page
├── AviationAnnotationPage.module.scss  # Page-level styles
├── components/                          # Feature components
├── stores/                              # Jotai state management
├── types/                              # TypeScript interfaces
├── hooks/                              # Custom React hooks
└── utils/                              # Helper functions
```

### 1.2 Component Hierarchy

```
<AviationAnnotationPage>
  ├── <IncidentDisplayPanel>              # Left panel: Read-only incident data
  ├── <AnnotationFormContainer>           # Right panel: Main form
  │   ├── <AutoSaveIndicator>            # Top-right: Save status
  │   ├── <BasicInfoSection>             # Aircraft type, event labels
  │   ├── <ThreatSection>                # Threat identification fields
  │   ├── <ErrorSection>                 # Error identification fields
  │   ├── <UASSection>                   # UAS identification fields
  │   ├── <CompetencySection>            # Competency indicators
  │   └── <TrainingSection>              # Training topics & planning
  └── <UnsavedChanges>                   # Navigation blocker
```

### 1.3 Reusable Component Library

| Component | Purpose | Reusability |
|-----------|---------|-------------|
| `HierarchicalDropdown` | 3-level cascading selector | High - used for Threat/Error/UAS |
| `MultiSelectDropdown` | Checkbox-based multi-select | High - used for Labels/Competency/CRM |
| `AnnotationFieldRow` | Table row with label + control | High - used in all sections |
| `SectionContainer` | Collapsible section with header | Medium - section wrapper |
| `AutoCalculatedField` | Read-only calculated display | Medium - training topics |
| `SearchableTreeModal` | Modal tree selector | High - hierarchical navigation |
| `SaveStatusBadge` | Visual save state indicator | Low - single instance |
| `FieldValidationError` | Inline error display | High - validation feedback |

---

## 2. Layout Design

### 2.1 Desktop Layout (Matching image-1.png)

```
┌─────────────────────────────────────────────────────────────┐
│  Aviation Annotation Page Header                            │
│  [< Back to Tasks] [Event #XXX] [Save Status: ●]           │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  Incident Panel  │    Annotation Form                       │
│  (Read-only)     │                                          │
│  Width: 400px    │    Width: Flexible                       │
│                  │                                          │
│  ┌────────────┐  │  ┌────────────────────────────────────┐ │
│  │ Event #    │  │  │ Basic Info Section                 │ │
│  │ Date/Time  │  │  │ ┌─────────┬──────────────────────┐ │ │
│  │ Location   │  │  │ │ Label   │ Control (dropdown)   │ │ │
│  │ Airport    │  │  │ │ 200px   │ Flexible             │ │ │
│  │ Phase      │  │  │ └─────────┴──────────────────────┘ │ │
│  │            │  │  └────────────────────────────────────┘ │
│  │ [Event     │  │                                          │
│  │  Desc...]  │  │  ┌────────────────────────────────────┐ │
│  └────────────┘  │  │ Threat Section (orange header)     │ │
│                  │  │ [3-level dropdown + fields]        │ │
│                  │  └────────────────────────────────────┘ │
│                  │                                          │
│                  │  [Error Section] [UAS Section]          │
│                  │  [Competency] [Training]                │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### 2.2 Responsive Breakpoints

| Breakpoint | Layout | Incident Panel | Form Width |
|------------|--------|----------------|------------|
| Desktop (>1200px) | Two-column | 400px fixed | Flexible |
| Tablet (768-1200px) | Single column | Collapsed at top | Full width |
| Mobile (<768px) | Single column | Summary only | Full width |

### 2.3 Section Organization

**Visual Hierarchy (Color-Coded):**

1. **Basic Info** (White background)
   - Aircraft Type: Single select dropdown
   - Event Labels: Multi-select dropdown
   - Flight Phase: Single select dropdown

2. **威胁识别 (Threat Identification)** (Orange background)
   - Threat Type: 3-level hierarchical dropdown (84 options)
   - Threat Management: Single select (4 options)
   - Threat Outcome: Single select (3 options)
   - Threat Description: Text area

3. **差错识别 (Error Identification)** (Orange background)
   - Error Relevancy: Single select (3 options)
   - Error Type: 3-level hierarchical dropdown (50 options)
   - Error Management: Single select (4 options)
   - Error Outcome: Single select (2 options)
   - Error Description: Text area

4. **UAS识别 (UAS Identification)** (Orange background)
   - UAS Relevancy: Single select (2 options)
   - UAS Type: 3-level hierarchical dropdown (140 options)
   - UAS Management: Single select (5 options)
   - UAS Description: Text area

5. **胜任力 (Competency)** (White background)
   - Competency Indicators: Multi-select (73 options across 8 categories)

6. **训练评估 (Training Evaluation)** (White background)
   - Likelihood: Single select (5 options)
   - Severity: Single select (5 options)
   - Training Benefit: Single select (5 options)

7. **训练主题 (Training Topics)** (Green background - Auto-calculated)
   - Threat-related Training: Auto-populated array
   - Error-related Training: Auto-populated array
   - UAS-related Training: Auto-populated array
   - CRM Training Topics: Multi-select (13 options)

8. **训练计划 (Training Planning)** (White background)
   - Training Plan Ideas: Text area
   - Goals to Achieve: Text area
   - Notes: Text area

### 2.4 Field Layout Pattern (SCSS)

```scss
.fieldRow {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);

  &:hover {
    background: var(--surface-hover);
  }
}

.fieldLabel {
  font-weight: 500;
  color: var(--content-primary);
  padding-top: 8px;
}

.fieldControl {
  min-height: 40px;
}
```

---

## 3. Hierarchical Dropdown Component Design

### 3.1 Recommended UI Pattern: Modal Tree Selector

**Rationale:**
- Threat Type: 84 options across 3 levels
- Error Type: 50 options across 3 levels
- UAS Type: 140 options across 3 levels
- Cascading dropdowns would be too complex and cramped
- Modal provides better search and navigation experience
- Full path display (L1 > L2 > L3) is clearer in modal context

### 3.2 Component Structure

```
<HierarchicalDropdown>
  ├── <DropdownTrigger>
  │   ├── Selected path display: "L1 > L2 > L3"
  │   └── Clear button (×)
  └── <TreeSelectorModal> (opens on click)
      ├── <ModalHeader>
      │   └── <SearchBar>
      ├── <Breadcrumbs>
      ├── <ModalBody>
      │   ├── <TreeLevel level={1}> (Level 1 options)
      │   ├── <TreeLevel level={2}> (Level 2 options - filtered by L1)
      │   └── <TreeLevel level={3}> (Level 3 options - filtered by L2)
      └── <ModalActions>
          ├── Cancel button
          └── Confirm button
```

### 3.3 Interaction Flow

**Selection Workflow:**
1. User clicks dropdown trigger → Modal opens with search bar focused
2. User sees Level 1 options list in left column
3. User clicks L1 option → Level 2 options appear in middle column, L1 highlighted
4. User clicks L2 option → Level 3 options appear in right column, L2 highlighted
5. User clicks L3 option → Item highlighted, selection confirmed
6. User clicks "Confirm" → Modal closes, trigger shows "L1 > L2 > L3"
7. User can click clear (×) → Selection cleared, field becomes empty

**Search Behavior:**
1. User types in search bar → Filter matches across all levels (fuzzy search)
2. Show matching items with full path context: "L1 > L2 > L3 (matched)"
3. Click on search result → Auto-select full path hierarchy
4. Clear search → Return to normal 3-column navigation

**Keyboard Navigation:**
- `Tab` → Focus trigger
- `Enter/Space` → Open modal
- `Arrow Keys` → Navigate options within current level
- `Enter` → Select option / drill down to next level
- `Backspace` → Navigate back one level
- `Escape` → Close modal
- `Tab` (in modal) → Move between search bar and tree levels
- Focus trap within modal when open

### 3.4 TypeScript Interfaces

```typescript
interface HierarchicalDropdownProps {
  category: 'threat' | 'error' | 'uas';
  value: HierarchicalSelection | null;
  onChange: (selection: HierarchicalSelection) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

interface HierarchicalSelection {
  level1: DropdownOption | null;
  level2: DropdownOption | null;
  level3: DropdownOption | null;
  fullPath: string;  // e.g., "TEW > TEW 01 > TEW 01 恶劣天气"
}

interface DropdownOption {
  id: number;
  code: string;           // e.g., "TEW 01"
  label: string;          // e.g., "恶劣天气( 寒冷/炎热/雷雨)"
  level: 1 | 2 | 3;
  parent_id: number | null;
  training_topics: string[] | null;  // Auto-calculation mapping
  children?: DropdownOption[];       // For tree structure
}

interface TreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: DropdownOption[];
  value: HierarchicalSelection | null;
  onConfirm: (selection: HierarchicalSelection) => void;
  category: string;
}
```

### 3.5 Visual Design (SCSS)

```scss
// Dropdown trigger
.hierarchicalTrigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--border-neutral);
  border-radius: 4px;
  min-height: 40px;
  cursor: pointer;
  background: var(--surface-primary);

  &:hover {
    border-color: var(--border-bold);
  }

  &.hasError {
    border-color: var(--color-error);
  }
}

.selectionPath {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;

  .separator {
    color: var(--content-subtler);
  }
}

// Modal (800px wide)
.treeSelectorModal {
  width: 800px;
  max-height: 80vh;

  .modalBody {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-height: 500px;
    overflow-y: auto;
  }

  .optionItem {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;

    &.selected {
      background: var(--surface-selected);
      color: var(--color-primary);
      font-weight: 500;
    }
  }
}
```

---

## 4. Multi-Select Dropdown Component

### 4.1 UI Pattern: Checkbox Dropdown with Chips

**Use Cases:**
- Event Labels (28 options)
- Competency Indicators (73 options across 8 categories)
- CRM Training Topics (13 options)

### 4.2 Component Design

```
Trigger Display:
┌────────────────────────────────────────┐
│ [Chip 1 ×] [Chip 2 ×] [+3 more]    ▼ │
└────────────────────────────────────────┘

Dropdown Panel (opens below):
┌────────────────────────────────────────┐
│ [Search...]                            │
├────────────────────────────────────────┤
│ ☑ Knowledge (KNO)                      │
│ ☐ Procedural (PRO)                     │
│ ☑ Flight Path Management (FPA)         │
│ ☐ Flight Path Monitoring (FPM)         │
│ ☐ Communication (COM)                  │
│ ...                                    │
└────────────────────────────────────────┘
```

### 4.3 TypeScript Interface

```typescript
interface MultiSelectDropdownProps {
  options: DropdownOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxChipsDisplay?: number;  // Default: 3
  searchable?: boolean;      // Default: true
  disabled?: boolean;
  required?: boolean;
}
```

### 4.4 Interaction Flow

1. Click trigger → Dropdown panel opens below
2. Show checkboxes with current selections checked
3. Click checkbox → Toggle selection (immediate update)
4. Type in search → Filter options live
5. Click outside → Dropdown closes automatically
6. Trigger displays: First 3 chips + "+N more" count badge

---

## 5. State Management (Jotai)

### 5.1 Atom Structure

```typescript
// stores/aviation-annotation.store.ts

// Current incident (read-only from API)
export const currentIncidentAtom = atom<AviationIncident | null>(null);

// Main annotation form data
export const annotationDataAtom = atom<AviationAnnotationData>({
  aircraft_type: '',
  event_labels: [],
  threat_type: { level1: null, level2: null, level3: null, fullPath: '' },
  threat_management: '',
  threat_outcome: '',
  threat_description: '',
  error_relevancy: '',
  error_type: { level1: null, level2: null, level3: null, fullPath: '' },
  error_management: '',
  error_outcome: '',
  error_description: '',
  uas_relevancy: '',
  uas_type: { level1: null, level2: null, level3: null, fullPath: '' },
  uas_management: '',
  uas_description: '',
  competency_indicators: [],
  likelihood: '',
  severity: '',
  training_benefit: '',
  crm_training_topics: [],
  training_plan_ideas: '',
  goals_to_achieve: '',
  notes: '',
});

// Dropdown options cache (loaded once on mount)
export const dropdownOptionsAtom = atom<DropdownCategory | null>(null);

// Derived atom: Auto-calculated training topics
export const calculatedTrainingAtom = atom((get) => {
  const data = get(annotationDataAtom);

  const threatTopics = data.threat_type.level3?.training_topics || [];
  const errorTopics = data.error_type.level3?.training_topics || [];
  const uasTopics = data.uas_type.level3?.training_topics || [];

  const combined = Array.from(new Set([...threatTopics, ...errorTopics, ...uasTopics]));

  return {
    threat_training_topics: threatTopics,
    error_training_topics: errorTopics,
    uas_training_topics: uasTopics,
    combined,
  };
});

// Form state tracking
export const annotationDirtyAtom = atom(false);
export const lastSavedAtom = atom<Date | null>(null);
export const saveStatusAtom = atom<SaveStatus>({
  state: 'saved',
  lastSaved: null,
  error: null,
});

// Field update atom (write-only)
export const updateFieldAtom = atom(
  null,
  (get, set, update: { field: keyof AviationAnnotationData; value: any }) => {
    const current = get(annotationDataAtom);
    set(annotationDataAtom, { ...current, [update.field]: update.value });
    set(annotationDirtyAtom, true);
    set(saveStatusAtom, { state: 'unsaved', lastSaved: get(lastSavedAtom), error: null });
  }
);

// Loading states
export const loadingIncidentAtom = atom(false);
export const loadingAnnotationAtom = atom(false);
export const loadingDropdownsAtom = atom(false);

// Validation errors
export const validationErrorsAtom = atom<Record<string, string>>({});
```

### 5.2 TypeScript Interfaces

```typescript
// types/aviation.types.ts

interface AviationIncident {
  id: number;
  task_id: number;
  event_number: string;
  event_description: string;
  date: string;
  time: string;
  location: string;
  airport: string;
  flight_phase: string;
}

interface AviationAnnotationData {
  id?: number;
  annotation_id?: number;

  // Basic Info
  aircraft_type: string;
  event_labels: string[];

  // Threat
  threat_type: HierarchicalSelection;
  threat_management: string;
  threat_outcome: string;
  threat_description: string;

  // Error
  error_relevancy: string;
  error_type: HierarchicalSelection;
  error_management: string;
  error_outcome: string;
  error_description: string;

  // UAS
  uas_relevancy: string;
  uas_type: HierarchicalSelection;
  uas_management: string;
  uas_description: string;

  // Competency & Training
  competency_indicators: string[];
  likelihood: string;
  severity: string;
  training_benefit: string;
  crm_training_topics: string[];

  // Manual Fields
  training_plan_ideas: string;
  goals_to_achieve: string;
  notes: string;
}

interface SaveStatus {
  state: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

interface DropdownCategory {
  aircraft: DropdownOption[];
  threat: DropdownOption[];
  error: DropdownOption[];
  uas: DropdownOption[];
  event_labels: DropdownOption[];
  competency: DropdownOption[];
  crm_topics: DropdownOption[];
}
```

---

## 6. Auto-Save Implementation

### 6.1 Strategy: Debounced Auto-Save

**Behavior:**
- Wait 2 seconds after last change before saving
- Visual feedback during save process
- Optimistic UI updates (no waiting)
- Error handling with retry option

### 6.2 Custom Hook

```typescript
// hooks/use-auto-save.hook.ts

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

export const useAutoSave = (annotationId: number | null) => {
  const annotationData = useAtomValue(annotationDataAtom);
  const isDirty = useAtomValue(annotationDirtyAtom);
  const setSaveStatus = useSetAtom(saveStatusAtom);
  const setDirty = useSetAtom(annotationDirtyAtom);
  const setLastSaved = useSetAtom(lastSavedAtom);

  const saveFunction = useRef(
    debounce(async (data: AviationAnnotationData) => {
      try {
        setSaveStatus({ state: 'saving', lastSaved: null, error: null });

        if (annotationId) {
          await aviationAPI.updateAnnotation(annotationId, data);
        } else {
          const response = await aviationAPI.createAnnotation(data);
          // Handle new annotation ID
        }

        const now = new Date();
        setSaveStatus({ state: 'saved', lastSaved: now, error: null });
        setLastSaved(now);
        setDirty(false);
      } catch (error) {
        setSaveStatus({
          state: 'error',
          lastSaved: null,
          error: error.message
        });
      }
    }, 2000) // 2 second debounce
  );

  useEffect(() => {
    if (isDirty) {
      saveFunction.current(annotationData);
    }
  }, [annotationData, isDirty]);

  useEffect(() => {
    return () => {
      saveFunction.current.cancel();
    };
  }, []);
};
```

### 6.3 Save Status Visual Indicator

**States:**
- `saved` → Green dot + "All changes saved"
- `saving` → Spinner + "Saving..."
- `unsaved` → Yellow dot + "Unsaved changes"
- `error` → Red dot + "Failed to save" + [Retry button]

**Position:** Top-right of form, sticky/floating badge

```scss
.saveStatusBadge {
  position: sticky;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 16px;
  background: var(--surface-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  z-index: 10;
}
```

---

## 7. Data Flow

### 7.1 Initial Load Sequence

```
1. Page loads with task_id from URL
        ↓
2. Fetch incident data
   GET /api/aviation/incidents/?task_id={task_id}
        ↓
3. Load into currentIncidentAtom
        ↓
4. Fetch existing annotation (if exists)
   GET /api/aviation/annotations/?task_id={task_id}
        ↓
5. Load into annotationDataAtom
        ↓
6. Fetch dropdown options (cached)
   GET /api/aviation/dropdowns/
        ↓
7. Load into dropdownOptionsAtom
        ↓
8. Render page with all data loaded
```

### 7.2 User Selection Triggers Auto-Calculation

```
User selects Threat L3 option
        ↓
updateFieldAtom({ field: 'threat_type', value: {...} })
        ↓
annotationDataAtom updated
        ↓
calculatedTrainingAtom re-computes (derived atom)
        ↓
AutoCalculatedField components re-render
        ↓
Display updated training topics (green fields)
```

### 7.3 Auto-Save Flow

```
User types in description field
        ↓
onChange handler calls updateFieldAtom
        ↓
annotationDataAtom updated
annotationDirtyAtom = true
saveStatusAtom = 'unsaved'
        ↓
useAutoSave hook detects change
        ↓
Debounce waits 2 seconds
        ↓
No new changes for 2s → Trigger save
        ↓
saveStatusAtom = 'saving'
        ↓
API call: PATCH /api/aviation/annotations/{id}
        ↓
Success:
  saveStatusAtom = 'saved'
  annotationDirtyAtom = false
  lastSavedAtom = new Date()
        ↓
Failure:
  saveStatusAtom = 'error'
  Show error message + [Retry] button
```

---

## 8. Component File Structure

```
web/apps/labelstudio/src/pages/Aviation/
└── AviationAnnotationPage/
    ├── index.ts                                    # Export barrel
    ├── AviationAnnotationPage.tsx                  # Main container
    ├── AviationAnnotationPage.module.scss          # Page styles
    │
    ├── components/
    │   ├── IncidentDisplayPanel/
    │   │   ├── IncidentDisplayPanel.tsx
    │   │   └── IncidentDisplayPanel.module.scss
    │   │
    │   ├── AnnotationForm/
    │   │   ├── AnnotationFormContainer.tsx
    │   │   ├── AnnotationFormContainer.module.scss
    │   │   ├── BasicInfoSection.tsx
    │   │   ├── ThreatSection.tsx
    │   │   ├── ErrorSection.tsx
    │   │   ├── UASSection.tsx
    │   │   ├── CompetencySection.tsx
    │   │   └── TrainingSection.tsx
    │   │
    │   ├── HierarchicalDropdown/
    │   │   ├── HierarchicalDropdown.tsx
    │   │   ├── HierarchicalDropdown.module.scss
    │   │   ├── TreeSelectorModal.tsx
    │   │   ├── TreeSelectorModal.module.scss
    │   │   ├── TreeLevel.tsx
    │   │   └── SearchBar.tsx
    │   │
    │   ├── MultiSelectDropdown/
    │   │   ├── MultiSelectDropdown.tsx
    │   │   └── MultiSelectDropdown.module.scss
    │   │
    │   ├── FieldRow/
    │   │   ├── AnnotationFieldRow.tsx
    │   │   └── AnnotationFieldRow.module.scss
    │   │
    │   ├── SectionContainer/
    │   │   ├── SectionContainer.tsx
    │   │   └── SectionContainer.module.scss
    │   │
    │   ├── AutoCalculatedField/
    │   │   ├── AutoCalculatedField.tsx
    │   │   └── AutoCalculatedField.module.scss
    │   │
    │   └── SaveStatusIndicator/
    │       ├── SaveStatusIndicator.tsx
    │       └── SaveStatusIndicator.module.scss
    │
    ├── stores/
    │   ├── aviation-annotation.store.ts            # Main Jotai atoms
    │   └── dropdown-options.store.ts               # Dropdown cache atoms
    │
    ├── hooks/
    │   ├── use-auto-save.hook.ts                  # Auto-save logic
    │   ├── use-annotation-data.hook.ts            # Data fetching
    │   ├── use-dropdown-options.hook.ts           # Options loading
    │   └── use-field-validation.hook.ts           # Validation logic
    │
    ├── types/
    │   ├── aviation.types.ts                      # Core types
    │   └── dropdown.types.ts                      # Dropdown types
    │
    ├── api/
    │   └── aviation.api.ts                        # API client
    │
    └── utils/
        ├── training-calculator.util.ts            # Auto-calc logic
        ├── validation.util.ts                     # Field validation
        └── formatting.util.ts                     # Display formatting
```

**Naming Conventions:**
- Files: `kebab-case.tsx` / `kebab-case.module.scss`
- Components: `PascalCase`
- Hooks: `use-hook-name.hook.ts`
- Stores: `store-name.store.ts`
- Utils: `util-name.util.ts`
- Types: `type-name.types.ts`

---

## 9. Accessibility (a11y)

### 9.1 Keyboard Navigation

**Hierarchical Dropdown:**
- `Tab` → Focus trigger
- `Enter/Space` → Open modal
- `Arrow Keys` → Navigate options within level
- `Enter` → Select option / drill down
- `Backspace` → Navigate back one level
- `Escape` → Close modal
- Focus trap within modal when open

**Multi-Select Dropdown:**
- `Tab` → Focus trigger
- `Enter/Space` → Open dropdown
- `Arrow Keys` → Navigate checkboxes
- `Space` → Toggle checkbox
- `Escape` → Close dropdown

**Form Navigation:**
- `Tab` → Move to next field
- `Shift+Tab` → Move to previous field
- All interactive elements keyboard accessible

### 9.2 ARIA Labels

```typescript
// HierarchicalDropdown
<button
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="dialog"
  aria-label="Select threat type (3 levels)"
  aria-describedby="threat-type-description"
>
  {selectionDisplay}
</button>

// TreeSelectorModal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Select Threat Type</h2>
</div>

// Multi-select
<div
  role="combobox"
  aria-expanded={isOpen}
  aria-multiselectable="true"
  aria-label="Select competency indicators"
>
  {/* Checkboxes */}
</div>

// Auto-calculated field
<div
  role="region"
  aria-label="Auto-calculated training topics"
  aria-live="polite"
>
  {topics.map(topic => <span key={topic}>{topic}</span>)}
</div>
```

### 9.3 Screen Reader Support

**Save Status Announcements:**
```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {saveStatus.state === 'saved' && "All changes saved"}
  {saveStatus.state === 'saving' && "Saving changes"}
  {saveStatus.state === 'error' && "Error saving changes"}
</div>
```

**Validation Errors:**
```typescript
<div role="alert" aria-live="assertive">
  {error && `Error: ${error}`}
</div>
```

### 9.4 Focus Management

**Modal Open/Close:**
```typescript
useEffect(() => {
  if (isOpen) {
    previousFocusRef.current = document.activeElement;
    searchInputRef.current?.focus();
    enableFocusTrap();
  }
}, [isOpen]);

const handleClose = () => {
  previousFocusRef.current?.focus();
  onClose();
};
```

### 9.5 Color Contrast (WCAG 2.1 AA)

- Text contrast ratio ≥ 4.5:1 for normal text
- Text contrast ratio ≥ 3:1 for large text (18pt+)
- Interactive elements contrast ratio ≥ 3:1
- Error states use both color AND icon
- Don't rely solely on color for information

---

## 10. Performance Optimizations

### 10.1 Virtual Scrolling

**Use Case:** Large dropdown lists (140+ UAS options)

**Implementation:** Use `react-window` or `react-virtual`
- Only render visible items + buffer
- Dramatically reduce DOM nodes
- Smooth scrolling experience

### 10.2 Memoization

```typescript
// Component memoization
const ThreatSection = React.memo(({ data, onChange }) => {
  // Component implementation
});

// Expensive calculations cached by Jotai
const calculatedTrainingAtom = atom((get) => {
  // Auto-calculation logic (cached)
});
```

### 10.3 Code Splitting

```typescript
const TreeSelectorModal = lazy(() => import('./TreeSelectorModal'));

<Suspense fallback={<Spinner />}>
  {isOpen && <TreeSelectorModal {...props} />}
</Suspense>
```

### 10.4 Debouncing

- Search input: 300ms debounce
- Auto-save: 2000ms debounce
- Validation: 500ms debounce

---

## 11. Error Handling

### 11.1 Inline Validation Errors

```
Field Row with Error:
┌─────────────────────────────────────────┐
│ Threat Type *                           │
│ [Select threat type...]          ▼     │  ← Red border
│ ⚠ This field is required                │  ← Error message
└─────────────────────────────────────────┘
```

### 11.2 Save Error Handling

- Display error message in save status badge
- Provide [Retry] button
- Keep unsaved changes in form
- Option to copy data before leaving page

### 11.3 Component Error Boundaries

```typescript
<ErrorBoundary fallback={<SectionError onRetry={refetch} />}>
  <ThreatSection />
</ErrorBoundary>
```

---

## 12. Implementation Phases

### Phase 1: Foundation
- Set up file structure
- Define TypeScript interfaces
- Create Jotai stores
- Build basic page layout

### Phase 2: Core Components
- AnnotationFieldRow
- SectionContainer
- IncidentDisplayPanel
- Basic text inputs

### Phase 3: Dropdown Components
- HierarchicalDropdown with TreeSelectorModal
- MultiSelectDropdown
- Search functionality
- Keyboard navigation

### Phase 4: Section Implementation
- BasicInfoSection
- ThreatSection
- ErrorSection
- UASSection
- CompetencySection
- TrainingSection

### Phase 5: Auto-Calculation
- Implement calculatedTrainingAtom
- AutoCalculatedField component
- Training topic mapping logic
- Real-time updates

### Phase 6: Auto-Save & Validation
- useAutoSave hook
- SaveStatusIndicator
- Field validation
- Error handling

### Phase 7: Accessibility & Polish
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader testing
- Performance optimization

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Component rendering
- State management (Jotai atoms)
- Utility functions (calculators, validators)
- Custom hooks

### 13.2 Integration Tests
- Form submission flow
- Auto-save behavior
- Auto-calculation logic
- Dropdown interactions

### 13.3 E2E Tests
- Complete annotation workflow
- Data persistence
- Navigation between tasks
- Error scenarios

### 13.4 Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Color contrast

---

## 14. Dependencies

### 14.1 Required Packages

```json
{
  "dependencies": {
    "react": "^18.x",
    "jotai": "^2.x",
    "lodash": "^4.x",
    "react-window": "^1.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-checkbox": "^1.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/lodash": "^4.x",
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x"
  }
}
```

### 14.2 Optional Enhancements
- `fuse.js` for fuzzy search
- `react-virtual` for virtualization
- `react-hook-form` for form management (alternative to Jotai)
- `zod` for schema validation

---

## 15. Next Steps

1. **Review and approve this design plan**
2. **Clarify any ambiguities or questions**
3. **Proceed to implementation Phase 1: Foundation**
4. **Iterate through remaining phases sequentially**

---

**Status**: ✅ Planning Complete - Awaiting Implementation Approval
