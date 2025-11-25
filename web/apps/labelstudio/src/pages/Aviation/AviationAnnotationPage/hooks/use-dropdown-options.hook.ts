import { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { useAPI } from '../../../../providers/ApiProvider';
import {
  dropdownOptionsAtom,
  loadingDropdownsAtom,
} from '../stores/aviation-annotation.store';
import {
  threatOptionsAtom,
  errorOptionsAtom,
  uasOptionsAtom,
} from '../stores/dropdown-options.store';
import { DropdownCategory } from '../types/aviation.types';
import { isAviationMockEnabled } from '../utils/feature-flags';
import { mockDropdownOptions } from '../mocks/aviation-mock-data';

interface UseDropdownOptionsResult {
  options: DropdownCategory | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDropdownOptions = (): UseDropdownOptionsResult => {
  const api = useAPI();

  const options = useAtomValue(dropdownOptionsAtom);
  const loading = useAtomValue(loadingDropdownsAtom);

  const setOptions = useSetAtom(dropdownOptionsAtom);
  const setLoading = useSetAtom(loadingDropdownsAtom);
  const setThreatOptions = useSetAtom(threatOptionsAtom);
  const setErrorOptions = useSetAtom(errorOptionsAtom);
  const setUasOptions = useSetAtom(uasOptionsAtom);

  const { data, isLoading, error, refetch } = useQuery<DropdownCategory>({
    queryKey: ['aviation-dropdowns'],
    queryFn: async () => {
      if (isAviationMockEnabled()) {
        return mockDropdownOptions;
      }

      const result = await api.callApi<DropdownCategory>('aviationDropdowns', {
        suppressError: true,
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to fetch dropdown options');
      }

      return result;
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data) {
      setOptions(data);

      if (data.threat) {
        setThreatOptions(data.threat);
      }
      if (data.error) {
        setErrorOptions(data.error);
      }
      if (data.uas) {
        setUasOptions(data.uas);
      }
    }
  }, [data, setOptions, setThreatOptions, setErrorOptions, setUasOptions]);

  return {
    options,
    loading,
    error: error as Error | null,
    refetch,
  };
};