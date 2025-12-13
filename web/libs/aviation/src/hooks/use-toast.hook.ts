import { useCallback } from 'react';
import { useToast as useLabelStudioToast, ToastType } from '@humansignal/ui';

export interface UseAviationToastResult {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const useAviationToast = (): UseAviationToastResult | null => {
  const toast = useLabelStudioToast();

  const success = useCallback(
    (message: string, duration = 3000) => {
      toast?.show({ message, type: ToastType.info, duration });
    },
    [toast]
  );

  const error = useCallback(
    (message: string, duration = 5000) => {
      toast?.show({ message, type: ToastType.error, duration });
    },
    [toast]
  );

  const info = useCallback(
    (message: string, duration = 3000) => {
      toast?.show({ message, type: ToastType.info, duration });
    },
    [toast]
  );

  if (!toast) return null;

  return { success, error, info };
};
