import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce, DebouncedFunc } from 'lodash';
import { useAPI } from '../../../../providers/ApiProvider';
import {
  annotationDataAtom,
  annotationDirtyAtom,
  saveStatusAtom,
  lastSavedAtom,
} from '../stores/aviation-annotation.store';
import { AviationAnnotationData } from '../types/aviation.types';

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
  const onSaveSuccessRef = useRef(onSaveSuccess);
  const onSaveErrorRef = useRef(onSaveError);

  useEffect(() => {
    annotationIdRef.current = annotationId;
  }, [annotationId]);

  useEffect(() => {
    onSaveSuccessRef.current = onSaveSuccess;
    onSaveErrorRef.current = onSaveError;
  }, [onSaveSuccess, onSaveError]);

  const saveFunction = useMemo<DebouncedFunc<(data: AviationAnnotationData, currentTaskId: number) => Promise<void>>>(
    () => debounce(async (data: AviationAnnotationData, currentTaskId: number) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setSaveStatus({ state: 'saving', lastSaved: null, error: null });

        const method = annotationIdRef.current ? 'updateAviationAnnotation' : 'createAviationAnnotation';
        const isUpdate = !!annotationIdRef.current;
        const bodyData = isUpdate ? data : { task_id: currentTaskId, ...data };

        const result = await api.callApi<AviationAnnotationData>(method, {
          params: isUpdate ? { pk: annotationIdRef.current } : {},
          body: bodyData,
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

        if (onSaveSuccessRef.current) {
          onSaveSuccessRef.current(response);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || signal.aborted) return;

        console.error('Auto-save error:', error);
        setSaveStatus({
          state: 'error',
          lastSaved: null,
          error: error.message || 'Failed to save changes',
        });

        if (onSaveErrorRef.current) {
          onSaveErrorRef.current(error);
        }
      }
    }, debounceMs),
    [api, debounceMs, setSaveStatus, setLastSaved, setDirty]
  );

  useEffect(() => {
    if (enabled && isDirty && taskId) {
      saveFunction(annotationData, taskId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- annotationData and saveFunction intentionally omitted to prevent repeated saves on every data change; isDirty flag controls when saves trigger
  }, [isDirty, enabled, taskId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      saveFunction.cancel();
    };
  }, [saveFunction]);

  const saveNow = useCallback(async () => {
    if (!taskId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    saveFunction.cancel();

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setSaveStatus({ state: 'saving', lastSaved: null, error: null });

      const method = annotationIdRef.current ? 'updateAviationAnnotation' : 'createAviationAnnotation';
      const isUpdate = !!annotationIdRef.current;
      const bodyData = isUpdate ? annotationData : { task_id: taskId, ...annotationData };

      const result = await api.callApi<AviationAnnotationData>(method, {
        params: isUpdate ? { pk: annotationIdRef.current } : {},
        body: bodyData,
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