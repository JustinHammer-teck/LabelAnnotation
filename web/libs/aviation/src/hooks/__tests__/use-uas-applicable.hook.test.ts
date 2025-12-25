import { renderHook } from '@testing-library/react';
import { useUasApplicable } from '../use-uas-applicable.hook';
import type { LabelingItem } from '../../types/annotation.types';

// Mock i18n translation
jest.mock('../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'relevance.uas_requirement': 'UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"',
      };
      return translations[key] || key;
    },
    currentLanguage: 'cn',
    changeLanguage: jest.fn(),
    i18n: {} as any,
  }),
}));

const createMockItem = (overrides: Partial<LabelingItem> = {}): LabelingItem => ({
  id: 1,
  event: 1,
  created_by: null,
  sequence_number: 1,
  status: 'draft',
  threat_type_l1: null,
  threat_type_l1_detail: null,
  threat_type_l2: null,
  threat_type_l2_detail: null,
  threat_type_l3: null,
  threat_type_l3_detail: null,
  threat_management: {},
  threat_impact: {},
  threat_coping_abilities: {},
  threat_description: '',
  error_type_l1: null,
  error_type_l1_detail: null,
  error_type_l2: null,
  error_type_l2_detail: null,
  error_type_l3: null,
  error_type_l3_detail: null,
  error_relevance: '',
  error_management: {},
  error_impact: {},
  error_coping_abilities: {},
  error_description: '',
  uas_applicable: false,
  uas_relevance: '',
  uas_type_l1: null,
  uas_type_l1_detail: null,
  uas_type_l2: null,
  uas_type_l2_detail: null,
  uas_type_l3: null,
  uas_type_l3_detail: null,
  uas_management: {},
  uas_impact: {},
  uas_coping_abilities: {},
  uas_description: '',
  calculated_threat_topics: [],
  calculated_error_topics: [],
  calculated_uas_topics: [],
  notes: '',
  linked_result_id: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('useUasApplicable', () => {
  describe('Threat Impact Triggers UAS', () => {
    /**
     * Reference: LabelingList.js:120
     * isUASRequired = (item.威胁列表?.影响 === '导致UAS T')
     * Mapped to: threat_impact.value === 'leads_to_uas_t'
     */
    it('should return isUasApplicable=true when threat_impact is leads_to_uas_t', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_uas_t' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
      expect(result.current.uasDisabledMessage).toBeNull();
    });

    /**
     * Threat triggers UAS even when error_impact is 'none'
     */
    it('should return isUasApplicable=true when threat_impact=leads_to_uas_t and error_impact=none', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_uas_t' },
        error_impact: { value: 'none' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
    });

    /**
     * Threat triggers UAS even when error_impact is empty object
     */
    it('should return isUasApplicable=true when threat_impact=leads_to_uas_t and error_impact is empty', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_uas_t' },
        error_impact: {},
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
    });

    /**
     * Both threat and error trigger UAS
     */
    it('should return isUasApplicable=true when both impacts trigger UAS', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_uas_t' },
        error_impact: { value: 'leads_to_uas_e' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
    });
  });

  describe('Error Impact Triggers UAS', () => {
    /**
     * Reference: LabelingList.js:120
     * isUASRequired = (item.差错列表?.影响 === '导致UAS E')
     * Mapped to: error_impact.value === 'leads_to_uas_e'
     */
    it('should return isUasApplicable=true when error_impact is leads_to_uas_e', () => {
      const item = createMockItem({
        error_impact: { value: 'leads_to_uas_e' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
      expect(result.current.uasDisabledMessage).toBeNull();
    });

    /**
     * Error triggers UAS even when threat_impact is 'none'
     */
    it('should return isUasApplicable=true when error_impact=leads_to_uas_e and threat_impact=none', () => {
      const item = createMockItem({
        threat_impact: { value: 'none' },
        error_impact: { value: 'leads_to_uas_e' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
    });

    /**
     * Error triggers UAS even when threat_impact is empty
     */
    it('should return isUasApplicable=true when error_impact=leads_to_uas_e and threat_impact is empty', () => {
      const item = createMockItem({
        threat_impact: {},
        error_impact: { value: 'leads_to_uas_e' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(true);
    });
  });

  describe('UAS Disabled Cases', () => {
    /**
     * Both impacts are 'none' - UAS not required
     */
    it('should return isUasApplicable=false when both impacts are none', () => {
      const item = createMockItem({
        threat_impact: { value: 'none' },
        error_impact: { value: 'none' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
      expect(result.current.uasDisabledMessage).not.toBeNull();
    });

    /**
     * Reference: effectAndManage.json - threat has 'leads_to_error' option
     * 'leads_to_error' does NOT trigger UAS
     */
    it('should return isUasApplicable=false when threat_impact=leads_to_error', () => {
      const item = createMockItem({
        threat_impact: { value: 'leads_to_error' },
        error_impact: { value: 'none' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
    });

    /**
     * No impact values set at all
     */
    it('should return isUasApplicable=false when both impacts are undefined/empty', () => {
      const item = createMockItem({
        threat_impact: {},
        error_impact: {},
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
    });

    /**
     * Empty objects should be treated as no value
     */
    it('should return isUasApplicable=false for fresh item with empty impact objects', () => {
      const item = createMockItem();

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    /**
     * Reference: ThreatModule.js:13-25 - handles malformed data
     * threat_impact could be null in malformed data scenarios
     */
    it('should return isUasApplicable=false when threat_impact is null', () => {
      const item = createMockItem({
        threat_impact: null as unknown as Record<string, unknown>,
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
    });

    /**
     * error_impact could be null in malformed data scenarios
     */
    it('should return isUasApplicable=false when error_impact is null', () => {
      const item = createMockItem({
        error_impact: null as unknown as Record<string, unknown>,
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
    });

    /**
     * Reference: ThreatModule.js:13 - if (Array.isArray(data))
     * Malformed data as array should be handled gracefully
     */
    it('should return isUasApplicable=false when impacts are arrays (malformed)', () => {
      const item = createMockItem({
        threat_impact: [] as unknown as Record<string, unknown>,
        error_impact: [] as unknown as Record<string, unknown>,
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.isUasApplicable).toBe(false);
    });

    /**
     * Disabled message content verification
     * Reference: UASModule.js:71 - shows message when disabled
     */
    it('should return correct disabled message when UAS not applicable', () => {
      const item = createMockItem({
        threat_impact: { value: 'none' },
        error_impact: { value: 'none' },
      });

      const { result } = renderHook(() => useUasApplicable(item));

      expect(result.current.uasDisabledMessage).toBe('UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E"');
    });
  });
});
