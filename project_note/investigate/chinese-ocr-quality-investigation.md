# Chinese OCR Quality Investigation

## Problem
Chinese character OCR results are poor quality while English works fine. Models ARE present in container at `/opt/easyocr/models/` including `zh_sim_g2.pth`.

## Root Cause Analysis

### 1. Image Binarization Degrading Chinese Characters
**Location**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:165-173, 255-263`

**Issue**: Adaptive thresholding binarization is enabled by default and likely degrading Chinese character quality.

```python
# Line 165-172 (PDF conversion)
if settings.OCR_BINARIZE and CV2_AVAILABLE:
    img_array = np.array(img)
    binary = cv2.adaptiveThreshold(
        img_array, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    img = Image.fromarray(binary)
```

**Why this hurts Chinese**:
- Adaptive thresholding works well for English documents with clear black text on white background
- Chinese characters have more complex strokes and details that get lost in binary conversion
- Default threshold parameters (11, 2) are tuned for Latin characters
- Chinese characters with varying stroke weights lose critical details

**Evidence**: `OCR_BINARIZE = get_bool_env('OCR_BINARIZE', True)` at line 76 of `label_studio/core/settings/label_studio.py`

---

### 2. Missing EasyOCR Parameters for Chinese
**Location**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:364`

**Current implementation**:
```python
results = reader.readtext(image_array)
```

**Missing critical parameters**:
- `min_size`: Default is 20, may miss smaller Chinese characters
- `text_threshold`: Default 0.7, too high for Chinese (causes rejection)
- `low_text`: Default 0.4, may miss low-confidence Chinese regions
- `contrast_ths`: Default 0.1, may need adjustment
- `adjust_contrast`: Default 0.5, could help Chinese character detection

---

### 3. No Language-Specific Confidence Handling
**Location**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:369-403`

**Issue**: Same confidence threshold applied to all characters.

```python
for bbox, text, confidence in results:
    # No filtering based on confidence
    # Chinese typically has lower confidence than English
```

Chinese characters typically get lower confidence scores than English due to:
- More complex stroke patterns
- Higher visual similarity between characters
- Model architecture optimized for Latin scripts

---

### 4. Character-Level Splitting Issues
**Location**: `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:381-403`

**Problem**: Naive character splitting by region width.

```python
if len(text) > 0:
    char_width = region_width / len(text)

    for i, char in enumerate(text):
        if char.strip():
            char_x = x_min + (i * char_width)
```

**Why this fails for Chinese**:
- Chinese characters have variable widths
- EasyOCR may return multi-character regions
- Simple division by character count is inaccurate
- No consideration for character spacing in Chinese vs English

---

## Recommended Fixes

### Priority 1: Disable Binarization for Chinese
**File**: `label_studio/core/settings/label_studio.py:76`

```python
# Change default to False or make it language-aware
OCR_BINARIZE = get_bool_env('OCR_BINARIZE', False)
```

**Alternative**: Detect language and apply binarization selectively.

---

### Priority 2: Optimize EasyOCR Parameters for Chinese
**File**: `label_studio/data_import/services.py:364`

```python
results = reader.readtext(
    image_array,
    paragraph=False,           # Better for character-level extraction
    min_size=10,               # Detect smaller Chinese characters
    text_threshold=0.5,        # Lower threshold for Chinese
    low_text=0.3,              # Detect low-confidence regions
    link_threshold=0.3,        # Better character grouping
    contrast_ths=0.05,         # More sensitive to contrast
    adjust_contrast=0.7,       # Enhance contrast for Chinese
    mag_ratio=1.5              # Magnify for better detection
)
```

---

### Priority 3: Language-Aware Confidence Filtering
**File**: `label_studio/data_import/services.py:369-403`

```python
import re

def is_chinese(char):
    return bool(re.match(r'[\u4e00-\u9fff]', char))

for bbox, text, confidence in results:
    # Lower threshold for Chinese characters
    min_confidence = 0.3 if any(is_chinese(c) for c in text) else 0.5

    if confidence < min_confidence:
        continue

    # Process text...
```

---

### Priority 4: Improve Character Splitting
**File**: `label_studio/data_import/services.py:381-403`

Options:
1. Use EasyOCR with `detail=1` to get character-level boxes (requires model support)
2. Use a separate character segmentation library for Chinese
3. Keep region-level extraction instead of splitting characters

**Recommended**: Don't split Chinese characters - save whole regions:

```python
# For Chinese text regions, save as single entity
if any(is_chinese(c) for c in text):
    characters.append({
        'character': text,  # Full text, not split
        'confidence': confidence,
        'x': norm_x_min,
        'y': norm_y_min,
        'width': norm_width,
        'height': norm_height,
        ...
    })
else:
    # English can be split character-by-character
    for i, char in enumerate(text):
        # Current splitting logic
```

---

## Quick Test Fix

**Immediate action**: Set environment variable:

```bash
export OCR_BINARIZE=False
```

Restart containers and test Chinese OCR quality. This should show immediate improvement if binarization is the primary issue.

---

## Files Requiring Changes

1. `/home/moritzzmn/projects/labelstudio/label_studio/core/settings/label_studio.py:76`
   - Change OCR_BINARIZE default to False

2. `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:364`
   - Add optimized EasyOCR parameters for Chinese

3. `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:369-403`
   - Add language-aware processing and confidence handling

4. `/home/moritzzmn/projects/labelstudio/label_studio/data_import/services.py:165-173, 255-263`
   - Make binarization language-aware or conditional

---

## Additional Considerations

### GPU Usage
**Location**: `services.py:60, 67`

```python
_easyocr_reader = easyocr.Reader(
    ['ch_sim', 'en'],
    gpu=False,  # Currently disabled
    ...
)
```

GPU acceleration could improve Chinese character recognition quality and speed. Consider enabling if GPU is available.

### Model Download
Current setup prevents model download (`download_enabled=False`). Verify that all Chinese model files are present:
- `zh_sim_g2.pth` (detection)
- `zh_sim.pth` (recognition)
- Craft models if using

### Image Resolution
**Location**: `services.py:160-161, 250-251`

```python
mat = fitz.Matrix(300/72.0, 300/72.0)  # 300 DPI
```

300 DPI should be sufficient for Chinese, but could test with higher DPI (400-600) if characters are very small.

---

## Testing Plan

1. Disable binarization: `OCR_BINARIZE=False`
2. Test Chinese character recognition quality
3. If improved, implement language-aware binarization
4. Add optimized EasyOCR parameters
5. Test confidence threshold adjustments
6. Measure improvement in Chinese character accuracy
