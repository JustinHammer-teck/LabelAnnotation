import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MultiSelectDropdownProps } from '../../types/dropdown.types';
import { DropdownOption } from '../../types/aviation.types';
import { FormattingUtil } from '../../utils/formatting.util';
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
  title,
}) => {
  const safeValue = Array.isArray(value) ? value : [];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingValue, setPendingValue] = useState<string[]>(safeValue);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPendingValue(Array.isArray(value) ? value : []);
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      option =>
        option.label.toLowerCase().includes(term) ||
        option.code.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const selectedOptions = useMemo(() => {
    return options.filter(option => pendingValue.includes(String(option.id)));
  }, [options, pendingValue]);

  const unselectedOptions = useMemo(() => {
    return filteredOptions.filter(option => !pendingValue.includes(String(option.id)));
  }, [filteredOptions, pendingValue]);

  const displaySelectedOptions = useMemo(() => {
    return options.filter(option => safeValue.includes(String(option.id)));
  }, [options, safeValue]);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    previousFocusRef.current?.focus();
  }, []);

  const handleConfirm = useCallback(() => {
    onChange(pendingValue);
    handleClose();
  }, [pendingValue, onChange, handleClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleSelectOption = useCallback((optionId: string) => {
    setPendingValue(prev =>
      prev.includes(optionId)
        ? prev.filter(v => v !== optionId)
        : [...prev, optionId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredOptions.map(o => String(o.id));
    setPendingValue(allIds);
  }, [filteredOptions]);

  const handleClearAll = useCallback(() => {
    setPendingValue([]);
  }, []);

  const handleRemoveChip = useCallback(
    (optionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(safeValue.filter(v => v !== optionId));
    },
    [safeValue, onChange]
  );

  const displayChips = useMemo(() => {
    if (displaySelectedOptions.length === 0) return null;

    const displayedOptions = displaySelectedOptions.slice(0, maxChipsDisplay);
    const remaining = displaySelectedOptions.length - maxChipsDisplay;

    return (
      <>
        {displayedOptions.map(option => (
          <span key={option.id} className={styles.chip} title={option.label}>
            {FormattingUtil.truncateText(option.label, 15)}
            {!disabled && (
              <span
                role="button"
                tabIndex={0}
                className={styles.chipRemove}
                onClick={(e) => handleRemoveChip(String(option.id), e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRemoveChip(String(option.id), e as unknown as React.MouseEvent);
                  }
                }}
                aria-label={`Remove ${option.label}`}
              >
                ×
              </span>
            )}
          </span>
        ))}
        {remaining > 0 && (
          <span className={styles.chipCount}>+{remaining} more</span>
        )}
      </>
    );
  }, [displaySelectedOptions, maxChipsDisplay, disabled, handleRemoveChip]);

  const triggerClassName = [
    styles.trigger,
    disabled && styles.disabled,
    error && styles.hasError,
    isOpen && styles.open,
  ]
    .filter(Boolean)
    .join(' ');

  const modalTitle = title || label || 'Select Options';

  return (
    <div className={styles.multiSelectDropdown}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <button
        type="button"
        className={triggerClassName}
        onClick={handleOpen}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
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

      {isOpen && createPortal(
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="multiselect-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="multiselect-modal-title" className={styles.modalTitle}>
                {modalTitle}
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {searchable && (
              <div className={styles.searchBar}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <span className={styles.selectionCount}>
                {pendingValue.length} selected
              </span>
            </div>

            <div className={styles.optionsList} role="listbox" aria-multiselectable="true">
              {selectedOptions.length > 0 && (
                <div className={styles.selectedSection}>
                  <div className={styles.sectionLabel}>Selected</div>
                  {selectedOptions.map(option => {
                    const optionId = String(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`${styles.option} ${styles.selected}`}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={true}
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
                  })}
                </div>
              )}

              {unselectedOptions.length > 0 ? (
                <div className={styles.unselectedSection}>
                  {selectedOptions.length > 0 && (
                    <div className={styles.sectionLabel}>Available</div>
                  )}
                  {unselectedOptions.map(option => {
                    const optionId = String(option.id);
                    return (
                      <label key={option.id} className={styles.option}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={false}
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
                  })}
                </div>
              ) : (
                filteredOptions.length === 0 && (
                  <div className={styles.noOptions}>No options found</div>
                )
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
