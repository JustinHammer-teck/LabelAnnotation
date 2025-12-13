import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api';
import { dropdownOptionsAtom, dropdownLoadingAtom } from '../stores';
import type { DropdownCategory, DropdownOption } from '../types';

export const useDropdownOptions = (category: DropdownCategory) => {
  const api = useAviationApi();
  const [allOptions, setAllOptions] = useAtom(dropdownOptionsAtom);
  const [globalLoading] = useAtom(dropdownLoadingAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = allOptions[category];
    if (cached) return;

    setLoading(true);
    setError(null);
    api.getTypeHierarchy(category)
      .then(options => {
        setAllOptions(prev => ({ ...prev, [category]: options }));
      })
      .catch(e => {
        setError(String(e));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, api]);

  return {
    options: allOptions[category] ?? [],
    loading: loading || globalLoading,
    error,
  };
};

export const useSearchTypes = () => {
  const api = useAviationApi();
  const [results, setResults] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, category?: DropdownCategory) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchTypes(query, category);
      setResults(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    search,
  };
};
