import { useMemo } from 'react';
import type { UserRole } from '../types';

/**
 * Roles that are allowed to review labeling items.
 * Manager and researcher roles have review permissions.
 */
const REVIEW_PERMITTED_ROLES: readonly UserRole[] = ['manager', 'researcher'] as const;

/**
 * Result of the useCanReviewItems hook.
 */
export interface UseCanReviewItemsResult {
  /** Whether the user can review items based on their role */
  canReview: boolean;
}

/**
 * Custom hook that encapsulates role-based visibility logic for the review section.
 * Only users with 'manager' or 'researcher' roles can review labeling items.
 *
 * @param userRole - The current user's role
 * @returns Object containing whether the user can review items
 *
 * @example
 * ```tsx
 * const { canReview } = useCanReviewItems(userRole);
 *
 * // In JSX:
 * {canReview && selectedItemId !== null && selectedItem && (
 *   <div className={styles.reviewSection}>
 *     ...
 *   </div>
 * )}
 * ```
 */
export const useCanReviewItems = (userRole: UserRole): UseCanReviewItemsResult => {
  return useMemo(() => {
    const canReview = REVIEW_PERMITTED_ROLES.includes(userRole);

    return {
      canReview,
    };
  }, [userRole]);
};
