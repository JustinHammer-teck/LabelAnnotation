import { type FC, useState, useCallback, useMemo, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import styles from './tree-selector-modal.module.scss';

export interface TreeSelectorItem {
  id: number;
  label: string;
  description?: string;
}

export interface TreeSelectorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: TreeSelectorItem[];
  selectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
}

export const TreeSelectorModal: FC<TreeSelectorModalProps> = ({
  open,
  onClose,
  title,
  items,
  selectedIds,
  onConfirm,
}) => {
  const titleId = useId();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(new Set(selectedIds));
    }
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';
    previousActiveElement.current = document.activeElement as HTMLElement;

    return () => {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  useEffect(() => {
    if (!open || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabTrap);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTabTrap);
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower),
    );
  }, [items, search]);

  const handleToggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of filteredItems) {
        next.add(item.id);
      }
      return next;
    });
  }, [filteredItems]);

  const handleDeselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selected));
  }, [onConfirm, selected]);

  const handleClose = useCallback(() => {
    setSearch('');
    setSelected(new Set(selectedIds));
    onClose();
  }, [onClose, selectedIds]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={handleClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h3 id={titleId} className={styles.title}>{title}</h3>
          <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} onClick={handleSelectAll}>
            Select All
          </button>
          <button type="button" className={styles.actionButton} onClick={handleDeselectAll}>
            Deselect All
          </button>
          <span className={styles.selectedCount}>{selected.size} selected</span>
        </div>

        <div className={styles.itemList}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>No items found</div>
          ) : (
            filteredItems.map((item) => (
              <label key={item.id} className={styles.item}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selected.has(item.id)}
                  onChange={() => handleToggle(item.id)}
                />
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>{item.label}</span>
                  {item.description && <span className={styles.itemDescription}>{item.description}</span>}
                </div>
              </label>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button type="button" className={styles.confirmButton} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
