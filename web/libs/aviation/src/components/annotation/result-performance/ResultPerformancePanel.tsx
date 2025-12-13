import { type FC, useEffect, useCallback } from 'react';
import { Button } from '../../common';
import { usePerformances } from '../../../hooks';
import { ResultPerformanceItem } from './ResultPerformanceItem';
import styles from './result-performance.module.scss';

export interface ResultPerformancePanelProps {
  projectId: number;
}

export const ResultPerformancePanel: FC<ResultPerformancePanelProps> = ({
  projectId,
}) => {
  const {
    performances,
    loading,
    error,
    fetchPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
  } = usePerformances(projectId);

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
        <h3 className={styles.panelTitle}>结果绩效评估</h3>
        <Button variant="primary" size="small" onClick={handleAdd}>
          + 添加
        </Button>
      </div>

      {loading && performances.length === 0 ? (
        <div className={styles.loading}>加载中...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : performances.length === 0 ? (
        <div className={styles.empty}>暂无结果绩效评估，点击"添加"创建</div>
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
