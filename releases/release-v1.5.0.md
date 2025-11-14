# Release v1.5.0

## Features

### Role-Based User Management System

Implemented hierarchical role-based access control with three roles (Manager, Researcher, Annotator) for granular permission management and role-restricted user visibility.

**Issue:**
- No role-based access control in organization member management
- All users could see all organization members regardless of permissions
- No API support for role assignment and management
- Frontend lacked role information for conditional UI rendering

**Implementation:**

**1. User Roles and Permissions**
```python
# Three-tier role hierarchy
- Manager (Rank 3): Full access to all features and users
- Researcher (Rank 2): Access to research features, limited user management
- Annotator (Rank 1): Basic annotation access only
```

**2. Role Assignment API**
```bash
POST /api/users/{user_id}/assign_role/
{
  "role": "Manager" | "Researcher" | "Annotator"
}
```

**Security Features:**
- Same organization validation (users can only assign roles within their org)
- Role hierarchy enforcement (users cannot assign roles higher than their own)
- Permission-based access control (`organizations.change` required)
- Automatic role group creation via Django migration

**3. Role-Based Filtering**
```python
# Automatic filtering in membership list API
- No role: See only users without roles
- Annotator: See Annotators + roleless users
- Researcher: See Researchers + Annotators + roleless users
- Manager: See all users (no restriction)
```

**4. Frontend Integration**
- Extended `/api/users/whoami/` endpoint with `permissions` and `role` fields
- Created reusable `useUserRole()` hook for role checking
- Added Role column to organization members list
- Implemented role-based UI visibility for Settings menu

**Technical Details:**
- Django Groups for role management (Annotator, Researcher, Manager)
- Query optimization with `.prefetch_related('user__groups')` to prevent N+1 queries
- Proxy pattern implementation to avoid modifying core API classes
- TypeScript type safety with `UserRole` union type

**Impact:**
- ✅ Hierarchical access control enforced at API level
- ✅ Managers and Researchers can assign roles to lower-ranked users
- ✅ Users only see organization members at their level or below
- ✅ Role-based UI components (Admin Panel, Settings access)
- ✅ Secure role assignment with permission validation
- ✅ Performance-optimized queries with prefetch

**Files Modified:**

**Backend:**
- `label_studio/users/serializers.py:125-166` (UserWithPermissionsSerializer, RoleAssignmentSerializer)
- `label_studio/users/api.py:157-205, 340` (assign_role endpoint, UserWhoAmIAPI)
- `label_studio/users/migrations/0011_create_role_groups.py` (role groups migration)
- `label_studio/organizations/serializers.py:32-62` (role field in member list)
- `label_studio/organizations/proxy.py:16-59` (role-based filtering)
- `label_studio/organizations/urls.py:22-31` (proxy routing)

**Frontend:**
- `web/libs/core/src/constants/permissions.ts` (permission constants)
- `web/libs/core/src/types/user.ts:20-21` (APIUser type extension)
- `web/apps/labelstudio/src/hooks/useUserRole.ts` (role checking hook)
- `web/apps/labelstudio/src/components/Menubar/Menubar.jsx:78, 266-273` (role-based menu)
- `web/apps/labelstudio/src/pages/Settings/index.jsx:28-29` (conditional settings)
- `web/apps/labelstudio/src/pages/Organization/PeoplePage/PeopleList.jsx:77-79, 101-103` (role column)
- `web/apps/labelstudio/src/pages/Organization/PeoplePage/PeopleList.scss:59-61` (role column styling)

**Migration Required:**
```bash
poetry run python label_studio/manage.py migrate users
```

### Real-Time Notification System Refactoring

Refactored Server-Sent Events (SSE) implementation to improve code organization, maintainability, and control over real-time notification streams.

**Issue:**
- SSE connection logic tightly coupled with UI component
- Hardcoded server URL (`http://localhost:8080`)
- No reconnection strategy on connection failure
- Difficult to test SSE logic independently
- No TypeScript type safety for notifications
- Cannot share SSE connection across components

**Implementation:**

**1. Separation of Concerns Architecture**
```typescript
// Three-layer architecture
useSSE (generic connection management)
    ↓
useNotificationStream (notification-specific logic)
    ↓
Jotai atoms (shared state)
    ↓
NotificationBell (UI only)
```

**2. Generic SSE Hook**
```typescript
useSSE({ url, autoConnect })
// Returns: connectionState, error, addEventListener, close
// Handles: EventSource lifecycle, error handling, cleanup
```

**3. Notification Stream Hook**
```typescript
useNotificationStream()
// Returns: notifications, unreadCount, connectionState, markAsRead
// Integrates: useSSE, API calls, atom state management
// Handles: Historical fetch, SSE events, revoke actions
```

**4. State Management with Jotai**
```typescript
// Atoms for shared state
notificationsAtom: Notification[]
notificationConnectionStateAtom: ConnectionState
unreadCountAtom: derived atom (computed)
```

**Technical Details:**
- EventSource connection management with proper cleanup
- Configurable endpoints via ApiConfig (no hardcoded URLs)
- TypeScript types for Notification, ConnectionState, ActionType
- Browser notification permission handling (unchanged)
- Automatic handling of revoke action type (redirect to home)

**Impact:**
- ✅ SSE logic separated from UI concerns
- ✅ Reusable hooks for future real-time features
- ✅ Single shared SSE connection (prevents multiple connections)
- ✅ Type-safe notification handling
- ✅ Easier to test independently
- ✅ Better error handling and connection state tracking
- ✅ Simplified NotificationBell component (UI only)

**Files Created:**
- `web/apps/labelstudio/src/utils/atoms/notificationAtoms.ts` (Jotai atoms + types)
- `web/apps/labelstudio/src/hooks/useSSE.ts` (generic SSE connection hook)
- `web/apps/labelstudio/src/hooks/useNotificationStream.ts` (notification-specific hook)

**Files Modified:**
- `web/apps/labelstudio/src/config/ApiConfig.js:3-6, 105-107` (SSE endpoint configuration)
- `web/apps/labelstudio/src/components/Notification/Notification.tsx` (refactored from .jsx, simplified to UI only)
- `web/apps/labelstudio/src/pages/Projects/ProjectsList.jsx:39-57` (fixed EmptyProjectsList syntax)

## Bug Fixes

### Task Assignment Settings Security and Performance Improvements

Enhanced Task Assignment Settings component with critical security fixes, comprehensive input validation, and performance optimizations following React best practices.

**Issues Fixed:**

**Security Vulnerabilities:**
- Users could modify their own project permissions (privilege escalation risk)
- No frontend permission validation before API calls
- Missing input validation allowed invalid API requests
- Error suppression masked failures without proper handling
- No null safety checks for ProjectContext

**Performance Issues:**
- Handler function recreated on every render causing unnecessary re-renders
- No memoization for expensive operations
- Missing React Query optimizations

**Code Quality Issues:**
- Raw API calls without React Query integration
- Inconsistent error handling
- Missing TypeScript strict validation
- Router compatibility issue with component memoization

**Implementation:**

**1. Self-Modification Prevention**
```typescript
// Before: Users could toggle themselves ON (partial protection)
const isDisabled = isToggling || (isCurrentUser && permissionUser.has_permission);

// After: Users cannot modify their own permissions at all
const isDisabled = isToggling || isCurrentUser;
```

**2. Permission-Based Access Control**
```typescript
// Frontend validation before showing interactive controls
const hasAssignPermission = user?.permissions?.some(p => p === 'projects.change_project');
const canManagePermissions = hasAssignPermission && isManagerOrResearcher;

// Show "no permission" message for unauthorized users
{!canManagePermissions ? (
  <div>You don't have permission to manage task assignments.</div>
) : (
  // Interactive table
)}
```

**3. Input Validation**
```typescript
// Query validation
if (!projectId || typeof projectId !== 'number' || projectId <= 0) {
  throw new Error('Invalid project ID');
}

// Mutation validation
if (!userId || userId <= 0) throw new Error('Invalid user ID');
if (typeof hasPermission !== 'boolean') throw new Error('Invalid permission value');
```

**4. Error Handling**
```typescript
// Removed error suppression
// Before: suppressError: true (masked failures)

// After: Proper 403 handling with user-friendly messages
if (result?.status === 403) {
  throw new Error('You do not have permission to modify user assignments');
}
```

**5. Performance Optimization**
```typescript
// Memoized handler prevents unnecessary re-renders
const handleTogglePermission = useCallback((userId: number, currentPermission: boolean) => {
  void togglePermission(userId, currentPermission);
}, [togglePermission]);
```

**Security Improvements:**
- ✅ Prevent all self-modifications (both grant and revoke)
- ✅ Frontend permission validation (projects.change_project + role check)
- ✅ Comprehensive input validation (projectId, userId, hasPermission)
- ✅ Proper 403 error handling with specific messages
- ✅ Null safety for ProjectContext
- ✅ Defense in depth (frontend + backend validation)

**Performance Improvements:**
- ✅ useCallback optimization for event handlers
- ✅ Prevents unnecessary child component re-renders
- ✅ React Query optimistic updates with rollback
- ✅ Proper query caching (30s stale time)

**UX Improvements:**
- ✅ Clear "no permission" message for unauthorized users
- ✅ Visual indicator "(You)" for current user
- ✅ Disabled toggle with descriptive aria-label
- ✅ Toast notifications for success/error feedback
- ✅ Specific error messages (validation, 403, network)

**Technical Details:**
- React Query integration for data fetching and mutations
- TypeScript strict validation with runtime checks
- Custom hook pattern (useProjectPermissions) for reusable logic
- Optimistic updates with automatic rollback on error
- Proper cleanup and error boundaries

**Files Modified:**
- `web/apps/labelstudio/src/pages/Settings/TaskAssignmentSettings/TaskAssignmentSettings.tsx` (8 security and performance fixes)
- `web/apps/labelstudio/src/pages/Settings/TaskAssignmentSettings/hooks/useProjectPermissions.ts` (input validation, error handling)

**Impact:**
- 🔒 Enhanced security: prevents privilege escalation and unauthorized access
- ⚡ Improved performance: reduced unnecessary re-renders
- 🎯 Better UX: clear feedback and error messages
- 🛡️ Defense in depth: frontend and backend validation
- ✅ Production-ready: follows React and TypeScript best practices
