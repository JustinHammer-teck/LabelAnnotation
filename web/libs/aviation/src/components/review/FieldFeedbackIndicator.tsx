import { type FC, useCallback, useState, useRef, useEffect } from 'react';
import type { FieldFeedback, FeedbackType } from '../../types';
import { useAviationTranslation } from '../../i18n';
import styles from './field-feedback-indicator.module.scss';

export interface FieldFeedbackIndicatorProps {
  fieldName: string;
  feedback?: FieldFeedback;
  onClick?: () => void;
}

/**
 * Inline indicator showing field rejection/feedback status.
 * Displays: icon + feedback type badge + truncated comment.
 * Red/orange styling for rejected/revision fields.
 */
export const FieldFeedbackIndicator: FC<FieldFeedbackIndicatorProps> = ({
  fieldName,
  feedback,
  onClick,
}) => {
  const { t } = useAviationTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const indicatorRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        indicatorRef.current &&
        !indicatorRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      setShowTooltip((prev) => !prev);
    }
  }, [onClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    },
    [handleClick],
  );

  // No feedback, no indicator
  if (!feedback) {
    return null;
  }

  const getFeedbackTypeLabel = (type: FeedbackType): string => {
    switch (type) {
      case 'partial':
        return t('feedback.type.partial');
      case 'full':
        return t('feedback.type.full');
      case 'revision':
        return t('feedback.type.revision');
      default:
        return t('feedback.type.revision');
    }
  };

  const getVariantClass = (type: FeedbackType): string => {
    switch (type) {
      case 'full':
        return styles.error;
      case 'partial':
      case 'revision':
        return styles.warning;
      default:
        return styles.warning;
    }
  };

  const truncateComment = (comment: string, maxLength = 40): string => {
    if (comment.length <= maxLength) {
      return comment;
    }
    return `${comment.substring(0, maxLength)}...`;
  };

  return (
    <div className={styles.container} data-testid="field-feedback-indicator" data-field={fieldName}>
      <button
        ref={indicatorRef}
        type="button"
        className={`${styles.indicator} ${getVariantClass(feedback.feedback_type)}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => !onClick && setShowTooltip(false)}
        aria-label={`Feedback on ${fieldName}: ${getFeedbackTypeLabel(feedback.feedback_type)}`}
        aria-describedby={showTooltip ? `tooltip-${fieldName}` : undefined}
      >
        <span className={styles.icon} aria-hidden="true">
          {feedback.feedback_type === 'full' ? (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
          )}
        </span>
        <span className={styles.badge}>{getFeedbackTypeLabel(feedback.feedback_type)}</span>
        {feedback.feedback_comment && (
          <span className={styles.commentPreview}>{truncateComment(feedback.feedback_comment)}</span>
        )}
      </button>

      {showTooltip && feedback.feedback_comment && (
        <div
          ref={tooltipRef}
          id={`tooltip-${fieldName}`}
          className={styles.tooltip}
          role="tooltip"
        >
          <div className={styles.tooltipHeader}>
            <strong>{getFeedbackTypeLabel(feedback.feedback_type)}</strong>
          </div>
          <div className={styles.tooltipContent}>{feedback.feedback_comment}</div>
        </div>
      )}
    </div>
  );
};
