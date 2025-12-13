import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api';
import { currentEventAtom, eventLoadingAtom, eventErrorAtom } from '../stores';
import type { AviationEvent } from '../types';

export const useEvent = () => {
  const api = useAviationApi();
  const [currentEvent, setCurrentEvent] = useAtom(currentEventAtom);
  const [loading, setLoading] = useAtom(eventLoadingAtom);
  const [error, setError] = useAtom(eventErrorAtom);

  const fetchEvent = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvent(id);
      setCurrentEvent(data);
      return data;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, setCurrentEvent, setLoading, setError]);

  const updateEvent = useCallback(async (id: number, data: Partial<AviationEvent>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateEvent(id, data);
      setCurrentEvent(updated);
      return updated;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, setCurrentEvent, setLoading, setError]);

  return {
    currentEvent,
    loading,
    error,
    fetchEvent,
    updateEvent,
    setCurrentEvent,
  };
};
