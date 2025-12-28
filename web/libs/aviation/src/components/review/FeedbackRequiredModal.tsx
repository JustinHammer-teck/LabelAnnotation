import { type FC } from 'react';
import { Modal } from '../common/modal';
import { Button } from '../common/button';
import { useAviationTranslation } from '../../i18n';
import styles from './feedback-required-modal.module.scss';

export type ActionType = 'reject' | 'revision';

export interface FeedbackRequiredModalProps {
  open: boolean;
  actionType: ActionType;
  onClose: () => void;
}

/**
 * Simple notification modal that appears when user clicks Reject or Request Revision
 * without having added any field feedback first.
 * Informs user they need to add at least one field feedback before proceeding.
 */
export const FeedbackRequiredModal: FC<FeedbackRequiredModalProps> = ({
  open,
  actionType,
  onClose,
}) => {
  const { t } = useAviationTranslation();
  const actionLabel = actionType === 'reject'
    ? t('feedback_modal.action_reject')
    : t('feedback_modal.action_revision');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('feedback_modal.title')}
      className={styles.modal}
      footer={
        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose}>
            {t('common.confirm')}
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <p className={styles.message}>
          {t('feedback_modal.message', { action: actionLabel })}
        </p>
        <p className={styles.hint}>
          {t('feedback_modal.hint')}
        </p>
      </div>
    </Modal>
  );
};
