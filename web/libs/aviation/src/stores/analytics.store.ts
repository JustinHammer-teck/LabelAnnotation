/**
 * Analytics Store - Jotai atoms for filter state management.
 *
 * @module stores/analytics.store
 */
import { atom } from 'jotai';
import type { AnalyticsFilters } from '../types';

/**
 * Primary filter state atom.
 * Stores all current filter values for analytics queries.
 */
export const analyticsFiltersAtom = atom<AnalyticsFilters>({});

/**
 * Derived atom that provides filter params for query building.
 * Returns the current filter state for use in API calls.
 */
export const analyticsFilterParamsAtom = atom((get) => {
  const filters = get(analyticsFiltersAtom);
  return { ...filters };
});
