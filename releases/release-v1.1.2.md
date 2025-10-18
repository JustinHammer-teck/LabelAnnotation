# Release v1.1.2 - Bug Fix

## Fixed

### Project Assignment Permission Error

Fixed critical bug preventing project assignment to users via django-guardian permissions.

**Issue:** `Permission matching query does not exist` error when attempting to assign users to projects through the ProjectAssignmentAPI.

**Root Cause:** Custom permissions were incorrectly defined on `ProjectProxy` model instead of parent `Project` model. Django proxy models share the same `ContentType` as their parent, causing permission lookup failures.

**Changes:**
- Moved custom permissions (`assign_project`, `assigned_to_project`) to `Project.Meta.permissions`
- Fixed permission string format in `ProjectAssignmentAPI` to use codename only for `assign_perm()`
- Fixed permission format in `ProjectUserPermissionSerializer` to use full `app_label.codename` for `has_perm()`
- Added database migration to create permissions with correct ContentType

**Impact:** Project assignment functionality now works correctly across all deployments after running migrations.
