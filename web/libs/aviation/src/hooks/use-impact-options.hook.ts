import { useMemo } from 'react';
import { useAviationTranslation } from '../i18n';

interface ImpactOption {
  value: string;
  label: string;
}

interface ImpactConfigStatic {
  impacts: string[];
  autoSelect: string | null;
}

/**
 * Configuration for threat impact options based on management selection
 * Reference: effectAndManage.json - threatIdentification.threatManagement
 * Note: Stores impact keys instead of labels - labels are translated at runtime
 */
export const THREAT_IMPACT_CONFIG: Record<string, ImpactConfigStatic> = {
  managed: {
    impacts: ['none'],
    autoSelect: 'none',
  },
  unmanaged: {
    impacts: ['none', 'leads_to_error', 'leads_to_uas_t'],
    autoSelect: null,
  },
  ineffective: {
    impacts: ['none', 'leads_to_error', 'leads_to_uas_t'],
    autoSelect: null,
  },
  unobserved: {
    impacts: ['none', 'leads_to_error', 'leads_to_uas_t'],
    autoSelect: null,
  },
};

/**
 * Configuration for error impact options based on management selection
 * Reference: effectAndManage.json - errorIdentification.errorManagement
 * Note: Error has 2 impact options (no "leads_to_error" - errors don't lead to errors)
 */
export const ERROR_IMPACT_CONFIG: Record<string, ImpactConfigStatic> = {
  managed: {
    impacts: ['none'],
    autoSelect: 'none',
  },
  unmanaged: {
    impacts: ['none', 'leads_to_uas_e'],
    autoSelect: null,
  },
  ineffective: {
    impacts: ['none', 'leads_to_uas_e'],
    autoSelect: null,
  },
  unobserved: {
    impacts: ['none', 'leads_to_uas_e'],
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
  const { t } = useAviationTranslation();

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

    // Translate impact values to labels using i18n
    const impactOptions: ImpactOption[] = config.impacts.map((value) => ({
      value,
      label: t(`impact.${value}`),
    }));

    return {
      impactOptions,
      autoSelectValue: config.autoSelect,
      isImpactDisabled: impactOptions.length === 1,
    };
  }, [category, managementValue, t]);
};
