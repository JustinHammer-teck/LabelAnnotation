import React, { useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom, updateFieldAtom } from '../../stores/aviation-annotation.store';
import { useDropdownOptions } from '../../hooks/use-dropdown-options.hook';
import styles from './ResultsTable.module.scss';

export const ResultsTable: React.FC = () => {
  const { t } = useTranslation();
  const data = useAtomValue(annotationDataAtom);
  const updateField = useSetAtom(updateFieldAtom);
  const { options } = useDropdownOptions();

  const competencySummary = useMemo(() => {
    const indicators = data.competency_indicators || [];
    if (indicators.length === 0) return '';

    const competencyOptions = options?.competency || [];
    const selectedLabels = indicators
      .map(id => competencyOptions.find(opt => String(opt.id) === id)?.label)
      .filter(Boolean);

    return selectedLabels.join(', ');
  }, [data.competency_indicators, options]);

  const handleFieldChange = <K extends keyof typeof data>(field: K, value: typeof data[K]) => {
    updateField({ field, value });
  };

  return (
    <div className={styles.resultsSection}>
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            <th rowSpan={2} className={styles.categoryHeader}>{t('aviation.results.category')}</th>
            <th colSpan={4} className={styles.sectionHeader}>{t('aviation.results.training_details')}</th>
            <th colSpan={2} className={styles.sectionHeader}>{t('aviation.results.crm_training_topics')}</th>
            <th rowSpan={2} className={styles.categoryHeader}>{t('aviation.results.competency_summary')}</th>
          </tr>
          <tr>
            <th>{t('aviation.results.likelihood')}</th>
            <th>{t('aviation.results.severity')}</th>
            <th>{t('aviation.results.training_effect')}</th>
            <th>{t('aviation.results.training_plan')}</th>
            <th>{t('aviation.results.training_topics')}</th>
            <th>{t('aviation.results.goals')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.rowLabel}>{t('aviation.results.single_select')}</td>
            <td>
              <select
                value={data.likelihood}
                onChange={(e) => handleFieldChange('likelihood', e.target.value)}
                className={styles.select}
              >
                <option value="">{t('aviation.results.select')}</option>
                {options?.likelihood?.map((opt) => (
                  <option key={opt.id} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                value={data.severity}
                onChange={(e) => handleFieldChange('severity', e.target.value)}
                className={styles.select}
              >
                <option value="">{t('aviation.results.select')}</option>
                {options?.severity?.map((opt) => (
                  <option key={opt.id} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                value={data.training_benefit}
                onChange={(e) => handleFieldChange('training_benefit', e.target.value)}
                className={styles.select}
              >
                <option value="">{t('aviation.results.select')}</option>
                {options?.training_benefit?.map((opt) => (
                  <option key={opt.id} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </td>
            <td rowSpan={2}>
              <textarea
                value={data.training_plan_ideas}
                onChange={(e) => handleFieldChange('training_plan_ideas', e.target.value)}
                placeholder={t('aviation.results.fill_in')}
                className={styles.textarea}
              />
            </td>
            <td rowSpan={2} className={styles.questionMark}>?</td>
            <td rowSpan={2}>
              <textarea
                value={data.goals_to_achieve}
                onChange={(e) => handleFieldChange('goals_to_achieve', e.target.value)}
                placeholder={t('aviation.results.fill_in')}
                className={styles.textarea}
              />
            </td>
            <td rowSpan={2} className={styles.competencyCell}>
              {competencySummary}
            </td>
          </tr>
          <tr>
            <td className={styles.rowLabel}>{t('aviation.results.dropdown_single_desc')}</td>
            <td className={styles.descCell}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_single_desc')}</td>
            <td className={styles.descCell}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_single_desc')}</td>
            <td className={styles.descCell}>{t('aviation.results.level_1_menu')}<br/>{t('aviation.results.dropdown_multi_desc')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
