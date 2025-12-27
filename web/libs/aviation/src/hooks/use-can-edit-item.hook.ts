/**
 * useCanEditItem Hook
 *
 * Determines whether a user can edit, add, or delete labeling items based on
 * their role and the item's status.
 *
 * Permission Matrix:
 * | Role       | Draft     | Submitted  | Reviewed       | Approved   |
 * |------------|-----------|------------|----------------|------------|
 * | Annotator  | Edit      | Read-only  | Edit+Resubmit  | Read-only  |
 * | Manager    | Read-only | Read-only  | Read-only      | Read-only  |
 * | Researcher | Read-only | Read-only  | Read-only      | Read-only  |
 * | Admin      | Full      | Full       | Full           | Full       |
 *
 * @module hooks/use-can-edit-item
 */

import { useMemo } from 'react';
import type { LabelingItem } from '../types';
import type { UserRole } from '../types/review.types';

/**
 * Result returned by the useCanEditItem hook.
 */
export interface UseCanEditItemResult {
  /** Whether the user can edit the item's fields */
  canEdit: boolean;
  /** Whether the user can add new labeling items */
  canAdd: boolean;
  /** Whether the user can delete labeling items */
  canDelete: boolean;
  /** Whether the item is in read-only mode */
  isReadOnly: boolean;
  /** Whether to show a read-only banner */
  showBanner: boolean;
  /** Message to display in the banner, null if not applicable */
  bannerMessage: string | null;
  /** Reason why editing is disabled, null if editing is allowed */
  disabledReason: string | null;
  /** Tooltip message to display on disabled elements, null if editing is allowed */
  tooltipMessage: string | null;
}

/**
 * Parameters for the useCanEditItem hook.
 */
export interface UseCanEditItemParams {
  /** The labeling item to check permissions for, or null */
  item: LabelingItem | null;
  /** The user's role */
  userRole: UserRole;
  /** Optional status override; if provided, uses this instead of item.status */
  itemStatus?: LabelingItem['status'];
}

/**
 * Permission configuration for each role and status combination.
 */
interface PermissionConfig {
  canEdit: boolean;
  canAdd: boolean;
  canDelete: boolean;
}

type ItemStatus = LabelingItem['status'];

/**
 * Permission matrix defining permissions for each role and status combination.
 *
 * Annotator:
 * - Draft: Full edit/add/delete access
 * - Submitted: Read-only (waiting for review)
 * - Reviewed: Edit only (resubmit flow, no add/delete)
 * - Approved: Read-only (final state)
 *
 * Manager/Researcher:
 * - All statuses: Read-only (reviewers, not editors)
 *
 * Admin:
 * - All statuses: Full access
 */
const PERMISSION_MATRIX: Record<UserRole, Record<ItemStatus, PermissionConfig>> = {
  annotator: {
    draft: { canEdit: true, canAdd: true, canDelete: true },
    submitted: { canEdit: false, canAdd: false, canDelete: false },
    reviewed: { canEdit: true, canAdd: false, canDelete: false },
    approved: { canEdit: false, canAdd: false, canDelete: false },
  },
  manager: {
    draft: { canEdit: false, canAdd: false, canDelete: false },
    submitted: { canEdit: false, canAdd: false, canDelete: false },
    reviewed: { canEdit: false, canAdd: false, canDelete: false },
    approved: { canEdit: false, canAdd: false, canDelete: false },
  },
  researcher: {
    draft: { canEdit: false, canAdd: false, canDelete: false },
    submitted: { canEdit: false, canAdd: false, canDelete: false },
    reviewed: { canEdit: false, canAdd: false, canDelete: false },
    approved: { canEdit: false, canAdd: false, canDelete: false },
  },
  admin: {
    draft: { canEdit: true, canAdd: true, canDelete: true },
    submitted: { canEdit: true, canAdd: true, canDelete: true },
    reviewed: { canEdit: true, canAdd: true, canDelete: true },
    approved: { canEdit: true, canAdd: true, canDelete: true },
  },
};

/**
 * Default permissions when role or status is invalid.
 */
const DEFAULT_PERMISSIONS: PermissionConfig = {
  canEdit: false,
  canAdd: false,
  canDelete: false,
};

/**
 * Gets a human-readable disabled reason based on role and status.
 *
 * @param role - The user's role
 * @param status - The item's status
 * @param isRoleRestriction - Whether the restriction is due to role (vs status)
 * @returns The disabled reason message
 */
const getDisabledReason = (
  role: UserRole | null,
  status: ItemStatus | null,
  isRoleRestriction: boolean
): string => {
  if (isRoleRestriction) {
    return `As a ${role}, you have read-only access to this item.`;
  }

  switch (status) {
    case 'submitted':
      return 'This item has been submitted and is pending review.';
    case 'approved':
      return 'This item has been approved and cannot be edited.';
    default:
      return 'This item is read-only.';
  }
};

/**
 * Gets a banner message based on role and status.
 *
 * @param role - The user's role
 * @param status - The item's status
 * @param isRoleRestriction - Whether the restriction is due to role (vs status)
 * @returns The banner message
 */
const getBannerMessage = (
  role: UserRole | null,
  status: ItemStatus | null,
  isRoleRestriction: boolean
): string => {
  if (isRoleRestriction) {
    return `Read-only mode: As a ${role}, you can view but not edit this item.`;
  }

  switch (status) {
    case 'submitted':
      return 'Read-only mode: This item has been submitted and is awaiting review.';
    case 'approved':
      return 'Read-only mode: This item has been approved and is locked.';
    default:
      return 'Read-only mode: This item cannot be edited.';
  }
};

/**
 * Gets a tooltip message for disabled elements.
 *
 * @param role - The user's role
 * @param status - The item's status
 * @param isRoleRestriction - Whether the restriction is due to role (vs status)
 * @returns The tooltip message
 */
const getTooltipMessage = (
  role: UserRole | null,
  status: ItemStatus | null,
  isRoleRestriction: boolean
): string => {
  if (isRoleRestriction) {
    return `${role} role cannot edit items`;
  }

  switch (status) {
    case 'submitted':
      return 'Item is submitted and pending review';
    case 'approved':
      return 'Item is approved and locked';
    default:
      return 'Item is read-only';
  }
};

/**
 * Checks if a role is a reviewer role (manager or researcher).
 *
 * @param role - The user's role
 * @returns True if the role is a reviewer role
 */
const isReviewerRole = (role: UserRole): boolean => {
  return role === 'manager' || role === 'researcher';
};

/**
 * Checks if a role is valid.
 *
 * @param role - The role to check
 * @returns True if the role is valid
 */
const isValidRole = (role: unknown): role is UserRole => {
  return role === 'admin' || role === 'manager' || role === 'researcher' || role === 'annotator';
};

/**
 * Checks if a status is valid.
 *
 * @param status - The status to check
 * @returns True if the status is valid
 */
const isValidStatus = (status: unknown): status is ItemStatus => {
  return status === 'draft' || status === 'submitted' || status === 'reviewed' || status === 'approved';
};

/**
 * Hook that determines edit/add/delete permissions for a labeling item
 * based on the user's role and the item's status.
 *
 * @param params - The hook parameters
 * @param params.item - The labeling item to check permissions for
 * @param params.userRole - The user's role
 * @param params.itemStatus - Optional status override
 * @returns Permission result with flags and messages
 *
 * @example
 * ```tsx
 * const { canEdit, showBanner, bannerMessage } = useCanEditItem({
 *   item: labelingItem,
 *   userRole: 'annotator',
 * });
 *
 * if (!canEdit) {
 *   return <ReadOnlyBanner message={bannerMessage} />;
 * }
 * ```
 */
export const useCanEditItem = ({
  item,
  userRole,
  itemStatus,
}: UseCanEditItemParams): UseCanEditItemResult => {
  return useMemo(() => {
    // Handle null/invalid inputs
    if (!item || !isValidRole(userRole)) {
      return {
        canEdit: false,
        canAdd: false,
        canDelete: false,
        isReadOnly: true,
        showBanner: true,
        bannerMessage: 'Read-only mode: Invalid item or user configuration.',
        disabledReason: 'Invalid item or user configuration.',
        tooltipMessage: 'Cannot edit: invalid configuration',
      };
    }

    // Determine effective status (itemStatus override or item.status)
    const effectiveStatus = itemStatus ?? item.status;

    // Handle invalid status
    if (!isValidStatus(effectiveStatus)) {
      return {
        canEdit: false,
        canAdd: false,
        canDelete: false,
        isReadOnly: true,
        showBanner: true,
        bannerMessage: 'Read-only mode: Unknown item status.',
        disabledReason: 'Unknown item status.',
        tooltipMessage: 'Cannot edit: unknown status',
      };
    }

    // Get permissions from matrix
    const rolePermissions = PERMISSION_MATRIX[userRole];
    const permissions = rolePermissions?.[effectiveStatus] ?? DEFAULT_PERMISSIONS;

    const { canEdit, canAdd, canDelete } = permissions;
    const isReadOnly = !canEdit;

    // Determine if restriction is role-based or status-based
    // Role-based: manager/researcher always read-only
    // Status-based: annotator with submitted/approved items
    const isRoleRestriction = isReviewerRole(userRole);

    // Admin always has full access, no banners or restrictions
    if (userRole === 'admin') {
      return {
        canEdit: true,
        canAdd: true,
        canDelete: true,
        isReadOnly: false,
        showBanner: false,
        bannerMessage: null,
        disabledReason: null,
        tooltipMessage: null,
      };
    }

    // For read-only states, provide appropriate messages
    if (isReadOnly) {
      return {
        canEdit,
        canAdd,
        canDelete,
        isReadOnly: true,
        showBanner: true,
        bannerMessage: getBannerMessage(userRole, effectiveStatus, isRoleRestriction),
        disabledReason: getDisabledReason(userRole, effectiveStatus, isRoleRestriction),
        tooltipMessage: getTooltipMessage(userRole, effectiveStatus, isRoleRestriction),
      };
    }

    // Editable state - no banners or restrictions
    return {
      canEdit,
      canAdd,
      canDelete,
      isReadOnly: false,
      showBanner: false,
      bannerMessage: null,
      disabledReason: null,
      tooltipMessage: null,
    };
  }, [item, userRole, itemStatus]);
};
