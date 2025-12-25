import { renderHook } from '@testing-library/react';
import { useImpactOptions } from '../use-impact-options.hook';

// Mock i18n translation
jest.mock('../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'impact.none': '无关紧要',
        'impact.leads_to_error': '导致差错',
        'impact.leads_to_uas_t': '导致UAS T',
        'impact.leads_to_uas_e': '导致UAS E',
      };
      return translations[key] || key;
    },
    currentLanguage: 'cn',
    changeLanguage: jest.fn(),
    i18n: {} as any,
  }),
}));

describe('useImpactOptions', () => {
  describe('Threat Category', () => {
    /**
     * Reference: effectAndManage.json lines 4-5
     * "管理的": { "threatImpact": ["无关紧要"] }
     *
     * When management="managed", only one impact option exists → auto-select it
     */
    it('should return single option and auto-select "none" when management is "managed"', () => {
      const { result } = renderHook(() => useImpactOptions('threat', 'managed'));

      expect(result.current.impactOptions).toHaveLength(1);
      expect(result.current.impactOptions[0]).toEqual({ value: 'none', label: '无关紧要' });
      expect(result.current.autoSelectValue).toBe('none');
      expect(result.current.isImpactDisabled).toBe(true);
    });

    /**
     * Reference: effectAndManage.json lines 7-9
     * "未管理": { "threatImpact": ["无关紧要", "导致差错", "导致UAS T"] }
     *
     * When management="unmanaged", 3 options → user must select, no auto-select
     */
    it('should return 3 options and no auto-select when management is "unmanaged"', () => {
      const { result } = renderHook(() => useImpactOptions('threat', 'unmanaged'));

      expect(result.current.impactOptions).toHaveLength(3);
      expect(result.current.impactOptions).toEqual([
        { value: 'none', label: '无关紧要' },
        { value: 'leads_to_error', label: '导致差错' },
        { value: 'leads_to_uas_t', label: '导致UAS T' },
      ]);
      expect(result.current.autoSelectValue).toBeNull();
      expect(result.current.isImpactDisabled).toBe(false);
    });

    /**
     * Reference: effectAndManage.json lines 10-12
     * "无效管理": { "threatImpact": ["无关紧要", "导致差错", "导致UAS T"] }
     */
    it('should return 3 options and no auto-select when management is "ineffective"', () => {
      const { result } = renderHook(() => useImpactOptions('threat', 'ineffective'));

      expect(result.current.impactOptions).toHaveLength(3);
      expect(result.current.autoSelectValue).toBeNull();
      expect(result.current.isImpactDisabled).toBe(false);
    });

    /**
     * Reference: effectAndManage.json lines 13-15
     * "未观察到": { "threatImpact": ["无关紧要", "导致差错", "导致UAS T"] }
     */
    it('should return 3 options and no auto-select when management is "unobserved"', () => {
      const { result } = renderHook(() => useImpactOptions('threat', 'unobserved'));

      expect(result.current.impactOptions).toHaveLength(3);
      expect(result.current.autoSelectValue).toBeNull();
      expect(result.current.isImpactDisabled).toBe(false);
    });
  });

  describe('Error Category', () => {
    /**
     * Reference: effectAndManage.json lines 20-21
     * "管理的": { "errorImpact": ["无关紧要"] }
     */
    it('should return single option and auto-select "none" when management is "managed"', () => {
      const { result } = renderHook(() => useImpactOptions('error', 'managed'));

      expect(result.current.impactOptions).toHaveLength(1);
      expect(result.current.impactOptions[0]).toEqual({ value: 'none', label: '无关紧要' });
      expect(result.current.autoSelectValue).toBe('none');
      expect(result.current.isImpactDisabled).toBe(true);
    });

    /**
     * Reference: effectAndManage.json lines 23-25
     * "未管理": { "errorImpact": ["无关紧要", "导致UAS E"] }
     *
     * Note: Error has 2 options (not 3 like threat - no "导致差错" for error)
     */
    it('should return 2 options and no auto-select when management is "unmanaged"', () => {
      const { result } = renderHook(() => useImpactOptions('error', 'unmanaged'));

      expect(result.current.impactOptions).toHaveLength(2);
      expect(result.current.impactOptions).toEqual([
        { value: 'none', label: '无关紧要' },
        { value: 'leads_to_uas_e', label: '导致UAS E' },
      ]);
      expect(result.current.autoSelectValue).toBeNull();
      expect(result.current.isImpactDisabled).toBe(false);
    });

    /**
     * Reference: effectAndManage.json lines 26-28
     */
    it('should return 2 options for "ineffective" management', () => {
      const { result } = renderHook(() => useImpactOptions('error', 'ineffective'));

      expect(result.current.impactOptions).toHaveLength(2);
      expect(result.current.isImpactDisabled).toBe(false);
    });

    /**
     * Reference: effectAndManage.json lines 29-31
     */
    it('should return 2 options for "unobserved" management', () => {
      const { result } = renderHook(() => useImpactOptions('error', 'unobserved'));

      expect(result.current.impactOptions).toHaveLength(2);
      expect(result.current.isImpactDisabled).toBe(false);
    });
  });

  describe('UAS Category', () => {
    /**
     * Reference: effectAndManage.json line 35
     * "uasManagement": ["无关紧要", "管理的", "未管理", "无效管理", "未观察到"]
     *
     * UAS has NO impact field - only management options
     */
    it('should return empty options and disabled for UAS category', () => {
      const { result } = renderHook(() => useImpactOptions('uas', 'managed'));

      expect(result.current.impactOptions).toHaveLength(0);
      expect(result.current.autoSelectValue).toBeNull();
      expect(result.current.isImpactDisabled).toBe(true);
    });

    it('should return empty options regardless of management value for UAS', () => {
      const { result } = renderHook(() => useImpactOptions('uas', 'unmanaged'));

      expect(result.current.impactOptions).toHaveLength(0);
      expect(result.current.isImpactDisabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    /**
     * Reference: ThreatModule.js:62 - if (!manage) return [];
     */
    it('should return empty options when managementValue is null', () => {
      const { result } = renderHook(() => useImpactOptions('threat', null));

      expect(result.current.impactOptions).toHaveLength(0);
      expect(result.current.autoSelectValue).toBeNull();
      expect(result.current.isImpactDisabled).toBe(true);
    });

    /**
     * Handle unknown management values gracefully
     */
    it('should return empty options for unknown management value', () => {
      const { result } = renderHook(() => useImpactOptions('threat', 'unknown_value'));

      expect(result.current.impactOptions).toHaveLength(0);
      expect(result.current.autoSelectValue).toBeNull();
    });
  });
});
