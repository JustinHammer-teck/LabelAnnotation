import { type FC, useRef, useState, useEffect, useCallback, useMemo, useId } from 'react';
import type { DropdownOption, HierarchicalSelection } from '../../../types/dropdown.types';
import styles from './hierarchical-dropdown.module.scss';

export interface HierarchicalDropdownProps {
  id?: string;
  category: 'threat' | 'error' | 'uas';
  value: HierarchicalSelection | null;
  onChange: (value: HierarchicalSelection | null) => void;
  options: DropdownOption[];
  disabled?: boolean;
  error?: string;
}

export const HierarchicalDropdown: FC<HierarchicalDropdownProps> = ({
  id: externalId,
  category,
  value,
  onChange,
  options,
  disabled = false,
  error,
}) => {
  const generatedId = useId();
  const dropdownId = externalId ?? generatedId;
  const listboxId = `${dropdownId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedL1, setSelectedL1] = useState<string | null>(value?.level1 ?? null);
  const [selectedL2, setSelectedL2] = useState<string | null>(value?.level2 ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  const l1Options = useMemo(() => options.filter((opt) => opt.level === 1), [options]);

  const l2Options = useMemo(() => {
    if (!selectedL1) return [];
    const parent = options.find((opt) => opt.code === selectedL1);
    return parent?.children ?? [];
  }, [options, selectedL1]);

  const l3Options = useMemo(() => {
    if (!selectedL2) return [];
    const parent = l2Options.find((opt) => opt.code === selectedL2);
    return parent?.children ?? [];
  }, [l2Options, selectedL2]);

  const selectedPath = useMemo(() => {
    if (!value?.level1) return null;
    const l1 = options.find((opt) => opt.code === value.level1);
    if (!l1) return null;

    const parts = [l1.label];
    if (value.level2 && l1.children) {
      const l2 = l1.children.find((opt) => opt.code === value.level2);
      if (l2) {
        parts.push(l2.label);
        if (value.level3 && l2.children) {
          const l3 = l2.children.find((opt) => opt.code === value.level3);
          if (l3) parts.push(l3.label);
        }
      }
    }
    return parts.join(' > ');
  }, [value, options]);

  useEffect(() => {
    setSelectedL1(value?.level1 ?? null);
    setSelectedL2(value?.level2 ?? null);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  const handleL1Select = useCallback((code: string) => {
    setSelectedL1(code);
    setSelectedL2(null);
    onChange({
      level1: code,
      level2: null,
      level3: null,
    });
  }, [onChange]);

  const handleL2Select = useCallback((code: string) => {
    setSelectedL2(code);
    if (selectedL1) {
      onChange({
        level1: selectedL1,
        level2: code,
        level3: null,
      });
    }
  }, [onChange, selectedL1]);

  const handleL3Select = useCallback(
    (code: string) => {
      if (selectedL1 === null || selectedL2 === null) return;
      onChange({
        level1: selectedL1,
        level2: selectedL2,
        level3: code,
      });
      setIsOpen(false);
    },
    [onChange, selectedL1, selectedL2],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setSelectedL1(null);
      setSelectedL2(null);
    },
    [onChange],
  );

  const handleOptionKeyDown = useCallback(
    (event: React.KeyboardEvent, handler: () => void) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler();
      }
    },
    [],
  );

  const triggerClasses = [
    styles.trigger,
    disabled ? styles.disabled : '',
    error ? styles.error : '',
    isOpen ? styles.open : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.triggerWrapper}>
        <button
          type="button"
          id={dropdownId}
          className={triggerClasses}
          onClick={handleToggle}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
        >
          <span className={`${styles.triggerText} ${!selectedPath ? styles.placeholder : ''}`}>
            {selectedPath || `Select ${category} type...`}
          </span>
          <span className={`${styles.triggerIcon} ${isOpen ? styles.open : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </button>
        {value && !disabled && (
          <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Clear selection">
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div id={listboxId} className={styles.dropdown} role="listbox">
          <div className={styles.column}>
            <div className={styles.columnHeader}>Level 1</div>
            {l1Options.length === 0 ? (
              <div className={styles.emptyColumn}>No options</div>
            ) : (
              l1Options.map((opt) => (
                <div
                  key={opt.id}
                  role="option"
                  tabIndex={0}
                  aria-selected={opt.code === selectedL1}
                  className={`${styles.option} ${opt.code === selectedL1 ? styles.selected : ''} ${opt.children?.length ? styles.hasChildren : ''}`}
                  onClick={() => handleL1Select(opt.code)}
                  onKeyDown={(e) => handleOptionKeyDown(e, () => handleL1Select(opt.code))}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionCode}>{opt.code}</span>
                </div>
              ))
            )}
          </div>

          <div className={styles.column}>
            <div className={styles.columnHeader}>Level 2</div>
            {!selectedL1 ? (
              <div className={styles.emptyColumn}>Select Level 1 first</div>
            ) : l2Options.length === 0 ? (
              <div className={styles.emptyColumn}>No options</div>
            ) : (
              l2Options.map((opt) => (
                <div
                  key={opt.id}
                  role="option"
                  tabIndex={0}
                  aria-selected={opt.code === selectedL2}
                  className={`${styles.option} ${opt.code === selectedL2 ? styles.selected : ''} ${opt.children?.length ? styles.hasChildren : ''}`}
                  onClick={() => handleL2Select(opt.code)}
                  onKeyDown={(e) => handleOptionKeyDown(e, () => handleL2Select(opt.code))}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionCode}>{opt.code}</span>
                </div>
              ))
            )}
          </div>

          <div className={styles.column}>
            <div className={styles.columnHeader}>Level 3</div>
            {!selectedL2 ? (
              <div className={styles.emptyColumn}>Select Level 2 first</div>
            ) : l3Options.length === 0 ? (
              <div className={styles.emptyColumn}>No options</div>
            ) : (
              l3Options.map((opt) => (
                <div
                  key={opt.id}
                  role="option"
                  tabIndex={0}
                  aria-selected={opt.code === value?.level3}
                  className={`${styles.option} ${opt.code === value?.level3 ? styles.selected : ''}`}
                  onClick={() => handleL3Select(opt.code)}
                  onKeyDown={(e) => handleOptionKeyDown(e, () => handleL3Select(opt.code))}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  <span className={styles.optionCode}>{opt.code}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
