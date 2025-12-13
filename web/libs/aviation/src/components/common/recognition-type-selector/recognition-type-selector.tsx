import { type FC, type ReactNode, useId } from 'react';
import type { DropdownOption, HierarchicalSelection } from '../../../types/dropdown.types';
import { HierarchicalDropdown } from '../hierarchical-dropdown';
import styles from './recognition-type-selector.module.scss';

export interface RecognitionTypeSelectorProps {
  category: 'threat' | 'error' | 'uas';
  label: string;
  typeSelection: HierarchicalSelection | null;
  onTypeChange: (value: HierarchicalSelection | null) => void;
  options: DropdownOption[];
  relatedFields?: ReactNode;
  disabled?: boolean;
  error?: string;
}

export const RecognitionTypeSelector: FC<RecognitionTypeSelectorProps> = ({
  category,
  label,
  typeSelection,
  onTypeChange,
  options,
  relatedFields,
  disabled = false,
  error,
}) => {
  const dropdownId = useId();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label htmlFor={dropdownId} className={styles.label}>{label}</label>
      </div>

      <div className={styles.typeSelection}>
        <HierarchicalDropdown
          id={dropdownId}
          category={category}
          value={typeSelection}
          onChange={onTypeChange}
          options={options}
          disabled={disabled}
          error={error}
        />
      </div>

      {relatedFields && <div className={styles.relatedFields}>{relatedFields}</div>}
    </div>
  );
};
