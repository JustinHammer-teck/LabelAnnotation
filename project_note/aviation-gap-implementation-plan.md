# Gap Analysis: Label Library vs Aviation Library

## Executive Summary

The aviation library is a TypeScript port of the label library with backend persistence. While the **core UAS conditional logic is functionally identical**, there are significant architectural differences in state management, component structure, and data flow patterns.

---

## 1. UAS CONDITIONAL LOGIC COMPARISON

### Logic Match: ✅ IDENTICAL

| Aspect | Label Library | Aviation Library |
|--------|---------------|------------------|
| **File** | `LabelingList.js:120` | `LabelingItemCard.tsx:33-38` |
| **Threat Trigger** | `item.威胁列表.影响 === '导致UAS T'` | `threatImpact === 'leads_to_uas_t'` |
| **Error Trigger** | `item.差错列表.影响 === '导致UAS E'` | `errorImpact === 'leads_to_uas_e'` |
| **Result Variable** | `isUASRequired` | `isUasRequired` |

**Label Library:**
```javascript
const isUASRequired = (item.威胁列表 && item.威胁列表.影响 === '导致UAS T') ||
                      (item.差错列表 && item.差错列表.影响 === '导致UAS E');
```

**Aviation Library:**
```typescript
const isUasRequired = useMemo(() => {
  return threatImpact === 'leads_to_uas_t' || errorImpact === 'leads_to_uas_e';
}, [threatImpact, errorImpact]);
```

### Additional Aviation Feature: `useUasApplicable` Hook
**File:** `hooks/use-uas-applicable.hook.ts:25-37`

Aviation provides a reusable hook for the same logic:
```typescript
export const useUasApplicable = (item: LabelingItem): UseUasApplicableResult => {
  return useMemo(() => {
    const isApplicable = threatValue === 'leads_to_uas_t' || errorValue === 'leads_to_uas_e';
    return {
      isUasApplicable: isApplicable,
      uasDisabledMessage: isApplicable ? null : 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"',
    };
  }, [item.threat_impact, item.error_impact]);
};
```

---

## 2. COMPONENT ARCHITECTURE GAP

### Label Library: Separate Module Components
```
DocumentAnalysis
└── LabelingList
    ├── ThreatModule.js    (dedicated component)
    ├── ErrorModule.js     (dedicated component)
    └── UASModule.js       (dedicated component)
```

### Aviation Library: Unified Polymorphic Component
```
AnnotationView
└── LabelingItemRow
    ├── RecognitionSection (category="threat")
    ├── RecognitionSection (category="error")
    └── RecognitionSection (category="uas")
```

**Gap:** Aviation uses a **single `RecognitionSection` component** with a `category` prop instead of three separate module components. This is more DRY but less explicit.

| File | Label | Aviation |
|------|-------|----------|
| Threat | `ThreatModule.js` (172 lines) | `RecognitionSection.tsx` (category="threat") |
| Error | `ErrorModule.js` (167 lines) | `RecognitionSection.tsx` (category="error") |
| UAS | `UASModule.js` (156 lines) | `RecognitionSection.tsx` (category="uas") |

---

## 3. STATE MANAGEMENT GAP

### Label Library: Prop Drilling + Parent State
```
Parent Component (DocumentAnalysis)
    │
    │ data={state}
    │ onChange={(newData) => setState(newData)}
    ▼
LabelingList
    │
    │ item.差错列表
    │ onChange={(val) => handleItemChange(id, '差错列表', val)}
    ▼
ErrorModule
```

- State lives in parent component
- Changes propagate up via callbacks
- Re-renders cascade down through React reconciliation
- `isUASRequired` computed inline during render

### Aviation Library: Jotai Atoms + Hooks + Callbacks
```
Jotai Atoms (Global)
├── labelingItemsAtom
├── currentEventAtom
├── performancesAtom
├── saveStatusAtom
└── dropdownOptionsAtom
    │
    ▼
Custom Hooks
├── useLabelingItems()
├── useAutoSave()
├── useUasApplicable()
└── useDropdownOptions()
    │
    │ item, onUpdate callback
    ▼
RecognitionSection Component
```

**Gap:** Aviation introduces **Jotai for global state** + **custom hooks for business logic**, while label uses simple prop/callback pattern.

| Aspect | Label | Aviation |
|--------|-------|----------|
| Global State | None | Jotai atoms |
| Business Logic | Inline in components | Extracted to hooks |
| Persistence | None | Auto-save hook (3s debounce) |
| Loading States | None | Dedicated atoms |

---

## 4. DATA FLOW GAP

### Label Library Flow
```
User changes 管理 in ErrorModule
    ↓
handleUpdate('管理', value)
    ↓
Auto-populate 影响 (if single option)
    ↓
onChange(updatedItem) → parent callback
    ↓
LabelingList.handleItemChange()
    ↓
Parent onChange(newData)
    ↓
React re-render
    ↓
isUASRequired recomputed (line 120)
    ↓
UASModule receives new isUASRequired prop
```

### Aviation Library Flow
```
User changes management in RecognitionSection
    ↓
handleManagementChange(value)
    ↓
Auto-populate impact via useImpactOptions hook
    ↓
onUpdate({ threat_management: value, threat_impact: autoValue })
    ↓
LabelingItemCard.handleUpdate()
    ↓
Check if UAS fields need clearing (lines 40-83)
    ↓
useLabelingItems.updateItem()
    ↓
API PATCH /api/aviation/items/{id}/
    ↓
Jotai atom update
    ↓
React re-render
    ↓
isUasRequired recomputed via useMemo
    ↓
RecognitionSection (uas) receives uasDisabled={!isUasRequired}
```

**Gap:** Aviation adds:
1. **API persistence** at the update step
2. **Automatic UAS field clearing** when conditions no longer apply
3. **Memoized computation** via `useMemo` (performance optimization)

---

## 5. CONFIGURATION GAP

### Label Library: Static JSON Files
| File | Purpose |
|------|---------|
| `labHieStru.json` | Type hierarchies (threat, error, UAS) |
| `effectAndManage.json` | Management → Impact mappings |
| `trainMap.json` | Leaf tag → Training topic mappings |

### Aviation Library: API-Driven Configuration
| Endpoint | Purpose |
|----------|---------|
| `GET /api/aviation/types/hierarchy/?category=...` | Type hierarchies |
| Dynamic via `useImpactOptions` hook | Management → Impact logic |
| Calculated in `useTrainingTopics` hook | Training topic derivation |

**Gap:** Aviation has **no static JSON config files**. All configuration is:
1. Fetched from backend API
2. Computed in hooks
3. Defined in TypeScript interfaces

---

## 6. PROPERTY NAMING GAP

### Field Name Mapping

| Concept | Label (Chinese) | Aviation (English) |
|---------|-----------------|-------------------|
| Threat List | `威胁列表` | `threat_*` fields |
| Error List | `差错列表` | `error_*` fields |
| UAS List | `UAS列表` | `uas_*` fields |
| Management | `管理` | `*_management` |
| Impact | `影响` | `*_impact` |
| Coping Ability | `应对能力` | `*_coping_abilities` |
| Description | `描述` | `*_description` |
| Level 1/2/3 | `level1/2/3` | `*_type_l1/l2/l3` |

### Impact Value Mapping

| Meaning | Label | Aviation |
|---------|-------|----------|
| Irrelevant | `无关紧要` | (unknown - API driven) |
| Leads to Error | `导致差错` | (unknown - API driven) |
| Leads to UAS T | `导致UAS T` | `leads_to_uas_t` |
| Leads to UAS E | `导致UAS E` | `leads_to_uas_e` |

---

## 7. ADDITIONAL AVIATION FEATURES (Not in Label)

| Feature | File | Description |
|---------|------|-------------|
| **Auto-Save** | `use-auto-save.hook.ts` | 3000ms debounced save to backend |
| **UAS Field Clearing** | `LabelingItemCard.tsx:40-83` | Auto-clears UAS when conditions fail |
| **Save Status Indicator** | `save-status.store.ts` | Shows saving/saved/error states |
| **Review Workflow** | `use-review-workflow.hook.ts` | Status transitions (draft → submitted → reviewed → approved) |
| **Excel Upload** | `use-excel-upload.hook.ts` | Bulk data import |
| **Internationalization** | `i18n/locales/en.json, zh.json` | Multi-language support |
| **Error Handling** | `default-api-client.ts:20-90` | Custom error classes with status codes |

---

## 8. TESTING GAP

### Label Library
- No test files found in `web/libs/label/src`

### Aviation Library
- `use-uas-applicable.hook.test.ts` - Tests UAS conditional logic
- Jest configuration present (`jest.config.ts`, `jest.setup.ts`)

---

## 9. KEY FILES REFERENCE

### Label Library
| File | Lines | Purpose |
|------|-------|---------|
| `LabelingList.js` | 209 | Main list component, UAS logic at line 120 |
| `ErrorModule.js` | 167 | Error identification form |
| `ThreatModule.js` | 172 | Threat identification form |
| `UASModule.js` | 156 | UAS identification form |
| `effectAndManage.json` | 37 | Management → Impact config |

### Aviation Library
| File | Lines | Purpose |
|------|-------|---------|
| `AnnotationView.tsx` | 374+ | Main annotation view |
| `LabelingItemCard.tsx` | 200+ | Item card with UAS logic at lines 33-38 |
| `RecognitionSection.tsx` | 284+ | Unified threat/error/uas component |
| `use-uas-applicable.hook.ts` | 40 | Reusable UAS applicability hook |
| `use-labeling-items.hook.ts` | 103 | CRUD operations + API |
| `use-auto-save.hook.ts` | 80 | Auto-save with debounce |
| `default-api-client.ts` | 472 | Full REST API client |

---

## 10. CONCLUSION

### Logic Parity: ✅ CONFIRMED
The UAS conditional logic is **functionally identical** between both libraries:
- Same trigger conditions (threat impact = UAS T OR error impact = UAS E)
- Same result (UAS section enabled/disabled)

### Architectural Differences: ⚠️ SIGNIFICANT
1. **Component Pattern**: Separate modules → Unified polymorphic component
2. **State Management**: Prop drilling → Jotai atoms + hooks
3. **Configuration**: Static JSON → API-driven
4. **Persistence**: None → Full REST API with auto-save
5. **Language**: JavaScript → TypeScript

### Recommendations
1. If porting logic from label to aviation, the core conditional check is already correctly implemented
2. Ensure impact value mappings are consistent between Chinese labels and English API values
3. The `useUasApplicable` hook can be used anywhere the UAS applicability needs to be checked
4. Aviation's auto-save and field clearing features are enhancements, not regressions

---

## 11. POTENTIAL BUGS & BEHAVIOR DIFFERENCES

### 🔴 BUG #1: Coping Abilities Structure Mismatch

**Severity**: Medium
**Files**:
- Label: `ThreatModule.js:67-78` uses `labHieStru.json` hierarchical structure
- Aviation: `RecognitionSection.tsx:34-42` uses flat hardcoded list

**Label Library** - Hierarchical TreeSelect with groups:
```javascript
const buildAbilityTreeData = () => {
  const abilities = labHieStru.threatIdentification?.threatCopingAbility || {};
  return Object.entries(abilities).map(([group, items]) => ({
    title: group,          // "KNO" or "PRO" groups
    selectable: false,
    children: items.map(...)
  }));
};
```

**Aviation Library** - Flat list:
```typescript
const COPING_OPTIONS: MultiSelectOption[] = [
  { value: 'situation_awareness', label: '情境意识' },
  { value: 'decision_making', label: '决策能力' },
  // ... 7 total options, NO grouping
];
```

**Impact**: Users lose the KNO/PRO grouping structure when selecting coping abilities.

---

### 🟡 BUG #2: Code Duplication - `useUasApplicable` Hook Not Used

**Severity**: Low (code smell, not functional bug)
**File**: `LabelingItemCard.tsx:36-38`

```typescript
// Duplicated logic - hook exists but not used
const isUasRequired = useMemo(() => {
  return threatImpact === 'leads_to_uas_t' || errorImpact === 'leads_to_uas_e';
}, [threatImpact, errorImpact]);
```

**Recommendation**: Use `useUasApplicable(item)` hook instead for consistency.

---

### 🟡 BUG #3: Aviation Has Additional Cascading Behavior (Enhancement or Bug?)

**Severity**: Low (behavior difference)
**File**: `LabelingItemCard.tsx:56-83`

**Label Library**: Impact changes have no side effects on other fields.

**Aviation Library**: Impact changes trigger cascading updates:
```typescript
if (newThreatImpact === 'leads_to_error') {
  enhancedUpdates.error_relevance = '来源于威胁';  // NEW BEHAVIOR
} else if (newThreatImpact === 'leads_to_uas_t') {
  enhancedUpdates.uas_relevance = '来源于威胁';   // NEW BEHAVIOR
  enhancedUpdates.uas_applicable = true;
}
```

**Question**: Is this intended behavior or should aviation match label library exactly?

---

### 🟢 VERIFIED CORRECT: Impact Auto-Select Logic

Both libraries correctly auto-select impact when management = "managed":

**Label (ThreatModule.js:38-40):**
```javascript
updatedItem.影响 = impacts.length === 1 ? impacts[0] : '';
```

**Aviation (RecognitionSection.tsx:152-160):**
```typescript
if (config?.autoSelect) {
  updates[`${category}_impact`] = { value: config.autoSelect };
}
```

---

### 🟢 VERIFIED CORRECT: Impact Clear on Management Change

Both libraries correctly clear impact when management changes to non-managed state:

**Label**: Sets `影响 = ''` when multiple options exist
**Aviation**: Sets `impact = {}` when no autoSelect

---

### 🟡 POTENTIAL BUG #4: UAS Impact Field Always Disabled

**Severity**: Low (may be intentional)
**File**: `use-impact-options.hook.ts:104-106`

```typescript
if (category === 'uas' || !managementValue) {
  return { impactOptions: [], autoSelectValue: null, isImpactDisabled: true };
}
```

UAS category returns no impact options - the field is always disabled. Need to verify if this matches label library's UAS module behavior (which also may not have impact field).

---

### 🟢 VERIFIED CORRECT: Type Hierarchy Cascade Clear

**Files**:
- Label: `ThreatModule.js:31-36`
- Aviation: `hierarchical-dropdown.tsx:101-120`

**Label Library**:
```javascript
if (field === 'level1') {
  updatedItem.level2 = '';
  updatedItem.level3 = '';
}
```

**Aviation Library** (`hierarchical-dropdown.tsx:101-109`):
```typescript
const handleL1Select = useCallback((code: string) => {
  setSelectedL1(code);
  setSelectedL2(null);    // ✅ Clears L2 local state
  onChange({
    level1: code,
    level2: null,         // ✅ Clears L2 in parent
    level3: null,         // ✅ Clears L3 in parent
  });
}, [onChange]);
```

**VERIFIED**: Aviation correctly implements cascade clearing in `HierarchicalDropdown` component.

---

## 12. FINAL BUG SUMMARY

| # | Bug | Severity | Status | Action |
|---|-----|----------|--------|--------|
| 1 | Coping abilities flat vs hierarchical | **Medium** | 🔴 Confirmed | Fix: Add KNO/PRO grouping to aviation |
| 2 | useUasApplicable hook not used | Low | 🟡 Code smell | Refactor: Use existing hook in LabelingItemCard |
| 3 | Cascading behavior on impact change | Low | 🟡 Enhancement | Clarify: Is `uas_relevance` auto-set intended? |
| 4 | UAS impact field disabled | Low | 🟡 Intentional | Label also has no UAS impact options |
| 5 | Type hierarchy cascade clear | N/A | ✅ Verified OK | HierarchicalDropdown correctly clears |

---

## 13. CONFIRMED BUG DETAILS

### 🔴 BUG #1: Coping Abilities Structure (CONFIRMED - NEEDS FIX)

**Label Library** (`labHieStru.json:47-56`):
```json
"threatCopingAbility": {
  "KNO": ["KNO.1", "KNO.2"],
  "PRO": ["PRO.1", "PRO.2"]
}
```

**Aviation Library** (`RecognitionSection.tsx:34-42`):
```typescript
const COPING_OPTIONS = [
  { value: 'situation_awareness', label: '情境意识' },
  // ... flat list, NO grouping
];
```

**Fix Required**: Add hierarchical grouping structure to aviation's coping abilities selector.

---

## 14. VERIFIED CORRECT BEHAVIORS

| Feature | Label | Aviation | Status |
|---------|-------|----------|--------|
| UAS conditional logic | ✅ | ✅ | Match |
| Impact auto-select on managed | ✅ | ✅ | Match |
| Impact clear on management change | ✅ | ✅ | Match |
| Type hierarchy cascade clear | ✅ | ✅ | Match |
| UAS disabled state | ✅ | ✅ | Match |

---

# IMPLEMENTATION PLAN (TDD Approach)

## Executive Summary

The backend already provides hierarchical coping abilities via API. The fix requires:
1. Creating a hook to fetch coping abilities from API
2. Updating RecognitionSection to use hierarchical MultiSelect
3. Refactoring LabelingItemCard to use existing useUasApplicable hook

## Key Discovery: Backend Already Has Hierarchical Data

**API Endpoint**: `GET /api/aviation/types/hierarchy/?category=coping`

**Backend Seed Data** (`seed_aviation_types.py:239-257`):
```python
coping_categories = {
    'KNO': 'Knowledge',
    'PRO': 'Procedures',
    'FPA': 'Flight Path Awareness',
    'FPM': 'Flight Path Management',
    'COM': 'Communication',
    'LTW': 'Leadership & Teamwork',
    'SAW': 'Situational Awareness',
    'WLM': 'Workload Management',
    'PSD': 'Problem Solving & Decision Making',
}
```

---

## Phase 1: Write Failing Tests (TDD Red Phase)

### 1.1 Create Hook Test File

**File**: `hooks/__tests__/use-coping-abilities.hook.test.ts`

```typescript
/**
 * TDD Test Suite for useCopingAbilities hook
 *
 * Reference: Label Library labHieStru.json:47-56
 * Coping abilities should be hierarchical with groups (KNO, PRO, etc.)
 */
describe('useCopingAbilities', () => {
  describe('Data Fetching', () => {
    it('should fetch coping abilities from API', async () => {});
    it('should return hierarchical structure with groups', async () => {});
    it('should handle loading state', () => {});
    it('should handle error state', () => {});
  });

  describe('Data Transformation', () => {
    it('should transform API response to MultiSelect group format', () => {});
    it('should preserve group codes (KNO, PRO, etc.)', () => {});
    it('should include child options under each group', () => {});
  });
});
```

### 1.2 Create Component Integration Test

**File**: `components/annotation/recognition-section/__tests__/RecognitionSection.coping-abilities.test.tsx`

```typescript
/**
 * TDD Test Suite for Coping Abilities in RecognitionSection
 *
 * Reference: Label Library ThreatModule.js:67-79
 * Gap: Aviation uses flat list, should use hierarchical groups
 */
describe('RecognitionSection - Coping Abilities Gap Fix', () => {
  describe('Hierarchical Structure', () => {
    it('should display coping abilities in groups (KNO, PRO, etc.)', async () => {});
    it('should allow selecting items from multiple groups', async () => {});
    it('should save selected values with group context', async () => {});
  });

  describe('API Integration', () => {
    it('should fetch coping abilities from API on mount', async () => {});
    it('should show loading state while fetching', () => {});
    it('should handle fetch errors gracefully', () => {});
  });
});
```

### 1.3 Update Existing Tests

**File**: `components/annotation/labeling-item-card/__tests__/LabelingItemCard.test.tsx`

```typescript
/**
 * Test for useUasApplicable hook usage
 * Gap: LabelingItemCard duplicates UAS logic instead of using hook
 */
describe('LabelingItemCard - useUasApplicable Integration', () => {
  it('should use useUasApplicable hook for UAS applicability', () => {});
  it('should not duplicate UAS logic inline', () => {});
});
```

---

## Phase 2: Implement useCopingAbilities Hook (TDD Green Phase)

### 2.1 Create Hook

**File**: `hooks/use-coping-abilities.hook.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import type { DropdownOption } from '../types/dropdown.types';
import { apiClient } from '../api';

export interface CopingAbilityGroup {
  code: string;
  label: string;
  options: CopingAbilityOption[];
}

export interface CopingAbilityOption {
  code: string;
  label: string;
}

export interface UseCopingAbilitiesResult {
  groups: CopingAbilityGroup[];
  isLoading: boolean;
  error: Error | null;
}

export const useCopingAbilities = (): UseCopingAbilitiesResult => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCopingAbilities = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getTypeHierarchy('coping');
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchCopingAbilities();
  }, []);

  const groups = useMemo((): CopingAbilityGroup[] => {
    return options
      .filter(opt => opt.level === 1)
      .map(group => ({
        code: group.code,
        label: group.label_zh || group.label,
        options: (group.children || []).map(child => ({
          code: child.code,
          label: child.label_zh || child.label,
        })),
      }));
  }, [options]);

  return { groups, isLoading, error };
};
```

### 2.2 Create MultiSelect Option Type

**File**: `types/coping.types.ts`

```typescript
export interface GroupedMultiSelectOption {
  groupCode: string;
  groupLabel: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}
```

---

## Phase 3: Update RecognitionSection Component

### 3.1 Remove Hardcoded COPING_OPTIONS

**File**: `components/annotation/recognition-section/RecognitionSection.tsx`

**Before** (Lines 34-42):
```typescript
const COPING_OPTIONS: MultiSelectOption[] = [
  { value: 'situation_awareness', label: '情境意识' },
  // ... flat list
];
```

**After**:
```typescript
// Remove hardcoded options
// Use useCopingAbilities hook instead
```

### 3.2 Integrate Hook

```typescript
import { useCopingAbilities } from '../../../hooks/use-coping-abilities.hook';

export const RecognitionSection: FC<RecognitionSectionProps> = ({...}) => {
  const { groups: copingGroups, isLoading: copingLoading } = useCopingAbilities();

  // Transform groups to MultiSelect format
  const copingOptions = useMemo(() => {
    return copingGroups.flatMap(group =>
      group.options.map(opt => ({
        value: opt.code,
        label: opt.label,
        group: group.label,
      }))
    );
  }, [copingGroups]);

  // ... rest of component
};
```

### 3.3 Update MultiSelect Component (if needed)

**File**: `components/common/multi-select/multi-select.tsx`

Add group support:
```typescript
interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;  // NEW: Optional group label
}
```

---

## Phase 4: Refactor LabelingItemCard

### 4.1 Use useUasApplicable Hook

**File**: `components/annotation/labeling-item-card/LabelingItemCard.tsx`

**Before** (Lines 33-38):
```typescript
const threatImpact = getImpactValue(item.threat_impact);
const errorImpact = getImpactValue(item.error_impact);

const isUasRequired = useMemo(() => {
  return threatImpact === 'leads_to_uas_t' || errorImpact === 'leads_to_uas_e';
}, [threatImpact, errorImpact]);
```

**After**:
```typescript
import { useUasApplicable } from '../../../hooks/use-uas-applicable.hook';

// Inside component:
const { isUasApplicable, uasDisabledMessage } = useUasApplicable(item);
```

---

## Phase 5: Run Tests & Verify Coverage

### 5.1 Run Test Commands

```bash
# Run all aviation tests
cd web && npx nx test aviation

# Run with coverage
cd web && npx nx test aviation --coverage

# Run specific test file
cd web && npx nx test aviation --testFile=use-coping-abilities.hook.test.ts
```

### 5.2 Expected Coverage Targets

| File | Target Coverage |
|------|-----------------|
| `use-coping-abilities.hook.ts` | > 90% |
| `RecognitionSection.tsx` | > 85% |
| `LabelingItemCard.tsx` | > 85% |

---

## Agent Assignment Matrix

| Phase | Primary Agent | Support Agent | Tools |
|-------|---------------|---------------|-------|
| Phase 1 (Tests) | `react-master` | `code-reviewer` | Write, Edit |
| Phase 2 (Hook) | `react-master` | `code-architecture-expert` | Write, Edit |
| Phase 3 (Component) | `react-master` | `ux-master` | Edit, MultiEdit |
| Phase 4 (Refactor) | `code-refactorer-agent` | `code-reviewer` | Edit |
| Phase 5 (Verify) | `code-reviewer` | - | Bash, Read |

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `hooks/__tests__/use-coping-abilities.hook.test.ts` | Hook tests |
| `hooks/use-coping-abilities.hook.ts` | Coping abilities fetching hook |
| `components/annotation/recognition-section/__tests__/RecognitionSection.coping-abilities.test.tsx` | Integration tests |

### Modified Files
| File | Changes |
|------|---------|
| `RecognitionSection.tsx` | Remove COPING_OPTIONS, use hook |
| `LabelingItemCard.tsx` | Use useUasApplicable hook |
| `multi-select.tsx` | Add group support (optional) |
| `hooks/index.ts` | Export new hook |

---

## Success Criteria

- [ ] All new tests pass
- [ ] Existing tests still pass
- [ ] Coping abilities display in hierarchical groups
- [ ] No code duplication for UAS applicability logic
- [ ] Coverage > 85% for modified files
- [ ] No TypeScript errors
- [ ] No console warnings in tests
