# Review Feature Backend Implementation Gaps

## Overview

Label Studio's frontend includes a complete annotation review workflow (accept/reject functionality), but the open-source backend lacks the API layer to support it. The database schema is fully prepared, but the business logic and endpoints are missing.

**Status:** Database ✅ | API Layer ❌ | Frontend ✅ (waiting for backend)

## Existing Backend Infrastructure

### Database Schema (Ready)

**File:** `label_studio/tasks/models.py`

The Annotation model includes:

```python
class Annotation(AnnotationMixin, models.Model):
    last_action = models.CharField(
        max_length=128,
        choices=ActionType.choices,  # Supports 'accepted', 'rejected', etc.
        default=None,
        null=True,
    )

    last_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        default=None,
        null=True,
    )
```

**Indexes:**
- `models.Index(fields=['last_action'])` - Optimized for filtering

### ActionType Enum (Ready)

**File:** `label_studio/tasks/choices.py`

```python
class ActionType(models.TextChoices):
    ACCEPTED = 'accepted', _('Accepted')
    REJECTED = 'rejected', _('Rejected')
    FIXED_AND_ACCEPTED = 'fixed_and_accepted', _('Fixed and accepted')
    DELETED_REVIEW = 'deleted_review', _('Deleted review')
    # ... other action types
```

### Data Manager Columns (Defined but Not Implemented)

**File:** `label_studio/data_manager/prepare_params.py`

```python
class Column(Enum):
    REVIEWED = 'reviewed', 'Boolean', 'Whether the tasks have been reviewed (Enterprise only)'
    REVIEWERS = 'reviewers', 'String', 'Reviewers that reviewed the task (Enterprise only)'
    REVIEWS_REJECTED = 'reviews_rejected', 'Number', 'Number of annotations rejected (Enterprise only)'
    REVIEWS_ACCEPTED = 'reviews_accepted', 'Number', 'Number of annotations accepted (Enterprise only)'
```

**Note:** Marked as "Enterprise only" - need implementation for open source.

### Placeholder Methods

**File:** `label_studio/tasks/mixins.py`

```python
class TaskMixin:
    def get_rejected_query(self):
        pass  # Empty placeholder - needs implementation
```

## Missing Backend Components

### 1. API Endpoints

**Required Endpoints:**

#### Accept Annotation
```
POST /api/annotations/{id}/accept/
```

**Request:**
```json
{
  "comment": "Looks good" // optional
}
```

**Response:**
```json
{
  "id": 123,
  "last_action": "accepted",
  "last_created_by": {
    "id": 2,
    "email": "reviewer@example.com"
  },
  "updated_at": "2025-11-01T10:30:00Z"
}
```

**Validation:**
- User must not be the annotation creator
- Annotation must be submitted (has valid pk)
- Annotation must not be skipped
- User must have review permissions

#### Reject Annotation
```
POST /api/annotations/{id}/reject/
```

**Request:**
```json
{
  "comment": "Please fix labeling errors" // optional or required based on config
}
```

**Response:**
```json
{
  "id": 123,
  "last_action": "rejected",
  "last_created_by": {
    "id": 2,
    "email": "reviewer@example.com"
  },
  "updated_at": "2025-11-01T10:30:00Z"
}
```

**Validation:** Same as accept

#### Fix and Accept Annotation
```
POST /api/annotations/{id}/fix-and-accept/
```

Used when reviewer makes changes before accepting.

**Current Workaround:**
The existing `PATCH /api/annotations/{id}/` endpoint could be used to update `last_action`, but it lacks:
- Validation logic
- Proper permission checks
- Webhook triggers
- Comment requirement enforcement

### 2. Serializer Extensions

**File:** `label_studio/tasks/serializers.py`

Add to `AnnotationSerializer`:

```python
class AnnotationSerializer(serializers.ModelSerializer):
    # ... existing fields ...

    last_action = serializers.ChoiceField(
        choices=ActionType.choices,
        required=False,
        allow_null=True
    )

    last_created_by = UserSerializer(read_only=True)

    can_be_reviewed = serializers.SerializerMethodField()

    def get_can_be_reviewed(self, obj):
        """Check if current user can review this annotation"""
        user = self.context.get('request').user
        return (
            obj.completed_by and
            obj.completed_by != user and
            not obj.was_cancelled and
            obj.pk is not None
        )
```

### 3. Business Logic & Validation

**New File:** `label_studio/tasks/review.py`

```python
from django.core.exceptions import ValidationError
from .models import Annotation
from .choices import ActionType

class AnnotationReviewService:
    """Service class for annotation review operations"""

    @staticmethod
    def validate_review_permission(annotation, user):
        """Validate user can review this annotation"""
        if not annotation.completed_by:
            raise ValidationError("Annotation must be submitted before review")

        if annotation.completed_by == user:
            raise ValidationError("Cannot review your own annotation")

        if annotation.was_cancelled:
            raise ValidationError("Cannot review skipped annotation")

        if annotation.pk is None:
            raise ValidationError("Annotation must be saved")

        return True

    @staticmethod
    def accept_annotation(annotation, reviewer, comment=None):
        """Accept an annotation"""
        AnnotationReviewService.validate_review_permission(annotation, reviewer)

        annotation.last_action = ActionType.ACCEPTED
        annotation.last_created_by = reviewer
        annotation.save(update_fields=['last_action', 'last_created_by', 'updated_at'])

        # TODO: Trigger webhook
        # TODO: Create comment if provided

        return annotation

    @staticmethod
    def reject_annotation(annotation, reviewer, comment=None):
        """Reject an annotation"""
        AnnotationReviewService.validate_review_permission(annotation, reviewer)

        # TODO: Check if comment is required (project setting)

        annotation.last_action = ActionType.REJECTED
        annotation.last_created_by = reviewer
        annotation.save(update_fields=['last_action', 'last_created_by', 'updated_at'])

        # TODO: Trigger webhook
        # TODO: Create comment if provided

        return annotation
```

### 4. ViewSet Actions

**File:** `label_studio/tasks/api.py` (extend `AnnotationAPI`)

```python
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .review import AnnotationReviewService

class AnnotationAPI(generics.RetrieveUpdateDestroyAPIView):
    # ... existing code ...

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        """Accept an annotation"""
        annotation = self.get_object()
        comment = request.data.get('comment')

        try:
            annotation = AnnotationReviewService.accept_annotation(
                annotation,
                request.user,
                comment
            )
            serializer = self.get_serializer(annotation)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Reject an annotation"""
        annotation = self.get_object()
        comment = request.data.get('comment')

        try:
            annotation = AnnotationReviewService.reject_annotation(
                annotation,
                request.user,
                comment
            )
            serializer = self.get_serializer(annotation)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
```

### 5. URL Routing

**File:** `label_studio/tasks/urls.py`

Routes should be automatically registered via `@action` decorator if using ViewSet.

If using APIView, add:
```python
path('annotations/<int:pk>/accept/', AnnotationAcceptAPI.as_view()),
path('annotations/<int:pk>/reject/', AnnotationRejectAPI.as_view()),
```

### 6. Query Methods for Filtering

**File:** `label_studio/tasks/mixins.py`

```python
class TaskMixin:
    def get_rejected_query(self):
        """Return Q object to filter rejected annotations"""
        from django.db.models import Q
        return Q(annotations__last_action=ActionType.REJECTED)

    def get_accepted_query(self):
        """Return Q object to filter accepted annotations"""
        from django.db.models import Q
        return Q(annotations__last_action=ActionType.ACCEPTED)

    def count_accepted_annotations(self):
        """Count accepted annotations for this task"""
        return self.annotations.filter(last_action=ActionType.ACCEPTED).count()

    def count_rejected_annotations(self):
        """Count rejected annotations for this task"""
        return self.annotations.filter(last_action=ActionType.REJECTED).count()
```

### 7. Webhook Integration

**File:** `label_studio/webhooks/models.py` or new review webhooks

Add webhook events:
- `ANNOTATION_ACCEPTED`
- `ANNOTATION_REJECTED`
- `ANNOTATION_FIXED_AND_ACCEPTED`

Payload should include:
```json
{
  "event": "annotation_accepted",
  "annotation": {...},
  "reviewer": {...},
  "comment": "...",
  "timestamp": "..."
}
```

### 8. Permissions

**File:** `label_studio/tasks/permissions.py`

Add permission class:
```python
class CanReviewAnnotation(BasePermission):
    """Permission to review annotations"""

    def has_object_permission(self, request, view, obj):
        # User must not be the annotation creator
        if obj.completed_by == request.user:
            return False

        # Add role-based permission checks here
        # e.g., user.has_perm('tasks.review_annotation')

        return True
```

## Frontend Integration Points

### Event Handlers Need Backend Calls

**File:** `web/libs/editor/src/stores/AppStore.js`

Current code (lines 662-706) invokes events that need backend:

```javascript
// This event needs to call POST /api/annotations/{id}/accept/
await getEnv(self).events.invoke("acceptAnnotation", self, { isDirty, entity });

// This event needs to call POST /api/annotations/{id}/reject/
await getEnv(self).events.invoke("rejectAnnotation", self, { isDirty, entity, comment });
```

### Frontend Configuration Needed

**File:** `web/libs/editor/src/stores/Annotation/Annotation.js:368-385`

Remove this check once backend is ready:
```javascript
// REMOVE THIS LINE:
getEnv(self).events.hasEvent("acceptAnnotation") &&
```

## Implementation Steps

### Phase 1: Core API (Minimum Viable)
1. Create `AnnotationReviewService` in `label_studio/tasks/review.py`
2. Add `accept` and `reject` actions to `AnnotationAPI`
3. Update `AnnotationSerializer` with review fields
4. Test API endpoints directly

**Files to modify:**
- `label_studio/tasks/review.py` (new)
- `label_studio/tasks/api.py` (extend)
- `label_studio/tasks/serializers.py` (extend)

### Phase 2: Frontend Integration
1. Register event handlers to call backend API
2. Remove LSE checks from `canBeReviewed`
3. Add "review" to default interfaces
4. Test full workflow from UI

**Files to modify:**
- `web/libs/editor/src/stores/AppStore.js`
- `web/libs/editor/src/stores/Annotation/Annotation.js`
- `web/libs/editor/src/defaultOptions.js`

### Phase 3: Query & Filtering
1. Implement `get_rejected_query()` and related methods
2. Add Data Manager column support
3. Enable filtering tasks by review status

**Files to modify:**
- `label_studio/tasks/mixins.py`
- `label_studio/data_manager/prepare_params.py`

### Phase 4: Webhooks & Permissions
1. Add webhook events for review actions
2. Implement permission classes
3. Add role-based access control

**Files to modify:**
- `label_studio/webhooks/models.py`
- `label_studio/tasks/permissions.py`

### Phase 5: Configuration
1. Add project setting for required review comments
2. Make review interface configurable per project
3. Add reviewer role assignment

**Files to modify:**
- `label_studio/projects/models.py`
- `label_studio/users/models.py`

## Testing Requirements

### Unit Tests
- `test_accept_annotation_success`
- `test_reject_annotation_success`
- `test_cannot_review_own_annotation`
- `test_cannot_review_draft_annotation`
- `test_cannot_review_skipped_annotation`
- `test_comment_required_when_configured`

### Integration Tests
- Frontend to backend workflow
- Webhook triggers
- Data Manager filtering

### API Tests
- Endpoint authentication/authorization
- Request/response validation
- Error handling

## Database Migration

**Not required** - All necessary fields already exist in the database schema.

## Configuration Options (Future)

### Project-Level Settings
```python
class Project(models.Model):
    # ... existing fields ...

    require_review_comment_on_reject = models.BooleanField(default=False)
    enable_review_workflow = models.BooleanField(default=True)
    allow_self_review = models.BooleanField(default=False)
```

### User Roles
- Add "Reviewer" role
- Assign specific users as reviewers per project

## References

### Key Backend Files
- `label_studio/tasks/models.py` - Annotation model
- `label_studio/tasks/choices.py` - ActionType enum
- `label_studio/tasks/api.py` - Annotation API
- `label_studio/tasks/serializers.py` - Annotation serializer
- `label_studio/tasks/mixins.py` - Task mixins
- `label_studio/data_manager/prepare_params.py` - Data Manager columns

### Key Frontend Files
- `web/libs/editor/src/stores/Annotation/Annotation.js:368-385` - canBeReviewed logic
- `web/libs/editor/src/stores/AppStore.js:662-706` - accept/reject handlers
- `web/libs/editor/src/components/BottomBar/Controls.tsx:75,156-182` - UI buttons
- `web/libs/editor/src/components/BottomBar/buttons.tsx:44-71` - AcceptButton component
- `web/libs/editor/src/defaultOptions.js` - Default interfaces

### Related Features
- Comments system (can be linked to reviews)
- Webhooks (should trigger on review actions)
- Data Manager (filtering by review status)
- Task queues (rejected queue)

## Estimated Effort

- **Phase 1 (Core API)**: 2-3 days
- **Phase 2 (Frontend Integration)**: 1-2 days
- **Phase 3 (Query & Filtering)**: 1 day
- **Phase 4 (Webhooks & Permissions)**: 1-2 days
- **Phase 5 (Configuration)**: 1 day
- **Testing**: 2-3 days

**Total**: 8-12 days

## Notes

- The database schema is already complete and indexed
- No migrations needed
- Backend implementation is the only blocker for this feature
- Frontend is fully ready and waiting for backend support
- LSE (Enterprise) has this feature fully implemented but closed-source
