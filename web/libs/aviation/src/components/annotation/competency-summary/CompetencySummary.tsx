import { type FC, useMemo } from 'react';
import type { LabelingItem } from '../../../types/annotation.types';
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

const CATEGORY_TITLES: Record<string, string> = {
  threat: '威胁相关胜任力',
  error: '差错相关胜任力',
  uas: 'UAS相关胜任力',
};

const COPING_TO_COMPETENCY: Record<string, { code: string; label: string }> = {
  situation_awareness: { code: 'SA', label: '情境意识' },
  decision_making: { code: 'DM', label: '决策能力' },
  communication: { code: 'COM', label: '沟通能力' },
  workload_management: { code: 'WM', label: '工作负荷管理' },
  crew_coordination: { code: 'CC', label: '机组协作' },
  stress_management: { code: 'SM', label: '压力管理' },
  automation_management: { code: 'AM', label: '自动化管理' },
};

export const CompetencySummary: FC<CompetencySummaryProps> = ({ category, item }) => {
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
          label: competency.label,
          source: 'coping',
        });
      }
    }

    return result;
  }, [category, item]);

  const title = CATEGORY_TITLES[category] ?? '相关胜任力';

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
