import React, { useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom, updateFieldAtom } from '../../stores/aviation-annotation.store';
import { useDropdownOptions } from '../../hooks/use-dropdown-options.hook';
import { MultiSelectDropdown } from '../MultiSelectDropdown/MultiSelectDropdown';
import { DropdownOption } from '../../types/aviation.types';
import styles from './CompetencyIndicatorsRow.module.scss';

export const CompetencyIndicatorsRow: React.FC = () => {
  const { t } = useTranslation();
  const data = useAtomValue(annotationDataAtom);
  const updateField = useSetAtom(updateFieldAtom);
  const { options } = useDropdownOptions();

  const competencyLevel1 = useMemo(() => {
    return (options?.competency || []).filter((c: DropdownOption) => c.level === 1);
  }, [options?.competency]);

  const getLevel2Options = useMemo(() => {
    const allCompetency = options?.competency || [];
    return (parentId: number): DropdownOption[] => {
      return allCompetency.filter((c: DropdownOption) => c.level === 2 && c.parent_id === parentId);
    };
  }, [options?.competency]);

  const competencySelections: Record<string, string[]> =
    data.competency_selections && typeof data.competency_selections === 'object' && !Array.isArray(data.competency_selections)
      ? data.competency_selections as Record<string, string[]>
      : {};

  const handleTopicsChange = (topicCode: string, selected: string[]) => {
    const updatedTopics: Record<string, string[]> = {
      ...competencySelections,
      [topicCode]: selected,
    };
    updateField({ field: 'competency_selections', value: updatedTopics });
  };

  const getTopicValue = (code: string): string[] => {
    const value = competencySelections[code];
    return Array.isArray(value) ? value : [];
  };

  if (competencyLevel1.length === 0) {
    return null;
  }

  return (
    <div className={styles.competencyRow}>
      <table className={styles.competencyTable}>
        <thead>
          <tr>
            {competencyLevel1.map((comp: DropdownOption) => (
              <th key={comp.id} className={styles.topicHeader} title={comp.label}>
                {comp.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {competencyLevel1.map((comp: DropdownOption) => (
              <td key={comp.id} className={styles.topicCell}>
                <MultiSelectDropdown
                  options={getLevel2Options(comp.id)}
                  value={getTopicValue(comp.code)}
                  onChange={(selected) => handleTopicsChange(comp.code, selected)}
                  placeholder={t('aviation.crm.dropdown_multi')}
                  maxChipsDisplay={2}
                  title={comp.label}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
