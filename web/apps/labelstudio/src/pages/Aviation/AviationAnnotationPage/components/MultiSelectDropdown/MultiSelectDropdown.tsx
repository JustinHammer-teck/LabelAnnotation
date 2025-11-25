import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MultiSelectDropdownProps } from '../../types/dropdown.types';
import { DropdownOption } from '../../types/aviation.types';
import styles from './MultiSelectDropdown.module.scss';

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  maxChipsDisplay = 3,
  searchable = true,
  disabled = false,
  required = false,
  error,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      option =>
        option.label.toLowerCase().includes(term) ||
        option.code.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  }, [disabled, isOpen]);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      const newValue = value.includes(optionId)
        ? value.filter(v => v !== optionId)
        : [...value, optionId];
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleSelectAll = useCallback(() => {
    const allIds = filteredOptions.map(o => String(o.id));
    onChange(allIds);
  }, [filteredOptions, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleRemoveChip = useCallback(
    (optionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter(v => v !== optionId));
    },
    [value, onChange]
  );

  // Get selected option labels
  const selectedOptions = useMemo(() => {
    return options.filter(option => value.includes(String(option.id)));
  }, [options, value]);

  // Display chips
  const displayChips = useMemo(() => {
    if (selectedOptions.length === 0) return null;

    const displayedOptions = selectedOptions.slice(0, maxChipsDisplay);
    const remaining = selectedOptions.length - maxChipsDisplay;

    return (
      <>
        {displayedOptions.map(option => (
          <span key={option.id} className={styles.chip}>
            {option.label}
            {!disabled && (
              <button
                type="button"
                className={styles.chipRemove}
                onClick={(e) => handleRemoveChip(String(option.id), e)}
                aria-label={`Remove ${option.label}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {remaining > 0 && (
          <span className={styles.chipCount}>+{remaining} more</span>
        )}
      </>
    );
  }, [selectedOptions, maxChipsDisplay, disabled, handleRemoveChip]);

  const triggerClassName = [
    styles.trigger,
    disabled && styles.disabled,
    error && styles.hasError,
    isOpen && styles.open,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.multiSelectDropdown} ref={dropdownRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <button
        type="button"
        className={triggerClassName}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || 'Select options'}
        aria-invalid={!!error}
      >
        <div className={styles.triggerContent}>
          {displayChips || (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>
        <span className={styles.dropdownIcon}>▼</span>
      </button>

      {error && <div className={styles.error}>{error}</div>}

      {isOpen && (
        <div className={styles.dropdownPanel}>
          {searchable && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>

          <div className={styles.optionsList} role="listbox" aria-multiselectable="true">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const optionId = String(option.id);
                const isSelected = value.includes(optionId);

                return (
                  <label
                    key={option.id}
                    className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isSelected}
                      onChange={() => handleSelectOption(optionId)}
                      aria-label={option.label}
                    />
                    <span className={styles.optionContent}>
                      {option.code && (
                        <span className={styles.optionCode}>{option.code}</span>
                      )}
                      <span className={styles.optionLabel}>{option.label}</span>
                    </span>
                  </label>
                );
              })
            ) : (
              <div className={styles.noOptions}>No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};