import { type FC, useRef, useEffect, useCallback, useId } from 'react';
import styles from './text-area.module.scss';

export interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  error?: string;
  autoResize?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const TextArea: FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  error,
  autoResize = false,
  className,
  id,
  'aria-label': ariaLabel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generatedErrorId = useId();
  const errorId = error ? generatedErrorId : undefined;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && autoResize) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [autoResize]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className={`${styles.textArea} ${error ? styles.error : ''} ${className || ''}`}>
      <textarea
        ref={textareaRef}
        id={id}
        className={`${styles.input} ${autoResize ? styles.autoResize : ''}`}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
      {error && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
