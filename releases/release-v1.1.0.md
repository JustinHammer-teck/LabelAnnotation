# Release v1.1.0

## OCR Integration and TextArea Control Enhancement

### New Features

#### OCR Character Overlay System
- Implemented OCR character detection and visualization overlay
- Added clickable OCR characters that automatically create rectangle annotations
- Integrated OCR word detection utilities for spatial text analysis
- Added OCR data processing pipeline for character-to-word conversion

#### Enhanced Rectangle Tool with OCR Support
- Added OCR word boundary snapping for precise text selection
- Implemented smart rectangle adjustment based on detected word boundaries
- Added configurable snap thresholds and sensitivity controls
- Integrated OCR overlay visibility toggle (Ctrl+Shift+O)

### Bug Fix

Fixed issue where OCR-extracted text was being populated into incorrect TextArea controls when multiple labels and TextAreas were present in annotation configurations.

#### Root Cause
- TextArea selection logic did not properly match controls to their associated labels
- Missing validation for perRegion TextArea visibility context
- Inadequate filtering based on `toName` and `whenLabelValue` attributes

#### Solution
- Enhanced TextArea control selection in OCROverlay to match `toName` attributes
- Added label-specific TextArea matching using `whenLabelValue` configuration
- Implemented validation in TextArea.addText() to prevent text insertion when control is not visible for current region
- Added debug logging to track TextArea selection process

#### Files Modified
- `web/libs/editor/src/components/ImageView/OCROverlay.jsx`
- `web/libs/editor/src/tags/control/TextArea/TextArea.jsx`

### Impact
- OCR text now correctly populates into TextAreas associated with selected labels
- Prevents cross-contamination between different label contexts
- Maintains existing functionality for single TextArea configurations