import { type FC, useMemo } from 'react';
import { Badge } from '../../common/badge';
import styles from './training-topics-panel.module.scss';

export interface TrainingTopicsPanelProps {
  threatTopics: string[];
  errorTopics: string[];
  uasTopics: string[];
}

interface TopicCategory {
  key: 'threat' | 'error' | 'uas';
  label: string;
  topics: string[];
}

export const TrainingTopicsPanel: FC<TrainingTopicsPanelProps> = ({
  threatTopics,
  errorTopics,
  uasTopics,
}) => {
  const categories = useMemo((): TopicCategory[] => {
    return [
      { key: 'threat', label: '威胁相关', topics: threatTopics },
      { key: 'error', label: '差错相关', topics: errorTopics },
      { key: 'uas', label: 'UAS相关', topics: uasTopics },
    ];
  }, [threatTopics, errorTopics, uasTopics]);

  const allTopics = useMemo(() => {
    const combined = [...threatTopics, ...errorTopics, ...uasTopics];
    return [...new Set(combined)];
  }, [threatTopics, errorTopics, uasTopics]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={styles.title}>Training Topics</h4>
        {allTopics.length > 0 && (
          <Badge type="info">{allTopics.length} 个主题</Badge>
        )}
      </div>

      <div className={styles.content}>
        {categories.map((category) => (
          <div key={category.key} className={styles.category}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryLabel}>{category.label}</span>
            </div>
            <div className={styles.topicsList} role="list">
              {category.topics.length === 0 ? (
                <span className={styles.autoFilled}>Auto-filled</span>
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
