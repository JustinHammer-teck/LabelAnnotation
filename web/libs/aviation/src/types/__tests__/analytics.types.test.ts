/**
 * Tests for Analytics Types.
 * Validates type structures for analytics filters, events, and responses.
 *
 * @module types/__tests__/analytics.types.test
 */
import type {
  AnalyticsFilters,
  AnalyticsBasicInfo,
  AnalyticsTypeHierarchy,
  AnalyticsLabelingItem,
  AnalyticsResultPerformance,
  AnalyticsEvent,
  PaginatedAnalyticsResponse,
  AnalyticsFilterOptions,
  AnalyticsQueryParams,
} from '../analytics.types';

describe('Analytics Types', () => {
  describe('AnalyticsFilters', () => {
    it('should accept valid date range filter', () => {
      const filters: AnalyticsFilters = {
        dateRange: ['2024-01-01', '2024-12-31'],
      };
      expect(filters.dateRange).toEqual(['2024-01-01', '2024-12-31']);
    });

    it('should accept valid aircraft filter array', () => {
      const filters: AnalyticsFilters = {
        aircraft: ['B737', 'A320', 'B777'],
      };
      expect(filters.aircraft).toEqual(['B737', 'A320', 'B777']);
    });

    it('should accept valid airport filter string', () => {
      const filters: AnalyticsFilters = {
        airport: 'PEK',
      };
      expect(filters.airport).toBe('PEK');
    });

    it('should accept valid cascader values for threat type', () => {
      const filters: AnalyticsFilters = {
        threatType: ['threat_l1_code', 'threat_l2_code', 'threat_l3_code'],
      };
      expect(filters.threatType).toEqual(['threat_l1_code', 'threat_l2_code', 'threat_l3_code']);
    });

    it('should accept valid cascader values for error type', () => {
      const filters: AnalyticsFilters = {
        errorType: ['error_l1', 'error_l2'],
      };
      expect(filters.errorType).toEqual(['error_l1', 'error_l2']);
    });

    it('should accept valid cascader values for UAS type', () => {
      const filters: AnalyticsFilters = {
        uasType: ['uas_l1'],
      };
      expect(filters.uasType).toEqual(['uas_l1']);
    });

    it('should accept valid event type filter array', () => {
      const filters: AnalyticsFilters = {
        eventType: ['type1', 'type2'],
      };
      expect(filters.eventType).toEqual(['type1', 'type2']);
    });

    it('should accept valid flight phase filter array', () => {
      const filters: AnalyticsFilters = {
        flightPhase: ['takeoff', 'cruise', 'landing'],
      };
      expect(filters.flightPhase).toEqual(['takeoff', 'cruise', 'landing']);
    });

    it('should accept valid training topic filter array', () => {
      const filters: AnalyticsFilters = {
        trainingTopic: ['topic1', 'topic2'],
      };
      expect(filters.trainingTopic).toEqual(['topic1', 'topic2']);
    });

    it('should accept valid competency filter (multi-select cascader)', () => {
      const filters: AnalyticsFilters = {
        competency: [['category1'], ['category2', 'item1']],
      };
      expect(filters.competency).toEqual([['category1'], ['category2', 'item1']]);
    });

    it('should accept all filter types together', () => {
      const filters: AnalyticsFilters = {
        dateRange: ['2024-01-01', '2024-12-31'],
        aircraft: ['B737'],
        airport: 'PEK',
        eventType: ['type1'],
        flightPhase: ['takeoff'],
        threatType: ['l1', 'l2', 'l3'],
        errorType: ['e1'],
        uasType: ['u1'],
        trainingTopic: ['topic1'],
        competency: [['cat', 'item']],
      };
      expect(filters.dateRange).toBeDefined();
      expect(filters.aircraft).toBeDefined();
      expect(filters.airport).toBeDefined();
      expect(filters.eventType).toBeDefined();
      expect(filters.flightPhase).toBeDefined();
      expect(filters.threatType).toBeDefined();
      expect(filters.errorType).toBeDefined();
      expect(filters.uasType).toBeDefined();
      expect(filters.trainingTopic).toBeDefined();
      expect(filters.competency).toBeDefined();
    });

    it('should accept empty filters object', () => {
      const filters: AnalyticsFilters = {};
      expect(filters).toEqual({});
    });
  });

  describe('AnalyticsBasicInfo', () => {
    const basicInfo: AnalyticsBasicInfo = {
      事件编号: 'EVT-001',
      日期: '2024-06-15',
      时间: '14:30:00',
      机型: 'B737-800',
      起飞机场: 'PEK',
      落地机场: 'SHA',
      实际降落: 'SHA',
      报告单位: 'Unit A',
      备注: 'Test remarks',
    };

    it('should have event number field', () => {
      expect(basicInfo.事件编号).toBe('EVT-001');
    });

    it('should have date field', () => {
      expect(basicInfo.日期).toBe('2024-06-15');
    });

    it('should have time field that can be null', () => {
      const infoWithNullTime: AnalyticsBasicInfo = { ...basicInfo, 时间: null };
      expect(infoWithNullTime.时间).toBeNull();
    });

    it('should have aircraft type field', () => {
      expect(basicInfo.机型).toBe('B737-800');
    });

    it('should have departure airport field', () => {
      expect(basicInfo.起飞机场).toBe('PEK');
    });

    it('should have arrival airport field', () => {
      expect(basicInfo.落地机场).toBe('SHA');
    });

    it('should have actual landing airport field', () => {
      expect(basicInfo.实际降落).toBe('SHA');
    });

    it('should have reporting unit field', () => {
      expect(basicInfo.报告单位).toBe('Unit A');
    });

    it('should have remarks field', () => {
      expect(basicInfo.备注).toBe('Test remarks');
    });
  });

  describe('AnalyticsTypeHierarchy', () => {
    it('should have all level fields as nullable strings', () => {
      const hierarchy: AnalyticsTypeHierarchy = {
        level1: 'Level 1 Value',
        level2: 'Level 2 Value',
        level3: null,
        管理: 'managed',
        影响: 'none',
        应对能力: ['ability1', 'ability2'],
        描述: 'Description text',
      };
      expect(hierarchy.level1).toBe('Level 1 Value');
      expect(hierarchy.level2).toBe('Level 2 Value');
      expect(hierarchy.level3).toBeNull();
    });

    it('should have management field', () => {
      const hierarchy: AnalyticsTypeHierarchy = {
        level1: null,
        level2: null,
        level3: null,
        管理: 'unmanaged',
        影响: 'leads_to_error',
        应对能力: [],
        描述: '',
      };
      expect(hierarchy.管理).toBe('unmanaged');
    });

    it('should have impact field', () => {
      const hierarchy: AnalyticsTypeHierarchy = {
        level1: null,
        level2: null,
        level3: null,
        管理: 'managed',
        影响: 'none',
        应对能力: [],
        描述: '',
      };
      expect(hierarchy.影响).toBe('none');
    });

    it('should have coping abilities as string array', () => {
      const hierarchy: AnalyticsTypeHierarchy = {
        level1: null,
        level2: null,
        level3: null,
        管理: 'managed',
        影响: 'none',
        应对能力: ['CRM', 'Monitoring'],
        描述: '',
      };
      expect(hierarchy.应对能力).toEqual(['CRM', 'Monitoring']);
    });
  });

  describe('AnalyticsLabelingItem', () => {
    it('should have id as string', () => {
      const item: AnalyticsLabelingItem = {
        id: '123',
        关联事件类型ID: null,
        威胁列表: null,
        差错列表: null,
        UAS列表: null,
        结束状态描述: '',
      };
      expect(item.id).toBe('123');
    });

    it('should have nullable linked result ID', () => {
      const item: AnalyticsLabelingItem = {
        id: '1',
        关联事件类型ID: '456',
        威胁列表: null,
        差错列表: null,
        UAS列表: null,
        结束状态描述: '',
      };
      expect(item.关联事件类型ID).toBe('456');
    });

    it('should have nullable threat list', () => {
      const hierarchy: AnalyticsTypeHierarchy = {
        level1: 'T1',
        level2: null,
        level3: null,
        管理: 'managed',
        影响: 'none',
        应对能力: [],
        描述: 'threat desc',
      };
      const item: AnalyticsLabelingItem = {
        id: '1',
        关联事件类型ID: null,
        威胁列表: hierarchy,
        差错列表: null,
        UAS列表: null,
        结束状态描述: '',
      };
      expect(item.威胁列表).toEqual(hierarchy);
    });

    it('should have nullable error list', () => {
      const item: AnalyticsLabelingItem = {
        id: '1',
        关联事件类型ID: null,
        威胁列表: null,
        差错列表: null,
        UAS列表: null,
        结束状态描述: '',
      };
      expect(item.差错列表).toBeNull();
    });

    it('should have nullable UAS list', () => {
      const item: AnalyticsLabelingItem = {
        id: '1',
        关联事件类型ID: null,
        威胁列表: null,
        差错列表: null,
        UAS列表: null,
        结束状态描述: '',
      };
      expect(item.UAS列表).toBeNull();
    });

    it('should have end state description', () => {
      const item: AnalyticsLabelingItem = {
        id: '1',
        关联事件类型ID: null,
        威胁列表: null,
        差错列表: null,
        UAS列表: null,
        结束状态描述: 'End state description',
      };
      expect(item.结束状态描述).toBe('End state description');
    });
  });

  describe('AnalyticsResultPerformance', () => {
    const performance: AnalyticsResultPerformance = {
      id: '100',
      事件类型: 'Type A',
      飞行阶段: 'takeoff',
      可能性: 'high',
      严重程度: 'major',
      训练效果: 'effective',
      训练方案设想: 'Training plan description',
      训练主题: ['topic1', 'topic2'],
      所需达到的目标: 'Objective text',
    };

    it('should have id as string', () => {
      expect(performance.id).toBe('100');
    });

    it('should have event type field', () => {
      expect(performance.事件类型).toBe('Type A');
    });

    it('should have flight phase field', () => {
      expect(performance.飞行阶段).toBe('takeoff');
    });

    it('should have likelihood field', () => {
      expect(performance.可能性).toBe('high');
    });

    it('should have severity field', () => {
      expect(performance.严重程度).toBe('major');
    });

    it('should have training effect field', () => {
      expect(performance.训练效果).toBe('effective');
    });

    it('should have training plan field', () => {
      expect(performance.训练方案设想).toBe('Training plan description');
    });

    it('should have training topics as string array', () => {
      expect(performance.训练主题).toEqual(['topic1', 'topic2']);
    });

    it('should have objectives field', () => {
      expect(performance.所需达到的目标).toBe('Objective text');
    });
  });

  describe('AnalyticsEvent', () => {
    const basicInfo: AnalyticsBasicInfo = {
      事件编号: 'EVT-001',
      日期: '2024-06-15',
      时间: '14:30:00',
      机型: 'B737',
      起飞机场: 'PEK',
      落地机场: 'SHA',
      实际降落: 'SHA',
      报告单位: 'Unit A',
      备注: '',
    };

    it('should have eventId string field', () => {
      const event: AnalyticsEvent = {
        eventId: 'evt-123',
        基本信息: basicInfo,
        事件描述: 'Event description',
        结果绩效列表: [],
        标签标注列表: [],
      };
      expect(event.eventId).toBe('evt-123');
    });

    it('should have basic info object', () => {
      const event: AnalyticsEvent = {
        eventId: 'evt-123',
        基本信息: basicInfo,
        事件描述: 'Event description',
        结果绩效列表: [],
        标签标注列表: [],
      };
      expect(event.基本信息).toEqual(basicInfo);
    });

    it('should have event description field', () => {
      const event: AnalyticsEvent = {
        eventId: 'evt-123',
        基本信息: basicInfo,
        事件描述: 'Detailed event description',
        结果绩效列表: [],
        标签标注列表: [],
      };
      expect(event.事件描述).toBe('Detailed event description');
    });

    it('should have result performances array', () => {
      const performance: AnalyticsResultPerformance = {
        id: '1',
        事件类型: 'Type',
        飞行阶段: 'phase',
        可能性: 'likely',
        严重程度: 'minor',
        训练效果: 'good',
        训练方案设想: 'plan',
        训练主题: [],
        所需达到的目标: 'goal',
      };
      const event: AnalyticsEvent = {
        eventId: 'evt-123',
        基本信息: basicInfo,
        事件描述: 'desc',
        结果绩效列表: [performance],
        标签标注列表: [],
      };
      expect(event.结果绩效列表).toHaveLength(1);
      expect(event.结果绩效列表[0]).toEqual(performance);
    });

    it('should have labeling items array', () => {
      const item: AnalyticsLabelingItem = {
        id: '1',
        关联事件类型ID: null,
        威胁列表: null,
        差错列表: null,
        UAS列表: null,
        结束状态描述: '',
      };
      const event: AnalyticsEvent = {
        eventId: 'evt-123',
        基本信息: basicInfo,
        事件描述: 'desc',
        结果绩效列表: [],
        标签标注列表: [item],
      };
      expect(event.标签标注列表).toHaveLength(1);
      expect(event.标签标注列表[0]).toEqual(item);
    });
  });

  describe('PaginatedAnalyticsResponse', () => {
    it('should have count number', () => {
      const response: PaginatedAnalyticsResponse = {
        count: 100,
        next: null,
        previous: null,
        results: [],
      };
      expect(response.count).toBe(100);
    });

    it('should have next nullable string', () => {
      const responseWithNext: PaginatedAnalyticsResponse = {
        count: 100,
        next: 'http://api/events/?page=2',
        previous: null,
        results: [],
      };
      expect(responseWithNext.next).toBe('http://api/events/?page=2');

      const responseWithoutNext: PaginatedAnalyticsResponse = {
        count: 10,
        next: null,
        previous: null,
        results: [],
      };
      expect(responseWithoutNext.next).toBeNull();
    });

    it('should have previous nullable string', () => {
      const responseWithPrev: PaginatedAnalyticsResponse = {
        count: 100,
        next: null,
        previous: 'http://api/events/?page=1',
        results: [],
      };
      expect(responseWithPrev.previous).toBe('http://api/events/?page=1');

      const responseWithoutPrev: PaginatedAnalyticsResponse = {
        count: 100,
        next: null,
        previous: null,
        results: [],
      };
      expect(responseWithoutPrev.previous).toBeNull();
    });

    it('should have results array', () => {
      const basicInfo: AnalyticsBasicInfo = {
        事件编号: 'EVT-001',
        日期: '2024-06-15',
        时间: null,
        机型: 'B737',
        起飞机场: 'PEK',
        落地机场: 'SHA',
        实际降落: 'SHA',
        报告单位: 'Unit',
        备注: '',
      };
      const event: AnalyticsEvent = {
        eventId: '1',
        基本信息: basicInfo,
        事件描述: 'desc',
        结果绩效列表: [],
        标签标注列表: [],
      };
      const response: PaginatedAnalyticsResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [event],
      };
      expect(response.results).toHaveLength(1);
      expect(response.results[0].eventId).toBe('1');
    });
  });

  describe('AnalyticsFilterOptions', () => {
    it('should have aircraft array', () => {
      const options: AnalyticsFilterOptions = {
        aircraft: ['B737', 'A320'],
        airports: [],
        eventTypes: [],
        flightPhases: [],
        trainingTopics: [],
      };
      expect(options.aircraft).toEqual(['B737', 'A320']);
    });

    it('should have airports array', () => {
      const options: AnalyticsFilterOptions = {
        aircraft: [],
        airports: ['PEK', 'SHA', 'CAN'],
        eventTypes: [],
        flightPhases: [],
        trainingTopics: [],
      };
      expect(options.airports).toEqual(['PEK', 'SHA', 'CAN']);
    });

    it('should have eventTypes array', () => {
      const options: AnalyticsFilterOptions = {
        aircraft: [],
        airports: [],
        eventTypes: ['type1', 'type2'],
        flightPhases: [],
        trainingTopics: [],
      };
      expect(options.eventTypes).toEqual(['type1', 'type2']);
    });

    it('should have flightPhases array', () => {
      const options: AnalyticsFilterOptions = {
        aircraft: [],
        airports: [],
        eventTypes: [],
        flightPhases: ['takeoff', 'cruise', 'landing'],
        trainingTopics: [],
      };
      expect(options.flightPhases).toEqual(['takeoff', 'cruise', 'landing']);
    });

    it('should have trainingTopics array', () => {
      const options: AnalyticsFilterOptions = {
        aircraft: [],
        airports: [],
        eventTypes: [],
        flightPhases: [],
        trainingTopics: ['topic1', 'topic2'],
      };
      expect(options.trainingTopics).toEqual(['topic1', 'topic2']);
    });
  });

  describe('AnalyticsQueryParams', () => {
    it('should accept all query param fields', () => {
      const params: AnalyticsQueryParams = {
        page: 1,
        page_size: 50,
        date_start: '2024-01-01',
        date_end: '2024-12-31',
        aircraft: 'B737,A320',
        airport: 'PEK',
        event_type: 'type1,type2',
        flight_phase: 'takeoff',
        threat_l1: 'T1',
        threat_l2: 'T2',
        threat_l3: 'T3',
        error_l1: 'E1',
        error_l2: 'E2',
        error_l3: 'E3',
        uas_l1: 'U1',
        uas_l2: 'U2',
        uas_l3: 'U3',
        training_topic: 'topic1,topic2',
        competency: 'comp1,comp2',
      };
      expect(params.page).toBe(1);
      expect(params.page_size).toBe(50);
      expect(params.date_start).toBe('2024-01-01');
      expect(params.threat_l1).toBe('T1');
    });

    it('should accept partial query params', () => {
      const params: AnalyticsQueryParams = {
        page: 2,
        aircraft: 'B737',
      };
      expect(params.page).toBe(2);
      expect(params.aircraft).toBe('B737');
      expect(params.date_start).toBeUndefined();
    });
  });
});
