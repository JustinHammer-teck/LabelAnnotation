/**
 * Tests for Analytics Store atoms.
 * Tests Jotai atoms for filter state management and derived query params.
 *
 * @module stores/__tests__/analytics.store.test
 */
import { createStore } from 'jotai';
import {
  analyticsFiltersAtom,
  analyticsFilterParamsAtom,
} from '../analytics.store';
import type { AnalyticsFilters } from '../../types';

describe('Analytics Store', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('analyticsFiltersAtom', () => {
    it('should initialize with empty filters', () => {
      const filters = store.get(analyticsFiltersAtom);
      expect(filters).toEqual({});
    });

    it('should store filter state', () => {
      const newFilters: AnalyticsFilters = {
        aircraft: ['B737', 'A320'],
        airport: 'PEK',
      };

      store.set(analyticsFiltersAtom, newFilters);

      const filters = store.get(analyticsFiltersAtom);
      expect(filters).toEqual(newFilters);
    });

    it('should update date range filter', () => {
      store.set(analyticsFiltersAtom, {
        dateRange: ['2024-01-01', '2024-12-31'],
      });

      const filters = store.get(analyticsFiltersAtom);
      expect(filters.dateRange).toEqual(['2024-01-01', '2024-12-31']);
    });

    it('should update aircraft filter', () => {
      store.set(analyticsFiltersAtom, {
        aircraft: ['B737'],
      });

      const filters = store.get(analyticsFiltersAtom);
      expect(filters.aircraft).toEqual(['B737']);
    });

    it('should update cascader filters', () => {
      store.set(analyticsFiltersAtom, {
        threatType: ['TL1', 'TL2', 'TL3'],
        errorType: ['EL1', 'EL2'],
        uasType: ['UL1'],
      });

      const filters = store.get(analyticsFiltersAtom);
      expect(filters.threatType).toEqual(['TL1', 'TL2', 'TL3']);
      expect(filters.errorType).toEqual(['EL1', 'EL2']);
      expect(filters.uasType).toEqual(['UL1']);
    });

    it('should update competency filter', () => {
      store.set(analyticsFiltersAtom, {
        competency: [['KNO'], ['KNO', 'KNO.1']],
      });

      const filters = store.get(analyticsFiltersAtom);
      expect(filters.competency).toEqual([['KNO'], ['KNO', 'KNO.1']]);
    });

    it('should allow partial updates', () => {
      store.set(analyticsFiltersAtom, { aircraft: ['B737'] });
      store.set(analyticsFiltersAtom, (prev) => ({
        ...prev,
        airport: 'SHA',
      }));

      const filters = store.get(analyticsFiltersAtom);
      expect(filters.aircraft).toEqual(['B737']);
      expect(filters.airport).toBe('SHA');
    });
  });

  describe('analyticsFilterParamsAtom', () => {
    it('should derive empty params from empty filters', () => {
      const params = store.get(analyticsFilterParamsAtom);
      expect(params).toEqual({});
    });

    it('should derive filter params from state', () => {
      store.set(analyticsFiltersAtom, {
        aircraft: ['B737', 'A320'],
        airport: 'PEK',
      });

      const params = store.get(analyticsFilterParamsAtom);
      expect(params.aircraft).toEqual(['B737', 'A320']);
      expect(params.airport).toBe('PEK');
    });

    it('should derive date params from date range', () => {
      store.set(analyticsFiltersAtom, {
        dateRange: ['2024-01-01', '2024-06-30'],
      });

      const params = store.get(analyticsFilterParamsAtom);
      expect(params.dateRange).toEqual(['2024-01-01', '2024-06-30']);
    });

    it('should derive cascader params', () => {
      store.set(analyticsFiltersAtom, {
        threatType: ['T1', 'T2', 'T3'],
      });

      const params = store.get(analyticsFilterParamsAtom);
      expect(params.threatType).toEqual(['T1', 'T2', 'T3']);
    });

    it('should update when source atom changes', () => {
      store.set(analyticsFiltersAtom, { airport: 'PEK' });
      let params = store.get(analyticsFilterParamsAtom);
      expect(params.airport).toBe('PEK');

      store.set(analyticsFiltersAtom, { airport: 'SHA' });
      params = store.get(analyticsFilterParamsAtom);
      expect(params.airport).toBe('SHA');
    });
  });

});
