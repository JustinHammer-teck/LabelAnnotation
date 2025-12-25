import { useMemo } from 'react';
import { useAviationTranslation } from '../i18n';
import type { LabelingItem } from '../types';

export interface UseUasApplicableResult {
  isUasApplicable: boolean;
  uasDisabledMessage: string | null;
}

interface ImpactObject {
  value?: string;
}

const isValidImpactObject = (val: unknown): val is ImpactObject => {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
};

const getImpactValue = (impact: unknown): string | undefined => {
  if (!isValidImpactObject(impact)) {
    return undefined;
  }
  const value = impact.value;
  return typeof value === 'string' ? value : undefined;
};

export const useUasApplicable = (item: LabelingItem): UseUasApplicableResult => {
  const { t } = useAviationTranslation();

  return useMemo(() => {
    const threatValue = getImpactValue(item.threat_impact);
    const errorValue = getImpactValue(item.error_impact);

    const isApplicable = threatValue === 'leads_to_uas_t' || errorValue === 'leads_to_uas_e';

    return {
      isUasApplicable: isApplicable,
      uasDisabledMessage: isApplicable ? null : t('relevance.uas_requirement'),
    };
  }, [item.threat_impact, item.error_impact, t]);
};
