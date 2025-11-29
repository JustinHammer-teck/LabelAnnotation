import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DropdownOption } from '../../types/aviation.types';
import styles from './SelectModal.module.scss';

interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: DropdownOption[];
  value: string;
  onConfirm: (value: string) => void;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  isOpen,
  onClose,
  title,
  options,
  value,
  onConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValue, setSelectedValue] = useState<string>(value);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedValue(value);
      setSearchTerm('');
      searchInputRef.current?.focus();
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.code.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const handleSelect = useCallback((option: DropdownOption) => {
    setSelectedValue(option.code);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedValue);
    onClose();
  }, [selectedValue, onConfirm, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={styles.selectModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.modalBody}>
          {filteredOptions.length > 0 ? (
            <div className={styles.optionList}>
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.optionItem} ${
                    selectedValue === option.code ? styles.selected : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <span className={styles.optionCode}>{option.code}</span>
                  <span className={styles.optionLabel}>{option.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!selectedValue}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
