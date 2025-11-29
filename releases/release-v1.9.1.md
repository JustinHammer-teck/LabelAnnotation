# Release v1.9.1 - Aviation Annotation Bug Fixes

## Features
- **Manual Save Button** - Added save button to annotation page header with loading state and i18n support

## Bug Fixes
- **Training Topics Not Persisting** - Removed backend auto-calculation that overwrote frontend values on save
- **Capability Fields Shared State** - Added separate `threat_capability`, `error_capability`, `uas_capability` fields (previously shared single field)
- **Task Navigation 404** - Fixed AviationTaskList using `task.id` instead of `task.task_id` for navigation

## Migration
- `0005_add_capability_fields.py` - Adds three new JSONField columns for capability separation

**Release Date**: 2025-11-29
