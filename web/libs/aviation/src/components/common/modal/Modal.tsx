import { type FC, type ReactNode, useEffect, useCallback, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.scss';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onClose],
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        focusableElements?.[0]?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  const modalContent = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${className || ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M12 2L2 12M2 2L12 12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
