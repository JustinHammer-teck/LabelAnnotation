import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { HierarchicalSelection, DropdownOption } from '../../types/aviation.types';
import {
  threatOptionsAtom,
  errorOptionsAtom,
  uasOptionsAtom,
  getOptionsByLevel,
  searchHierarchicalOptions,
} from '../../stores/dropdown-options.store';
import styles from './TreeSelectorModal.module.scss';

interface TreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'threat' | 'error' | 'uas';
  value: HierarchicalSelection;
  onConfirm: (selection: HierarchicalSelection, trainingTopics: string[]) => void;
}

export const TreeSelectorModal: React.FC<TreeSelectorModalProps> = ({
  isOpen,
  onClose,
  category,
  value,
  onConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedL1, setSelectedL1] = useState<DropdownOption | null>(null);
  const [selectedL2, setSelectedL2] = useState<DropdownOption | null>(null);
  const [selectedL3, setSelectedL3] = useState<DropdownOption | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get options based on category
  const allOptions = useAtomValue(
    category === 'threat'
      ? threatOptionsAtom
      : category === 'error'
      ? errorOptionsAtom
      : uasOptionsAtom
  );

  // Get options for each level
  const level1Options = useMemo(
    () => getOptionsByLevel(allOptions, 1),
    [allOptions]
  );

  const level2Options = useMemo(
    () => (selectedL1 ? getOptionsByLevel(allOptions, 2, selectedL1.id) : []),
    [allOptions, selectedL1]
  );

  const level3Options = useMemo(
    () => (selectedL2 ? getOptionsByLevel(allOptions, 3, selectedL2.id) : []),
    [allOptions, selectedL2]
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return searchHierarchicalOptions(allOptions, searchTerm);
  }, [allOptions, searchTerm]);

  const findOptionByCode = useCallback(
    (code: string): DropdownOption | null => {
      if (!code) return null;
      return allOptions.find((opt) => opt.code === code) || null;
    },
    [allOptions]
  );

  useEffect(() => {
    if (isOpen && allOptions.length > 0) {
      const l1 = findOptionByCode(value?.level1 || '');
      const l2 = findOptionByCode(value?.level2 || '');
      const l3 = findOptionByCode(value?.level3 || '');
      setSelectedL1(l1);
      setSelectedL2(l2);
      setSelectedL3(l3);
      setSearchTerm('');
    }
  }, [isOpen, value, allOptions, findOptionByCode]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
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

  // Focus trap
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

  const handleSelectL1 = useCallback((option: DropdownOption) => {
    setSelectedL1(option);
    setSelectedL2(null);
    setSelectedL3(null);
  }, []);

  const handleSelectL2 = useCallback((option: DropdownOption) => {
    setSelectedL2(option);
    setSelectedL3(null);
  }, []);

  const handleSelectL3 = useCallback((option: DropdownOption) => {
    setSelectedL3(option);
  }, []);

  const handleSearchResultClick = useCallback(
    (option: DropdownOption) => {
      // Find parent options
      const parent2 = allOptions.find(o => o.id === option.parent_id);
      const parent1 = parent2 ? allOptions.find(o => o.id === parent2.parent_id) : null;

      if (option.level === 3) {
        setSelectedL1(parent1 || null);
        setSelectedL2(parent2 || null);
        setSelectedL3(option);
      } else if (option.level === 2) {
        setSelectedL1(parent1 || null);
        setSelectedL2(option);
        setSelectedL3(null);
      } else {
        setSelectedL1(option);
        setSelectedL2(null);
        setSelectedL3(null);
      }
      setSearchTerm('');
    },
    [allOptions]
  );

  const handleConfirm = useCallback(() => {
    const deepestSelected = selectedL3 || selectedL2 || selectedL1;
    if (!deepestSelected) return;

    const selection: HierarchicalSelection = {
      level1: selectedL1?.code || '',
      level2: selectedL2?.code || '',
      level3: selectedL3?.code || '',
    };

    const trainingTopics = deepestSelected.training_topics || [];

    onConfirm(selection, trainingTopics);
  }, [selectedL1, selectedL2, selectedL3, onConfirm]);

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
        className={styles.treeSelectorModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>
            Select {category.charAt(0).toUpperCase() + category.slice(1)} Type
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

        {selectedL1 && (
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumb}>{selectedL1.label}</span>
            {selectedL2 && (
              <>
                <span className={styles.separator}>›</span>
                <span className={styles.breadcrumb}>{selectedL2.label}</span>
              </>
            )}
            {selectedL3 && (
              <>
                <span className={styles.separator}>›</span>
                <span className={styles.breadcrumb}>{selectedL3.label}</span>
              </>
            )}
          </div>
        )}

        <div className={styles.modalBody}>
          {searchTerm ? (
            <div className={styles.searchResults}>
              {searchResults.length > 0 ? (
                searchResults.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.searchResult}
                    onClick={() => handleSearchResultClick(option)}
                  >
                    <span className={styles.resultCode}>{option.code}</span>
                    <span className={styles.resultLabel}>{option.label}</span>
                  </button>
                ))
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.treeColumn}>
                <h3 className={styles.columnHeader}>Level 1</h3>
                <div className={styles.optionList}>
                  {level1Options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.optionItem} ${
                        selectedL1?.id === option.id ? styles.selected : ''
                      }`}
                      onClick={() => handleSelectL1(option)}
                    >
                      <span className={styles.optionCode}>{option.code}</span>
                      <span className={styles.optionLabel}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.treeColumn}>
                <h3 className={styles.columnHeader}>Level 2</h3>
                <div className={styles.optionList}>
                  {level2Options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.optionItem} ${
                        selectedL2?.id === option.id ? styles.selected : ''
                      }`}
                      onClick={() => handleSelectL2(option)}
                    >
                      <span className={styles.optionCode}>{option.code}</span>
                      <span className={styles.optionLabel}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.treeColumn}>
                <h3 className={styles.columnHeader}>Level 3</h3>
                <div className={styles.optionList}>
                  {level3Options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.optionItem} ${
                        selectedL3?.id === option.id ? styles.selected : ''
                      }`}
                      onClick={() => handleSelectL3(option)}
                    >
                      <span className={styles.optionCode}>{option.code}</span>
                      <span className={styles.optionLabel}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
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
            disabled={!selectedL1}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};