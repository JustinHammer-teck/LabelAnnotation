import { type FC, useState, useCallback, useMemo } from 'react';
import { isActive, FF_AVIATION_REVIEW } from '@humansignal/core/lib/utils/feature-flags';
import { Button } from '../common/button';
import styles from './review-panel.module.scss';

type LoadingAction = 'approve' | 'reject' | 'revision';

export interface ReviewPanelProps {
  labelingItemId: number;
  currentStatus: 'draft' | 'submitted' | 'reviewed' | 'approved';
  userRole: 'admin' | 'manager' | 'researcher' | 'annotator';
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onRequestRevision?: () => Promise<void>;
}

export const ReviewPanel: FC<ReviewPanelProps> = ({
  labelingItemId,
  currentStatus,
  userRole,
  onApprove,
  onReject,
  onRequestRevision,
}) => {
  // ALL HOOKS FIRST - MUST BE CALLED UNCONDITIONALLY
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);

  // Handler factory to reduce duplication
  const createActionHandler = useCallback(
    (actionType: LoadingAction, callback?: () => Promise<void>) => {
      return async () => {
        if (loadingAction || !callback) return;
        setLoadingAction(actionType);
        try {
          await callback();
        } finally {
          setLoadingAction(null);
        }
      };
    },
    [loadingAction]
  );

  const handleApprove = useMemo(
    () => createActionHandler('approve', onApprove),
    [createActionHandler, onApprove]
  );

  const handleReject = useMemo(
    () => createActionHandler('reject', onReject),
    [createActionHandler, onReject]
  );

  const handleRequestRevision = useMemo(
    () => createActionHandler('revision', onRequestRevision),
    [createActionHandler, onRequestRevision]
  );

  const isLoading = loadingAction !== null;

  // Visibility logic extracted to useMemo
  const isVisible = useMemo(() => {
    // Feature flag check - temporarily bypassed for development
    // TODO: Uncomment before production
    // if (!isActive(FF_AVIATION_REVIEW)) {
    //   return false;
    // }

    const hasReviewRole = userRole === 'admin' || userRole === 'manager' || userRole === 'researcher';
    // Only show when status is 'submitted' (or 'draft' for development testing)
    // TODO: Remove 'draft' condition before production
    const isReviewableStatus = currentStatus === 'submitted' || currentStatus === 'draft';

    return hasReviewRole && isReviewableStatus;
  }, [userRole, currentStatus]);

  // EARLY RETURN AFTER ALL HOOKS
  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.reviewPanel} data-testid="review-panel" data-item-id={labelingItemId}>
      <div className={styles.header}>
        <h4 className={styles.title}>Review Actions</h4>
      </div>
      <div className={styles.body}>
        <p className={styles.description}>
          Review this submission and take an action below.
        </p>
        <div className={styles.actions}>
          <Button
            className={styles.approveButton}
            onClick={handleApprove}
            disabled={isLoading || !onApprove}
            aria-label="Approve submission"
          >
            {loadingAction === 'approve' ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            className={styles.revisionButton}
            onClick={handleRequestRevision}
            disabled={isLoading || !onRequestRevision}
            aria-label="Request revision"
          >
            {loadingAction === 'revision' ? 'Requesting...' : 'Request Revision'}
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={isLoading || !onReject}
            aria-label="Reject submission"
          >
            {loadingAction === 'reject' ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
};
