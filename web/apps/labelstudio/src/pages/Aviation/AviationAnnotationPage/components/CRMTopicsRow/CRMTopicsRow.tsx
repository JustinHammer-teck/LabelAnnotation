import React from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom } from '../../stores/aviation-annotation.store';
import styles from './CRMTopicsRow.module.scss';

const CRM_TOPICS = [
  { code: 'KNO', label: 'KNO' },
  { code: 'PRO', label: 'PRO' },
  { code: 'FPA', label: 'FPA' },
  { code: 'FPM', label: 'FPM' },
  { code: 'COM', label: 'COM' },
  { code: 'LTW', label: 'LTW' },
  { code: 'SAW', label: 'SAW' },
  { code: 'WLM', label: 'WLM' },
  { code: 'PSD', label: 'PSD' },
];

export const CRMTopicsRow: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useAtom(annotationDataAtom);

  const toggleTopic = (code: string) => {
    const current = data.crm_training_topics || [];
    const updated = current.includes(code)
      ? current.filter(t => t !== code)
      : [...current, code];
    setData({ ...data, crm_training_topics: updated });
  };

  return (
    <div className={styles.crmRow}>
      {CRM_TOPICS.map((topic) => (
        <div key={topic.code} className={styles.crmTopic}>
          <div className={styles.topicLabel}>{topic.label}</div>
          <div className={styles.topicContent}>
            <button className={styles.multiSelectButton}>
              {t('aviation.crm.dropdown_multi')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
