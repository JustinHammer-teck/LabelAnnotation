import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api';
import { performancesAtom, performancesLoadingAtom, performancesErrorAtom } from '../stores';
import type { ResultPerformance, CreateResultPerformanceData, LinkItemsData } from '../types';

export const usePerformances = (projectId: number) => {
  const api = useAviationApi();
  const [performances, setPerformances] = useAtom(performancesAtom);
  const [loading, setLoading] = useAtom(performancesLoadingAtom);
  const [error, setError] = useAtom(performancesErrorAtom);

  const fetchPerformances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPerformances(projectId);
      setPerformances(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, projectId, setPerformances, setLoading, setError]);

  const createPerformance = useCallback(async (data: CreateResultPerformanceData) => {
    setLoading(true);
    setError(null);
    try {
      const newPerformance = await api.createPerformance(projectId, data);
      setPerformances(prev => [...prev, newPerformance]);
      return newPerformance;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, projectId, setPerformances, setLoading, setError]);

  const updatePerformance = useCallback(async (id: number, data: Partial<ResultPerformance>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updatePerformance(id, data);
      setPerformances(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, setPerformances, setLoading, setError]);

  const deletePerformance = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.deletePerformance(id);
      setPerformances(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, setPerformances, setLoading, setError]);

  const linkItems = useCallback(async (performanceId: number, data: LinkItemsData) => {
    setLoading(true);
    setError(null);
    try {
      await api.linkItems(performanceId, data);
      setPerformances(prev => prev.map(p => {
        if (p.id === performanceId) {
          return { ...p, linked_items: [...new Set([...p.linked_items, ...data.item_ids])] };
        }
        return p;
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, setPerformances, setLoading, setError]);

  const unlinkItems = useCallback(async (performanceId: number, itemIds: number[]) => {
    setLoading(true);
    setError(null);
    try {
      await api.unlinkItems(performanceId, itemIds);
      setPerformances(prev => prev.map(p => {
        if (p.id === performanceId) {
          return { ...p, linked_items: p.linked_items.filter(id => !itemIds.includes(id)) };
        }
        return p;
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, setPerformances, setLoading, setError]);

  return {
    performances,
    loading,
    error,
    fetchPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
    linkItems,
    unlinkItems,
  };
};
