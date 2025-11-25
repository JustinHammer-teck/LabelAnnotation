import React from 'react';
import styles from './AutoCalculatedField.module.scss';

interface AutoCalculatedFieldProps {
  label: string;
  value: string[];
  emptyText?: string;
  variant?: 'default' | 'green';
}

export const AutoCalculatedField: React.FC<AutoCalculatedFieldProps> = ({
  label,
  value = [],
  emptyText = 'No items',
  variant = 'green',
}) => {
  const fieldClassName = [styles.autoCalculatedField, styles[`variant-${variant}`]]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fieldClassName}>
      <div className={styles.label}>{label}</div>
      <div
        className={styles.valueContainer}
        role="region"
        aria-label={`Auto-calculated ${label}`}
        aria-live="polite"
      >
        {value.length > 0 ? (
          <div className={styles.valueList}>
            {value.map((item, index) => (
              <span key={index} className={styles.valueItem}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          <span className={styles.emptyText}>{emptyText}</span>
        )}
      </div>
    </div>
  );
};