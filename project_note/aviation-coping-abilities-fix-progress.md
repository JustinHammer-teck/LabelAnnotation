# Aviation Library - Coping Abilities Fix Progress

**Date**: 2025-12-13
**Status**: In Progress (Phase 2 Complete, Ready for Phase 3)

---

## Executive Summary

Fixing the coping abilities structure mismatch between the label library and aviation library. The label library uses hierarchical grouping (KNO, PRO, etc.) while aviation uses a flat hardcoded list.

**Key Discovery**: Backend already provides hierarchical coping abilities via API - frontend just needs to use it.

---

## Gap Analysis Findings

### Confirmed Bug: Coping Abilities Structure Mismatch

| Aspect | Label Library | Aviation Library |
|--------|---------------|------------------|
| Structure | Hierarchical (KNO/PRO groups) | Flat list |
| Data Source | Static `labHieStru.json` | Hardcoded in component |
| Component | TreeSelect with groups | Simple MultiSelect |

**Label Library** (`labHieStru.json:47-56`):
```json
"threatCopingAbility": {
  "KNO": ["KNO.1", "KNO.2"],
  "PRO": ["PRO.1", "PRO.2"]
}
```

**Aviation Library** (`RecognitionSection.tsx:34-42`):
```typescript
const COPING_OPTIONS: MultiSelectOption[] = [
  { value: 'situation_awareness', label: '情境意识' },
  { value: 'decision_making', label: '决策能力' },
  // ... 7 flat options, NO grouping
];
```

### Backend Already Has Hierarchical Data

**API Endpoint**: `GET /api/aviation/types/hierarchy/?category=coping`

**Seed Data** (`seed_aviation_types.py`):
- KNO (Knowledge): KNO.1, KNO.2
- PRO (Procedures): PRO.1, PRO.2
- FPA (Flight Path Awareness): FPA.1, FPA.2
- FPM (Flight Path Management): FPM.1, FPM.2
- COM (Communication): COM.1, COM.2
- LTW (Leadership & Teamwork): LTW.1, LTW.2
- SAW (Situational Awareness): SAW.1, SAW.2
- WLM (Workload Management): WLM.1, WLM.2
- PSD (Problem Solving & Decision Making): PSD.1, PSD.2

---

## Implementation Plan (TDD Approach)

### Phase 1: Write Failing Tests ✅ COMPLETED

**Files Created**:
- `hooks/__tests__/use-coping-abilities.hook.test.ts`
- `recognition-section/__tests__/RecognitionSection.coping-abilities.test.tsx`

**Test Coverage**:
- API fetching and loading states
- Error handling
- Data transformation to grouped format
- Flat options for backward compatibility
- Edge cases (empty response, groups with no children)

### Phase 2: Implement useCopingAbilities Hook ✅ COMPLETED

**File Created**:
- `hooks/use-coping-abilities.hook.ts`

**Hook Interface**:
```typescript
interface UseCopingAbilitiesResult {
  loading: boolean;
  error: string | null;
  groups: CopingAbilityGroup[];
  flatOptions: CopingAbilityOption[];
}
```

**Completed Tasks**:
- ✅ Upgraded `@testing-library/react` from 12.1.5 to 14.3.1
- ✅ Removed deprecated `@testing-library/react-hooks` package
- ✅ Fixed all hook test files to use `@testing-library/react`
- ✅ Fixed mock stability issue (stable reference for `useAviationApi`)
- ✅ All 13 hook tests passing

**Test Results**:
```
PASS libs/aviation/src/hooks/__tests__/use-coping-abilities.hook.test.ts
  useCopingAbilities
    API Fetching (3 tests) ✅
    Error Handling (2 tests) ✅
    Data Transformation (5 tests) ✅
    Flat Options (1 test) ✅
    Edge Cases (2 tests) ✅
```

### Phase 3: Update RecognitionSection 🔄 NEXT

- Remove hardcoded `COPING_OPTIONS`
- Integrate `useCopingAbilities` hook
- Transform groups to MultiSelect format

**TDD Status**: 16 integration tests waiting (RecognitionSection.coping-abilities.test.tsx)

### Phase 4: Refactor LabelingItemCard ⏳ PENDING

- Use existing `useUasApplicable` hook
- Remove duplicated UAS logic

### Phase 5: Run Tests & Verify ⏳ PENDING

- All new tests pass
- Existing tests still pass
- Coverage > 85%

---

## Current Test Status

| Test Suite | Status | Pass/Total |
|------------|--------|------------|
| use-coping-abilities.hook.test.ts | ✅ PASS | 13/13 |
| use-uas-applicable.hook.test.ts | ✅ PASS | 17/17 |
| use-impact-options.hook.test.ts | ✅ PASS | 10/10 |
| RecognitionSection.test.tsx | ✅ PASS | - |
| RecognitionSection.data-init.test.tsx | ✅ PASS | - |
| RecognitionSection.cascade-reset.test.tsx | ✅ PASS | 15/15 |
| RecognitionSection.uas-applicable.test.tsx | ✅ PASS | - |
| RecognitionSection.coping-abilities.test.tsx | ⏳ TDD | 0/16 (awaiting Phase 3) |

**Total**: 93 passing, 16 pending (TDD)

---

## Files Modified/Created

### New Files
| File | Status | Purpose |
|------|--------|---------|
| `hooks/use-coping-abilities.hook.ts` | ✅ Created | Fetch coping abilities from API |
| `hooks/__tests__/use-coping-abilities.hook.test.ts` | ✅ Created | Hook tests (13 tests) |
| `recognition-section/__tests__/RecognitionSection.coping-abilities.test.tsx` | ✅ Created | Integration tests (16 tests) |

### Modified Files
| File | Status | Changes |
|------|--------|---------|
| `hooks/index.ts` | ✅ Updated | Export new hook |
| `web/package.json` | ✅ Updated | Upgraded @testing-library/react to 14.3.1, removed react-hooks |
| `hooks/__tests__/use-uas-applicable.hook.test.ts` | ✅ Updated | Import from @testing-library/react |
| `hooks/__tests__/use-impact-options.hook.test.ts` | ✅ Updated | Import from @testing-library/react |
| `RecognitionSection.tsx` | ⏳ Pending | Remove hardcoded options, use hook |
| `LabelingItemCard.tsx` | ⏳ Pending | Use useUasApplicable hook |

---

## Verified Correct Behaviors (No Changes Needed)

| Feature | Status |
|---------|--------|
| UAS conditional logic | ✅ Match |
| Impact auto-select on managed | ✅ Match |
| Impact clear on management change | ✅ Match |
| Type hierarchy cascade clear | ✅ Match |
| UAS disabled state | ✅ Match |

---

## Other Identified Issues (Lower Priority)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 2 | `useUasApplicable` hook not used in LabelingItemCard | Low | Planned for Phase 4 |
| 3 | Cascading `uas_relevance` on impact change | Low | Enhancement, not bug |
| 4 | UAS impact field always disabled | Low | Intentional (matches label) |

---

## Next Steps

1. ✅ ~~Fix test import issue~~ (Upgraded to @testing-library/react v14)
2. ✅ ~~Run hook tests to verify implementation~~ (13/13 passing)
3. 🔄 Proceed to Phase 3: Update RecognitionSection (use react-master agent)
4. ⏳ Complete Phase 4: Refactor LabelingItemCard (use code-refactorer-agent)
5. ⏳ Run full test suite

---

## Agent Assignment Matrix

| Phase | Primary Agent | Support Agent | Status |
|-------|---------------|---------------|--------|
| Phase 1 (Tests) | `react-master` | `code-reviewer` | ✅ Done |
| Phase 2 (Hook) | `react-master` | `code-architecture-expert` | ✅ Done |
| Phase 3 (Component) | `react-master` | `ux-master` | 🔄 Next |
| Phase 4 (Refactor) | `code-refactorer-agent` | `code-reviewer` | ⏳ Pending |
| Phase 5 (Verify) | `code-reviewer` | - | ⏳ Pending |

---

## Reference Files

### Label Library
- `web/libs/label/src/components/ThreatModule.js:67-79`
- `web/libs/label/src/data/labHieStru.json:47-56`

### Aviation Library
- `web/libs/aviation/src/components/annotation/recognition-section/RecognitionSection.tsx`
- `web/libs/aviation/src/hooks/use-coping-abilities.hook.ts`
- `web/libs/aviation/src/api/default-api-client.ts`

### Backend
- `label_studio/aviation/management/commands/seed_aviation_types.py:239-257`
