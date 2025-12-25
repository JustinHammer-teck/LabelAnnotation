import { type FC, useMemo } from 'react';
import type { LabelingItem } from '../../../types/annotation.types';
import { useAviationTranslation } from '../../../i18n';
import styles from './competency-summary.module.scss';

export interface CompetencySummaryProps {
  category: 'threat' | 'error' | 'uas';
  item: LabelingItem;
}

interface Competency {
  code: string;
  label: string;
  source: 'type' | 'coping';
}

const CATEGORY_TITLE_KEYS: Record<string, string> = {
  threat: 'competency.threat_related',
  error: 'competency.error_related',
  uas: 'competency.uas_related',
};

const COPING_TO_COMPETENCY: Record<string, { code: string; labelKey: string }> = {
  situation_awareness: { code: 'SA', labelKey: 'competency.situation_awareness' },
  decision_making: { code: 'DM', labelKey: 'competency.decision_making' },
  communication: { code: 'COM', labelKey: 'competency.communication' },
  workload_management: { code: 'WM', labelKey: 'competency.workload_management' },
  crew_coordination: { code: 'CC', labelKey: 'competency.crew_coordination' },
  stress_management: { code: 'SM', labelKey: 'competency.stress_management' },
  automation_management: { code: 'AM', labelKey: 'competency.automation_management' },
};

export const CompetencySummary: FC<CompetencySummaryProps> = ({ category, item }) => {
  const { t } = useAviationTranslation();

  const getField = <T,>(suffix: string): T => {
    return item[`${category}_${suffix}` as keyof LabelingItem] as T;
  };

  const competencies = useMemo((): Competency[] => {
    const result: Competency[] = [];

    const l3Detail = getField<LabelingItem['threat_type_l3_detail']>('type_l3_detail');
    if (l3Detail) {
      result.push({
        code: l3Detail.code,
        label: l3Detail.label,
        source: 'type',
      });
    }

    const copingAbilities = getField<Record<string, unknown> | null>('coping_abilities');
    const copingValues = (
      copingAbilities && !Array.isArray(copingAbilities) && Array.isArray(copingAbilities.values)
        ? copingAbilities.values as string[]
        : []
    );

    for (const copingValue of copingValues) {
      const competency = COPING_TO_COMPETENCY[copingValue];
      if (competency) {
        result.push({
          code: competency.code,
          label: t(competency.labelKey),
          source: 'coping',
        });
      }
    }

    return result;
  }, [category, item, t]);

  const titleKey = CATEGORY_TITLE_KEYS[category] ?? 'competency.threat_related';
  const title = t(titleKey);

  if (competencies.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.summary} ${styles[category]}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.count}>{competencies.length}</span>
      </div>
      <div className={styles.competencies}>
        {competencies.map((competency) => (
          <div
            key={`${competency.source}-${competency.code}`}
            className={`${styles.competency} ${styles[competency.source]}`}
          >
            <span className={styles.code}>{competency.code}</span>
            <span className={styles.label}>{competency.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
