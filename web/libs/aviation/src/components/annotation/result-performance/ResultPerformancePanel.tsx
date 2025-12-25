import { type FC, useEffect, useCallback } from 'react';
import { Button } from '../../common';
import { usePerformances } from '../../../hooks';
import { useAviationTranslation } from '../../../i18n';
import { ResultPerformanceItem } from './ResultPerformanceItem';
import styles from './result-performance.module.scss';

export interface ResultPerformancePanelProps {
  eventId: number;
}

export const ResultPerformancePanel: FC<ResultPerformancePanelProps> = ({
  eventId,
}) => {
  const { t } = useAviationTranslation();
  const {
    performances,
    loading,
    error,
    fetchPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
  } = usePerformances(eventId);

  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  const handleAdd = useCallback(() => {
    createPerformance({});
  }, [createPerformance]);

  const handleUpdate = useCallback(
    (id: number, data: Record<string, unknown>) => {
      updatePerformance(id, data);
    },
    [updatePerformance],
  );

  const handleDelete = useCallback(
    (id: number) => {
      deletePerformance(id);
    },
    [deletePerformance],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>{t('result_performance.panel_title')}</h3>
        <Button variant="primary" size="small" onClick={handleAdd}>
          {t('result_performance.add_result')}
        </Button>
      </div>

      {loading && performances.length === 0 ? (
        <div className={styles.loading}>{t('common.loading')}</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : performances.length === 0 ? (
        <div className={styles.empty}>{t('empty.no_results')}</div>
      ) : (
        <div className={styles.itemsList}>
          {performances.map((perf, index) => (
            <ResultPerformanceItem
              key={perf.id}
              item={perf}
              index={index}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
