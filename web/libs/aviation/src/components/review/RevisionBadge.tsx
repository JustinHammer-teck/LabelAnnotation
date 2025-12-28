import { type FC } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { ReviewableFieldName } from '../../types';
import { useAviationTranslation } from '../../i18n';
import styles from './revision-badge.module.scss';

export interface RevisionBadgeProps {
  /** The field that needs revision */
  fieldName: ReviewableFieldName;
  /** Reviewer's comment explaining what needs revision */
  comment?: string;
  /** Name of the reviewer who requested the revision */
  reviewerName?: string;
  /** Timestamp when the revision was requested */
  reviewedAt?: string;
  /** Callback when user marks the field as resolved */
  onMarkResolved?: () => void;
  /** Whether the revision has been resolved */
  isResolved?: boolean;
}

/**
 * Badge component that indicates a field needs revision.
 * Shows a tooltip on hover with reviewer feedback and option to mark as resolved.
 * Uses Radix UI Tooltip for accessibility and keyboard navigation support.
 *
 * @example
 * ```tsx
 * <RevisionBadge
 *   fieldName="threat_type"
 *   comment="Please verify the L3 threat type selection"
 *   reviewerName="John Doe"
 *   reviewedAt="2024-01-15T10:30:00Z"
 *   onMarkResolved={() => handleResolve('threat_type')}
 *   isResolved={false}
 * />
 * ```
 */
export const RevisionBadge: FC<RevisionBadgeProps> = ({
  fieldName,
  comment,
  reviewerName,
  reviewedAt,
  onMarkResolved,
  isResolved = false,
}) => {
  const { t } = useAviationTranslation();

  // Don't render if no comment or if resolved
  if (!comment || isResolved) return null;

  const formattedDate = reviewedAt
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(reviewedAt))
    : null;

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={styles.badge}
            aria-label={`View revision information for ${fieldName}`}
            data-testid="revision-badge"
            data-field={fieldName}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
            {t('review.badge.needs_revision')}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={styles.tooltipContent}
            sideOffset={5}
            role="tooltip"
          >
            {(reviewerName || formattedDate) && (
              <div className={styles.tooltipHeader}>
                {reviewerName && <div>{t('review.badge.reviewer')} {reviewerName}</div>}
                {formattedDate && <div>{t('review.badge.requested')} {formattedDate}</div>}
              </div>
            )}
            <div className={styles.tooltipComment}>{comment}</div>
            {onMarkResolved && (
              <button
                type="button"
                className={styles.resolveButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkResolved();
                }}
              >
                {t('review.badge.mark_resolved')}
              </button>
            )}
            <Tooltip.Arrow className={styles.tooltipArrow} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
