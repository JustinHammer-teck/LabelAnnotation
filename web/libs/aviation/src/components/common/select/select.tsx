import { type FC, useRef, useState, useEffect, useCallback } from 'react';
import styles from './select.module.scss';

interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  id?: string;
  value: string | number | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  allowClear?: boolean;
  'aria-label'?: string;
}

export const Select: FC<SelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  error,
  className,
  allowClear = false,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  const handleSelect = useCallback(
    (optionValue: string | number) => {
      onChange(String(optionValue));
      setIsOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.select} ${disabled ? styles.disabled : ''} ${error ? styles.error : ''} ${className || ''}`}
    >
      <button type="button" id={id} className={styles.trigger} onClick={handleToggle} disabled={disabled} aria-label={ariaLabel}>
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={styles.actions}>
          {allowClear && selectedOption && (
            <span className={styles.clearButton} onClick={handleClear} role="button" tabIndex={-1}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </span>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </span>
      </button>

      {isOpen && (
        <ul className={styles.dropdown}>
          {options.map((option) => (
            <li
              key={option.value}
              className={`${styles.option} ${String(option.value) === String(value) ? styles.selected : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
