# Aviation Module (@heartex/aviation)

Aviation safety event labeling, performance assessment, and training topic generation module for Label Studio.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **State Management**: Jotai atoms
- **Routing**: React Router v5
- **Internationalization**: i18next (en/zh)
- **Build**: Nx workspace with Webpack
- **Styling**: SCSS modules with BEM-style naming

## Directory Structure

```
aviation/src/
├── api/                          # API client layer
│   ├── api-client.ts             # AviationApiClient interface (contract)
│   ├── default-api-client.ts     # Default HTTP implementation
│   └── context.ts                # React context for DI
├── assets/styles/                # SCSS variables and mixins
├── components/
│   ├── annotation/               # Core annotation UI
│   │   ├── action-toolbar/       # Save, submit actions
│   │   ├── competency-summary/   # Competency assessment display
│   │   ├── editable-event-panel/ # Event metadata editing
│   │   ├── event-description/    # Event details display
│   │   ├── event-navigation/     # Navigate between events
│   │   ├── labeling-item-card/   # Individual item card
│   │   ├── recognition-section/  # Main labeling UI (threat/error/UAS)
│   │   ├── result-performance/   # Performance assessment
│   │   └── training-topics/      # Auto-extracted topics
│   ├── common/                   # Reusable UI components
│   │   ├── hierarchical-dropdown/  # 3-level cascading select
│   │   ├── tree-selector-modal/    # Tree-based type selection
│   │   ├── recognition-type-selector/
│   │   └── [button, modal, select, table, etc.]
│   ├── excel-upload/             # Excel import functionality
│   ├── layout/                   # Shell, Header, Sidebar
│   ├── views/                    # Page-level components
│   │   ├── ProjectListView.tsx
│   │   ├── TaskListView.tsx
│   │   ├── AnnotationView.tsx
│   │   └── CreateProjectModal.tsx
│   └── AviationModule.tsx        # Root component with routing
├── hooks/                        # Custom React hooks (15 hooks)
├── i18n/                         # Translations (en.json, zh.json)
├── stores/                       # Jotai atom stores (8 stores)
├── types/                        # TypeScript definitions
└── utils/                        # Utility functions
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/aviation/projects` | ProjectListView | List all aviation projects |
| `/aviation/projects/:projectId/events` | TaskListView | List events in project |
| `/aviation/projects/:projectId/events/:eventId` | AnnotationView | Annotate single event |

## Core Data Types

### AviationEvent
Flight event metadata (date, airports, aircraft, weather, crew).

```typescript
interface AviationEvent {
  id: number;
  task: { id: number };
  event_number: string;
  event_description: string;
  date: string;
  departure_airport: string;
  arrival_airport: string;
  actual_landing_airport: string;
  flight_phase: string;
  aircraft_type: string;
  aircraft_registration: string;
  crew_composition: Record<string, unknown>;
  weather_conditions: string;
}
```

### LabelingItem
Core annotation data with 3-level hierarchies for threat/error/UAS.

```typescript
interface LabelingItem {
  id: number;
  event: number;
  sequence_number: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';

  // Threat section (3-level hierarchy + management/impact/coping)
  threat_type_l1: number | null;
  threat_type_l2: number | null;
  threat_type_l3: number | null;
  threat_management: Record<string, unknown>;  // { value: 'managed'|'unmanaged'|... }
  threat_impact: Record<string, unknown>;      // { value: 'none'|'leads_to_error'|'leads_to_uas_t' }
  threat_coping_abilities: Record<string, unknown>;

  // Error section (same structure)
  error_type_l1/l2/l3, error_management, error_impact, error_coping_abilities

  // UAS section (conditionally enabled)
  uas_applicable: boolean;
  uas_type_l1/l2/l3, uas_management, uas_impact, uas_coping_abilities

  // Auto-calculated from L3 selections
  calculated_threat_topics: string[];
  calculated_error_topics: string[];
  calculated_uas_topics: string[];

  linked_result_id: number | null;  // Links to ResultPerformance
}
```

### ResultPerformance
Event-level performance assessment with training recommendations.

```typescript
interface ResultPerformance {
  id: number;
  event: number;
  aviation_project: number;
  event_type: string;
  severity: string;
  likelihood: string;
  training_effect: string;
  training_plan: string;
  training_topics: string[];      // Aggregated from linked items
  training_goals: string;
  recommendations: string;
  threat_summary: string;
  error_summary: string;
  competency_summary: string;
  linked_items: number[];         // LabelingItem IDs
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
}
```

### DropdownOption
Hierarchical type option with training topics.

```typescript
interface DropdownOption {
  id: number;
  category: DropdownCategory;     // 'threat'|'error'|'uas'|'management'|'impact'|...
  level: number;                  // 1, 2, or 3
  parent_id: number | null;
  code: string;
  label: string;
  label_zh: string;
  training_topics: string[];      // Topics extracted when L3 selected
  children: DropdownOption[];
}
```

## Jotai Stores

| Store | Atoms | Purpose |
|-------|-------|---------|
| `event.store.ts` | `currentEventAtom`, `eventLoadingAtom`, `eventErrorAtom` | Current event state |
| `labeling-items.store.ts` | `labelingItemsAtom`, `currentItemIndexAtom`, `itemsDirtyAtom` | Annotation items |
| `performances.store.ts` | `performancesAtom`, `performancesLoadingAtom` | Performance assessments |
| `dropdown-options.store.ts` | `dropdownOptionsAtom`, `dropdownLoadingAtom` | Type hierarchies |
| `projects.store.ts` | `projectsAtom`, `currentProjectAtom` | Project list |
| `save-status.store.ts` | `saveStatusAtom` | `'idle'|'saving'|'saved'|'error'` |
| `language.store.ts` | `languageAtom`, `isChineseAtom`, `isEnglishAtom` | i18n state |

## Key Hooks

### Data Fetching
- `useProjects()` - CRUD operations for aviation projects
- `useEvent(eventId)` - Fetch single event with loading/error state
- `useEvents(projectId)` - Fetch event list for project
- `useLabelingItems(eventId)` - CRUD for labeling items
- `usePerformances(eventId)` - CRUD for result performances

### Dropdown/Options
- `useDropdownOptions(category)` - Fetch hierarchical options
- `useSearchTypes(query, category)` - Search type hierarchy
- `useImpactOptions(category, managementValue)` - Dynamic impact options
- `useCopingAbilities(category, managementValue)` - Coping ability options

### Business Logic
- `useUasApplicable(item)` - Determine if UAS section enabled
- `useTrainingTopics(items)` - Extract topics from L3 selections
- `useAutoSave(itemId, options)` - Debounced auto-save (3s default)
- `useReviewWorkflow()` - Status transitions and permissions
- `useExcelUpload(projectId)` - Excel import with progress

### Utilities
- `useAviationToast()` - Toast notifications

## Critical Business Logic

### 1. Impact Selection Rules

When management is "managed", impact auto-selects to "none" (single option).
When management is unmanaged/ineffective/unobserved, user selects from multiple impacts.

```typescript
// From use-impact-options.hook.ts
THREAT_IMPACT_CONFIG = {
  managed: { impacts: [{ value: 'none' }], autoSelect: 'none' },
  unmanaged: { impacts: ['none', 'leads_to_error', 'leads_to_uas_t'], autoSelect: null },
  // ineffective, unobserved: same as unmanaged
}

ERROR_IMPACT_CONFIG = {
  managed: { impacts: [{ value: 'none' }], autoSelect: 'none' },
  unmanaged: { impacts: ['none', 'leads_to_uas_e'], autoSelect: null },
  // Note: errors cannot "lead to error" - only to UAS
}
```

### 2. UAS Applicability

UAS section is enabled ONLY when:
- `threat_impact.value === 'leads_to_uas_t'` OR
- `error_impact.value === 'leads_to_uas_e'`

```typescript
// From use-uas-applicable.hook.ts
const isApplicable = threatValue === 'leads_to_uas_t' || errorValue === 'leads_to_uas_e';
```

### 3. Training Topics Extraction

Training topics auto-extracted from Level 3 type selections.
Each L3 option contains `training_topics: string[]` that aggregates to ResultPerformance.

### 4. Auto-save Behavior

- Default debounce: 3000ms
- Flushes pending saves on component unmount
- Tracks status: idle -> saving -> saved/error

```typescript
const { debouncedSave, saveNow, saveStatus } = useAutoSave(itemId, {
  debounceMs: 3000,
  flushOnUnmount: true,
});
```

## API Endpoints

Base path: `/api/aviation`

### Projects
| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/projects/` | `getProjects()` |
| GET | `/projects/:id/` | `getProject(id)` |
| POST | `/projects/` | `createProject(data)` |
| PATCH | `/projects/:id/` | `updateProject(id, data)` |
| DELETE | `/projects/:id/` | `deleteProject(id)` |

### Events
| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/projects/:projectId/events/` | `getEvents(projectId)` |
| GET | `/events/:id/` | `getEvent(id)` |
| PATCH | `/events/:id/` | `updateEvent(id, data)` |

### Labeling Items
| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/events/:eventId/items/` | `getItems(eventId)` |
| POST | `/events/:eventId/items/` | `createItem(eventId, data)` |
| PATCH | `/items/:id/` | `updateItem(id, data)` |
| DELETE | `/items/:id/` | `deleteItem(id)` |

### Result Performances
| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/events/:eventId/performances/` | `getPerformances(eventId)` |
| POST | `/events/:eventId/performances/` | `createPerformance(eventId, data)` |
| PATCH | `/performances/:id/` | `updatePerformance(id, data)` |
| DELETE | `/performances/:id/` | `deletePerformance(id)` |
| POST | `/performances/:id/link-items/` | `linkItems(performanceId, data)` |
| POST | `/performances/:id/unlink-items/` | `unlinkItems(performanceId, itemIds)` |

### Types & Search
| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/types/:category/` | `getTypeHierarchy(category)` |
| GET | `/types/search/?q=...&category=...` | `searchTypes(query, category)` |

### Import/Export
| Method | Endpoint | Function |
|--------|----------|----------|
| POST | `/projects/:id/upload-excel/` | `uploadExcel(projectId, file, onProgress)` |
| GET | `/projects/:id/export/?format=json\|xlsx` | `exportEvents(projectId, format)` |

## Testing

```bash
# Run aviation unit tests
cd web && nx test aviation

# Run specific test file
cd web && nx test aviation --testFile=use-impact-options.hook.spec.ts
```

Test files located alongside source in `__tests__/` directories or `*.spec.ts` files.

Tested hooks:
- `use-coping-abilities.hook.spec.ts`
- `use-excel-upload.hook.spec.ts`
- `use-impact-options.hook.spec.ts`
- `use-uas-applicable.hook.spec.ts`

## Coding Conventions

### File Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `RecognitionSection.tsx` |
| Hooks | kebab-case with `.hook.ts` | `use-auto-save.hook.ts` |
| Stores | kebab-case with `.store.ts` | `labeling-items.store.ts` |
| Types | kebab-case with `.types.ts` | `annotation.types.ts` |
| Tests | `.spec.ts` suffix | `use-impact-options.hook.spec.ts` |
| Styles | `.module.scss` | `recognition-section.module.scss` |

### Component Pattern

```typescript
import { type FC, useCallback } from 'react';
import { useAtom } from 'jotai';
import styles from './component-name.module.scss';

export interface ComponentNameProps {
  itemId: number;
  onSave?: () => void;
}

export const ComponentName: FC<ComponentNameProps> = ({ itemId, onSave }) => {
  const [items] = useAtom(labelingItemsAtom);

  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  return <div className={styles.container}>...</div>;
};
```

### Hook Pattern

```typescript
import { useMemo, useCallback } from 'react';
import { useAtom } from 'jotai';

export interface UseHookNameResult {
  data: SomeType;
  loading: boolean;
  execute: () => Promise<void>;
}

export const useHookName = (param: number): UseHookNameResult => {
  return useMemo(() => {
    // ...logic
  }, [param]);
};
```

### Store Pattern

```typescript
import { atom } from 'jotai';
import type { SomeType } from '../types';

export const dataAtom = atom<SomeType[]>([]);
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);
```

## Common Issues & Solutions

### UAS Section Not Enabling
Check that `threat_impact` or `error_impact` contains `{ value: 'leads_to_uas_t' }` or `{ value: 'leads_to_uas_e' }`. The hook checks for object structure, not string values.

### Impact Not Auto-selecting
Verify `management` value is exactly `'managed'`. Check `THREAT_IMPACT_CONFIG` or `ERROR_IMPACT_CONFIG` for valid keys.

### Auto-save Not Triggering
Ensure `itemId` is not null. Check `saveStatusAtom` state. Verify `flushOnUnmount` is not set to `false`.

### Dropdown Options Empty
Verify API returns correct `category` value. Check `dropdownOptionsAtom` state. Ensure `useDropdownOptions` hook is called with valid category.

## Related Backend

Backend implementation: `label_studio/aviation/`

See `/home/moritzzmn/projects/labelstudio/label_studio/CLAUDE.md` for Django patterns.
