# Release v1.3.1

## Bug Fixes

### Notification Read Status Not Updating on Click

Fixed notification not being marked as read when clicked due to premature page redirect.

**Issue:**
- Clicking notification would redirect before PATCH request completed
- Database status remained unread despite UI update
- Navigation canceled pending API call

**Resolution:**
- Made `handleNotificationClick` async with await
- Page navigation now waits for API response
- Ensures database update completes before redirect

**Impact:**
- Notifications correctly marked as read in database
- Read status persists across page refreshes
- Prevents duplicate unread notifications

### Project Access Control Bypass After Permission Revoke

Fixed security issue where users could still access projects after assignment revocation.

**Issue:**
- Revoked users retained access to project detail pages
- `ProjectAPIProxy.get_queryset()` only filtered by organization
- Object-level permissions not enforced on project retrieval
- Permission revocation did not prevent direct project access

**Resolution:**
- Updated `ProjectAPIProxy.get_queryset()` to use `get_objects_for_user()`
- Filters projects by `assigned_to_project` permission
- Returns 404 for projects where user lacks permission
- Matches permission pattern used in `ProjectListApiProxy`

**Impact:**
- Revoked users receive 404 when accessing removed projects
- Enforces object-level permissions consistently
- Prevents unauthorized access to project data
- Improves security and access control integrity

## Enhancement

### Dashboard Theme Integration

Fixed dashboard colors to use Label Studio theme system instead of hardcoded values.

**Issue:**
- Dashboard used hardcoded color values instead of theme variables
- chroma.js color format error with modern CSS RGB syntax
- Dashboard colors did not adapt to theme changes

**Resolution:**
- Refactored to use CSS variables from `@humansignal/ui/src/tokens`
- Utilized `-raw` CSS variables for chroma.js compatibility
- Mapped all chart and status colors to theme system

**Impact:**
- Dashboard charts and metrics properly adapt to theme changes
- Support for dark mode when enabled
- Consistent color scheme across Label Studio UI

### Dashboard Analytics Permission Filtering

Enhanced dashboard analytics to respect user-level project permissions.

**Issue:**
- Dashboard analytics displayed data from all organization projects
- Users could see statistics for projects they don't have access to
- Annotation counts and project metrics exposed unauthorized information
- No permission-based filtering on analytics endpoint

**Resolution:**
- Updated `ProjectDashboardAnalyticsAPI` to use `get_objects_for_user()`
- Filter projects by `assigned_to_project` permission
- Scope annotation statistics to user's accessible projects only
- Extract project IDs and filter daily stats accordingly

**Impact:**
- Dashboard displays only data from projects user can access
- Prevents information leakage about restricted projects
- Accurate analytics scoped to user permissions
- Consistent permission enforcement across all project endpoints
