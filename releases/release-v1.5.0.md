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
