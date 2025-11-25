import React, { useState, useCallback, useMemo } from 'react';
import { HierarchicalDropdownProps } from '../../types/dropdown.types';
import { HierarchicalSelection, DropdownOption } from '../../types/aviation.types';
import { TreeSelectorModal } from './TreeSelectorModal';
import { formatPathString } from '../../stores/dropdown-options.store';
import styles from './HierarchicalDropdown.module.scss';

export const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({
  category,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select option...',
  error,
  label,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayValue = useMemo(() => {
    if (!value || !value.fullPath) {
      return '';
    }
    return value.fullPath;
  }, [value]);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleConfirm = useCallback(
    (selection: HierarchicalSelection) => {
      onChange(selection);
      setIsModalOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange({
        level1: null,
        level2: null,
        level3: null,
        fullPath: '',
      });
    },
    [onChange]
  );

  const triggerClassName = [
    styles.hierarchicalTrigger,
    disabled && styles.disabled,
    error && styles.hasError,
    displayValue && styles.hasValue,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.hierarchicalDropdown}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <button
        type="button"
        role="combobox"
        aria-expanded={isModalOpen}
        aria-haspopup="dialog"
        aria-label={`Select ${category} type (3 levels)`}
        aria-invalid={!!error}
        className={triggerClassName}
        onClick={handleOpen}
        disabled={disabled}
      >
        <span className={styles.triggerContent}>
          {displayValue ? (
            <span className={styles.selectionPath}>{displayValue}</span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>

        <div className={styles.triggerActions}>
          {displayValue && !disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
          <span className={styles.dropdownIcon}>▼</span>
        </div>
      </button>

      {error && <div className={styles.error}>{error}</div>}

      {isModalOpen && (
        <TreeSelectorModal
          isOpen={isModalOpen}
          onClose={handleClose}
          category={category}
          value={value}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};