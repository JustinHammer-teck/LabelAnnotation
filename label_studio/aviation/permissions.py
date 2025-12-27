"""
Aviation module permission classes.

Defines DRF permission classes for controlling access to LabelingItem
based on user role and item status.

Permission Matrix:
| Role       | Draft     | Submitted  | Reviewed   | Approved   |
|------------|-----------|------------|------------|------------|
| Annotator  | Edit/Del  | Read-only  | Edit only  | Read-only  |
| Manager    | Read-only | Read-only  | Read-only  | Read-only  |
| Researcher | Read-only | Read-only  | Read-only  | Read-only  |
| Admin      | Full      | Full       | Full       | Full       |
"""
import logging

from rest_framework import permissions

logger = logging.getLogger(__name__)


# Valid user roles in the aviation module
VALID_ROLES = ('admin', 'manager', 'researcher', 'annotator')

# Reviewer roles (can review but not edit)
REVIEWER_ROLES = ('manager', 'researcher')


def get_user_role(user):
    """
    Get the user's role in the aviation context.

    Role determination priority:
    1. If user is superuser, return 'admin'
    2. If user has aviation_role attribute, use that
    3. Default to 'annotator' for regular users

    Args:
        user: Django User instance

    Returns:
        str: One of 'admin', 'manager', 'researcher', 'annotator'
    """
    if user.is_superuser:
        return 'admin'

    # Check for aviation_role attribute (can be set dynamically)
    role = getattr(user, 'aviation_role', None)
    if role and role.lower() in VALID_ROLES:
        return role.lower()

    # Default to annotator for regular users
    return 'annotator'


class CanEditLabelingItem(permissions.BasePermission):
    """
    Permission class to check if user can edit a LabelingItem.

    Permission Matrix:
    | Role       | Draft | Submitted | Reviewed | Approved |
    |------------|-------|-----------|----------|----------|
    | Annotator  | Yes*  | No        | Yes*     | No       |
    | Manager    | No    | No        | No       | No       |
    | Researcher | No    | No        | No       | No       |
    | Admin      | Yes   | Yes       | Yes      | Yes      |

    * Annotator can only edit their own items
    """

    message = "You do not have permission to edit this item."

    def has_permission(self, request, view):
        """
        Check if user has general permission to access the view.

        Safe methods (GET, HEAD, OPTIONS) are allowed for all authenticated users.
        Write methods require authentication.
        """
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Check if user can edit the specific LabelingItem object.

        Args:
            request: DRF Request object
            view: The view instance
            obj: LabelingItem instance

        Returns:
            bool: True if permission is granted, False otherwise
        """
        # Allow safe methods (GET, HEAD, OPTIONS) for all
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        item = obj
        item_status = item.status
        role = get_user_role(user)

        logger.debug(
            f"CanEditLabelingItem check: user={user.id}, role={role}, "
            f"item={item.id}, status={item_status}, method={request.method}"
        )

        # Admin can edit anything
        if role == 'admin':
            return True

        # Manager and Researcher cannot edit anything
        if role in REVIEWER_ROLES:
            self.message = (
                f"As a {role}, you can review items but not edit them. "
                "Only annotators and admins can edit labeling items."
            )
            return False

        # Annotator logic
        if role == 'annotator':
            # Must own the item to edit
            if item.created_by_id != user.id:
                self.message = "You can only edit items that you created."
                return False

            if item_status == 'draft':
                return True
            elif item_status == 'submitted':
                self.message = (
                    "This item has been submitted and is pending review. "
                    "You cannot edit it until a reviewer provides feedback."
                )
                return False
            elif item_status == 'reviewed':
                # Annotator can edit reviewed items (resubmit flow)
                return True
            elif item_status == 'approved':
                self.message = (
                    "This item has been approved and is now locked. "
                    "Approved items cannot be edited."
                )
                return False

        # Fallback: deny access
        self.message = "You do not have permission to edit this item."
        return False


class CanDeleteLabelingItem(permissions.BasePermission):
    """
    Permission class to check if user can delete a LabelingItem.

    Permission Matrix:
    | Role       | Draft | Submitted | Reviewed | Approved |
    |------------|-------|-----------|----------|----------|
    | Annotator  | Yes*  | No        | No       | No       |
    | Manager    | No    | No        | No       | No       |
    | Researcher | No    | No        | No       | No       |
    | Admin      | Yes   | Yes       | Yes      | Yes      |

    * Annotator can only delete their own draft items
    """

    message = "You do not have permission to delete this item."

    def has_permission(self, request, view):
        """
        Check if user has general permission to access the view.

        Safe methods are allowed for all authenticated users.
        """
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Check if user can delete the specific LabelingItem object.

        Only checks DELETE method; other methods pass through to be
        handled by other permission classes.

        Args:
            request: DRF Request object
            view: The view instance
            obj: LabelingItem instance

        Returns:
            bool: True if permission is granted, False otherwise
        """
        # Safe methods always allowed
        if request.method in permissions.SAFE_METHODS:
            return True

        # Only handle DELETE method; let other permissions handle non-DELETE
        if request.method != 'DELETE':
            return True

        user = request.user
        item = obj
        item_status = item.status
        role = get_user_role(user)

        logger.debug(
            f"CanDeleteLabelingItem check: user={user.id}, role={role}, "
            f"item={item.id}, status={item_status}"
        )

        # Admin can delete anything
        if role == 'admin':
            return True

        # Manager and Researcher cannot delete anything
        if role in REVIEWER_ROLES:
            self.message = (
                f"As a {role}, you cannot delete labeling items. "
                "Deletion is only allowed for annotators (draft items) and admins."
            )
            return False

        # Annotator can only delete draft items they created
        if role == 'annotator':
            if item_status != 'draft':
                self.message = (
                    f"You cannot delete {item_status} items. "
                    "Only draft items can be deleted by annotators."
                )
                return False

            if item.created_by_id != user.id:
                self.message = "You can only delete items that you created."
                return False

            return True

        # Fallback: deny access
        return False


class CanCreateLabelingItem(permissions.BasePermission):
    """
    Permission class to check if user can create a LabelingItem.

    Only annotators and admins can create items.
    Managers and researchers cannot create items.
    """

    message = "You do not have permission to create items."

    def has_permission(self, request, view):
        """
        Check if user can create a new LabelingItem.

        Only checks POST method; other methods pass through.

        Args:
            request: DRF Request object
            view: The view instance

        Returns:
            bool: True if permission is granted, False otherwise
        """
        # Safe methods always allowed
        if request.method in permissions.SAFE_METHODS:
            return True

        # Only handle POST method; let other permissions handle non-POST
        if request.method != 'POST':
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        role = get_user_role(user)

        logger.debug(
            f"CanCreateLabelingItem check: user={user.id}, role={role}"
        )

        # Admin can create anything
        if role == 'admin':
            return True

        # Manager and Researcher cannot create items
        if role in REVIEWER_ROLES:
            self.message = (
                f"As a {role}, you cannot create labeling items. "
                "Only annotators and admins can create new items."
            )
            return False

        # Annotator can create
        if role == 'annotator':
            return True

        # Fallback: deny access
        return False
