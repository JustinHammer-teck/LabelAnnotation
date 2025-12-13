import { type FC, useCallback, useEffect } from 'react';
import { useAviationTranslation } from '../../../i18n';
import { Button } from '../../common/button';
import styles from './event-navigation.module.scss';

export interface EventNavigationProps {
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onBeforeNavigate?: () => Promise<void> | void;
  disabled?: boolean;
}

export const EventNavigation: FC<EventNavigationProps> = ({
  currentIndex,
  totalCount,
  onNavigate,
  onBeforeNavigate,
  disabled = false,
}) => {
  const { t } = useAviationTranslation();

  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= totalCount - 1;
  const displayIndex = totalCount > 0 ? currentIndex + 1 : 0;

  const handleNavigate = useCallback(
    async (direction: 'prev' | 'next') => {
      if (disabled) return;
      if (direction === 'prev' && isFirst) return;
      if (direction === 'next' && isLast) return;

      if (onBeforeNavigate) {
        await onBeforeNavigate();
      }
      onNavigate(direction);
    },
    [disabled, isFirst, isLast, onBeforeNavigate, onNavigate]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && !isFirst) {
        e.preventDefault();
        handleNavigate('prev');
      } else if (e.key === 'ArrowRight' && !isLast) {
        e.preventDefault();
        handleNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, isFirst, isLast, handleNavigate]);

  return (
    <div className={styles.navigation}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleNavigate('prev')}
        disabled={disabled || isFirst}
        title={isFirst ? t('navigation.first_event') : t('navigation.prev_event')}
        aria-label={t('navigation.prev_event')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
        </svg>
        <span className={styles.buttonText}>{t('common.prev')}</span>
      </Button>

      <div className={styles.counter} aria-live="polite">
        <span className={styles.current}>{displayIndex}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.total}>{totalCount}</span>
      </div>

      <Button
        variant="secondary"
        size="small"
        onClick={() => handleNavigate('next')}
        disabled={disabled || isLast}
        title={isLast ? t('navigation.last_event') : t('navigation.next_event')}
        aria-label={t('navigation.next_event')}
      >
        <span className={styles.buttonText}>{t('common.next')}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </Button>
    </div>
  );
};
