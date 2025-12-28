import { type FC, useCallback, useId, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReviewableFieldName, FeedbackType } from '../../types';
import { useAviationTranslation } from '../../i18n';
import styles from './field-review-tooltip.module.scss';

/**
 * Status of a field review.
 * - pending: Not yet reviewed
 * - approved: Field approved by reviewer
 * - rejected: Field rejected, needs revision
 * - revision: Revision requested for this field
 */
export type FieldReviewStatus = 'pending' | 'approved' | 'rejected' | 'revision';

export interface FieldReviewTooltipProps {
  /** The field name for tracking */
  fieldName: ReviewableFieldName;
  /** Human-readable label for the field */
  fieldLabel: string;
  /** Current review status of the field */
  currentStatus?: FieldReviewStatus;
  /** Existing feedback comment if rejected/revision */
  feedbackComment?: string;
  /** Callback when field is approved */
  onApprove?: (fieldName: ReviewableFieldName) => void;
  /** Callback when field is rejected */
  onReject?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback when revision is requested */
  onRequestRevision?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback to clear review status */
  onClearStatus?: (fieldName: ReviewableFieldName) => void;
  /** Whether the tooltip is visible */
  isVisible?: boolean;
  /** Position relative to field: 'right' | 'top-right' | 'top' */
  position?: 'right' | 'top-right' | 'top';
  /** Reference element to anchor the tooltip to (for portal positioning) */
  anchorRef?: React.RefObject<HTMLElement>;
}

/**
 * Tooltip with approve/reject/revision action buttons for field-level review.
 *
 * Appears on hover over form fields when a Manager/Researcher is reviewing.
 * Provides quick actions to approve, reject, or request revision on individual fields.
 *
 * @example
 * ```tsx
 * <FieldReviewTooltip
 *   fieldName="threat_type_l1"
 *   fieldLabel="Threat Type Level 1"
 *   currentStatus="pending"
 *   onApprove={(field) => approveField(field)}
 *   onReject={(field, comment) => rejectField(field, comment)}
 *   isVisible={isHovered}
 * />
 * ```
 */
export const FieldReviewTooltip: FC<FieldReviewTooltipProps> = ({
  fieldName,
  fieldLabel,
  currentStatus = 'pending',
  feedbackComment,
  onApprove,
  onReject,
  onRequestRevision,
  onClearStatus,
  isVisible = false,
  position = 'right',
  anchorRef,
}) => {
  const { t } = useAviationTranslation();
  const tooltipId = useId();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectMode, setRejectMode] = useState<'reject' | 'revision'>('reject');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Calculate tooltip position when visible and anchor is available
  useEffect(() => {
    if (!isVisible || !anchorRef?.current) {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const gap = 8; // gap between anchor and tooltip

      let style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 99999,
      };

      switch (position) {
        case 'right':
          style = {
            ...style,
            left: rect.right + gap,
            top: rect.top + rect.height / 2,
            transform: 'translateY(-50%)',
          };
          break;
        case 'top-right':
          style = {
            ...style,
            left: rect.right - 20,
            bottom: window.innerHeight - rect.top + gap,
          };
          break;
        case 'top':
          style = {
            ...style,
            left: rect.left + rect.width / 2,
            bottom: window.innerHeight - rect.top + gap,
            transform: 'translateX(-50%)',
          };
          break;
      }

      setTooltipStyle(style);
    };

    updatePosition();

    // Update position on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, anchorRef, position]);

  const handleApprove = useCallback(() => {
    onApprove?.(fieldName);
  }, [fieldName, onApprove]);

  const handleRejectClick = useCallback(() => {
    setRejectMode('reject');
    setShowRejectInput(true);
    setRejectComment('');
  }, []);

  const handleRevisionClick = useCallback(() => {
    setRejectMode('revision');
    setShowRejectInput(true);
    setRejectComment('');
  }, []);

  const handleConfirmReject = useCallback(() => {
    if (rejectMode === 'reject') {
      onReject?.(fieldName, rejectComment || undefined);
    } else {
      onRequestRevision?.(fieldName, rejectComment || undefined);
    }
    setShowRejectInput(false);
    setRejectComment('');
  }, [fieldName, rejectComment, rejectMode, onReject, onRequestRevision]);

  const handleCancelReject = useCallback(() => {
    setShowRejectInput(false);
    setRejectComment('');
  }, []);

  const handleClearStatus = useCallback(() => {
    onClearStatus?.(fieldName);
  }, [fieldName, onClearStatus]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancelReject();
      } else if (event.key === 'Enter' && showRejectInput) {
        event.preventDefault();
        handleConfirmReject();
      }
    },
    [handleCancelReject, handleConfirmReject, showRejectInput]
  );

  if (!isVisible) {
    return null;
  }

  // Determine if we should use portal (when anchorRef is provided)
  const usePortal = Boolean(anchorRef?.current) && typeof document !== 'undefined';

  // If already reviewed, show status badge with option to clear
  if (currentStatus !== 'pending') {
    const statusContent = (
      <div
        ref={tooltipRef}
        id={tooltipId}
        className={`${styles.tooltip} ${!usePortal ? styles[position] : ''} ${styles.statusDisplay}`}
        style={usePortal ? tooltipStyle : undefined}
        role="tooltip"
        aria-label={`Review status for ${fieldLabel}`}
        data-testid="field-review-tooltip-status"
        data-field={fieldName}
        data-status={currentStatus}
      >
        <div className={styles.statusBadge}>
          {currentStatus === 'approved' && (
            <>
              <span className={`${styles.statusIcon} ${styles.approved}`} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
              </span>
              <span className={styles.statusText}>{t('review.approved_status')}</span>
            </>
          )}
          {currentStatus === 'rejected' && (
            <>
              <span className={`${styles.statusIcon} ${styles.rejected}`} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              </span>
              <span className={styles.statusText}>{t('review.rejected_status')}</span>
            </>
          )}
          {currentStatus === 'revision' && (
            <>
              <span className={`${styles.statusIcon} ${styles.revision}`} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                </svg>
              </span>
              <span className={styles.statusText}>{t('review.revision_requested')}</span>
            </>
          )}
        </div>
        {feedbackComment && (
          <div className={styles.feedbackComment} title={feedbackComment}>
            {feedbackComment}
          </div>
        )}
        {onClearStatus && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearStatus}
            aria-label={t('review.tooltip.remove_status')}
            title={t('review.tooltip.remove_status')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        )}
      </div>
    );

    return usePortal ? createPortal(statusContent, document.body) : statusContent;
  }

  // Show action buttons for pending review
  const actionContent = (
    <div
      ref={tooltipRef}
      id={tooltipId}
      className={`${styles.tooltip} ${!usePortal ? styles[position] : ''}`}
      style={usePortal ? tooltipStyle : undefined}
      role="tooltip"
      aria-label={`Review actions for ${fieldLabel}`}
      data-testid="field-review-tooltip"
      data-field={fieldName}
      onKeyDown={handleKeyDown}
    >
      {!showRejectInput ? (
        <div className={styles.actionButtons}>
          {/* Approve Button */}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.approveButton}`}
            onClick={handleApprove}
            aria-label={`${t('review.tooltip.approve_title')} ${fieldLabel}`}
            title={t('review.tooltip.approve_title')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
          </button>

          {/* Reject Button */}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.rejectButton}`}
            onClick={handleRejectClick}
            aria-label={`${t('review.tooltip.reject_title')} ${fieldLabel}`}
            title={t('review.tooltip.reject_title')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>

          {/* Request Revision Button */}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.revisionButton}`}
            onClick={handleRevisionClick}
            aria-label={`${t('review.tooltip.revision_title')} ${fieldLabel}`}
            title={t('review.tooltip.revision_title')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className={styles.rejectInputContainer}>
          <div className={styles.inputHeader}>
            <span className={styles.inputLabel}>
              {rejectMode === 'reject' ? t('review.tooltip.rejection_comment') : t('review.tooltip.revision_comment')}
            </span>
            <span className={styles.inputHint}>{t('review.tooltip.optional')}</span>
          </div>
          <textarea
            className={styles.commentInput}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder={
              rejectMode === 'reject'
                ? t('review.tooltip.explain_rejection')
                : t('review.tooltip.explain_revision')
            }
            rows={2}
            autoFocus
            aria-label={rejectMode === 'reject' ? t('review.tooltip.rejection_comment') : t('review.tooltip.revision_comment')}
          />
          <div className={styles.inputActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancelReject}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={`${styles.confirmButton} ${rejectMode === 'reject' ? styles.confirmReject : styles.confirmRevision}`}
              onClick={handleConfirmReject}
            >
              {rejectMode === 'reject' ? t('review.tooltip.reject_title') : t('review.tooltip.revision_title')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return usePortal ? createPortal(actionContent, document.body) : actionContent;
};
