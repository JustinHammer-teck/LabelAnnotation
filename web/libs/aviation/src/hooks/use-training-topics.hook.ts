import { useMemo } from 'react';
import { useDropdownOptions } from './use-dropdown-options.hook';
import type { LabelingItem, DropdownOption } from '../types';

function findTopicsForLevel3Id(options: DropdownOption[], level3Id: number | null): string[] {
  if (!level3Id) return [];

  const findInTree = (nodes: DropdownOption[]): string[] => {
    for (const node of nodes) {
      if (node.level === 3 && node.id === level3Id) {
        return node.training_topics ?? [];
      }
      if (node.children) {
        const found = findInTree(node.children);
        if (found.length > 0) return found;
      }
    }
    return [];
  };

  return findInTree(options);
}

export interface TrainingTopics {
  threat: string[];
  error: string[];
  uas: string[];
  all: string[];
}

export const useTrainingTopics = (item: LabelingItem | null): TrainingTopics => {
  const { options: threatOptions } = useDropdownOptions('threat');
  const { options: errorOptions } = useDropdownOptions('error');
  const { options: uasOptions } = useDropdownOptions('uas');

  const topics = useMemo(() => {
    if (!item) {
      return { threat: [], error: [], uas: [], all: [] };
    }

    const threatTopics = findTopicsForLevel3Id(threatOptions, item.threat_type_l3);
    const errorTopics = findTopicsForLevel3Id(errorOptions, item.error_type_l3);
    const uasTopics = findTopicsForLevel3Id(uasOptions, item.uas_type_l3);

    const all = [...new Set([...threatTopics, ...errorTopics, ...uasTopics])];

    return {
      threat: threatTopics,
      error: errorTopics,
      uas: uasTopics,
      all,
    };
  }, [item, threatOptions, errorOptions, uasOptions]);

  return topics;
};
