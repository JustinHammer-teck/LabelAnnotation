import { useCallback, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api';
import { saveStatusAtom, labelingItemsAtom } from '../stores';
import type { LabelingItem } from '../types';

export interface UseAutoSaveOptions {
  debounceMs?: number;
  flushOnUnmount?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useAutoSave = (itemId: number | null, options?: UseAutoSaveOptions) => {
  const api = useAviationApi();
  const [items] = useAtom(labelingItemsAtom);
  const [saveStatus, setSaveStatus] = useAtom(saveStatusAtom);
  const debounceMs = options?.debounceMs ?? 3000;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<Partial<LabelingItem> | null>(null);

  const item = items.find(i => i.id === itemId);

  const executeSave = useCallback(async (data: Partial<LabelingItem>) => {
    if (itemId === null) return;
    setSaveStatus({ state: 'saving', lastSaved: null, error: null });
    try {
      await api.updateItem(itemId, data);
      setSaveStatus({ state: 'saved', lastSaved: new Date(), error: null });
      options?.onSuccess?.();
    } catch (e) {
      const errorMsg = String(e);
      setSaveStatus({ state: 'error', lastSaved: null, error: errorMsg });
      options?.onError?.(errorMsg);
    }
  }, [api, itemId, setSaveStatus, options]);

  const saveImmediately = useCallback((data: Partial<LabelingItem>) => {
    if (itemId === null) return;
    api.updateItem(itemId, data).catch(() => {});
  }, [api, itemId]);

  const debouncedSave = useCallback((data: Partial<LabelingItem>) => {
    pendingDataRef.current = { ...pendingDataRef.current, ...data };
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        executeSave(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, debounceMs);
  }, [debounceMs, executeSave]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingDataRef.current) {
      await executeSave(pendingDataRef.current);
      pendingDataRef.current = null;
    } else {
      // No pending changes - still trigger success callback for user feedback
      options?.onSuccess?.();
    }
  }, [executeSave, options]);

  useEffect(() => {
    const flushOnUnmount = options?.flushOnUnmount !== false;
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingDataRef.current && flushOnUnmount) {
        saveImmediately(pendingDataRef.current);
      }
    };
  }, [options?.flushOnUnmount, saveImmediately]);

  return {
    item,
    saveStatus,
    debouncedSave,
    saveNow,
  };
};
