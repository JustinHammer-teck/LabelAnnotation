# Release v1.3.0

## Notification System Enhancements

### New Features

#### REST API for Notification History

Implemented REST API endpoints for querying and managing user notifications, enabling persistent notification storage and retrieval.

**API Endpoints:**
- `GET /api/notifications/` - List user notifications with optional `?unread=true` filter
- `PATCH /api/notifications/<id>/` - Mark notification as read

**Implementation:**
- Created `NotificationSerializer` with parsed content fields (subject, message, path, action_type)
- Added `NotificationListView` and `MarkNotificationAsReadView` API views
- User-scoped notifications filtered by channel prefix
- Integrated with existing SSE real-time delivery

#### Enhanced Project Assignment Notifications

Project assignment and revocation notifications now include contextual URLs and automatic navigation.

**Assignment Behavior:**
- Notifications include project title and clickable URL (`/projects/{id}/`)
- Clicking notification navigates user directly to assigned project
- Notifications persist in database with metadata

**Revocation Behavior:**
- Real-time detection when user loses project access
- Automatic redirect to home page if currently viewing revoked project
- Path-based comparison prevents unnecessary redirects

**Backend Changes:**
- Updated `NotificationService.send_notification()` with optional `path`, `action_type`, and `source` parameters
- Modified `ProjectAssignmentAPI` to pass project URL and action type
- Notification content includes structured metadata (path, action_type)
- Source field populated as `project:{id}` for tracking

**Frontend Changes:**
- Parse `path` and `action_type` from notification data
- SSE handler checks current URL against revoked project path
- Immediate redirect on revoke if path matches
- Historical notifications loaded with full metadata

#### Visual Notification Indicators

Added visual styling to distinguish unread notifications in the notification dropdown.

**Styling:**
- Unread: Light blue background, blue left border, blue dot indicator
- Read: Default white background, gray text
- Clear visual hierarchy for notification status

### Bug Fixes

#### Dashboard Pie Chart Sizing

Fixed pie chart resizing issue where chart would display oversized on page load and resize on hover.

**Resolution:**
- Set `maintainAspectRatio: false` in Chart.js options
- Chart now respects container height consistently
- Legend positioned to right for better space utilization

### Technical Details

**Database:**
- Notification model's `source` field now populated
- Content stored as JSON with extended fields (path, action_type)
- Indexed queries on `channel` and `is_read` fields

**Real-time Integration:**
- SSE notifications include path and action_type in context
- Backward compatible with existing notification consumers
- Duplicate notification prevention by ID

### Impact

- Users can review historical notifications after page refresh
- Project assignment workflows provide clear navigation
- Reduced confusion when permissions are revoked
- Improved user experience with visual notification status
- Enhanced notification traceability with source tracking
