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
    queryKey: ['aviation-dropdowns-all'],
    queryFn: async () => {
      const result = await api.callApi<DropdownCategory>('aviationDropdownsAll', {
        suppressError: true,
      });

      if (!result) {
        throw new Error('Failed to fetch dropdown options');
      }

      if ('status_code' in result && (result as any).status_code >= 400) {
        throw new Error((result as any).detail || 'Failed to fetch dropdown options');
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
      if (data.error_type) {
        setErrorOptions(data.error_type);
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