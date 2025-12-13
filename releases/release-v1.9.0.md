# Release v1.9.0 - Aviation Safety Annotation System

## Overview

New module for annotating aviation safety incidents with Excel-like interface, hierarchical categorization, and automated training topic calculation.

## Frontend

### Pages
- **AviationProjectList** - Project management with create/edit/delete
- **AviationTaskList** - Task filtering, pagination, and Excel batch import
- **AviationAnnotationPage** - Main annotation interface with table layout

### Components
- **BasicInfoTable** - Date, aircraft type, location, event labels, flight phase
- **ResultsTable** - Likelihood, severity, training effect assessment
- **RecognitionSection** - Threat/Error/UAS identification with 3-level hierarchy
- **MultiSelectDropdown** - Hierarchical selection with search and grouping
- **CRMTopicsRow** - 9 CRM training categories (KNO, PRO, FPA, FPM, COM, LTW, SAW, WLM, PSD)
- **TrainingTopicsPanel** - Auto-aggregated training recommendations
- **ExcelUploadModal** - Batch incident import with validation

### State & API
- Jotai atoms with auto-save (2s debounce)
- 15 API endpoints configured
- i18n support (English/Chinese)

## Backend

### Models
- `AviationProject` - Project container with organization scope
- `AviationAnnotation` - 40+ fields for incident data
- `AviationIncident` - Source incident records
- `AviationDropdownOption` - 3-level hierarchical options

### API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/aviation/annotations/` | List/create annotations |
| `GET/PUT/DELETE /api/aviation/annotations/{id}/` | Annotation CRUD |
| `GET /api/aviation/dropdowns/` | Dropdown options (supports `?grouped=true`) |
| `GET /api/aviation/dropdowns/hierarchy/` | Hierarchical tree structure |
| `GET /api/aviation/export/` | Export annotations to Excel |
| `GET /api/aviation/export/template/` | Download import template |
| `POST /api/aviation/incidents/validate/` | Validate Excel before import |

### Services
- **TrainingCalculationService** - Auto-calculate training topics from threat/error/UAS selections
- **ExcelParserService** - Parse and validate Excel imports (50MB limit, duplicate detection)
- **ExcelExportService** - Generate styled Excel exports with 37 columns
- **SchemaService** - Dynamic dropdown schema loading

### Management Commands
```bash
python manage.py load_aviation_defaults  # Seed dropdown options
python manage.py load_aviation_schema    # Load from schema file
python manage.py clear_aviation_data     # Clear all aviation data
```

## Security
- Organization-level data isolation
- Path traversal protection on exports
- Zip bomb detection on imports
- File size validation (50MB compressed, 200MB uncompressed)

## Breaking Changes
None

**Release Date**: 2025-11-29
