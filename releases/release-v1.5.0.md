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
