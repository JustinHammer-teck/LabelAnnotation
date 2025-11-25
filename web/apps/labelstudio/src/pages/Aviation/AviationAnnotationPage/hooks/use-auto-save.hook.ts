import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { useAPI } from '../../../../providers/ApiProvider';
import {
  annotationDataAtom,
  annotationDirtyAtom,
  saveStatusAtom,
  lastSavedAtom,
} from '../stores/aviation-annotation.store';
import { AviationAnnotationData } from '../types/aviation.types';
import { isAviationMockEnabled } from '../utils/feature-flags';

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  onSaveSuccess?: (data: AviationAnnotationData) => void;
  onSaveError?: (error: Error) => void;
}

export const useAutoSave = (
  taskId: number | null,
  annotationId: number | null,
  options: UseAutoSaveOptions = {}
) => {
  const api = useAPI();
  const {
    enabled = true,
    debounceMs = 2000,
    onSaveSuccess,
    onSaveError,
  } = options;

  const annotationData = useAtomValue(annotationDataAtom);
  const isDirty = useAtomValue(annotationDirtyAtom);
  const setSaveStatus = useSetAtom(saveStatusAtom);
  const setDirty = useSetAtom(annotationDirtyAtom);
  const setLastSaved = useSetAtom(lastSavedAtom);

  const annotationIdRef = useRef(annotationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    annotationIdRef.current = annotationId;
  }, [annotationId]);

  const saveFunction = useCallback(
    debounce(async (data: AviationAnnotationData, currentTaskId: number) => {
      if (isAviationMockEnabled()) {
        const now = new Date();
        setSaveStatus({ state: 'saved', lastSaved: now, error: null });
        setLastSaved(now);
        setDirty(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setSaveStatus({ state: 'saving', lastSaved: null, error: null });

        const method = annotationIdRef.current ? 'updateAviationAnnotation' : 'createAviationAnnotation';
        const params: any = annotationIdRef.current
          ? { pk: annotationIdRef.current, ...data }
          : { task_id: currentTaskId, ...data };

        const result = await api.callApi<AviationAnnotationData>(method, {
          params,
          signal,
          suppressError: false,
        });

        if (signal.aborted) return;

        if (!result || result.error) {
          throw new Error(result?.error || 'Failed to save annotation');
        }

        const response = result as AviationAnnotationData;

        if (!annotationIdRef.current && response.id) {
          annotationIdRef.current = response.id;
        }

        const now = new Date();
        setSaveStatus({ state: 'saved', lastSaved: now, error: null });
        setLastSaved(now);
        setDirty(false);

        if (onSaveSuccess) {
          onSaveSuccess(response);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || signal.aborted) return;

        console.error('Auto-save error:', error);
        setSaveStatus({
          state: 'error',
          lastSaved: null,
          error: error.message || 'Failed to save changes',
        });

        if (onSaveError) {
          onSaveError(error);
        }
      }
    }, debounceMs),
    [api, debounceMs, setSaveStatus, setLastSaved, setDirty, onSaveSuccess, onSaveError]
  );

  useEffect(() => {
    if (enabled && isDirty && taskId) {
      saveFunction(annotationData, taskId);
    }
  }, [annotationData, isDirty, enabled, taskId, saveFunction]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      saveFunction.cancel();
      saveFunction.flush();
    };
  }, [saveFunction]);

  const saveNow = useCallback(async () => {
    if (!taskId) return;

    if (isAviationMockEnabled()) {
      const now = new Date();
      setSaveStatus({ state: 'saved', lastSaved: now, error: null });
      setLastSaved(now);
      setDirty(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    saveFunction.cancel();

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setSaveStatus({ state: 'saving', lastSaved: null, error: null });

      const method = annotationIdRef.current ? 'updateAviationAnnotation' : 'createAviationAnnotation';
      const params: any = annotationIdRef.current
        ? { pk: annotationIdRef.current, ...annotationData }
        : { task_id: taskId, ...annotationData };

      const result = await api.callApi<AviationAnnotationData>(method, {
        params,
        signal,
        suppressError: false,
      });

      if (signal.aborted) return;

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to save annotation');
      }

      const response = result as AviationAnnotationData;

      if (!annotationIdRef.current && response.id) {
        annotationIdRef.current = response.id;
      }

      const now = new Date();
      setSaveStatus({ state: 'saved', lastSaved: now, error: null });
      setLastSaved(now);
      setDirty(false);

      if (onSaveSuccess) {
        onSaveSuccess(response);
      }

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError' || signal.aborted) return;

      setSaveStatus({
        state: 'error',
        lastSaved: null,
        error: error.message || 'Failed to save changes',
      });

      if (onSaveError) {
        onSaveError(error);
      }

      throw error;
    }
  }, [api, taskId, annotationData, setSaveStatus, setLastSaved, setDirty, onSaveSuccess, onSaveError, saveFunction]);

  const retrySave = useCallback(() => {
    if (taskId && isDirty) {
      saveFunction(annotationData, taskId);
    }
  }, [taskId, isDirty, annotationData, saveFunction]);

  return {
    saveNow,
    retrySave,
    isSaving: useAtomValue(saveStatusAtom).state === 'saving',
  };
};