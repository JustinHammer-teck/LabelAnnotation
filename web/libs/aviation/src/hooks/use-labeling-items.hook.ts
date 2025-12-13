import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api';
import { labelingItemsAtom, currentItemIndexAtom, itemsDirtyAtom, itemsLoadingAtom } from '../stores';
import type { LabelingItem, CreateLabelingItemData } from '../types';

export const useLabelingItems = (eventId: number) => {
  const api = useAviationApi();
  const [items, setItems] = useAtom(labelingItemsAtom);
  const [currentIndex, setCurrentIndex] = useAtom(currentItemIndexAtom);
  const [isDirty, setIsDirty] = useAtom(itemsDirtyAtom);
  const [loading, setLoading] = useAtom(itemsLoadingAtom);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getItems(eventId);
      setItems(data);
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [api, eventId, setItems, setIsDirty, setLoading]);

  const addItem = useCallback(async (data?: Partial<CreateLabelingItemData>) => {
    setError(null);
    try {
      const maxSeqNum = items.length > 0
        ? Math.max(...items.map(i => i.sequence_number))
        : 0;
      const createData: CreateLabelingItemData = {
        sequence_number: data?.sequence_number ?? maxSeqNum + 1,
        ...data,
      };
      const newItem = await api.createItem(eventId, createData);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }, [api, eventId, setItems, items]);

  const updateItem = useCallback(async (id: number, data: Partial<LabelingItem>) => {
    setError(null);
    try {
      const updated = await api.updateItem(id, data);
      setItems(prev => prev.map(item => item.id === id ? updated : item));
      setIsDirty(false);
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }, [api, setItems, setIsDirty]);

  const updateItemLocal = useCallback((id: number, data: Partial<LabelingItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    setIsDirty(true);
  }, [setItems, setIsDirty]);

  const deleteItem = useCallback(async (id: number) => {
    setError(null);
    try {
      await api.deleteItem(id);
      setItems(prev => {
        const newItems = prev.filter(item => item.id !== id);
        setCurrentIndex(currentIdx => {
          if (currentIdx >= newItems.length) {
            return Math.max(0, newItems.length - 1);
          }
          return currentIdx;
        });
        return newItems;
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }, [api, setItems, setCurrentIndex]);

  const currentItem = items[currentIndex] ?? null;

  return {
    items,
    currentItem,
    currentIndex,
    isDirty,
    loading,
    error,
    setCurrentIndex,
    fetchItems,
    addItem,
    updateItem,
    updateItemLocal,
    deleteItem,
  };
};
