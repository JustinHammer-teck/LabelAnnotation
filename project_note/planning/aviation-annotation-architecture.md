# Aviation Safety Event Annotation System - Architecture Plan

## 1. System Architecture Overview

### Integration Strategy with Label Studio

The aviation annotation system will be built as a specialized module within Label Studio, leveraging its existing task management, annotation workflow, and export infrastructure while adding aviation-specific components:

```
Label Studio Core
├── Existing Infrastructure
│   ├── Task Management (reuse)
│   ├── User Authentication (reuse)
│   ├── Project Management (extend)
│   └── Export Framework (extend)
└── Aviation Module (new)
    ├── Aviation Data Models
    ├── Hierarchical Dropdown Components
    ├── Auto-calculation Engine
    └── Excel Import/Export Handlers
```

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Aviation Annotation Interface               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ - Incident Display Component                        │   │
│  │ - Hierarchical Dropdown System                      │   │
│  │ - Auto-calculation Display                          │   │
│  │ - Text Input Areas                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                    Jotai State Management                    │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST API
┌───────────────────────────┴──────────────────────────────────┐
│                    Backend (Django)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Aviation API Module                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ - Excel Upload ViewSet                              │   │
│  │ - Aviation Annotation ViewSet                       │   │
│  │ - Training Calculation Service                      │   │
│  │ - Export Generator Service                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                    Aviation Data Models                      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                    PostgreSQL Database
```

## 2. Data Models (Django Models)

### Core Aviation Models

```python
# label_studio/aviation/models.py

class AviationProject(models.Model):
    """Extension of base Project for aviation-specific features"""
    project = models.OneToOneField('projects.Project')
    threat_mapping = JSONField()  # Threat type to training topic mappings
    error_mapping = JSONField()   # Error type to training topic mappings
    uas_mapping = JSONField()     # UAS type to training topic mappings

class AviationIncident(models.Model):
    """Aviation safety incident data from Excel upload"""
    task = models.OneToOneField('tasks.Task')
    event_number = models.CharField(max_length=50)
    event_description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=200)
    airport = models.CharField(max_length=100)
    flight_phase = models.CharField(max_length=100)
    source_file = models.ForeignKey('data_import.FileUpload')

class AviationAnnotation(models.Model):
    """Aviation-specific annotation data"""
    annotation = models.OneToOneField('tasks.Annotation')

    # Basic Info
    aircraft_type = models.CharField(max_length=100)
    event_labels = JSONField()  # Array of selected labels

    # Threat Identification
    threat_type_l1 = models.CharField(max_length=100, blank=True)
    threat_type_l2 = models.CharField(max_length=100, blank=True)
    threat_type_l3 = models.CharField(max_length=200, blank=True)
    threat_management = models.CharField(max_length=50, blank=True)
    threat_outcome = models.CharField(max_length=50, blank=True)
    threat_description = models.TextField(blank=True)

    # Error Identification
    error_relevancy = models.CharField(max_length=50, blank=True)
    error_type_l1 = models.CharField(max_length=100, blank=True)
    error_type_l2 = models.CharField(max_length=100, blank=True)
    error_type_l3 = models.CharField(max_length=200, blank=True)
    error_management = models.CharField(max_length=50, blank=True)
    error_outcome = models.CharField(max_length=50, blank=True)
    error_description = models.TextField(blank=True)

    # UAS Identification
    uas_relevancy = models.CharField(max_length=50, blank=True)
    uas_type_l1 = models.CharField(max_length=100, blank=True)
    uas_type_l2 = models.CharField(max_length=100, blank=True)
    uas_type_l3 = models.CharField(max_length=200, blank=True)
    uas_management = models.CharField(max_length=50, blank=True)
    uas_description = models.TextField(blank=True)

    # Competency & Training
    competency_indicators = JSONField()  # Array of selected competencies
    likelihood = models.CharField(max_length=50, blank=True)
    severity = models.CharField(max_length=50, blank=True)
    training_benefit = models.CharField(max_length=50, blank=True)
    crm_training_topics = JSONField()  # Array of CRM topics

    # Auto-calculated fields
    threat_training_topics = JSONField()  # Auto-filled based on threat selection
    error_training_topics = JSONField()   # Auto-filled based on error selection
    uas_training_topics = JSONField()     # Auto-filled based on UAS selection

    # Manual text fields
    training_plan_ideas = models.TextField(blank=True)
    goals_to_achieve = models.TextField(blank=True)
    notes = models.TextField(blank=True)

class AviationDropdownOption(models.Model):
    """Stores all dropdown options from Excel sheets"""
    category = models.CharField(max_length=50)  # 'aircraft', 'threat', 'error', etc.
    level = models.IntegerField(default=1)  # Hierarchy level (1, 2, or 3)
    parent = models.ForeignKey('self', null=True, blank=True)
    code = models.CharField(max_length=50)
    label = models.CharField(max_length=200)
    training_topics = JSONField(null=True)  # Associated training topics
    display_order = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['category', 'level']),
            models.Index(fields=['parent', 'display_order']),
        ]
```

## 3. Backend Components

### API ViewSets and Serializers

```python
# label_studio/aviation/api.py

class AviationExcelUploadViewSet(viewsets.ViewSet):
    """Handle Excel file upload and task creation"""
    - upload(): Parse Excel, create incidents and tasks
    - validate_excel(): Check Excel format compliance
    - create_tasks_batch(): Bulk create tasks from rows

class AviationAnnotationViewSet(viewsets.ModelViewSet):
    """Aviation annotation CRUD operations"""
    - create(): Create annotation with auto-calculations
    - update(): Update with validation and auto-calculations
    - partial_update(): Support auto-save functionality
    - calculate_training_topics(): Auto-fill logic

class AviationDropdownViewSet(viewsets.ReadOnlyModelViewSet):
    """Provide dropdown options to frontend"""
    - list(): Get options by category and level
    - get_hierarchy(): Return full hierarchy tree
    - search(): Fuzzy search across options

class AviationExportViewSet(viewsets.ViewSet):
    """Generate Excel exports"""
    - export(): Generate annotated Excel file
    - export_template(): Generate empty template
```

### Services

```python
# label_studio/aviation/services.py

class ExcelParserService:
    """Parse aviation incident Excel files"""
    - parse_incidents(): Extract incident data
    - parse_dropdown_options(): Load reference sheets
    - validate_structure(): Check required columns

class TrainingCalculationService:
    """Auto-calculate training topics"""
    - calculate_threat_training(): Map threat to training
    - calculate_error_training(): Map error to training
    - calculate_uas_training(): Map UAS to training
    - apply_calculation_rules(): Apply business logic

class ExcelExportService:
    """Generate Excel exports"""
    - export_annotations(): Create annotated Excel
    - format_hierarchical_data(): Format nested selections
    - apply_excel_styling(): Apply formatting
```

## 4. Frontend Components

### Component Structure

```
web/apps/labelstudio/src/pages/Aviation/
├── AviationAnnotationPage/
│   ├── AviationAnnotationPage.tsx
│   ├── components/
│   │   ├── IncidentDisplay/
│   │   │   └── IncidentDisplay.tsx
│   │   ├── HierarchicalDropdown/
│   │   │   ├── HierarchicalDropdown.tsx
│   │   │   ├── TreeSelector.tsx
│   │   │   └── SearchableTree.tsx
│   │   ├── AnnotationSection/
│   │   │   ├── ThreatSection.tsx
│   │   │   ├── ErrorSection.tsx
│   │   │   ├── UASSection.tsx
│   │   │   └── CompetencySection.tsx
│   │   └── TrainingDisplay/
│   │       └── AutoCalculatedTopics.tsx
│   └── stores/
│       └── aviationStore.ts
├── AviationUploadPage/
│   ├── AviationUploadPage.tsx
│   └── ExcelUploader.tsx
└── AviationExportPage/
    └── ExportManager.tsx
```

### State Management (Jotai Atoms)

```typescript
// aviationStore.ts

// Current incident data
export const currentIncidentAtom = atom<AviationIncident | null>(null)

// Annotation data with auto-save
export const annotationDataAtom = atom<AviationAnnotation>({})
export const annotationDirtyAtom = atom(false)

// Dropdown options cache
export const dropdownOptionsAtom = atom<DropdownOptions>({})

// Hierarchical selection state
export const threatSelectionAtom = atom<HierarchicalSelection>({})
export const errorSelectionAtom = atom<HierarchicalSelection>({})
export const uasSelectionAtom = atom<HierarchicalSelection>({})

// Auto-calculated training topics
export const calculatedTrainingAtom = atom((get) => {
  const threat = get(threatSelectionAtom)
  const error = get(errorSelectionAtom)
  const uas = get(uasSelectionAtom)
  return calculateTrainingTopics(threat, error, uas)
})
```

## 5. Auto-Calculation Logic

### Training Topic Mapping Engine

```typescript
// services/trainingCalculator.ts

class TrainingCalculator {
  private threatMappings: Map<string, string[]>
  private errorMappings: Map<string, string[]>
  private uasMappings: Map<string, string[]>

  calculateFromSelection(
    category: 'threat' | 'error' | 'uas',
    level3Selection: string
  ): string[] {
    // Lookup mapping table
    // Return associated training topics
    // Handle edge cases and defaults
  }

  aggregateAllTraining(
    threatTopics: string[],
    errorTopics: string[],
    uasTopics: string[]
  ): AggregatedTraining {
    // Combine and deduplicate
    // Categorize by priority
    // Return structured result
  }
}
```

## 6. Excel Integration

### Upload Processing Pipeline

```
Excel Upload → Validation → Parse Rows → Create Tasks → Initialize Annotations
     │             │            │            │                │
     ▼             ▼            ▼            ▼                ▼
FileUpload    Check Format  Extract Data  Task.objects  AviationIncident
  Model        & Columns     & Options    .bulk_create    .bulk_create
```

### Export Generation Pipeline

```
Query Annotations → Join with Incidents → Format Data → Generate Excel → Download
        │                  │                   │              │             │
        ▼                  ▼                   ▼              ▼             ▼
AviationAnnotation  AviationIncident   Hierarchical    openpyxl      Response
    .filter()         .select_related()  Formatting     Workbook      FileResponse
```

## 7. Task Management Integration

### Task Creation from Excel

```python
class AviationTaskCreator:
    def create_tasks_from_excel(self, file_upload, project):
        # Parse Excel file
        # Create Task instances with aviation data
        # Set task status and locks
        # Initialize empty annotations
```

### Task Locking Mechanism

```python
class TaskLockManager:
    def acquire_lock(self, task_id, user_id):
        # Redis-based distributed lock
        # Timeout after inactivity
        # Prevent concurrent editing

    def release_lock(self, task_id, user_id):
        # Release on save or timeout
        # Notify other users
```

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- **Backend Models**: Create aviation data models
- **Excel Parser**: Basic Excel upload and parsing
- **API Endpoints**: CRUD operations for aviation data
- **Database Schema**: Migrations and indexes

### Phase 2: Core Annotation UI (Week 2-3)
- **Incident Display**: Show uploaded incident data
- **Basic Dropdowns**: Single-level selection components
- **Text Fields**: Manual input areas
- **Auto-save**: Implement partial save functionality

### Phase 3: Hierarchical Components (Week 3-4)
- **Tree Selector**: 3-level hierarchical dropdown
- **Search Function**: Fuzzy search in dropdowns
- **Parent-Child Logic**: Level dependencies
- **Bulk Selection**: Multi-select components

### Phase 4: Auto-Calculation (Week 4-5)
- **Mapping Tables**: Load training mappings
- **Calculation Engine**: Implement auto-fill logic
- **Real-time Updates**: React to selection changes
- **Validation Rules**: Required field checks

### Phase 5: Export & Polish (Week 5-6)
- **Excel Export**: Generate formatted Excel
- **Task Management**: Locking and status tracking
- **Performance**: Optimize queries and caching
- **Testing**: Unit and integration tests

### Phase 6: Integration & Deployment (Week 6-7)
- **Label Studio Integration**: Menu items and navigation
- **User Permissions**: Access control
- **Documentation**: User guide and API docs
- **Production Deployment**: Docker and configs

## 9. Technical Considerations

### Performance Optimizations
- **Caching**: Redis cache for dropdown options
- **Pagination**: Large Excel file handling
- **Batch Operations**: Bulk task creation
- **Lazy Loading**: Load hierarchies on demand

### Data Integrity
- **Transaction Management**: Atomic operations for task creation
- **Validation**: Schema validation for Excel uploads
- **Audit Trail**: Track all annotation changes
- **Backup Strategy**: Regular export snapshots

### Scalability
- **Horizontal Scaling**: Stateless API design
- **Queue System**: Async Excel processing with RQ
- **Database Indexing**: Optimize query performance
- **CDN**: Static asset delivery

### Security
- **Input Validation**: Sanitize Excel data
- **Access Control**: Project-level permissions
- **File Upload**: Size and type restrictions
- **SQL Injection**: Parameterized queries

## 10. Dependencies and Risks

### External Dependencies
- **openpyxl**: Excel file processing
- **pandas**: Data manipulation (optional)
- **redis**: Task locking and caching
- **PostgreSQL**: JSON field support

### Potential Risks
- **Excel Format Changes**: Need flexible parser
- **Large Files**: Memory management for big Excel files
- **Complex Hierarchies**: UI complexity for deep trees
- **Auto-calculation Accuracy**: Mapping table maintenance

### Mitigation Strategies
- **Format Validation**: Strict Excel template
- **Streaming Parser**: Process large files in chunks
- **Progressive Enhancement**: Start with simple UI
- **Admin Interface**: Manage mapping tables

## Summary

This architecture leverages Label Studio's existing infrastructure while adding aviation-specific components. The modular design allows for incremental development and testing. Key innovations include the hierarchical dropdown system, auto-calculation engine, and Excel integration pipeline. The implementation follows Django/React best practices and maintains compatibility with Label Studio's extension patterns.