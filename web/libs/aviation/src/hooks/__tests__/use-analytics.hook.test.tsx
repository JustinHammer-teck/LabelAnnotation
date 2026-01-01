/**
 * Tests for Analytics Hooks.
 * Tests useEventsAnalytics, useFilterOptions, and useAnalyticsFilters hooks.
 *
 * @module hooks/__tests__/use-analytics.hook.test
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import type { FC, ReactNode } from 'react';
import { AviationApiContext } from '../../api/context';
import type { AviationApiClient } from '../../api/api-client';
import {
  useEventsAnalytics,
  useFilterOptions,
  useAnalyticsFilters,
} from '../use-analytics.hook';
import { analyticsFiltersAtom } from '../../stores/analytics.store';
import type {
  AnalyticsFilters,
  PaginatedAnalyticsResponse,
  AnalyticsFilterOptions,
  AnalyticsEvent,
} from '../../types';

// Mock analytics event factory
const createMockEvent = (id: string): AnalyticsEvent => ({
  eventId: id,
  基本信息: {
    事件编号: `EVT-${id}`,
    日期: '2024-06-15',
    时间: '14:30:00',
    机型: 'B737',
    起飞机场: 'PEK',
    落地机场: 'SHA',
    实际降落: 'SHA',
    报告单位: 'Unit A',
    备注: '',
  },
  事件描述: `Test event ${id}`,
  结果绩效列表: [],
  标签标注列表: [],
});

// Mock paginated response factory
const createMockResponse = (
  events: AnalyticsEvent[],
  page: number,
  totalCount: number,
  hasNext: boolean
): PaginatedAnalyticsResponse => ({
  count: totalCount,
  next: hasNext ? `http://localhost/api/aviation/projects/1/events/analytics/?page=${page + 1}` : null,
  previous: page > 1 ? `http://localhost/api/aviation/projects/1/events/analytics/?page=${page - 1}` : null,
  results: events,
});

// Mock filter options
const mockFilterOptions: AnalyticsFilterOptions = {
  aircraft: ['B737', 'A320', 'B777'],
  airports: ['PEK', 'SHA', 'CAN'],
  eventTypes: ['type1', 'type2', 'type3'],
  flightPhases: ['takeoff', 'cruise', 'landing'],
  trainingTopics: ['topic1', 'topic2'],
};

// Create mock API client
const createMockApiClient = (overrides: Partial<AviationApiClient> = {}): AviationApiClient => ({
  getProjects: jest.fn(),
  getProject: jest.fn(),
  getAvailableProjects: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getEvents: jest.fn(),
  getEvent: jest.fn(),
  updateEvent: jest.fn(),
  getItems: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  getPerformances: jest.fn(),
  createPerformance: jest.fn(),
  updatePerformance: jest.fn(),
  deletePerformance: jest.fn(),
  linkItems: jest.fn(),
  unlinkItems: jest.fn(),
  getTypeHierarchy: jest.fn(),
  searchTypes: jest.fn(),
  uploadExcel: jest.fn(),
  exportEvents: jest.fn(),
  downloadExport: jest.fn(),
  submitItem: jest.fn(),
  approveItem: jest.fn(),
  rejectItem: jest.fn(),
  requestRevision: jest.fn(),
  resubmitItem: jest.fn(),
  getReviewHistory: jest.fn(),
  getProjectAssignments: jest.fn(),
  toggleProjectAssignment: jest.fn(),
  getEventsAnalytics: jest.fn().mockResolvedValue(createMockResponse([], 1, 0, false)),
  getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
  ...overrides,
});

// Wrapper component for tests
interface WrapperProps {
  children: ReactNode;
  apiClient?: AviationApiClient;
  initialFilters?: AnalyticsFilters;
}

const HydrateAtoms: FC<{ initialValues: Array<[typeof analyticsFiltersAtom, AnalyticsFilters]>; children: ReactNode }> = ({
  initialValues,
  children,
}) => {
  useHydrateAtoms(initialValues);
  return <>{children}</>;
};

const createWrapper = (apiClient: AviationApiClient, initialFilters: AnalyticsFilters = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const store = createStore();

  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AviationApiContext.Provider value={apiClient}>
        <JotaiProvider store={store}>
          <HydrateAtoms initialValues={[[analyticsFiltersAtom, initialFilters]]}>
            {children}
          </HydrateAtoms>
        </JotaiProvider>
      </AviationApiContext.Provider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('useEventsAnalytics', () => {
  it('should fetch data on mount with project ID', async () => {
    const mockEvents = [createMockEvent('1'), createMockEvent('2')];
    const mockResponse = createMockResponse(mockEvents, 1, 2, false);
    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.getEventsAnalytics).toHaveBeenCalledWith(123, {}, 1, 50);
    expect(result.current.events).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
  });

  it('should refetch when filters change', async () => {
    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn().mockResolvedValue(createMockResponse([], 1, 0, false)),
    });

    const initialFilters: AnalyticsFilters = { aircraft: ['B737'] };
    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi, initialFilters),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.getEventsAnalytics).toHaveBeenCalledWith(123, initialFilters, 1, 50);
  });

  it('should handle loading state', async () => {
    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createMockResponse([], 1, 0, false)), 100))
      ),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle error state', async () => {
    const mockError = new Error('Network error');
    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn().mockRejectedValue(mockError),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.events).toEqual([]);
  });

  it('should support infinite query pagination', async () => {
    const page1Events = [createMockEvent('1'), createMockEvent('2')];
    const page2Events = [createMockEvent('3'), createMockEvent('4')];

    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn()
        .mockResolvedValueOnce(createMockResponse(page1Events, 1, 4, true))
        .mockResolvedValueOnce(createMockResponse(page2Events, 2, 4, false)),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.events).toHaveLength(2);

    // Fetch next page
    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    expect(result.current.events).toHaveLength(4);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('should merge paginated results', async () => {
    const page1Events = [createMockEvent('1')];
    const page2Events = [createMockEvent('2')];
    const page3Events = [createMockEvent('3')];

    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn()
        .mockResolvedValueOnce(createMockResponse(page1Events, 1, 3, true))
        .mockResolvedValueOnce(createMockResponse(page2Events, 2, 3, true))
        .mockResolvedValueOnce(createMockResponse(page3Events, 3, 3, false)),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First page
    expect(result.current.events.map((e) => e.eventId)).toEqual(['1']);

    // Fetch second page
    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    expect(result.current.events.map((e) => e.eventId)).toEqual(['1', '2']);

    // Fetch third page
    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    expect(result.current.events.map((e) => e.eventId)).toEqual(['1', '2', '3']);
  });

  it('should return totalCount from first page', async () => {
    const mockEvents = [createMockEvent('1')];
    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn().mockResolvedValue(createMockResponse(mockEvents, 1, 100, true)),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalCount).toBe(100);
  });

  it('should return empty array when no data', async () => {
    const mockApi = createMockApiClient({
      getEventsAnalytics: jest.fn().mockResolvedValue(createMockResponse([], 1, 0, false)),
    });

    const { result } = renderHook(() => useEventsAnalytics(123), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('useFilterOptions', () => {
  it('should fetch filter options for project', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.getFilterOptions).toHaveBeenCalledWith(456);
    expect(result.current.options).not.toBeNull();
  });

  it('should cache filter options', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const wrapper = createWrapper(mockApi);

    // First render
    const { result: result1 } = renderHook(() => useFilterOptions(456), { wrapper });

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Second render - should use cache
    const { result: result2 } = renderHook(() => useFilterOptions(456), { wrapper });

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    // API should only be called once due to caching
    expect(mockApi.getFilterOptions).toHaveBeenCalledTimes(1);
  });

  it('should return aircraft types', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.options).not.toBeNull();
    });

    expect(result.current.options?.aircraft).toEqual(['B737', 'A320', 'B777']);
  });

  it('should return airports', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.options).not.toBeNull();
    });

    expect(result.current.options?.airports).toEqual(['PEK', 'SHA', 'CAN']);
  });

  it('should return event types', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.options).not.toBeNull();
    });

    expect(result.current.options?.eventTypes).toEqual(['type1', 'type2', 'type3']);
  });

  it('should return flight phases', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.options).not.toBeNull();
    });

    expect(result.current.options?.flightPhases).toEqual(['takeoff', 'cruise', 'landing']);
  });

  it('should return training topics', async () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockResolvedValue(mockFilterOptions),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    await waitFor(() => {
      expect(result.current.options).not.toBeNull();
    });

    expect(result.current.options?.trainingTopics).toEqual(['topic1', 'topic2']);
  });

  it('should return null options while loading', () => {
    const mockApi = createMockApiClient({
      getFilterOptions: jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFilterOptions), 100))
      ),
    });

    const { result } = renderHook(() => useFilterOptions(456), {
      wrapper: createWrapper(mockApi),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.options).toBeNull();
  });
});

describe('useAnalyticsFilters', () => {
  it('should initialize with empty filters', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    expect(result.current.filters).toEqual({});
  });

  it('should update date range filter', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    act(() => {
      result.current.updateFilter('dateRange', ['2024-01-01', '2024-12-31']);
    });

    expect(result.current.filters.dateRange).toEqual(['2024-01-01', '2024-12-31']);
  });

  it('should update aircraft filter', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    act(() => {
      result.current.updateFilter('aircraft', ['B737', 'A320']);
    });

    expect(result.current.filters.aircraft).toEqual(['B737', 'A320']);
  });

  it('should update cascader filters', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    act(() => {
      result.current.updateFilter('threatType', ['T1', 'T2', 'T3']);
    });

    expect(result.current.filters.threatType).toEqual(['T1', 'T2', 'T3']);

    act(() => {
      result.current.updateFilter('errorType', ['E1', 'E2']);
    });

    expect(result.current.filters.errorType).toEqual(['E1', 'E2']);

    act(() => {
      result.current.updateFilter('uasType', ['U1']);
    });

    expect(result.current.filters.uasType).toEqual(['U1']);
  });

  it('should clear all filters', async () => {
    const mockApi = createMockApiClient();
    const initialFilters: AnalyticsFilters = {
      aircraft: ['B737'],
      airport: 'PEK',
      dateRange: ['2024-01-01', '2024-12-31'],
    };

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi, initialFilters),
    });

    expect(result.current.filters).toEqual(initialFilters);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it('should preserve other filters when updating one', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    act(() => {
      result.current.updateFilter('aircraft', ['B737']);
    });

    act(() => {
      result.current.updateFilter('airport', 'PEK');
    });

    expect(result.current.filters.aircraft).toEqual(['B737']);
    expect(result.current.filters.airport).toBe('PEK');
  });

  it('should update training topic filter', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    act(() => {
      result.current.updateFilter('trainingTopic', ['topic1', 'topic2']);
    });

    expect(result.current.filters.trainingTopic).toEqual(['topic1', 'topic2']);
  });

  it('should update competency filter', async () => {
    const mockApi = createMockApiClient();

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi),
    });

    act(() => {
      result.current.updateFilter('competency', [['KNO'], ['KNO', 'KNO.1']]);
    });

    expect(result.current.filters.competency).toEqual([['KNO'], ['KNO', 'KNO.1']]);
  });

  it('should allow setting filter to undefined to remove it', async () => {
    const mockApi = createMockApiClient();
    const initialFilters: AnalyticsFilters = {
      aircraft: ['B737'],
    };

    const { result } = renderHook(() => useAnalyticsFilters(), {
      wrapper: createWrapper(mockApi, initialFilters),
    });

    act(() => {
      result.current.updateFilter('aircraft', undefined);
    });

    expect(result.current.filters.aircraft).toBeUndefined();
  });
});
