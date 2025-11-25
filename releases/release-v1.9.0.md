# Release v1.9.0 - Aviation Safety Annotation System

## New Feature: Aviation Safety Event Annotation

**Frontend Implementation**

Added comprehensive aviation safety event annotation interface with Excel-like table layout for annotating aviation incidents and near-miss events.

### Key Features

**1. Table-Based Data Entry**
- Basic information table (Date, Aircraft Type, Location, Event Labels, Flight Phase, Notes)
- Results assessment grid (Likelihood, Severity, Training Effect, Training Plan, Goals)
- Three recognition sections: Threat, Error, and UAS identification

**2. Training Analysis**
- CRM training topics selection (9 categories: KNO, PRO, FPA, FPM, COM, LTW, SAW, WLM, PSD)
- Automated training topics aggregation by category (Threat/Error/UAS related)
- Competency indicators tracking

**3. Hierarchical Data Selection**
- Multi-level dropdown selectors for threat, error, and UAS types
- Support for 3-level hierarchical categorization
- Relevancy assessment with management and outcome tracking

**4. Internationalization**
- English-first interface with i18n support
- Full Chinese translation available
- 60+ translation keys for aviation domain

**5. Mock Mode**
- Feature flag for frontend development without backend
- Sample data with complete dropdown options
- Toggle via browser console: `window.aviationMock.enable()`

**6. State Management**
- Jotai atoms for reactive state management
- Auto-save with 2-second debounce
- AbortController for race condition prevention
- React Query for API caching

### Technical Implementation

**Components Created (40+ files)**
- `BasicInfoTable` - Top section data entry
- `ResultsTable` - Assessment grid
- `RecognitionSection` - Threat/Error/UAS recognition (reusable)
- `TrainingTopicsPanel` - Training topics aggregation
- `CRMTopicsRow` - CRM topic selection
- `IncidentDisplayPanel` - Event overview

**State Management**
- Central Jotai store with derived atoms
- Atomic updates with type-safe constraints
- Optimistic UI updates with rollback

**API Integration**
- 15 new endpoints in `ApiConfig.js`
- Standard `useAPI()` pattern integration
- React Query for caching and data synchronization

**Routing**
- New `/aviation` route
- Added to sidebar navigation menu
- Support for task-specific URLs: `/aviation/:taskId`

### Access

Navigate to **Aviation Safety** from the sidebar menu or visit `/aviation` directly.

### Dependencies

- i18next, react-i18next (already installed)
- Jotai atoms, React Query (already installed)
- No new dependencies added

---

## Backend Implementation

**Django REST API with Auto-calculation Engine**

### Core Features

**1. Database Models**
- `AviationAnnotation` - Stores annotation data with 40+ fields
- `AviationDropdownOption` - Hierarchical dropdown options (3-level)
- Custom managers with organization-level data isolation
- Query optimization with select_related/prefetch_related

**2. REST API Endpoints**
- Annotation CRUD operations (list, create, retrieve, update, delete)
- Dropdown options API with hierarchy support
- Query parameters for filtering and pagination
- Organization-scoped queries for data security

**3. Auto-calculation Service**
- Training topics auto-calculated from threat/error/UAS selections
- Signal-based updates on annotation changes
- Recursive prevention with update field detection
- Database-level updates to avoid signal loops

**4. Signal Handlers**
- `aviation_annotation_post_save` - Triggers training topic calculation
- Field-specific trigger detection (threat_type_l3, error_type_l3, uas_type_l3)
- Raw save bypass for fixture loading
- Transaction-safe updates

### Technical Implementation

**API Views (8 endpoints)**
- `AviationAnnotationListAPI` - List and create annotations
- `AviationAnnotationDetailAPI` - Retrieve, update, delete
- `AviationDropdownListAPI` - Get dropdown options
- `AviationDropdownHierarchyAPI` - Get hierarchical trees

**Serializers**
- `AviationAnnotationSerializer` - FlexFieldsModelSerializer with validation
- `AviationDropdownOptionSerializer` - Hierarchical data serialization
- Read-only auto-calculated fields (threat/error/uas_training_topics)

**Services**
- `TrainingCalculationService` - Auto-calculate training topics from selections
- Mapping-based topic resolution
- Batch updates for performance

**URL Routing**
- `/api/aviation/annotations/` - Annotation operations
- `/api/aviation/dropdowns/` - Dropdown data access
- ViewClassPermission with granular permissions

### Testing

**Test Coverage (130 tests)**
- `test_models.py` - Model validation and relationships
- `test_serializers.py` - Serialization and validation logic
- `test_api.py` - API endpoint testing
- `test_managers.py` - Custom manager methods
- `test_signals.py` - Signal handler behavior

**Integration Testing**
- Organization-level data isolation
- Auto-calculation workflow
- Signal trigger conditions
- Query optimization verification

---

## Bug Fixes

**Django App Configuration**
- Fixed signal registration by using full AppConfig path in INSTALLED_APPS
- Changed from `'aviation'` to `'aviation.apps.AviationConfig'` for Django 3.2+ compatibility
- Removed deprecated `default_app_config` from `__init__.py`
- Fixed `test_signal_connected` to properly detect receiver registration

---

**Release Date**: 2025-11-25
**Feature Type**: New Module
**Breaking Changes**: None