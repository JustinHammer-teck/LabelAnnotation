# Theme Gap Analysis: Label Component vs LabelStudio App

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Gaps | 12 |
| Critical | 3 |
| Moderate | 5 |
| Minor | 4 |

**Key Finding:** Label component uses hardcoded hex values while LabelStudio uses CSS custom properties from `@humansignal/ui`. This breaks theme consistency and dark mode support.

---

## Critical Gaps

### 1. Primary Color Mismatch
| Source | Color | Value |
|--------|-------|-------|
| Label Component | Primary | `#1a5490` (dark blue) |
| LabelStudio | Primary | `--grape_500` (purple) |
| Aviation Module | Primary | `#1890ff` (Ant Design blue) |

**Impact:** Brand inconsistency across the application.

### 2. Text Color Using Brand Blue
| Source | Usage | Value |
|--------|-------|-------|
| Label Component | Primary text | `#1a5490` (blue) |
| LabelStudio | Primary text | `--color-neutral-content` (gray) |

**Impact:** Text appears blue in Label component but gray elsewhere.

### 3. No Dark Mode Support
- LabelStudio: `[data-color-scheme="dark"]` fully supported
- Label Component: **No dark mode support**

**Impact:** Label component will appear broken in dark mode.

---

## Color Mapping Table

### Primary Colors
| Label Component | LabelStudio Equivalent | Gap |
|-----------------|----------------------|-----|
| `#1a5490` | `--color-primary-content` | CRITICAL |
| `#2d6aa8` | `--color-primary-content-bold` | CRITICAL |

### Text Colors
| Label Component | LabelStudio Equivalent | Gap |
|-----------------|----------------------|-----|
| `#1a5490` (primary) | `--color-neutral-content` | CRITICAL |
| `#999` (secondary) | `--color-neutral-content-subtle` | MINOR |
| `#fff` (white) | `--color-neutral-content-inverse` | MINOR |

### Background Colors
| Label Component | LabelStudio Equivalent | Gap |
|-----------------|----------------------|-----|
| `#fff` | `--color-surface-default` | MINOR |
| `#f0f2f5` | `--surface-background` | MINOR |
| `#f0f4f8` | No equivalent | MODERATE |
| `#f9f9f9` | `--color-surface-subtle` | MINOR |

### Border Colors
| Label Component | LabelStudio Equivalent | Gap |
|-----------------|----------------------|-----|
| `#e8e8e8` | `--color-neutral-border` | MINOR |
| `#d9d9d9` | Aviation uses same value | NONE |
| `#e0e8f0` | No equivalent | MODERATE |

### Semantic Colors
| Label Component | LabelStudio Equivalent | Gap |
|-----------------|----------------------|-----|
| `orange` (threat) | `--color-warning-icon` | NONE |
| `red` (error) | `--color-negative-content` | MODERATE |
| `purple` (UAS) | `--grape_500` | NONE |
| Not defined (success) | `--color-positive-content` | MODERATE |

---

## Module Colors Comparison

### Error Module (Needs Alignment)
| Label Component | LabelStudio |
|-----------------|-------------|
| bg: `#fef4f3` | `--red_1: #FFF1F0` |
| border: `#e8c8c5` | `--red_3: #FFCCC7` |

**Very close values - should use LabelStudio variables!**

### Other Modules (Unique - Acceptable)
These module colors are unique identifiers and don't need to map to LabelStudio:
- Competency: Blue (`#e8f4fc` / `#b3d4ea`)
- Training: Green (`#f0f7ed` / `#c5ddb8`)
- Threat: Orange (`#fef6f0` / `#e8cfc0`)
- UAS: Purple (`#f7f3fc` / `#d4c8e8`)
- Result: Cyan (`#f0f7fa` / `#b8d8e8`)
- Labeling: Blue-gray (`#f5f8fc` / `#ccd9e8`)

---

## Migration Recommendations

### Immediate Actions (High Priority)
1. Replace text color `#1a5490` with `--color-neutral-content`
2. Replace border `#e8e8e8` with `--color-neutral-border`
3. Align error module with `--red_1` and `--red_3`

### Short Term
1. Create label-specific CSS variables:
```css
:root {
  --label-color-primary: #1a5490;
  --label-color-primary-secondary: #2d6aa8;
  --label-surface-content: #f0f4f8;

  /* Module colors */
  --label-module-competency-bg: #e8f4fc;
  --label-module-competency-border: #b3d4ea;
  /* ... etc */
}
```

2. Import `@humansignal/ui` color tokens

### Long Term
1. Add dark mode support with `[data-color-scheme="dark"]`
2. Align primary color with either Aviation (`#1890ff`) or Grape palette
3. Implement theme provider for dynamic switching

---

## Files Reference

| File | Purpose |
|------|---------|
| `web/libs/label/color-theme.json` | Extracted Label theme |
| `web/libs/label/theme-gap-analysis.json` | Detailed JSON analysis |
| `web/apps/labelstudio/src/themes/default/colors.scss` | Main app theme |
| `web/libs/aviation/src/assets/styles/_variables.scss` | Aviation theme |
