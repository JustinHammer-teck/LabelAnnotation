import { type FC } from 'react';
import styles from './status-indicator.module.scss';

export interface StatusIndicatorProps {
  status: 'saved' | 'saving' | 'error';
  message?: string;
  className?: string;
}

const defaultMessages: Record<StatusIndicatorProps['status'], string> = {
  saved: 'Saved',
  saving: 'Saving...',
  error: 'Error saving',
};

export const StatusIndicator: FC<StatusIndicatorProps> = ({
  status,
  message,
  className,
}) => {
  const displayMessage = message ?? defaultMessages[status];

  return (
    <span
      className={`${styles.statusIndicator} ${styles[status]} ${className || ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.message}>{displayMessage}</span>
    </span>
  );
};
