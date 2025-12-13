import { type FC, useRef, useState, useEffect, useCallback, useId } from 'react';
import styles from './multi-select.module.scss';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectOptionGroup {
  code: string;
  label: string;
  options: MultiSelectOption[];
}

export interface MultiSelectProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  groups?: MultiSelectOptionGroup[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const MultiSelect: FC<MultiSelectProps> = ({
  id,
  value,
  onChange,
  options,
  groups,
  placeholder = 'Select...',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    },
    [onChange, value],
  );

  const handleRemove = useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== optionValue));
    },
    [onChange, value],
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, optionValue: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(optionValue);
      }
    },
    [handleSelect],
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
      className={`${styles.multiSelect} ${disabled ? styles.disabled : ''} ${className || ''}`}
    >
      <div
        id={id}
        className={styles.trigger}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        aria-controls={listboxId}
        aria-label={ariaLabel}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span key={option.value} className={styles.chip}>
              {option.label}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={(e) => handleRemove(option.value, e)}
                disabled={disabled}
                aria-label={`Remove ${option.label}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M8 2L2 8M2 2L8 8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </span>
          ))
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <ul className={styles.dropdown} role="listbox" id={listboxId}>
          {groups && groups.length > 0
            ? groups.map((group) => (
                <li key={group.code} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <span className={styles.groupCode}>{group.code}</span>
                    <span className={styles.groupLabel}>{group.label}</span>
                  </div>
                  <ul className={styles.groupOptions}>
                    {group.options.map((option) => {
                      const isSelected = value.includes(option.value);
                      return (
                        <li
                          key={option.value}
                          className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                          onClick={() => handleSelect(option.value)}
                          onKeyDown={(e) => handleOptionKeyDown(e, option.value)}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={0}
                        >
                          <span className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            )}
                          </span>
                          {option.label}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            : options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <li
                    key={option.value}
                    className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => handleOptionKeyDown(e, option.value)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                  >
                    <span className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </li>
                );
              })}
        </ul>
      )}
    </div>
  );
};
