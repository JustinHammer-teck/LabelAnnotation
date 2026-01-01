/**
 * Tests for Analytics API Client methods.
 * Tests the getEventsAnalytics and getFilterOptions methods along with
 * the buildFilterQueryParams utility function.
 *
 * @module api/__tests__/analytics-api.test
 */
import { createDefaultApiClient, buildFilterQueryParams } from '../default-api-client';
import type { AviationApiClient } from '../api-client';
import type { AnalyticsFilters, PaginatedAnalyticsResponse, AnalyticsFilterOptions } from '../../types';

describe('Analytics API Client', () => {
  let apiClient: AviationApiClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    apiClient = createDefaultApiClient();
    originalFetch = global.fetch;
    global.fetch = jest.fn();

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-csrf-token',
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('getEventsAnalytics', () => {
    const mockResponse: PaginatedAnalyticsResponse = {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          eventId: '1',
          基本信息: {
            事件编号: 'EVT-001',
            日期: '2024-06-15',
            时间: '14:30:00',
            机型: 'B737',
            起飞机场: 'PEK',
            落地机场: 'SHA',
            实际降落: 'SHA',
            报告单位: 'Unit A',
            备注: '',
          },
          事件描述: 'Test event description',
          结果绩效列表: [],
          标签标注列表: [],
        },
      ],
    };

    it('should call correct endpoint with project ID', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.getEventsAnalytics(123);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/aviation/projects/123/events/analytics/'),
        expect.any(Object)
      );
    });

    it('should include default pagination params', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.getEventsAnalytics(123);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('page_size=50');
    });

    it('should pass filter params as query string', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        aircraft: ['B737', 'A320'],
        airport: 'PEK',
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('aircraft=B737%2CA320');
      expect(calledUrl).toContain('airport=PEK');
    });

    it('should convert date range to ISO strings', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        dateRange: ['2024-01-01', '2024-12-31'],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('date_start=2024-01-01');
      expect(calledUrl).toContain('date_end=2024-12-31');
    });

    it('should convert arrays to comma-separated strings', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        eventType: ['type1', 'type2', 'type3'],
        flightPhase: ['takeoff', 'cruise'],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('event_types=type1%2Ctype2%2Ctype3');
      expect(calledUrl).toContain('flight_phases=takeoff%2Ccruise');
    });

    it('should handle empty filters', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.getEventsAnalytics(123, {});

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      // Should only have pagination params
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('page_size=50');
      expect(calledUrl).not.toContain('aircraft');
      expect(calledUrl).not.toContain('airport');
    });

    it('should handle pagination params', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.getEventsAnalytics(123, undefined, 3, 25);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('page=3');
      expect(calledUrl).toContain('page_size=25');
    });

    it('should return typed response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.getEventsAnalytics(123);

      expect(result.count).toBe(2);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].eventId).toBe('1');
      expect(result.results[0].基本信息.机型).toBe('B737');
    });

    it('should handle threat type cascader values', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        threatType: ['TL1', 'TL2', 'TL3'],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('threat_l1=TL1');
      expect(calledUrl).toContain('threat_l2=TL2');
      expect(calledUrl).toContain('threat_l3=TL3');
    });

    it('should handle error type cascader values', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        errorType: ['EL1', 'EL2'],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('error_l1=EL1');
      expect(calledUrl).toContain('error_l2=EL2');
      expect(calledUrl).not.toContain('error_l3');
    });

    it('should handle UAS type cascader values', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        uasType: ['UL1'],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('uas_l1=UL1');
      expect(calledUrl).not.toContain('uas_l2');
      expect(calledUrl).not.toContain('uas_l3');
    });

    it('should handle training topic filter', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        trainingTopic: ['topic1', 'topic2'],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('training_topics=topic1%2Ctopic2');
    });

    it('should handle competency filter', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const filters: AnalyticsFilters = {
        competency: [['category1'], ['category2', 'item1']],
      };

      await apiClient.getEventsAnalytics(123, filters);

      const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
      // Should extract last element from each selection
      expect(calledUrl).toContain('competencies=category1%2Citem1');
    });

    it('should throw on 403 forbidden response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Permission denied' })),
      });

      await expect(apiClient.getEventsAnalytics(123)).rejects.toThrow();
    });

    it('should throw on 404 not found response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Project not found' })),
      });

      await expect(apiClient.getEventsAnalytics(123)).rejects.toThrow();
    });
  });

  describe('getFilterOptions', () => {
    const mockOptions: AnalyticsFilterOptions = {
      aircraft: ['B737', 'A320', 'B777'],
      airports: ['PEK', 'SHA', 'CAN'],
      eventTypes: ['type1', 'type2'],
      flightPhases: ['takeoff', 'cruise', 'landing'],
      trainingTopics: ['topic1', 'topic2', 'topic3'],
    };

    it('should call correct endpoint with project ID', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockOptions),
      });

      await apiClient.getFilterOptions(456);

      expect(fetch).toHaveBeenCalledWith(
        '/api/aviation/projects/456/filter-options/',
        expect.any(Object)
      );
    });

    it('should return typed filter options', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockOptions),
      });

      const result = await apiClient.getFilterOptions(456);

      expect(result.aircraft).toEqual(['B737', 'A320', 'B777']);
      expect(result.airports).toEqual(['PEK', 'SHA', 'CAN']);
      expect(result.eventTypes).toEqual(['type1', 'type2']);
      expect(result.flightPhases).toEqual(['takeoff', 'cruise', 'landing']);
      expect(result.trainingTopics).toEqual(['topic1', 'topic2', 'topic3']);
    });

    it('should throw on 403 forbidden response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Permission denied' })),
      });

      await expect(apiClient.getFilterOptions(456)).rejects.toThrow();
    });
  });
});

describe('buildFilterQueryParams', () => {
  it('should return empty string for undefined filters', () => {
    const result = buildFilterQueryParams(undefined);
    expect(result).toBe('page=1&page_size=50');
  });

  it('should return empty string for empty filters', () => {
    const result = buildFilterQueryParams({});
    expect(result).toBe('page=1&page_size=50');
  });

  it('should include page and page_size params', () => {
    const result = buildFilterQueryParams({}, 2, 25);
    expect(result).toContain('page=2');
    expect(result).toContain('page_size=25');
  });

  it('should handle date range filter', () => {
    const filters: AnalyticsFilters = {
      dateRange: ['2024-01-01', '2024-06-30'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('date_start=2024-01-01');
    expect(result).toContain('date_end=2024-06-30');
  });

  it('should skip date range with wrong length', () => {
    const filters: AnalyticsFilters = {
      dateRange: ['2024-01-01'] as unknown as [string, string],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).not.toContain('date_start');
    expect(result).not.toContain('date_end');
  });

  it('should handle aircraft array filter', () => {
    const filters: AnalyticsFilters = {
      aircraft: ['B737', 'A320'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('aircraft=B737%2CA320');
  });

  it('should skip empty aircraft array', () => {
    const filters: AnalyticsFilters = {
      aircraft: [],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).not.toContain('aircraft');
  });

  it('should handle airport single value filter', () => {
    const filters: AnalyticsFilters = {
      airport: 'PEK',
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('airport=PEK');
  });

  it('should handle event type array filter', () => {
    const filters: AnalyticsFilters = {
      eventType: ['type1', 'type2'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('event_types=type1%2Ctype2');
  });

  it('should handle flight phase array filter', () => {
    const filters: AnalyticsFilters = {
      flightPhase: ['takeoff', 'cruise'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('flight_phases=takeoff%2Ccruise');
  });

  it('should handle threat type cascader with all levels', () => {
    const filters: AnalyticsFilters = {
      threatType: ['T1', 'T2', 'T3'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('threat_l1=T1');
    expect(result).toContain('threat_l2=T2');
    expect(result).toContain('threat_l3=T3');
  });

  it('should handle threat type cascader with partial levels', () => {
    const filters: AnalyticsFilters = {
      threatType: ['T1', 'T2'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('threat_l1=T1');
    expect(result).toContain('threat_l2=T2');
    expect(result).not.toContain('threat_l3');
  });

  it('should handle error type cascader', () => {
    const filters: AnalyticsFilters = {
      errorType: ['E1', 'E2', 'E3'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('error_l1=E1');
    expect(result).toContain('error_l2=E2');
    expect(result).toContain('error_l3=E3');
  });

  it('should handle UAS type cascader', () => {
    const filters: AnalyticsFilters = {
      uasType: ['U1'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('uas_l1=U1');
    expect(result).not.toContain('uas_l2');
    expect(result).not.toContain('uas_l3');
  });

  it('should handle training topic array filter', () => {
    const filters: AnalyticsFilters = {
      trainingTopic: ['topic1', 'topic2', 'topic3'],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).toContain('training_topics=topic1%2Ctopic2%2Ctopic3');
  });

  it('should handle competency multi-select cascader', () => {
    const filters: AnalyticsFilters = {
      competency: [['cat1'], ['cat2', 'item1'], ['cat3', 'sub', 'item2']],
    };
    const result = buildFilterQueryParams(filters);
    // Should extract last element from each selection
    expect(result).toContain('competencies=cat1%2Citem1%2Citem2');
  });

  it('should skip empty competency array', () => {
    const filters: AnalyticsFilters = {
      competency: [],
    };
    const result = buildFilterQueryParams(filters);
    expect(result).not.toContain('competencies');
  });

  it('should handle all filters together', () => {
    const filters: AnalyticsFilters = {
      dateRange: ['2024-01-01', '2024-12-31'],
      aircraft: ['B737'],
      airport: 'PEK',
      eventType: ['type1'],
      flightPhase: ['takeoff'],
      threatType: ['T1', 'T2'],
      errorType: ['E1'],
      uasType: ['U1'],
      trainingTopic: ['topic1'],
      competency: [['cat', 'item']],
    };
    const result = buildFilterQueryParams(filters, 1, 50);

    expect(result).toContain('page=1');
    expect(result).toContain('page_size=50');
    expect(result).toContain('date_start=2024-01-01');
    expect(result).toContain('date_end=2024-12-31');
    expect(result).toContain('aircraft=B737');
    expect(result).toContain('airport=PEK');
    expect(result).toContain('event_types=type1');
    expect(result).toContain('flight_phases=takeoff');
    expect(result).toContain('threat_l1=T1');
    expect(result).toContain('threat_l2=T2');
    expect(result).toContain('error_l1=E1');
    expect(result).toContain('uas_l1=U1');
    expect(result).toContain('training_topics=topic1');
    expect(result).toContain('competencies=item');
  });
});
