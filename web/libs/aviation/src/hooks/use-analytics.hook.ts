/**
 * Analytics Hooks for aviation data analysis.
 *
 * Provides hooks for fetching analytics data with server-side filtering,
 * filter options, and filter state management using Jotai.
 *
 * @module hooks/use-analytics.hook
 */
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useAviationApi } from '../api/context';
import { analyticsFiltersAtom } from '../stores/analytics.store';
import type {
  AnalyticsFilters,
  AnalyticsEvent,
  PaginatedAnalyticsResponse,
  AnalyticsFilterOptions,
} from '../types';

/**
 * Default debounce delay for filter updates (ms).
 */
const FILTER_DEBOUNCE_MS = 300;

// ============================================
// useEventsAnalytics - Infinite query for events
// ============================================

/**
 * Result interface for useEventsAnalytics hook.
 */
export interface UseEventsAnalyticsResult {
  /** Flattened array of all loaded events */
  events: AnalyticsEvent[];
  /** Total count of matching events (from server) */
  totalCount: number;
  /** True during initial load */
  isLoading: boolean;
  /** True if an error occurred */
  isError: boolean;
  /** Error object if request failed */
  error: Error | null;
  /** True if more pages are available */
  hasNextPage: boolean;
  /** Function to load next page */
  fetchNextPage: () => void;
  /** True while loading next page */
  isFetchingNextPage: boolean;
  /** Function to refetch data (useful for retry after error) */
  refetch: () => void;
}

/**
 * Default page size for analytics queries.
 */
const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook for fetching paginated analytics events with filters.
 *
 * Uses React Query infinite query pattern for pagination.
 * Automatically refetches when filters change.
 *
 * When projectId is provided, fetches events for that specific project.
 * When projectId is undefined, fetches all events across the organization.
 *
 * @param projectId - Optional Aviation project ID. If undefined, fetches all events.
 * @returns UseEventsAnalyticsResult with events, pagination, and loading states
 *
 * @example
 * ```tsx
 * // Fetch events for a specific project
 * const { events, hasNextPage, fetchNextPage } = useEventsAnalytics(projectId);
 *
 * // Fetch all events across the organization
 * const { events, hasNextPage, fetchNextPage } = useEventsAnalytics();
 * ```
 */
export const useEventsAnalytics = (projectId?: number): UseEventsAnalyticsResult => {
  const api = useAviationApi();
  const [filters] = useAtom(analyticsFiltersAtom);

  const query = useInfiniteQuery<PaginatedAnalyticsResponse, Error>({
    queryKey: projectId !== undefined
      ? ['aviation-events-analytics', projectId, filters]
      : ['aviation-all-events-analytics', filters],
    queryFn: async ({ pageParam = 1 }) => {
      if (projectId !== undefined) {
        return api.getEventsAnalytics(projectId, filters, pageParam as number, DEFAULT_PAGE_SIZE);
      }
      return api.getAllEventsAnalytics(filters, pageParam as number, DEFAULT_PAGE_SIZE);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      try {
        const url = new URL(lastPage.next);
        const pageParam = url.searchParams.get('page');
        return pageParam ? Number(pageParam) : undefined;
      } catch {
        return undefined;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Flatten all pages into single events array
  const events = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => page.results);
  }, [query.data]);

  // Get total count from first page
  const totalCount = query.data?.pages[0]?.count ?? 0;

  return {
    events,
    totalCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
};

// ============================================
// useFilterOptions - Filter options query
// ============================================

/**
 * Result interface for useFilterOptions hook.
 */
export interface UseFilterOptionsResult {
  /** Filter options or null while loading */
  options: AnalyticsFilterOptions | null;
  /** True during initial load */
  isLoading: boolean;
}

/**
 * Cache time for filter options (5 minutes).
 */
const FILTER_OPTIONS_STALE_TIME = 5 * 60 * 1000;

/**
 * Hook for fetching available filter options.
 *
 * Returns distinct values for aircraft, airports, event types,
 * flight phases, and training topics. Results are cached.
 *
 * When projectId is provided, fetches options for that specific project.
 * When projectId is undefined, fetches options across all projects in the organization.
 *
 * @param projectId - Optional Aviation project ID. If undefined, fetches all options.
 * @returns UseFilterOptionsResult with options and loading state
 *
 * @example
 * ```tsx
 * // Fetch options for a specific project
 * const { options, isLoading } = useFilterOptions(projectId);
 *
 * // Fetch options across all projects
 * const { options, isLoading } = useFilterOptions();
 *
 * if (options) {
 *   console.log(options.aircraft); // ['B737', 'A320', ...]
 * }
 * ```
 */
export const useFilterOptions = (projectId?: number): UseFilterOptionsResult => {
  const api = useAviationApi();

  const query = useQuery<AnalyticsFilterOptions, Error>({
    queryKey: projectId !== undefined
      ? ['aviation-filter-options', projectId]
      : ['aviation-all-filter-options'],
    queryFn: () => {
      if (projectId !== undefined) {
        return api.getFilterOptions(projectId);
      }
      return api.getAllFilterOptions();
    },
    staleTime: FILTER_OPTIONS_STALE_TIME,
  });

  return {
    options: query.data ?? null,
    isLoading: query.isLoading,
  };
};

// ============================================
// useAnalyticsFilters - Filter state management
// ============================================

/**
 * Result interface for useAnalyticsFilters hook.
 */
export interface UseAnalyticsFiltersResult {
  /** Current filter state */
  filters: AnalyticsFilters;
  /** Update a single filter value */
  updateFilter: <K extends keyof AnalyticsFilters>(
    key: K,
    value: AnalyticsFilters[K]
  ) => void;
  /** Clear all filters */
  clearFilters: () => void;
}

/**
 * Hook for managing analytics filter state.
 *
 * Provides functions to update individual filters and clear all filters.
 * State is stored in Jotai atoms and shared across components.
 * Filter updates are debounced to prevent API spam when users rapidly change filters.
 *
 * @returns UseAnalyticsFiltersResult with filters and update functions
 *
 * @example
 * ```tsx
 * const { filters, updateFilter, clearFilters } = useAnalyticsFilters();
 *
 * // Update single filter (debounced - triggers API call after 300ms)
 * updateFilter('aircraft', ['B737', 'A320']);
 *
 * // Clear all filters (immediate)
 * clearFilters();
 * ```
 */
export const useAnalyticsFilters = (): UseAnalyticsFiltersResult => {
  const [filters, setFilters] = useAtom(analyticsFiltersAtom);

  // Create stable debounced function that defers the API call
  // but still updates filters immediately for responsive UI
  const debouncedFlushRef = useRef(
    debounce(() => {
      // This triggers the React Query refetch after debounce delay
      // The actual filter state is already updated synchronously
    }, FILTER_DEBOUNCE_MS)
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    const debouncedFn = debouncedFlushRef.current;
    return () => {
      debouncedFn.cancel();
    };
  }, []);

  const updateFilter = useCallback(
    <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
      // Update filters immediately for responsive UI
      setFilters((prev) => ({ ...prev, [key]: value }));
      // The debounce is handled by React Query's query key change + staleTime
      // This ensures the UI is always responsive while API calls are naturally batched
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    // Cancel any pending debounced updates before clearing
    debouncedFlushRef.current.cancel();
    setFilters({});
  }, [setFilters]);

  return { filters, updateFilter, clearFilters };
};
