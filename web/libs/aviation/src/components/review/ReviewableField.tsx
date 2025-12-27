import { type FC, type ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import type { ReviewableFieldName, UserRole } from '../../types';
import { FieldReviewTooltip, type FieldReviewStatus } from './FieldReviewTooltip';
import styles from './reviewable-field.module.scss';

export interface FieldReviewState {
  status: FieldReviewStatus;
  comment?: string;
}

export interface ReviewableFieldProps {
  /** The wrapped field component */
  children: ReactNode;
  /** The field name for tracking reviews */
  fieldName: ReviewableFieldName;
  /** Human-readable label for the field */
  fieldLabel: string;
  /** Current user's role - tooltip only shows for reviewers */
  userRole: UserRole;
  /** Current review status of this field */
  reviewStatus?: FieldReviewState;
  /** Callback when field is approved */
  onApprove?: (fieldName: ReviewableFieldName) => void;
  /** Callback when field is rejected */
  onReject?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback when revision is requested */
  onRequestRevision?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback to clear review status */
  onClearStatus?: (fieldName: ReviewableFieldName) => void;
  /** Whether review mode is enabled */
  isReviewMode?: boolean;
  /** Tooltip position relative to field */
  tooltipPosition?: 'right' | 'top-right' | 'top';
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Check if a user role has permission to review fields.
 */
const canReviewFields = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager' || role === 'researcher';
};

/**
 * Wrapper component that adds field-level review tooltip functionality.
 *
 * Wraps any form field component to add hover-triggered approve/reject/revision
 * actions for Manager/Researcher users during review mode.
 *
 * Features:
 * - Hover-triggered tooltip with action buttons
 * - Visual indicator for reviewed fields (approved/rejected/revision)
 * - Role-based visibility (only shown to reviewers)
 * - Keyboard accessibility support
 * - Customizable tooltip positioning
 *
 * @example
 * ```tsx
 * <ReviewableField
 *   fieldName="threat_type_l1"
 *   fieldLabel="Threat Type Level 1"
 *   userRole="researcher"
 *   reviewStatus={{ status: 'pending' }}
 *   onApprove={handleApprove}
 *   onReject={handleReject}
 *   isReviewMode={true}
 * >
 *   <Select
 *     value={threatTypeL1}
 *     onChange={setThreatTypeL1}
 *     options={threatTypeOptions}
 *   />
 * </ReviewableField>
 * ```
 */
export const ReviewableField: FC<ReviewableFieldProps> = ({
  children,
  fieldName,
  fieldLabel,
  userRole,
  reviewStatus,
  onApprove,
  onReject,
  onRequestRevision,
  onClearStatus,
  isReviewMode = true,
  tooltipPosition = 'right',
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if tooltip should be visible
  const canReview = canReviewFields(userRole);
  const isTooltipVisible = canReview && isReviewMode && (isHovered || isFocused);

  // Get current status
  const currentStatus = reviewStatus?.status ?? 'pending';
  const feedbackComment = reviewStatus?.comment;

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Cancel any pending hide
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    // Small delay to prevent flickering on quick mouse movements
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Cancel any pending show
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Delay before hiding - gives user time to move to tooltip or re-enter
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((event: React.FocusEvent) => {
    // Only blur if focus is leaving the container entirely
    if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Allow Escape to close tooltip
    if (event.key === 'Escape') {
      setIsFocused(false);
      setIsHovered(false);
    }
  }, []);

  // Get wrapper class based on status
  const getStatusClass = (): string => {
    if (!canReview || !isReviewMode) return '';

    switch (currentStatus) {
      case 'approved':
        return styles.approved;
      case 'rejected':
        return styles.rejected;
      case 'revision':
        return styles.revision;
      default:
        return '';
    }
  };

  // If not a reviewer or not in review mode, just render children
  if (!canReview || !isReviewMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${getStatusClass()} ${className ?? ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-testid="reviewable-field"
      data-field={fieldName}
      data-status={currentStatus}
    >
      {/* Status indicator border/highlight */}
      {currentStatus !== 'pending' && (
        <div className={styles.statusIndicator} aria-hidden="true" />
      )}

      {/* The wrapped field */}
      <div className={styles.fieldContent}>
        {children}
      </div>

      {/* Review tooltip */}
      <FieldReviewTooltip
        fieldName={fieldName}
        fieldLabel={fieldLabel}
        currentStatus={currentStatus}
        feedbackComment={feedbackComment}
        onApprove={onApprove}
        onReject={onReject}
        onRequestRevision={onRequestRevision}
        onClearStatus={onClearStatus}
        isVisible={isTooltipVisible}
        position={tooltipPosition}
        anchorRef={containerRef}
      />

      {/* Status badge for reviewed fields (visible without hover) */}
      {currentStatus !== 'pending' && (
        <div className={styles.persistentBadge}>
          {currentStatus === 'approved' && (
            <span className={`${styles.badge} ${styles.badgeApproved}`} title="Approved">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
              </svg>
            </span>
          )}
          {currentStatus === 'rejected' && (
            <span className={`${styles.badge} ${styles.badgeRejected}`} title="Rejected">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </span>
          )}
          {currentStatus === 'revision' && (
            <span className={`${styles.badge} ${styles.badgeRevision}`} title="Needs Revision">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
              </svg>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
