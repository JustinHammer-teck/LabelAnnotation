import React from 'react';
import styles from './FieldRow.module.scss';

interface FieldRowProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  description?: string;
}

export const FieldRow: React.FC<FieldRowProps> = ({
  label,
  required = false,
  error,
  children,
  fullWidth = false,
  description,
}) => {
  const rowClassName = [
    styles.fieldRow,
    fullWidth && styles.fullWidth,
    error && styles.hasError,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClassName}>
      <div className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}>*</span>}
        {description && <div className={styles.description}>{description}</div>}
      </div>
      <div className={styles.fieldControl}>
        {children}
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
};