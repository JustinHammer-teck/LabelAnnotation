export interface HierarchicalDropdownProps {
  category: 'threat' | 'error' | 'uas';
  value: HierarchicalSelection | null;
  onChange: (selection: HierarchicalSelection) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  label?: string;
}

export interface MultiSelectDropdownProps {
  options: DropdownOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxChipsDisplay?: number;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  title?: string;
}

export interface TreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: DropdownOption[];
  value: HierarchicalSelection | null;
  onConfirm: (selection: HierarchicalSelection) => void;
  category: string;
}

export interface SingleSelectDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
}

import { HierarchicalSelection, DropdownOption } from './aviation.types';

export interface TreeLevel {
  level: 1 | 2 | 3;
  options: DropdownOption[];
  selectedId: number | null;
  onSelect: (option: DropdownOption) => void;
  searchTerm?: string;
}