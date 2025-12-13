import React, { useState } from 'react';
import styles from './SectionContainer.module.scss';

interface SectionContainerProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  variant?: 'default' | 'orange' | 'green';
  description?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  variant = 'default',
  description,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const containerClassName = [
    styles.sectionContainer,
    styles[`variant-${variant}`],
    !isExpanded && styles.collapsed,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName}>
      <div
        className={styles.sectionHeader}
        onClick={collapsible ? handleToggle : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle();
                }
              }
            : undefined
        }
      >
        <h3 className={styles.sectionTitle}>
          {collapsible && (
            <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
          )}
          {title}
        </h3>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      {isExpanded && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
};