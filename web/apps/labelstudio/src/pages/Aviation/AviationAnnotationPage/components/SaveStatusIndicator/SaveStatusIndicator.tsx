import React from 'react';
import { useAtomValue } from 'jotai';
import { saveStatusAtom } from '../../stores/aviation-annotation.store';
import { FormattingUtil } from '../../utils/formatting.util';
import styles from './SaveStatusIndicator.module.scss';

interface SaveStatusIndicatorProps {
  onRetry?: () => void;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ onRetry }) => {
  const saveStatus = useAtomValue(saveStatusAtom);

  const getStatusIcon = () => {
    switch (saveStatus.state) {
      case 'saved':
        return <span className={styles.iconSaved}>✓</span>;
      case 'saving':
        return <span className={styles.iconSaving}>⟳</span>;
      case 'unsaved':
        return <span className={styles.iconUnsaved}>●</span>;
      case 'error':
        return <span className={styles.iconError}>!</span>;
      default:
        return null;
    }
  };

  const statusClassName = [styles.saveStatusBadge, styles[saveStatus.state]]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={statusClassName}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {getStatusIcon()}
      <span className={styles.statusText}>
        {FormattingUtil.formatSaveStatus(saveStatus.state, saveStatus.lastSaved)}
      </span>
      {saveStatus.state === 'error' && onRetry && (
        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
          aria-label="Retry save"
        >
          Retry
        </button>
      )}
      {saveStatus.error && (
        <div className={styles.errorTooltip}>{saveStatus.error}</div>
      )}
    </div>
  );
};