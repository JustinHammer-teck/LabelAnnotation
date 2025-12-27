import { type FC, type ReactNode, useCallback, useMemo, useState } from 'react';
import { Select, MultiSelect, TextArea } from '../../common';
import { useDropdownOptions } from '../../../hooks';
import { useAviationTranslation } from '../../../i18n';
import type { ResultPerformance, ReviewableFieldName, UserRole } from '../../../types';
import { ReviewableField, type FieldReviewState } from '../../review/ReviewableField';
import { useOptionalReviewContext } from '../../../context';
import styles from './result-performance.module.scss';

export interface ResultPerformanceItemProps {
  item: ResultPerformance;
  index: number;
  onUpdate: (id: number, updates: Partial<ResultPerformance>) => void;
  onDelete: (id: number) => void;
  defaultExpanded?: boolean;
  disabled?: boolean;
  deleteTooltip?: string;
  /** Current user's role for review permission checks */
  userRole?: UserRole;
  /** Whether the UI is in review mode */
  isReviewMode?: boolean;
  /** Review states for each field */
  fieldReviewStates?: Partial<Record<ReviewableFieldName, FieldReviewState>>;
  /** Callback when a field is approved */
  onFieldApprove?: (fieldName: ReviewableFieldName) => void;
  /** Callback when a field is rejected */
  onFieldReject?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback when revision is requested for a field */
  onFieldRequestRevision?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback to clear review status for a field */
  onFieldClearStatus?: (fieldName: ReviewableFieldName) => void;
}

export const ResultPerformanceItem: FC<ResultPerformanceItemProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  defaultExpanded = false,
  disabled = false,
  deleteTooltip,
  userRole: userRoleProp,
  isReviewMode: isReviewModeProp = false,
  fieldReviewStates: fieldReviewStatesProp,
  onFieldApprove: onFieldApproveProp,
  onFieldReject: onFieldRejectProp,
  onFieldRequestRevision: onFieldRequestRevisionProp,
  onFieldClearStatus: onFieldClearStatusProp,
}) => {
    const { t, currentLanguage } = useAviationTranslation();
    const [expanded, setExpanded] = useState(defaultExpanded);

    // Get review context (null if outside provider)
    const reviewContext = useOptionalReviewContext();

    // Use context values with props as fallback for backwards compatibility
    const userRole = userRoleProp ?? reviewContext?.userRole;
    const isReviewMode = isReviewModeProp || (reviewContext?.isReviewMode ?? false);
    const getFieldReviewState = reviewContext?.getFieldReviewState;
    const onFieldApprove = onFieldApproveProp ?? reviewContext?.onFieldApprove;
    const onFieldReject = onFieldRejectProp ?? reviewContext?.onFieldReject;
    const onFieldRequestRevision = onFieldRequestRevisionProp ?? reviewContext?.onFieldRequestRevision;
    const onFieldClearStatus = onFieldClearStatusProp ?? reviewContext?.onFieldClearStatus;

    /**
     * Get the review state for a field.
     * Uses prop value if provided, otherwise uses context.
     */
    const getReviewState = useCallback(
      (fieldName: ReviewableFieldName): FieldReviewState | undefined => {
        // Props take precedence over context
        if (fieldReviewStatesProp) {
          return fieldReviewStatesProp[fieldName];
        }
        // Use context accessor if available
        return getFieldReviewState?.(fieldName);
      },
      [fieldReviewStatesProp, getFieldReviewState]
    );

    /**
     * Wraps a form field with ReviewableField component for review tooltip functionality.
     * Only wraps when userRole and isReviewMode are set appropriately.
     */
    const wrapWithReviewable = useCallback(
      (fieldName: ReviewableFieldName, fieldLabel: string, children: ReactNode): ReactNode => {
        if (!userRole || !isReviewMode) {
          return children;
        }

        return (
          <ReviewableField
            fieldName={fieldName}
            fieldLabel={fieldLabel}
            userRole={userRole}
            isReviewMode={isReviewMode}
            reviewStatus={getReviewState(fieldName)}
            onApprove={onFieldApprove}
            onReject={onFieldReject}
            onRequestRevision={onFieldRequestRevision}
            onClearStatus={onFieldClearStatus}
          >
            {children}
          </ReviewableField>
        );
      },
      [userRole, isReviewMode, getReviewState, onFieldApprove, onFieldReject, onFieldRequestRevision, onFieldClearStatus]
    );

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
        if (disabled) return;
        onDelete(item.id);
      },
      [item.id, onDelete, disabled],
    );

    const handleFieldChange = useCallback(
      (field: keyof ResultPerformance, value: unknown) => {
        if (disabled) return;
        onUpdate(item.id, { [field]: value });
      },
      [item.id, onUpdate, disabled],
    );

    const eventTypeLabel = useMemo(() => {
      const opt = eventTypeSelectOptions.find((o) => o.value === item.event_type);
      const typeLabel = opt?.label || item.event_type || t('defaults.new_assessment');
      return `${t('result_performance.result_item', { index: index + 1 })}: ${typeLabel}`;
    }, [eventTypeSelectOptions, item.event_type, index, t]);

    return (
      <div className={`${styles.item} ${expanded ? '' : styles.collapsed} ${disabled ? styles.disabled : ''}`}>
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
              disabled={disabled}
              title={disabled ? deleteTooltip : undefined}
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
                {wrapWithReviewable(
                  'result_event_type',
                  t('result_performance.event_type'),
                  <Select
                    value={item.event_type || null}
                    onChange={(value) => handleFieldChange('event_type', value)}
                    options={eventTypeSelectOptions}
                    placeholder={t('placeholders.select')}
                    aria-label={t('result_performance.event_type')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.flight_phase')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_flight_phase',
                  t('result_performance.flight_phase'),
                  <Select
                    value={item.flight_phase || null}
                    onChange={(value) => handleFieldChange('flight_phase', value)}
                    options={flightPhaseSelectOptions}
                    placeholder={t('placeholders.select')}
                    aria-label={t('result_performance.flight_phase')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.likelihood')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_likelihood',
                  t('result_performance.likelihood'),
                  <Select
                    value={item.likelihood || null}
                    onChange={(value) => handleFieldChange('likelihood', value)}
                    options={likelihoodSelectOptions}
                    placeholder={t('placeholders.select')}
                    aria-label={t('result_performance.likelihood')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.severity')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_severity',
                  t('result_performance.severity'),
                  <Select
                    value={item.severity || null}
                    onChange={(value) => handleFieldChange('severity', value)}
                    options={severitySelectOptions}
                    placeholder={t('placeholders.select')}
                    aria-label={t('result_performance.severity')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.training_effect')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_training_effect',
                  t('result_performance.training_effect'),
                  <Select
                    value={item.training_effect || null}
                    onChange={(value) => handleFieldChange('training_effect', value)}
                    options={trainingEffectSelectOptions}
                    placeholder={t('placeholders.select')}
                    aria-label={t('result_performance.training_effect')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.training_plan')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_training_plan',
                  t('result_performance.training_plan'),
                  <TextArea
                    value={item.training_plan || ''}
                    onChange={(value) => handleFieldChange('training_plan', value)}
                    rows={2}
                    placeholder={t('placeholders.enter_training_plan')}
                    aria-label={t('result_performance.training_plan')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.training_topics')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_training_topics',
                  t('result_performance.training_topics'),
                  <MultiSelect
                    value={item.training_topics || []}
                    onChange={(value) => handleFieldChange('training_topics', value)}
                    options={trainingTopicsSelectOptions}
                    placeholder={t('result_performance.select_training_topics')}
                    aria-label={t('result_performance.training_topics')}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.fieldsRow} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('result_performance.objectives')}</label>
              <div className={styles.fieldInput}>
                {wrapWithReviewable(
                  'result_objectives',
                  t('result_performance.objectives'),
                  <TextArea
                    value={item.objectives || ''}
                    onChange={(value) => handleFieldChange('objectives', value)}
                    rows={2}
                    placeholder={t('placeholders.enter_goal')}
                    aria-label={t('result_performance.objectives')}
                    disabled={disabled}
                  />
                )}
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
