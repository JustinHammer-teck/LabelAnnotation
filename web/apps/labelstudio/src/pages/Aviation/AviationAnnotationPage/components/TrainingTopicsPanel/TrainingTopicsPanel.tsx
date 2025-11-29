import React from 'react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { calculatedTrainingAtom } from '../../stores/aviation-annotation.store';
import styles from './TrainingTopicsPanel.module.scss';

export const TrainingTopicsPanel: React.FC = () => {
  const { t } = useTranslation();
  const trainingTopics = useAtomValue(calculatedTrainingAtom);

  const formatTopics = (topics: string[]): string => {
    return topics.length > 0 ? topics.join('\n') : '';
  };

  return (
    <div className={styles.trainingPanel}>
      <div className={styles.panelHeader}>{t('aviation.training_panel.title')}</div>

      <div className={styles.topicSection}>
        <div className={styles.topicHeader}>{t('aviation.training_panel.threat_related')}</div>
        <div className={styles.topicBox}>
          <textarea
            value={formatTopics(trainingTopics.threat_training_topics)}
            placeholder={t('aviation.training_panel.auto_fill')}
            className={styles.textarea}
            readOnly
          />
        </div>
      </div>

      <div className={styles.topicSection}>
        <div className={styles.topicHeader}>{t('aviation.training_panel.error_related')}</div>
        <div className={styles.topicBox}>
          <textarea
            value={formatTopics(trainingTopics.error_training_topics)}
            placeholder={t('aviation.training_panel.auto_fill')}
            className={styles.textarea}
            readOnly
          />
        </div>
      </div>

      <div className={styles.topicSection}>
        <div className={styles.topicHeader}>{t('aviation.training_panel.uas_related')}</div>
        <div className={styles.topicBox}>
          <textarea
            value={formatTopics(trainingTopics.uas_training_topics)}
            placeholder={t('aviation.training_panel.auto_fill')}
            className={styles.textarea}
            readOnly
          />
        </div>
      </div>

      <button className={styles.addButton}>
        <span className={styles.plusIcon}>+</span>
        {t('aviation.training_panel.add_annotation')}
      </button>
    </div>
  );
};
