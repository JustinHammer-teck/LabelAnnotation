import { useMemo } from 'react';

interface ImpactOption {
  value: string;
  label: string;
}

interface ImpactConfig {
  impacts: ImpactOption[];
  autoSelect: string | null;
}

/**
 * Configuration for threat impact options based on management selection
 * Reference: effectAndManage.json - threatIdentification.threatManagement
 */
export const THREAT_IMPACT_CONFIG: Record<string, ImpactConfig> = {
  managed: {
    impacts: [{ value: 'none', label: '无关紧要' }],
    autoSelect: 'none',
  },
  unmanaged: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_error', label: '导致差错' },
      { value: 'leads_to_uas_t', label: '导致UAS T' },
    ],
    autoSelect: null,
  },
  ineffective: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_error', label: '导致差错' },
      { value: 'leads_to_uas_t', label: '导致UAS T' },
    ],
    autoSelect: null,
  },
  unobserved: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_error', label: '导致差错' },
      { value: 'leads_to_uas_t', label: '导致UAS T' },
    ],
    autoSelect: null,
  },
};

/**
 * Configuration for error impact options based on management selection
 * Reference: effectAndManage.json - errorIdentification.errorManagement
 * Note: Error has 2 impact options (no "导致差错" - errors don't lead to errors)
 */
export const ERROR_IMPACT_CONFIG: Record<string, ImpactConfig> = {
  managed: {
    impacts: [{ value: 'none', label: '无关紧要' }],
    autoSelect: 'none',
  },
  unmanaged: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_uas_e', label: '导致UAS E' },
    ],
    autoSelect: null,
  },
  ineffective: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_uas_e', label: '导致UAS E' },
    ],
    autoSelect: null,
  },
  unobserved: {
    impacts: [
      { value: 'none', label: '无关紧要' },
      { value: 'leads_to_uas_e', label: '导致UAS E' },
    ],
    autoSelect: null,
  },
};

export interface UseImpactOptionsResult {
  impactOptions: ImpactOption[];
  autoSelectValue: string | null;
  isImpactDisabled: boolean;
}

/**
 * Hook to get impact options based on category and management selection
 *
 * Logic flow (from label lib ThreatModule.js:38-41, 61-65):
 * - When management="managed", only one impact option exists → auto-select it
 * - When management has multiple options → user must select, no auto-select
 * - UAS category has no impact field
 *
 * @param category - 'threat' | 'error' | 'uas'
 * @param managementValue - Current management selection value
 * @returns Impact options, auto-select value, and disabled state
 */
export const useImpactOptions = (
  category: 'threat' | 'error' | 'uas',
  managementValue: string | null,
): UseImpactOptionsResult => {
  return useMemo(() => {
    if (category === 'uas' || !managementValue) {
      return { impactOptions: [], autoSelectValue: null, isImpactDisabled: true };
    }

    const config = category === 'threat'
      ? THREAT_IMPACT_CONFIG[managementValue]
      : ERROR_IMPACT_CONFIG[managementValue];

    if (!config) {
      return { impactOptions: [], autoSelectValue: null, isImpactDisabled: true };
    }

    return {
      impactOptions: config.impacts,
      autoSelectValue: config.autoSelect,
      isImpactDisabled: config.impacts.length === 1,
    };
  }, [category, managementValue]);
};
