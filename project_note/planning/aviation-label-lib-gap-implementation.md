# Label Library → Aviation Library: Logic Flow Gap Implementation Plan

## Overview

Fix 4 logic flow gaps to achieve parity between `web/libs/label/src/` (source) and `web/libs/aviation/src/` (target).

**Context**: Migration from client-side label lib to persistent aviation lib with backend support. Architecture differences are acceptable; this plan addresses pure logic flow gaps.

---

## Gap Summary

| # | Gap | Status | Priority |
|---|-----|--------|----------|
| 1 | Management → Impact conditional mapping | ✅ Completed | Critical |
| 2 | UAS auto-enable based on impact | ✅ Completed | Critical |
| 3 | Cascade reset on level selection | ✅ Completed | High |
| 4 | Data initialization guard | ✅ Completed | Medium |

### Gap 1 Implementation Details (Completed)

**Files Created:**
- `web/libs/aviation/src/hooks/use-impact-options.hook.ts` - Hook with THREAT/ERROR_IMPACT_CONFIG
- `web/libs/aviation/src/hooks/__tests__/use-impact-options.hook.test.ts` - 12 hook tests
- `web/libs/aviation/src/components/annotation/recognition-section/__tests__/RecognitionSection.test.tsx` - 12 component tests
- `web/libs/aviation/jest.setup.ts` - Jest DOM setup

**Files Modified:**
- `web/libs/aviation/src/hooks/index.ts` - Added export
- `web/libs/aviation/src/components/annotation/recognition-section/RecognitionSection.tsx` - Uses hook, dynamic options
- `web/libs/aviation/jest.config.ts` - Fixed preset path, added setup

**Test Results:** 24/24 tests passing

### Gap 2 Implementation Details (Completed)

**Files Created:**
- `web/libs/aviation/src/hooks/use-uas-applicable.hook.ts` - Hook with type guards for safe impact value extraction
- `web/libs/aviation/src/hooks/__tests__/use-uas-applicable.hook.test.ts` - 15 hook tests
- `web/libs/aviation/src/components/annotation/recognition-section/__tests__/RecognitionSection.uas-applicable.test.tsx` - 12 component tests

**Files Modified:**
- `web/libs/aviation/src/hooks/index.ts` - Added export for use-uas-applicable
- `web/libs/aviation/src/components/annotation/recognition-section/RecognitionSection.tsx` - Added uasDisabled, uasDisabledMessage props
- `web/libs/aviation/src/components/annotation/recognition-section/recognition-section.module.scss` - Added .disabledMessage style

**Test Results:** 27/27 tests passing

### Gap 3 Implementation Details (Completed)

**Files Created:**
- `web/libs/aviation/src/components/annotation/recognition-section/__tests__/RecognitionSection.cascade-reset.test.tsx` - 15 cascade reset tests

**Files Modified:**
- `web/libs/aviation/src/components/common/hierarchical-dropdown/hierarchical-dropdown.tsx` - handleL1Select and handleL2Select now call onChange with cascade reset values

**Test Results:** 15/15 tests passing

**Implementation Notes:**
- L1 change now triggers onChange with L2=null, L3=null
- L2 change now triggers onChange with L3=null
- Fixed test column selectors to filter out `.columnHeader` elements (use `Array.from(listbox.children).filter()` instead of `querySelectorAll('[class*="column"]')`)
- Added EA-02 and UA-02 L2 options to mock data for multi-category L2 cascade test

### Gap 4 Implementation Details (Completed)

**Files Created:**
- `web/libs/aviation/src/components/annotation/recognition-section/__tests__/RecognitionSection.data-init.test.tsx` - 14 data initialization tests

**Files Modified:**
- `web/libs/aviation/src/components/annotation/recognition-section/RecognitionSection.tsx` - Added useEffect for data initialization guard, defensive guards in useMemo hooks
- `web/libs/aviation/src/components/annotation/competency-summary/CompetencySummary.tsx` - Added defensive guard for copingAbilities array handling

**Test Results:** 14/14 tests passing

**Implementation Notes:**
- useEffect checks for malformed data (arrays, null, undefined) in management/impact/coping_abilities fields
- When malformed data detected, initializes to default structure: `{}` for management/impact, `{ values: [] }` for coping_abilities
- Dependency array includes `[management, impact, copingAbilities, category, onUpdate]` to match label-lib behavior (runs on data changes, not just mount)
- Added defensive guards in `copingValue` useMemo and `CompetencySummary` to handle malformed data gracefully before useEffect can run

---

## Gap 1: Management → Impact Conditional Mapping

### Problem

Aviation lib has independent dropdowns for management and impact. Label lib auto-fills impact when management="managed" and filters options based on management selection.

### Label Lib Reference

**File**: `web/libs/label/src/components/ThreatModule.js:38-41`

```javascript
if (field === '管理') {
    const impacts = effectAndManage?.threatIdentification?.threatManagement?.[value]?.threatImpact || [];
    updatedItem.影响 = impacts.length === 1 ? impacts[0] : '';
}
```

**Data**: `web/libs/label/src/data/effectAndManage.json`

```json
{
  "threatIdentification": {
    "threatManagement": {
      "管理的": { "threatImpact": ["无关紧要"] },
      "未管理": { "threatImpact": ["无关紧要", "导致差错", "导致UAS T"] },
      "无效管理": { "threatImpact": ["无关紧要", "导致差错", "导致UAS T"] },
      "未观察到": { "threatImpact": ["无关紧要", "导致差错", "导致UAS T"] }
    }
  },
  "errorIdentification": {
    "errorManagement": {
      "管理的": { "errorImpact": ["无关紧要"] },
      "未管理": { "errorImpact": ["无关紧要", "导致UAS E"] },
      "无效管理": { "errorImpact": ["无关紧要", "导致UAS E"] },
      "未观察到": { "errorImpact": ["无关紧要", "导致UAS E"] }
    }
  }
}
```

### Solution

**Create** `web/libs/aviation/src/hooks/use-impact-options.hook.ts`:

```typescript
import { useMemo } from 'react';

interface ImpactOption {
  value: string;
  label: string;
}

const THREAT_IMPACT_CONFIG: Record<string, { impacts: ImpactOption[]; autoSelect: string | null }> = {
  managed: {
    impacts: [{ value: 'none', label: '无关紧要' }],
    autoSelect: 'none',
  },
  unmanaged: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_error', label: '导致差错' },
      { value: 'leads_to_uas', label: '导致UAS' },
    ],
    autoSelect: null,
  },
  ineffective: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_error', label: '导致差错' },
      { value: 'leads_to_uas', label: '导致UAS' },
    ],
    autoSelect: null,
  },
  unobserved: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_error', label: '导致差错' },
      { value: 'leads_to_uas', label: '导致UAS' },
    ],
    autoSelect: null,
  },
};

const ERROR_IMPACT_CONFIG: Record<string, { impacts: ImpactOption[]; autoSelect: string | null }> = {
  managed: {
    impacts: [{ value: 'none', label: '无关紧要' }],
    autoSelect: 'none',
  },
  unmanaged: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_uas', label: '导致UAS' },
    ],
    autoSelect: null,
  },
  ineffective: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_uas', label: '导致UAS' },
    ],
    autoSelect: null,
  },
  unobserved: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_uas', label: '导致UAS' },
    ],
    autoSelect: null,
  },
};

export const useImpactOptions = (
  category: 'threat' | 'error' | 'uas',
  managementValue: string | null,
) => {
  return useMemo(() => {
    if (category === 'uas' || !managementValue) {
      return { impactOptions: [], autoSelectValue: null, isImpactDisabled: true };
    }
    const config = category === 'threat'
      ? THREAT_IMPACT_CONFIG[managementValue]
      : ERROR_IMPACT_CONFIG[managementValue];
    return {
      impactOptions: config?.impacts ?? [],
      autoSelectValue: config?.autoSelect ?? null,
      isImpactDisabled: (config?.impacts.length ?? 0) === 1,
    };
  }, [category, managementValue]);
};

export { THREAT_IMPACT_CONFIG, ERROR_IMPACT_CONFIG };
```

**Modify** `RecognitionSection.tsx:125-132` - Update `handleManagementChange`:

```typescript
const handleManagementChange = useCallback(
  (value: string | null) => {
    const updates: Partial<LabelingItem> = {
      [`${category}_management`]: value ? { value } : {},
    };
    if (category !== 'uas' && value) {
      const config = category === 'threat'
        ? THREAT_IMPACT_CONFIG[value]
        : ERROR_IMPACT_CONFIG[value];
      if (config?.autoSelect) {
        updates[`${category}_impact`] = { value: config.autoSelect };
      } else {
        updates[`${category}_impact`] = {};
      }
    }
    onUpdate(updates);
  },
  [onUpdate, category],
);
```

**Modify** `RecognitionSection.tsx:191-199` - Use dynamic options:

```typescript
<Select
  id={`${category}-impact`}
  value={impactValue}
  onChange={handleImpactChange}
  options={impactOptions}
  placeholder="选择影响..."
  disabled={disabled || isImpactDisabled || category === 'uas'}
/>
```

---

## Gap 2: UAS Auto-Enable Based on Impact

### Problem

Aviation uses stored `uas_applicable` boolean field (manual toggle). Label lib computes it from threat/error impact values.

### Label Lib Reference

**File**: `web/libs/label/src/components/LabelingList.js:120`

```javascript
const isUASRequired =
    (item.威胁列表?.影响 === '导致UAS T') ||
    (item.差错列表?.影响 === '导致UAS E');
```

### Solution

**Create** `web/libs/aviation/src/hooks/use-uas-applicable.hook.ts`:

```typescript
import { useMemo } from 'react';
import type { LabelingItem } from '../types';

export interface UseUasApplicableResult {
  isUasApplicable: boolean;
  uasDisabledMessage: string | null;
}

export const useUasApplicable = (item: LabelingItem): UseUasApplicableResult => {
  return useMemo(() => {
    const threatImpact = (item.threat_impact as { value?: string })?.value;
    const errorImpact = (item.error_impact as { value?: string })?.value;
    const isApplicable = threatImpact === 'leads_to_uas' || errorImpact === 'leads_to_uas';
    return {
      isUasApplicable: isApplicable,
      uasDisabledMessage: isApplicable ? null : 'UAS需要威胁或差错影响为"导致UAS"',
    };
  }, [item.threat_impact, item.error_impact]);
};
```

**Modify** `RecognitionSection.tsx` props (lines 11-18):

```typescript
export interface RecognitionSectionProps {
  category: 'threat' | 'error' | 'uas';
  title: string;
  item: LabelingItem;
  options: DropdownOption[];
  onUpdate: (updates: Partial<LabelingItem>) => void;
  disabled?: boolean;
  uasDisabled?: boolean;
  uasDisabledMessage?: string;
}
```

**Add** disabled message in JSX (after line 163):

```typescript
{category === 'uas' && uasDisabled && uasDisabledMessage && (
  <div className={styles.disabledMessage}>{uasDisabledMessage}</div>
)}
```

**Modify** consumer components (`AnnotationView.tsx`, `LabelingItemCard.tsx`):

```typescript
const { isUasApplicable, uasDisabledMessage } = useUasApplicable(item);

<RecognitionSection
  category="uas"
  title="UAS识别"
  item={item}
  options={uasOptions}
  onUpdate={onUpdate}
  uasDisabled={!isUasApplicable}
  uasDisabledMessage={uasDisabledMessage ?? undefined}
/>
```

---

## Gap 3: Cascade Reset on Level Selection

### Problem

Aviation doesn't clear L2/L3 when L1 changes, or L3 when L2 changes.

### Label Lib Reference

**File**: `web/libs/label/src/components/ThreatModule.js:29-36`

```javascript
if (field === 'level1') {
    updatedItem.level2 = '';
    updatedItem.level3 = '';
} else if (field === 'level2') {
    updatedItem.level3 = '';
}
```

### Solution

**Modify** `RecognitionSection.tsx:90-123` - Update `handleTypeChange`:

```typescript
const handleTypeChange = useCallback(
  (value: HierarchicalSelection | null) => {
    const findOptionByCode = (opts: DropdownOption[], code: string): DropdownOption | null => {
      for (const opt of opts) {
        if (opt.code === code) return opt;
        if (opt.children) {
          const found = findOptionByCode(opt.children, code);
          if (found) return found;
        }
      }
      return null;
    };

    if (!value) {
      onUpdate({
        [`${category}_type_l1`]: null,
        [`${category}_type_l2`]: null,
        [`${category}_type_l3`]: null,
      });
      return;
    }

    const l1Option = value.level1 ? findOptionByCode(options, value.level1) : null;
    const l2Option = value.level2 ? findOptionByCode(options, value.level2) : null;
    const l3Option = value.level3 ? findOptionByCode(options, value.level3) : null;

    const updates: Partial<LabelingItem> = {
      [`${category}_type_l1`]: l1Option?.id ?? null,
    };

    if (value.level2 === null) {
      updates[`${category}_type_l2`] = null;
      updates[`${category}_type_l3`] = null;
    } else {
      updates[`${category}_type_l2`] = l2Option?.id ?? null;
      updates[`${category}_type_l3`] = value.level3 === null ? null : (l3Option?.id ?? null);
    }

    onUpdate(updates);
  },
  [onUpdate, options, category],
);
```

---

## Gap 4: Data Initialization Guard

### Problem

Aviation doesn't handle malformed/missing data structures in threat/error/uas fields.

### Label Lib Reference

**File**: `web/libs/label/src/components/ThreatModule.js:13-25`

```javascript
useEffect(() => {
    if (Array.isArray(data) || !data) {
        onChange({
            level1: '', level2: '', level3: '',
            管理: '', 影响: '', 应对能力: [], 描述: ''
        });
    }
}, [data, onChange]);
```

### Solution

**Add** useEffect to `RecognitionSection.tsx` (after useMemo hooks, ~line 88):

```typescript
import { type FC, useCallback, useMemo, useEffect } from 'react';

useEffect(() => {
  const isInvalid = (obj: unknown) => Array.isArray(obj) || obj === null || obj === undefined;

  const management = getField<Record<string, unknown> | null>('management');
  const impact = getField<Record<string, unknown> | null>('impact');
  const coping = getField<Record<string, unknown> | null>('coping_abilities');

  if (isInvalid(management) || isInvalid(impact) || isInvalid(coping)) {
    onUpdate({
      [`${category}_management`]: {},
      [`${category}_impact`]: {},
      [`${category}_coping_abilities`]: { values: [] },
    });
  }
}, []);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `web/libs/aviation/src/hooks/use-impact-options.hook.ts` | **NEW** - Gap 1 |
| `web/libs/aviation/src/hooks/use-uas-applicable.hook.ts` | **NEW** - Gap 2 |
| `web/libs/aviation/src/hooks/index.ts` | Add 2 exports |
| `web/libs/aviation/src/components/annotation/recognition-section/RecognitionSection.tsx` | All 4 gaps |
| `web/libs/aviation/src/components/views/AnnotationView.tsx` | Gap 2 (UAS props) |
| `web/libs/aviation/src/components/annotation/labeling-item-card/LabelingItemCard.tsx` | Gap 2 (UAS props) |
| `web/libs/aviation/src/components/annotation/recognition-section/recognition-section.module.scss` | Add `.disabledMessage` style |

---

## Implementation Order

1. **Gap 1** - Create `use-impact-options.hook.ts`, modify `RecognitionSection.tsx` management/impact logic
2. **Gap 3** - Modify `handleTypeChange` cascade reset in `RecognitionSection.tsx`
3. **Gap 2** - Create `use-uas-applicable.hook.ts`, add props to `RecognitionSection`, update consumers
4. **Gap 4** - Add initialization useEffect to `RecognitionSection.tsx`

---

## Testing Checklist

### Gap 1 Tests (24/24 ✅)
- [x] When management="managed", impact auto-fills to "无关紧要" and dropdown is disabled
- [x] When management="unmanaged/ineffective/unobserved", impact dropdown shows correct options

### Gap 2 Tests (27/27 ✅)
- [x] Threat impact="导致UAS" enables UAS section
- [x] Error impact="导致UAS" enables UAS section
- [x] Neither impact="导致UAS" → UAS section disabled with message
- [x] Edge cases: null, undefined, arrays, empty objects handled

### Gap 3 Tests (15/15 ✅)
- [x] L1 change clears L2 and L3
- [x] Clearing selection sets all to null
- [x] L2 change clears L3
- [x] L3 change preserves L1 and L2
- [x] Cascade works for all categories (threat, error, uas)

### Gap 4 Tests (14/14 ✅)
- [x] Array data in management/impact/coping triggers initialization
- [x] Null data in management/impact/coping triggers initialization
- [x] Undefined data in coping_abilities triggers initialization
- [x] Valid object data does NOT trigger initialization
- [x] Empty objects {} do NOT trigger initialization
- [x] Mixed malformed data (array + null) triggers single initialization
- [x] All categories tested (threat, error, uas)
