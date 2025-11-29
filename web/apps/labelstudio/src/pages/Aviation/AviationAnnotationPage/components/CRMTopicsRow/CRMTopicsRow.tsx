import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom, updateFieldAtom } from '../../stores/aviation-annotation.store';
import { useDropdownOptions } from '../../hooks/use-dropdown-options.hook';
import { MultiSelectDropdown } from '../MultiSelectDropdown/MultiSelectDropdown';
import styles from './CRMTopicsRow.module.scss';

const CRM_TOPIC_CODES = ['KNO', 'PRO', 'FPA', 'FPM', 'COM', 'LTW', 'SAW', 'WLM', 'PSD'];

export const CRMTopicsRow: React.FC = () => {
  const { t } = useTranslation();
  const data = useAtomValue(annotationDataAtom);
  const updateField = useSetAtom(updateFieldAtom);
  const { options } = useDropdownOptions();

  const crmTopics: Record<string, string[]> =
    data.crm_training_topics && typeof data.crm_training_topics === 'object' && !Array.isArray(data.crm_training_topics)
      ? data.crm_training_topics as Record<string, string[]>
      : {};

  const handleTopicsChange = (topicCode: string, selected: string[]) => {
    const updatedTopics: Record<string, string[]> = {
      ...crmTopics,
      [topicCode]: selected,
    };
    updateField({ field: 'crm_training_topics', value: updatedTopics });
  };

  const getTopicValue = (code: string): string[] => {
    const value = crmTopics[code];
    return Array.isArray(value) ? value : [];
  };

  return (
    <div className={styles.crmRow}>
      <table className={styles.crmTable}>
        <thead>
          <tr>
            {CRM_TOPIC_CODES.map(code => (
              <th key={code} className={styles.topicHeader}>
                {code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {CRM_TOPIC_CODES.map(code => (
              <td key={code} className={styles.topicCell}>
                <MultiSelectDropdown
                  options={options?.crm_topics || []}
                  value={getTopicValue(code)}
                  onChange={(selected) => handleTopicsChange(code, selected)}
                  placeholder={t('aviation.crm.dropdown_multi')}
                  maxChipsDisplay={2}
                  title={`${code} - ${t('aviation.crm.title')}`}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
