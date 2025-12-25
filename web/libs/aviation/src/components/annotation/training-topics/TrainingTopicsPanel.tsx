import { type FC, useMemo } from 'react';
import { useAviationTranslation } from '../../../i18n';
import { Badge } from '../../common/badge';
import styles from './training-topics-panel.module.scss';

export interface TrainingTopicsPanelProps {
  threatTopics: string[];
  errorTopics: string[];
  uasTopics: string[];
}

interface TopicCategory {
  key: 'threat' | 'error' | 'uas';
  labelKey: string;
  topics: string[];
}

export const TrainingTopicsPanel: FC<TrainingTopicsPanelProps> = ({
  threatTopics,
  errorTopics,
  uasTopics,
}) => {
  const { t } = useAviationTranslation();

  const categories = useMemo((): TopicCategory[] => {
    return [
      { key: 'threat', labelKey: 'training_topics.threat_related', topics: threatTopics },
      { key: 'error', labelKey: 'training_topics.error_related', topics: errorTopics },
      { key: 'uas', labelKey: 'training_topics.uas_related', topics: uasTopics },
    ];
  }, [threatTopics, errorTopics, uasTopics]);

  const allTopics = useMemo(() => {
    const combined = [...threatTopics, ...errorTopics, ...uasTopics];
    return [...new Set(combined)];
  }, [threatTopics, errorTopics, uasTopics]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={styles.title}>{t('training_topics.title')}</h4>
        {allTopics.length > 0 && (
          <Badge type="info">{t('training_topics.count', { count: allTopics.length })}</Badge>
        )}
      </div>

      <div className={styles.content}>
        {categories.map((category) => (
          <div key={category.key} className={styles.category}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryLabel}>{t(category.labelKey)}</span>
            </div>
            <div className={styles.topicsList} role="list">
              {category.topics.length === 0 ? (
                <span className={styles.autoFilled}>{t('training_topics.auto_filled')}</span>
              ) : (
                category.topics.map((topic) => (
                  <span
                    key={topic}
                    role="listitem"
                    className={`${styles.topicBadge} ${styles[category.key]}`}
                  >
                    {topic}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
