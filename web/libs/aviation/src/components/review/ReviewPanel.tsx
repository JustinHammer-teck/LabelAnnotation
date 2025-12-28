import { type FC, useState, useCallback, useMemo } from 'react';
import { isActive, FF_AVIATION_REVIEW } from '@humansignal/core/lib/utils/feature-flags';
import { Button } from '../common/button';
import { FeedbackRequiredModal, type ActionType } from './FeedbackRequiredModal';
import { useAviationTranslation } from '../../i18n';
import styles from './review-panel.module.scss';

type LoadingAction = 'approve' | 'reject' | 'revision';

export interface ReviewPanelProps {
  labelingItemId: number;
  currentStatus: 'draft' | 'submitted' | 'reviewed' | 'approved';
  userRole: 'admin' | 'manager' | 'researcher' | 'annotator';
  pendingFeedbacksCount?: number;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onRequestRevision?: () => Promise<void>;
}

export const ReviewPanel: FC<ReviewPanelProps> = ({
  labelingItemId,
  currentStatus,
  userRole,
  pendingFeedbacksCount = 0,
  onApprove,
  onReject,
  onRequestRevision,
}) => {
  // ALL HOOKS FIRST - MUST BE CALLED UNCONDITIONALLY
  const { t } = useAviationTranslation();
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalActionType, setModalActionType] = useState<ActionType>('reject');

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

  // Check if feedback is required before proceeding
  const requiresFeedback = pendingFeedbacksCount === 0;

  // Handle reject click - show modal if no feedback, otherwise proceed
  const handleRejectClick = useCallback(() => {
    if (requiresFeedback) {
      setModalActionType('reject');
      setShowModal(true);
    } else {
      createActionHandler('reject', onReject)();
    }
  }, [requiresFeedback, createActionHandler, onReject]);

  // Handle revision click - show modal if no feedback, otherwise proceed
  const handleRevisionClick = useCallback(() => {
    if (requiresFeedback) {
      setModalActionType('revision');
      setShowModal(true);
    } else {
      createActionHandler('revision', onRequestRevision)();
    }
  }, [requiresFeedback, createActionHandler, onRequestRevision]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

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
    <>
      <div className={styles.reviewPanel} data-testid="review-panel" data-item-id={labelingItemId}>
        <div className={styles.header}>
          <h4 className={styles.title}>{t('review.title')}</h4>
        </div>
        <div className={styles.body}>
          <p className={styles.description}>
            {t('review.description')}
          </p>
          <div className={styles.actions}>
            <Button
              className={styles.approveButton}
              onClick={handleApprove}
              disabled={isLoading || !onApprove}
              aria-label={t('review.approve_button')}
            >
              {loadingAction === 'approve' ? t('review.approve_loading') : t('review.approve_button')}
            </Button>
            <Button
              className={styles.revisionButton}
              onClick={handleRevisionClick}
              disabled={isLoading || !onRequestRevision}
              aria-label={t('review.revision_button')}
            >
              {loadingAction === 'revision' ? t('review.revision_loading') : t('review.revision_button')}
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectClick}
              disabled={isLoading || !onReject}
              aria-label={t('review.reject_button')}
            >
              {loadingAction === 'reject' ? t('review.reject_loading') : t('review.reject_button')}
            </Button>
          </div>
        </div>
      </div>

      <FeedbackRequiredModal
        open={showModal}
        actionType={modalActionType}
        onClose={handleModalClose}
      />
    </>
  );
};
