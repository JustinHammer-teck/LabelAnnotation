import { type FC, useState, useCallback, useId } from 'react';
import type { FieldFeedback } from '../../types';
import styles from './revision-indicator.module.scss';

export interface RevisionIndicatorProps {
  fieldName: string;
  feedbacks: FieldFeedback[];
  onMarkResolved?: () => void;
}

/**
 * Shows annotator which fields need revision.
 * Displays: warning icon + list of feedback comments + checkbox to mark resolved.
 * More prominent styling to draw annotator attention.
 */
export const RevisionIndicator: FC<RevisionIndicatorProps> = ({
  fieldName,
  feedbacks,
  onMarkResolved,
}) => {
  const [isResolved, setIsResolved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const checkboxId = useId();

  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      setIsResolved(checked);
      if (checked && onMarkResolved) {
        onMarkResolved();
      }
    },
    [onMarkResolved],
  );

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggleExpand();
      }
    },
    [handleToggleExpand],
  );

  // No feedbacks, no indicator
  if (!feedbacks || feedbacks.length === 0) {
    return null;
  }

  const getFeedbackTypeLabel = (type: string): string => {
    switch (type) {
      case 'partial':
        return 'Partial Issue';
      case 'full':
        return 'Rejected';
      case 'revision':
        return 'Needs Revision';
      default:
        return 'Feedback';
    }
  };

  const feedbackCount = feedbacks.length;
  const hasMultipleFeedbacks = feedbackCount > 1;

  return (
    <div
      className={`${styles.container} ${isResolved ? styles.resolved : ''}`}
      data-testid="revision-indicator"
      data-field={fieldName}
      role="region"
      aria-label={`Revision needed for ${fieldName}`}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={handleToggleExpand}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={`feedback-list-${fieldName}`}
        >
          <span className={styles.icon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
          </span>
          <span className={styles.titleText}>
            Revision Required
            {hasMultipleFeedbacks && (
              <span className={styles.count}>({feedbackCount} issues)</span>
            )}
          </span>
          <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </button>
      </div>

      {isExpanded && (
        <div id={`feedback-list-${fieldName}`} className={styles.content}>
          <ul className={styles.feedbackList} role="list">
            {feedbacks.map((feedback, index) => (
              <li key={feedback.id || index} className={styles.feedbackItem}>
                <span className={styles.feedbackType}>
                  {getFeedbackTypeLabel(feedback.feedback_type)}
                </span>
                <p className={styles.feedbackComment}>{feedback.feedback_comment}</p>
              </li>
            ))}
          </ul>

          {onMarkResolved && (
            <div className={styles.resolveSection}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id={checkboxId}
                  checked={isResolved}
                  onChange={handleCheckboxChange}
                  className={styles.checkbox}
                  aria-describedby={`resolve-hint-${fieldName}`}
                />
                <span className={styles.checkboxText}>Mark as resolved</span>
              </label>
              <span id={`resolve-hint-${fieldName}`} className={styles.resolveHint}>
                Check this after addressing all feedback for this field
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
