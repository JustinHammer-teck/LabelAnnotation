import { type FC, type ReactNode, useState, useCallback } from 'react';
import styles from './panel.module.scss';

export interface PanelProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: ReactNode;
  className?: string;
}

export const Panel: FC<PanelProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  actions,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setIsExpanded((prev) => !prev);
    }
  }, [collapsible]);

  return (
    <div className={`${styles.panel} ${!isExpanded ? styles.collapsed : ''} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          {collapsible && (
            <button
              type="button"
              className={`${styles.collapseButton} ${!isExpanded ? styles.collapsed : ''}`}
              onClick={handleToggle}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
          )}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.body} aria-hidden={collapsible && !isExpanded ? true : undefined}>
        {children}
      </div>
    </div>
  );
};
