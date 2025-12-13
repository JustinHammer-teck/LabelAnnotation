import { useState, useEffect, useMemo } from 'react';
import { useAviationApi } from '../api';
import type { DropdownOption } from '../types';

export interface CopingAbilityOption {
  value: string;
  label: string;
}

export interface CopingAbilityGroup {
  code: string;
  label: string;
  options: CopingAbilityOption[];
}

export interface UseCopingAbilitiesResult {
  loading: boolean;
  error: string | null;
  groups: CopingAbilityGroup[];
  flatOptions: CopingAbilityOption[];
}

/**
 * Hook to fetch and transform coping abilities from the API
 *
 * Reference: Label Library ThreatModule.js:67-79
 * Transforms API response into hierarchical group structure matching
 * the label library's TreeSelect format.
 *
 * API Endpoint: GET /api/aviation/types/hierarchy/?category=coping
 *
 * @returns {UseCopingAbilitiesResult} Groups, flat options, loading state, and error
 */
export const useCopingAbilities = (): UseCopingAbilitiesResult => {
  const api = useAviationApi();
  const [rawOptions, setRawOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getTypeHierarchy('coping')
      .then((data) => {
        setRawOptions(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [api]);

  const groups = useMemo((): CopingAbilityGroup[] => {
    return rawOptions
      .filter((opt) => opt.level === 1)
      .map((group) => ({
        code: group.code,
        label: group.label_zh || group.label,
        options: (group.children || []).map((child) => ({
          value: child.code,
          label: child.label_zh || child.label,
        })),
      }));
  }, [rawOptions]);

  const flatOptions = useMemo((): CopingAbilityOption[] => {
    return groups.flatMap((group) => group.options);
  }, [groups]);

  return {
    loading,
    error,
    groups,
    flatOptions,
  };
};
