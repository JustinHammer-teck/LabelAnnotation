import { type FC } from 'react';
import { useAtomValue } from 'jotai';
import { useAviationTranslation } from '../../../i18n';
import { saveStatusAtom } from '../../../stores';
import { Button } from '../../common/button';
import { Badge } from '../../common/badge';
import type { SaveStatus } from '../../../types';
import styles from './action-toolbar.module.scss';

export type EventStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ActionToolbarProps {
  eventStatus?: EventStatus;
  onSave?: () => void;
  onSubmit?: () => void;
  saveDisabled?: boolean;
  submitDisabled?: boolean;
}

const SaveStatusIndicator: FC<{ status: SaveStatus }> = ({ status }) => {
  const { t } = useAviationTranslation();

  const getStatusConfig = () => {
    switch (status.state) {
      case 'saving':
        return { text: t('toolbar.save_status.saving'), className: styles.saving };
      case 'saved':
        return { text: t('toolbar.save_status.saved'), className: styles.saved };
      case 'error':
        return { text: t('toolbar.save_status.error'), className: styles.error };
      default:
        return { text: t('toolbar.save_status.idle'), className: styles.idle };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`${styles.saveStatus} ${config.className}`} aria-live="polite">
      {status.state === 'saving' && (
        <svg className={styles.spinner} width="14" height="14" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray="31.4 31.4"
          />
        </svg>
      )}
      {status.state === 'saved' && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
        </svg>
      )}
      {status.state === 'error' && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
        </svg>
      )}
      <span>{config.text}</span>
    </span>
  );
};

const StatusBadge: FC<{ status: EventStatus }> = ({ status }) => {
  const { t } = useAviationTranslation();

  const getBadgeType = (): 'default' | 'info' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'submitted':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return <Badge type={getBadgeType()}>{t(`status.${status}`)}</Badge>;
};

export const ActionToolbar: FC<ActionToolbarProps> = ({
  eventStatus = 'draft',
  onSave,
  onSubmit,
  saveDisabled = false,
  submitDisabled = false,
}) => {
  const { t } = useAviationTranslation();
  const saveStatus = useAtomValue(saveStatusAtom);

  const isSaving = saveStatus.state === 'saving';
  const canSubmit = eventStatus === 'draft' && !submitDisabled;

  return (
    <div className={styles.toolbar}>
      <SaveStatusIndicator status={saveStatus} />

      <div className={styles.actions}>
        <StatusBadge status={eventStatus} />

        {onSave && (
          <Button
            variant="secondary"
            size="small"
            onClick={onSave}
            disabled={saveDisabled || isSaving}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
            </svg>
            {t('common.save')}
          </Button>
        )}

        {onSubmit && canSubmit && (
          <Button variant="primary" size="small" onClick={onSubmit} disabled={isSaving}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            {t('toolbar.submit_for_review')}
          </Button>
        )}
      </div>
    </div>
  );
};
