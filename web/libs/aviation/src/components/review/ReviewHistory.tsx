import { type FC, useState, useCallback, useMemo } from 'react';
import { isActive, FF_AVIATION_REVIEW } from '@humansignal/core/lib/utils/feature-flags';
import type { ReviewDecision, ReviewStatus, FieldFeedback } from '../../types/review.types';
import styles from './review-history.module.scss';

export interface ReviewHistoryProps {
  labelingItemId: number;
  decisions: ReviewDecision[];
  loading?: boolean;
}

/**
 * Format a date string to a relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Format a date string to a full date/time string
 */
const formatFullDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get display label for review status
 */
const getStatusLabel = (status: ReviewStatus): string => {
  const labels: Record<ReviewStatus, string> = {
    approved: 'Approved',
    rejected_partial: 'Partially Rejected',
    rejected_full: 'Fully Rejected',
    revision_requested: 'Revision Requested',
  };
  return labels[status];
};

/**
 * Get CSS class name for status badge
 */
const getStatusClassName = (status: ReviewStatus): string => {
  if (status === 'approved') {
    return styles.statusApproved;
  } else if (status === 'revision_requested') {
    return styles.statusRevision;
  } else {
    return styles.statusRejected;
  }
};

interface FieldFeedbackListProps {
  feedbacks: FieldFeedback[];
  isExpanded: boolean;
}

const FieldFeedbackList: FC<FieldFeedbackListProps> = ({ feedbacks, isExpanded }) => {
  if (!isExpanded || feedbacks.length === 0) {
    return null;
  }

  return (
    <ul className={styles.feedbackList} role="list">
      {feedbacks.map((feedback) => (
        <li key={feedback.id} className={styles.feedbackItem}>
          <span className={styles.feedbackField}>{feedback.field_name}</span>
          <span className={styles.feedbackType} data-type={feedback.feedback_type}>
            {feedback.feedback_type}
          </span>
          {feedback.feedback_comment && (
            <p className={styles.feedbackComment}>{feedback.feedback_comment}</p>
          )}
        </li>
      ))}
    </ul>
  );
};

interface TimelineItemProps {
  decision: ReviewDecision;
  isFirst: boolean;
  isLast: boolean;
}

const TimelineItem: FC<TimelineItemProps> = ({ decision, isFirst, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const hasFeedbacks = decision.field_feedbacks.length > 0;

  const handleToggle = useCallback(() => {
    if (hasFeedbacks) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasFeedbacks]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  return (
    <li
      className={`${styles.timelineItem} ${isFirst ? styles.first : ''} ${isLast ? styles.last : ''}`}
    >
      <div className={styles.timelineConnector}>
        <span className={`${styles.timelineDot} ${getStatusClassName(decision.status)}`} />
        {!isLast && <span className={styles.timelineLine} />}
      </div>
      <div className={styles.timelineContent}>
        <div
          className={`${styles.timelineHeader} ${hasFeedbacks ? styles.expandable : ''}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          role={hasFeedbacks ? 'button' : undefined}
          tabIndex={hasFeedbacks ? 0 : undefined}
          aria-expanded={hasFeedbacks ? isExpanded : undefined}
        >
          <span className={`${styles.statusBadge} ${getStatusClassName(decision.status)}`}>
            {getStatusLabel(decision.status)}
          </span>
          <span className={styles.reviewer}>{decision.reviewer_name ?? `User #${decision.reviewer}`}</span>
          <span className={styles.timestamp} title={formatFullDateTime(decision.created_at)}>
            {formatRelativeTime(decision.created_at)}
          </span>
          {hasFeedbacks && (
            <span className={styles.expandIcon} aria-hidden="true">
              {isExpanded ? '\u25BC' : '\u25B6'}
            </span>
          )}
        </div>
        {decision.reviewer_comment && (
          <p className={styles.comment}>{decision.reviewer_comment}</p>
        )}
        <FieldFeedbackList feedbacks={decision.field_feedbacks} isExpanded={isExpanded} />
      </div>
    </li>
  );
};

export const ReviewHistory: FC<ReviewHistoryProps> = ({
  labelingItemId,
  decisions,
  loading = false,
}) => {
  // Feature flag check - temporarily bypassed for development
  // TODO: Uncomment before production
  // if (!isActive(FF_AVIATION_REVIEW)) {
  //   return null;
  // }

  // Sort decisions by date, newest first
  const sortedDecisions = useMemo(() => {
    return [...decisions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [decisions]);

  // Loading state
  if (loading) {
    return (
      <div
        className={styles.reviewHistory}
        data-testid="review-history"
        data-item-id={labelingItemId}
      >
        <div className={styles.header}>
          <h4 className={styles.title}>Review History</h4>
        </div>
        <div className={styles.body}>
          <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <span>Loading review history...</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedDecisions.length === 0) {
    return (
      <div
        className={styles.reviewHistory}
        data-testid="review-history"
        data-item-id={labelingItemId}
      >
        <div className={styles.header}>
          <h4 className={styles.title}>Review History</h4>
        </div>
        <div className={styles.body}>
          <p className={styles.emptyState}>No review history available for this item.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.reviewHistory}
      data-testid="review-history"
      data-item-id={labelingItemId}
    >
      <div className={styles.header}>
        <h4 className={styles.title}>Review History</h4>
        <span className={styles.count}>{sortedDecisions.length} decision{sortedDecisions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.body}>
        <ul className={styles.timeline} role="list" aria-label="Review decisions timeline">
          {sortedDecisions.map((decision, index) => (
            <TimelineItem
              key={decision.id}
              decision={decision}
              isFirst={index === 0}
              isLast={index === sortedDecisions.length - 1}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
