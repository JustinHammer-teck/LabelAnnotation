# OCR Chinese Character Extraction Feature - Planning Document

## Overview

This document outlines the planning breakdown for implementing an OCR Chinese character extraction feature in Label Studio. The feature will automatically extract Chinese characters from uploaded images and provide an interactive interface for users to select characters and build text annotations.

## Feature Requirements

### Core Requirements
1. **Automatic Character Extraction**: Extract Chinese characters from OCR documents upon import
2. **Bounding Box Storage**: Store character coordinates with confidence scores
3. **Interactive Selection Interface**: Clickable character overlay for annotation building
4. **TextArea Integration**: Auto-populate text controls with selected characters
5. **Non-Invasive Architecture**: Use proxy patterns to avoid core code modifications

### Technical Constraints
- Focus exclusively on Chinese character extraction
- Maintain compatibility with existing annotation workflow
- Use extensible architecture (proxy classes, inheritance)
- No modifications to core Label Studio models or components

## Architecture Overview

### System Components

#### Backend Architecture
```
Task (existing) 
    ↓ (proxy relationship)
OCRTaskProxy
    ↓ (foreign key)
OCRCharacterExtraction (new model)
    ↓ (processes via)
ChineseOCRService (composite)
    ↓ (delegates to)
ImageOCRProcessor | PDFOCRProcessor (concrete implementations)
    ↓ (exposes through)
Extended Task API
```

#### Frontend Architecture
```
Image Component (existing)
    ↓ (overlays)
CharacterLayer (new component)
    ↓ (integrates with)
TextArea Controls (existing)
```

### Data Flow
1. **File Upload** → Signal Handler → File Type Detection → Background OCR Job
2. **OCR Processing** → Processor Selection (Image/PDF) → Character Extraction → Database Storage
3. **Frontend Load** → API Request → Character Layer Display
4. **User Interaction** → Character Selection → TextArea Population

## Task Breakdown

### Phase 1: Backend Foundation

#### Task 1.1: Database Schema Design
**Objective**: Create data models for character extraction storage
**Components**:
- `OCRCharacterExtraction` model design
- `OCRTaskProxy` model design
- Database migration creation
- Model relationships and indexes

**Dependencies**: None
**Estimated Effort**: 1-2 days

#### Task 1.2: OCR Service Implementation
**Objective**: Implement Chinese character extraction service with file type abstraction
**Components**:
- `ChineseOCRService` composite class design
- `ImageOCRProcessor` concrete implementation for image files
- `PDFOCRProcessor` concrete implementation for PDF files
- OCR library integration (PaddleOCR/EasyOCR)
- File type detection and processor selection logic
- Image processing and coordinate normalization
- Character detection and confidence scoring

**Dependencies**: Task 1.1 (database models)
**Estimated Effort**: 3-4 days

#### Task 1.3: API Endpoint Extensions
**Objective**: Extend Task API with OCR functionality
**Components**:
- Character extraction trigger endpoint
- Character data retrieval endpoint
- API serializers and responses
- Error handling and validation

**Dependencies**: Task 1.1, Task 1.2
**Estimated Effort**: 1-2 days

#### Task 1.4: File Import Integration
**Objective**: Auto-trigger OCR extraction on file upload with file type detection
**Components**:
- Django signal handler implementation
- File type detection logic (PDF vs Image)
- Background job processing setup with processor selection
- Supported file format validation (PDF, JPG, PNG, TIFF, etc.)
- Error handling and retry logic

**Dependencies**: Task 1.2, Task 1.3
**Estimated Effort**: 1-2 days

### Phase 2: Frontend Implementation

#### Task 2.1: Character Layer Component
**Objective**: Create interactive character overlay component
**Components**:
- React component with TypeScript interfaces
- Character positioning and scaling logic
- Visual styling for character boxes
- Loading states and error handling

**Dependencies**: Task 1.3 (API endpoints)
**Estimated Effort**: 2-3 days

#### Task 2.2: Image Component Integration
**Objective**: Integrate character layer with existing Image component
**Components**:
- Character layer toggle functionality
- Overlay positioning and responsive scaling
- Z-index management for proper layering
- Component lifecycle integration

**Dependencies**: Task 2.1
**Estimated Effort**: 1-2 days

#### Task 2.3: Character Selection Logic
**Objective**: Implement character click selection and text building
**Components**:
- Click event handling for characters
- Multi-character selection state management
- Selected character visual feedback
- Text string building from selection order

**Dependencies**: Task 2.1, Task 2.2
**Estimated Effort**: 1-2 days

#### Task 2.4: TextArea Auto-population
**Objective**: Auto-fill TextArea controls with selected text
**Components**:
- TextArea component integration
- Selected text to annotation mapping
- Region association logic
- Text update and validation

**Dependencies**: Task 2.3
**Estimated Effort**: 1 day

### Phase 3: Integration & Testing

#### Task 3.1: End-to-End Workflow Testing
**Objective**: Validate complete feature workflow
**Components**:
- File upload to character extraction testing
- Frontend character selection testing
- TextArea population validation
- Cross-browser compatibility testing

**Dependencies**: All previous tasks
**Estimated Effort**: 2 days

#### Task 3.2: Performance Optimization
**Objective**: Optimize for large images and many characters
**Components**:
- OCR processing performance tuning
- Frontend rendering optimization
- Memory usage optimization
- Database query optimization

**Dependencies**: Task 3.1
**Estimated Effort**: 1-2 days

#### Task 3.3: Error Handling & Edge Cases
**Objective**: Handle error scenarios and edge cases
**Components**:
- OCR processing failure handling
- Network error handling in frontend
- Invalid image format handling
- Empty extraction result handling

**Dependencies**: Task 3.1, Task 3.2
**Estimated Effort**: 1 day

## Technical Specifications

### Database Design Concepts
- **OCRCharacterExtraction Table**: character, confidence, normalized coordinates, image dimensions, page_number (for PDFs)
- **Indexes**: task_id + confidence, character lookup, page_number
- **Relationships**: Foreign key to Task model

### OCR Service Design Concepts
- **ChineseOCRService (Composite)**: Main service class that delegates to specific processors
- **BaseOCRProcessor (Abstract)**: Interface defining common OCR operations
- **ImageOCRProcessor (Concrete)**: Handles image files (JPG, PNG, TIFF, etc.)
- **PDFOCRProcessor (Concrete)**: Handles PDF files with page-by-page processing
- **ProcessorFactory**: Factory method to create appropriate processor based on file type

### File Type Handling Strategy
- **Supported Image Formats**: JPG, JPEG, PNG, TIFF, BMP, WebP
- **PDF Processing**: Convert PDF pages to images, then apply OCR to each page
- **Multi-page Support**: Store page number for PDF-extracted characters
- **Coordinate Normalization**: Per-page normalization for PDFs, single normalization for images

### API Design Concepts
- **GET /api/tasks/{id}/ocr_characters/**: Retrieve extracted characters (with optional page filter)
- **POST /api/tasks/{id}/extract_ocr_characters/**: Trigger extraction with file type detection
- **Response Format**: JSON with character data, bounding boxes, and page information

### Frontend Component Concepts
- **CharacterLayer**: Overlay component with absolute positioning
- **Page Navigation**: Controls for multi-page PDF navigation (when applicable)
- **Character Boxes**: Clickable divs with hover and selection states
- **Toggle Control**: Button to show/hide character layer
- **State Management**: Local state for character selection and page navigation

### Integration Points
- **Django Signals**: Post-save signal on Task creation with file type detection
- **Background Jobs**: Redis/RQ for OCR processing with processor selection
- **Storage Resolution**: Use existing task.resolve_uri() method for both PDF and image files
- **Component Overlay**: CSS z-index and pointer-events management

## Dependencies & Requirements

### External Dependencies
- **OCR Library**: PaddleOCR (recommended for Chinese) or EasyOCR
- **Image Processing**: PIL (Pillow), OpenCV (optional)
- **PDF Processing**: PyMuPDF (fitz) or pdf2image for PDF to image conversion
- **Background Jobs**: Redis + RQ (already available)

### System Requirements
- **Python**: >=3.10 (existing requirement)
- **Node/Yarn**: Existing frontend build system
- **Database**: PostgreSQL/SQLite (existing setup)

## Risk Assessment

### Technical Risks
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| OCR accuracy for Chinese characters | Medium | Use high-quality OCR models, allow manual correction |
| Performance with large images | High | Implement background processing, image resizing |
| Memory usage during extraction | Medium | Process images in chunks, cleanup after extraction |

### Integration Risks
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Frontend layer z-index conflicts | Low | Proper CSS management, testing |
| Database migration on large datasets | Medium | Test migrations, provide rollback scripts |
| Background job queue overload | Medium | Job prioritization, queue monitoring |

### Implementation Risks
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Complex React state management | Medium | Use established patterns, thorough testing |
| API endpoint conflicts | Low | Use action decorators, avoid endpoint replacement |
| Character selection UX complexity | Medium | Iterative design, user testing |

## Success Criteria

### Functional Requirements
- [ ] Extract Chinese characters from uploaded OCR images
- [ ] Store character data with bounding boxes and confidence scores
- [ ] Display interactive character overlay in annotation interface
- [ ] Enable character selection and text building
- [ ] Auto-populate TextArea annotations with selected text
- [ ] Maintain full compatibility with existing annotation workflow

### Performance Requirements
- [ ] Character extraction completes within 30 seconds for typical documents
- [ ] Character layer renders with <500ms response time
- [ ] Support images up to 10MB without memory issues
- [ ] Handle 100+ characters per image efficiently

### Quality Requirements
- [ ] No conflicts with existing Label Studio functionality
- [ ] Proper error handling and user feedback
- [ ] Mobile-responsive character selection interface
- [ ] Accessibility compliance for character interaction

## Implementation Strategy

### Development Approach
1. **Incremental Development**: Implement one task at a time
2. **Testing Integration**: Test each component as it's developed
3. **User Validation**: Get feedback on UI/UX during development
4. **Performance Monitoring**: Track performance metrics throughout

### Deployment Strategy
1. **Feature Flag**: Optional deployment behind feature flag
2. **Gradual Rollout**: Test with small user groups first
3. **Monitoring**: Track usage and performance metrics
4. **Rollback Plan**: Ability to disable feature if issues arise

## Next Steps

This planning document provides the foundation for implementing the OCR Chinese character extraction feature. The work is broken down into **11 discrete tasks** across 3 phases.

**Ready for Implementation**: Each task can be implemented individually upon approval. 

**Recommended Starting Point**: Task 1.1 (Database Schema Design) as it provides the foundation for all other components.

**Validation Required**: Please review this planning breakdown and approve before proceeding with implementation of specific tasks.