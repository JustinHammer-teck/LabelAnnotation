import { type FC, useCallback, useMemo, useState } from 'react';
import { Select, MultiSelect, TextArea } from '../../common';
import { useDropdownOptions } from '../../../hooks';
import type { ResultPerformance } from '../../../types';
import styles from './result-performance.module.scss';

export interface ResultPerformanceItemProps {
  item: ResultPerformance;
  index: number;
  onUpdate: (id: number, updates: Partial<ResultPerformance>) => void;
  onDelete: (id: number) => void;
  defaultExpanded?: boolean;
}

export const ResultPerformanceItem: FC<ResultPerformanceItemProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  defaultExpanded = false,
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const { options: eventTypeOptions } = useDropdownOptions('event_type');
    const { options: flightPhaseOptions } = useDropdownOptions('flight_phase');
    const { options: likelihoodOptions } = useDropdownOptions('likelihood');
    const { options: severityOptions } = useDropdownOptions('severity');
    const { options: trainingEffectOptions } = useDropdownOptions('training_effect');
    const { options: trainingTopicsOptions } = useDropdownOptions('training_topics');

    const eventTypeSelectOptions = useMemo(
      () => eventTypeOptions.map((opt) => ({ value: opt.code, label: opt.label_zh || opt.label })),
      [eventTypeOptions],
    );

    const flightPhaseSelectOptions = useMemo(
      () => flightPhaseOptions.map((opt) => ({ value: opt.code, label: opt.label_zh || opt.label })),
      [flightPhaseOptions],
    );

    const likelihoodSelectOptions = useMemo(
      () => likelihoodOptions.map((opt) => ({ value: opt.code, label: opt.label_zh || opt.label })),
      [likelihoodOptions],
    );

    const severitySelectOptions = useMemo(
      () => severityOptions.map((opt) => ({ value: opt.code, label: opt.label_zh || opt.label })),
      [severityOptions],
    );

    const trainingEffectSelectOptions = useMemo(
      () => trainingEffectOptions.map((opt) => ({ value: opt.code, label: opt.label_zh || opt.label })),
      [trainingEffectOptions],
    );

    const trainingTopicsSelectOptions = useMemo(
      () => trainingTopicsOptions.map((opt) => ({ value: opt.code, label: opt.label_zh || opt.label })),
      [trainingTopicsOptions],
    );

    const handleToggle = useCallback(() => {
      setExpanded((prev) => !prev);
    }, []);

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(item.id);
      },
      [item.id, onDelete],
    );

    const handleFieldChange = useCallback(
      (field: keyof ResultPerformance, value: unknown) => {
        onUpdate(item.id, { [field]: value });
      },
      [item.id, onUpdate],
    );

    const eventTypeLabel = useMemo(() => {
      const opt = eventTypeSelectOptions.find((o) => o.value === item.event_type);
      const typeLabel = opt?.label || item.event_type || '新建评估';
      return `结果 ${index + 1}: ${typeLabel}`;
    }, [eventTypeSelectOptions, item.event_type, index]);

    return (
      <div className={`${styles.item} ${expanded ? '' : styles.collapsed}`}>
        <div className={styles.itemHeader} onClick={handleToggle}>
          <h4 className={styles.itemTitle}>
            <span className={styles.expandIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            {eventTypeLabel}
          </h4>
          <div className={styles.itemActions}>
            <button
              type="button"
              onClick={handleDelete}
              className={styles.deleteButton}
              aria-label="删除"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M10 4v7a1 1 0 01-1 1H5a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.itemContent}>
          <div className={styles.fieldsRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>事件类型</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.event_type || null}
                  onChange={(value) => handleFieldChange('event_type', value)}
                  options={eventTypeSelectOptions}
                  placeholder="请选择"
                  aria-label="事件类型"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>飞行阶段</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.flight_phase || null}
                  onChange={(value) => handleFieldChange('flight_phase', value)}
                  options={flightPhaseSelectOptions}
                  placeholder="请选择"
                  aria-label="飞行阶段"
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>可能性</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.likelihood || null}
                  onChange={(value) => handleFieldChange('likelihood', value)}
                  options={likelihoodSelectOptions}
                  placeholder="请选择"
                  aria-label="可能性"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>严重程度</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.severity || null}
                  onChange={(value) => handleFieldChange('severity', value)}
                  options={severitySelectOptions}
                  placeholder="请选择"
                  aria-label="严重程度"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>训练效果</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.training_effect || null}
                  onChange={(value) => handleFieldChange('training_effect', value)}
                  options={trainingEffectSelectOptions}
                  placeholder="请选择"
                  aria-label="训练效果"
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>训练方案设想</label>
              <div className={styles.fieldInput}>
                <TextArea
                  value={item.training_plan || ''}
                  onChange={(value) => handleFieldChange('training_plan', value)}
                  rows={2}
                  placeholder="请输入训练方案设想"
                  aria-label="训练方案设想"
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>训练主题</label>
              <div className={styles.fieldInput}>
                <MultiSelect
                  value={item.training_topics || []}
                  onChange={(value) => handleFieldChange('training_topics', value)}
                  options={trainingTopicsSelectOptions}
                  placeholder="请选择训练主题"
                  aria-label="训练主题"
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>所需达到的目标</label>
              <div className={styles.fieldInput}>
                <TextArea
                  value={item.objectives || ''}
                  onChange={(value) => handleFieldChange('objectives', value)}
                  rows={2}
                  placeholder="请输入所需达到的目标"
                  aria-label="所需达到的目标"
                />
              </div>
            </div>
          </div>

          <div className={styles.summariesSection}>
            <h5 className={styles.summariesTitle}>自动汇总</h5>
            <div className={styles.summariesGrid}>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>威胁汇总</span>
                <span className={styles.summaryValue}>{item.threat_summary || '-'}</span>
              </div>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>差错汇总</span>
                <span className={styles.summaryValue}>{item.error_summary || '-'}</span>
              </div>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>能力汇总</span>
                <span className={styles.summaryValue}>{item.competency_summary || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
