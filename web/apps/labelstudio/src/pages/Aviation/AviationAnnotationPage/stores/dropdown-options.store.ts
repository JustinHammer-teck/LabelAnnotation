import { atom } from 'jotai';
import { DropdownOption } from '../types/aviation.types';

// Build hierarchical tree structure from flat list
export const buildHierarchicalTree = (options: DropdownOption[]): DropdownOption[] => {
  const map = new Map<number, DropdownOption>();
  const roots: DropdownOption[] = [];

  // First pass: create map
  options.forEach(option => {
    map.set(option.id, { ...option, children: [] });
  });

  // Second pass: build tree
  options.forEach(option => {
    const node = map.get(option.id);
    if (!node) return;

    if (option.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(option.parent_id);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    }
  });

  return roots;
};

// Threat hierarchy atom
export const threatOptionsAtom = atom<DropdownOption[]>([]);
export const threatTreeAtom = atom((get) => buildHierarchicalTree(get(threatOptionsAtom)));

// Error hierarchy atom
export const errorOptionsAtom = atom<DropdownOption[]>([]);
export const errorTreeAtom = atom((get) => buildHierarchicalTree(get(errorOptionsAtom)));

// UAS hierarchy atom
export const uasOptionsAtom = atom<DropdownOption[]>([]);
export const uasTreeAtom = atom((get) => buildHierarchicalTree(get(uasOptionsAtom)));

// Search function for hierarchical options
export const searchHierarchicalOptions = (
  options: DropdownOption[],
  searchTerm: string
): DropdownOption[] => {
  const term = searchTerm.toLowerCase();
  const results: DropdownOption[] = [];

  const search = (items: DropdownOption[], parent?: DropdownOption) => {
    items.forEach(item => {
      const matches =
        item.label.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term);

      if (matches) {
        results.push(item);
      }

      if (item.children && item.children.length > 0) {
        search(item.children, item);
      }
    });
  };

  search(options);
  return results;
};

// Get options by level
export const getOptionsByLevel = (
  options: DropdownOption[],
  level: 1 | 2 | 3,
  parentId?: number
): DropdownOption[] => {
  return options.filter(option => {
    if (option.level !== level) return false;
    if (level === 1) return option.parent_id === null;
    return option.parent_id === parentId;
  });
};

// Find option by ID
export const findOptionById = (
  options: DropdownOption[],
  id: number
): DropdownOption | null => {
  for (const option of options) {
    if (option.id === id) return option;
    if (option.children) {
      const found = findOptionById(option.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Get full path for an option
export const getOptionPath = (
  options: DropdownOption[],
  targetId: number
): DropdownOption[] => {
  const path: DropdownOption[] = [];

  const findPath = (items: DropdownOption[], currentPath: DropdownOption[]): boolean => {
    for (const item of items) {
      if (item.id === targetId) {
        path.push(...currentPath, item);
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (findPath(item.children, [...currentPath, item])) {
          return true;
        }
      }
    }
    return false;
  };

  findPath(options, []);
  return path;
};

// Format path string
export const formatPathString = (path: DropdownOption[]): string => {
  return path.map(option => option.code || option.label).join(' > ');
};