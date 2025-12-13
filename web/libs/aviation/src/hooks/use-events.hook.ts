import { useCallback, useState } from 'react';
import { useAviationApi } from '../api';
import type { AviationEvent } from '../types';

export const useEvents = (projectId: number) => {
  const api = useAviationApi();
  const [events, setEvents] = useState<AviationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvents(projectId);
      setEvents(data);
      return data;
    } catch (e) {
      setError(String(e));
      return [];
    } finally {
      setLoading(false);
    }
  }, [api, projectId]);

  return {
    events,
    loading,
    error,
    fetchEvents,
  };
};
