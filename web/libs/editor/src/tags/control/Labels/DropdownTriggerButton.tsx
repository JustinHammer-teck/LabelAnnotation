import React, { FC } from 'react';
import styles from './DropdownTriggerButton.module.scss';

interface LabelType {
  id: string;
  value: string;
  _value?: string;
  background?: string;
}

interface DropdownTriggerButtonProps {
  selectedLabels: LabelType[];
  placeholder?: string;
  disabled?: boolean;
}

export const DropdownTriggerButton: FC<DropdownTriggerButtonProps> = ({
  selectedLabels,
  placeholder = 'Select label...',
  disabled = false,
}) => {
  const hasSelection = selectedLabels.length > 0;
  const showMultipleIndicator = selectedLabels.length > 2;
  const visibleLabels = selectedLabels.slice(0, 2);
  const remainingCount = selectedLabels.length - 2;

  return (
    <div className={`${styles.trigger} ${disabled ? styles['trigger--disabled'] : ''}`}>
      {!hasSelection && (
        <span className={styles.placeholder}>{placeholder}</span>
      )}

      {hasSelection && (
        <div className={styles.selection}>
          {visibleLabels.map((label) => (
            <div key={label.id} className={styles['label-item']}>
              {label.background && (
                <div
                  className={styles['color-indicator']}
                  style={{ backgroundColor: label.background }}
                />
              )}
              <span className={styles['label-text']}>{label._value || label.value}</span>
            </div>
          ))}
          {showMultipleIndicator && (
            <span className={styles.more}>+{remainingCount} more</span>
          )}
        </div>
      )}

      <svg
        className={styles.arrow}
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
