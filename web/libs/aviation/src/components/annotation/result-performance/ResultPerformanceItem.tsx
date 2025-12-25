import { type FC, useCallback, useMemo, useState } from 'react';
import { Select, MultiSelect, TextArea } from '../../common';
import { useDropdownOptions } from '../../../hooks';
import { useAviationTranslation } from '../../../i18n';
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
    const { t, currentLanguage } = useAviationTranslation();
    const [expanded, setExpanded] = useState(defaultExpanded);

    const { options: eventTypeOptions } = useDropdownOptions('event_type');
    const { options: flightPhaseOptions } = useDropdownOptions('flight_phase');
    const { options: likelihoodOptions } = useDropdownOptions('likelihood');
    const { options: severityOptions } = useDropdownOptions('severity');
    const { options: trainingEffectOptions } = useDropdownOptions('training_effect');
    const { options: trainingTopicsOptions } = useDropdownOptions('training_topics');

    const eventTypeSelectOptions = useMemo(
      () => eventTypeOptions.map((opt) => ({
        value: opt.code,
        label: currentLanguage === 'cn' ? (opt.label_zh || opt.label) : opt.label
      })),
      [eventTypeOptions, currentLanguage],
    );

    const flightPhaseSelectOptions = useMemo(
      () => flightPhaseOptions.map((opt) => ({
        value: opt.code,
        label: currentLanguage === 'cn' ? (opt.label_zh || opt.label) : opt.label
      })),
      [flightPhaseOptions, currentLanguage],
    );

    const likelihoodSelectOptions = useMemo(
      () => likelihoodOptions.map((opt) => ({
        value: opt.code,
        label: currentLanguage === 'cn' ? (opt.label_zh || opt.label) : opt.label
      })),
      [likelihoodOptions, currentLanguage],
    );

    const severitySelectOptions = useMemo(
      () => severityOptions.map((opt) => ({
        value: opt.code,
        label: currentLanguage === 'cn' ? (opt.label_zh || opt.label) : opt.label
      })),
      [severityOptions, currentLanguage],
    );

    const trainingEffectSelectOptions = useMemo(
      () => trainingEffectOptions.map((opt) => ({
        value: opt.code,
        label: currentLanguage === 'cn' ? (opt.label_zh || opt.label) : opt.label
      })),
      [trainingEffectOptions, currentLanguage],
    );

    const trainingTopicsSelectOptions = useMemo(
      () => trainingTopicsOptions.map((opt) => ({
        value: opt.code,
        label: currentLanguage === 'cn' ? (opt.label_zh || opt.label) : opt.label
      })),
      [trainingTopicsOptions, currentLanguage],
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
      const typeLabel = opt?.label || item.event_type || t('defaults.new_assessment');
      return `${t('result_performance.result_item', { index: index + 1 })}: ${typeLabel}`;
    }, [eventTypeSelectOptions, item.event_type, index, t]);

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
              aria-label={t('common.delete')}
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
              <label className={styles.fieldLabel}>{t('result_performance.event_type')}</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.event_type || null}
                  onChange={(value) => handleFieldChange('event_type', value)}
                  options={eventTypeSelectOptions}
                  placeholder={t('placeholders.select')}
                  aria-label={t('result_performance.event_type')}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.flight_phase')}</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.flight_phase || null}
                  onChange={(value) => handleFieldChange('flight_phase', value)}
                  options={flightPhaseSelectOptions}
                  placeholder={t('placeholders.select')}
                  aria-label={t('result_performance.flight_phase')}
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.likelihood')}</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.likelihood || null}
                  onChange={(value) => handleFieldChange('likelihood', value)}
                  options={likelihoodSelectOptions}
                  placeholder={t('placeholders.select')}
                  aria-label={t('result_performance.likelihood')}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.severity')}</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.severity || null}
                  onChange={(value) => handleFieldChange('severity', value)}
                  options={severitySelectOptions}
                  placeholder={t('placeholders.select')}
                  aria-label={t('result_performance.severity')}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.training_effect')}</label>
              <div className={styles.fieldInput}>
                <Select
                  value={item.training_effect || null}
                  onChange={(value) => handleFieldChange('training_effect', value)}
                  options={trainingEffectSelectOptions}
                  placeholder={t('placeholders.select')}
                  aria-label={t('result_performance.training_effect')}
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.training_plan')}</label>
              <div className={styles.fieldInput}>
                <TextArea
                  value={item.training_plan || ''}
                  onChange={(value) => handleFieldChange('training_plan', value)}
                  rows={2}
                  placeholder={t('placeholders.enter_training_plan')}
                  aria-label={t('result_performance.training_plan')}
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.training_topics')}</label>
              <div className={styles.fieldInput}>
                <MultiSelect
                  value={item.training_topics || []}
                  onChange={(value) => handleFieldChange('training_topics', value)}
                  options={trainingTopicsSelectOptions}
                  placeholder={t('result_performance.select_training_topics')}
                  aria-label={t('result_performance.training_topics')}
                />
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.objectives')}</label>
              <div className={styles.fieldInput}>
                <TextArea
                  value={item.objectives || ''}
                  onChange={(value) => handleFieldChange('objectives', value)}
                  rows={2}
                  placeholder={t('placeholders.enter_goal')}
                  aria-label={t('result_performance.objectives')}
                />
              </div>
            </div>
          </div>

          <div className={styles.summariesSection}>
            <h5 className={styles.summariesTitle}>{t('result_performance.auto_summary')}</h5>
            <div className={styles.summariesGrid}>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>{t('result_performance.threat_summary')}</span>
                <span className={styles.summaryValue}>{item.threat_summary || '-'}</span>
              </div>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>{t('result_performance.error_summary')}</span>
                <span className={styles.summaryValue}>{item.error_summary || '-'}</span>
              </div>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>{t('result_performance.competency_summary')}</span>
                <span className={styles.summaryValue}>{item.competency_summary || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
