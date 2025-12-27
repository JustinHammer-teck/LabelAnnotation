import { type FC, type ReactNode, useCallback, memo } from 'react';
import { TextArea } from '../../common';
import type { AviationEvent, ReviewableFieldName, UserRole } from '../../../types';
import { useAviationTranslation } from '../../../i18n';
import { ReviewableField, type FieldReviewState } from '../../review/ReviewableField';
import { useOptionalReviewContext } from '../../../context';
import styles from './editable-event-panel.module.scss';

export interface EditableEventPanelProps {
  event: AviationEvent;
  eventIndex: number;
  onUpdate: (field: keyof AviationEvent, value: string) => void;
  disabled?: boolean;
  /** Current user's role for permission checks */
  userRole?: UserRole;
  /** Whether the UI is in review mode (manager/admin reviewing) */
  isReviewMode?: boolean;
  /** Field-level review states for displaying status indicators */
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

const EditableEventPanelComponent: FC<EditableEventPanelProps> = ({
  event,
  eventIndex,
  onUpdate,
  disabled = false,
  userRole: userRoleProp,
  isReviewMode: isReviewModeProp,
  fieldReviewStates: fieldReviewStatesProp,
  onFieldApprove: onFieldApproveProp,
  onFieldReject: onFieldRejectProp,
  onFieldRequestRevision: onFieldRequestRevisionProp,
  onFieldClearStatus: onFieldClearStatusProp,
}) => {
  const { t } = useAviationTranslation();

  // Get review context values (null if outside provider)
  const reviewContext = useOptionalReviewContext();

  // Use props as overrides, falling back to context values
  const userRole = userRoleProp ?? reviewContext?.userRole;
  const isReviewMode = isReviewModeProp ?? reviewContext?.isReviewMode ?? false;
  const onFieldApprove = onFieldApproveProp ?? reviewContext?.onFieldApprove;
  const onFieldReject = onFieldRejectProp ?? reviewContext?.onFieldReject;
  const onFieldRequestRevision = onFieldRequestRevisionProp ?? reviewContext?.onFieldRequestRevision;
  const onFieldClearStatus = onFieldClearStatusProp ?? reviewContext?.onFieldClearStatus;

  /**
   * Gets the review state for a field.
   * Uses prop-based states if provided, otherwise falls back to context getter.
   */
  const getFieldReviewState = useCallback(
    (fieldName: ReviewableFieldName): FieldReviewState | undefined => {
      // Props take precedence over context
      if (fieldReviewStatesProp) {
        return fieldReviewStatesProp[fieldName];
      }
      // Fall back to context getter
      return reviewContext?.getFieldReviewState(fieldName);
    },
    [fieldReviewStatesProp, reviewContext]
  );

  /**
   * Wraps a field component with ReviewableField for review mode.
   * Only wraps when userRole and isReviewMode are both set.
   */
  const wrapWithReviewable = useCallback(
    (
      fieldName: ReviewableFieldName,
      fieldLabel: string,
      children: ReactNode
    ): ReactNode => {
      if (!userRole || !isReviewMode) {
        return children;
      }

      return (
        <ReviewableField
          fieldName={fieldName}
          fieldLabel={fieldLabel}
          userRole={userRole}
          isReviewMode={isReviewMode}
          reviewStatus={getFieldReviewState(fieldName)}
          onApprove={onFieldApprove}
          onReject={onFieldReject}
          onRequestRevision={onFieldRequestRevision}
          onClearStatus={onFieldClearStatus}
        >
          {children}
        </ReviewableField>
      );
    },
    [
      userRole,
      isReviewMode,
      getFieldReviewState,
      onFieldApprove,
      onFieldReject,
      onFieldRequestRevision,
      onFieldClearStatus,
    ]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      if (disabled) return;
      onUpdate('event_description', value);
    },
    [onUpdate, disabled],
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onUpdate('date', e.target.value);
    },
    [onUpdate, disabled],
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onUpdate('time', e.target.value);
    },
    [onUpdate, disabled],
  );

  const handleAircraftTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onUpdate('aircraft_type', e.target.value);
    },
    [onUpdate, disabled],
  );

  const handleDepartureAirportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onUpdate('departure_airport', e.target.value);
    },
    [onUpdate, disabled],
  );

  const handleArrivalAirportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onUpdate('arrival_airport', e.target.value);
    },
    [onUpdate, disabled],
  );

  const handleActualLandingAirportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onUpdate('actual_landing_airport', e.target.value);
    },
    [onUpdate, disabled],
  );

  const handleRemarksChange = useCallback(
    (value: string) => {
      if (disabled) return;
      onUpdate('remarks', value);
    },
    [onUpdate, disabled],
  );

  return (
    <div className={`${styles.panel} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('event.description')}</h3>
        <div className={styles.eventBadge}>
          Event_{eventIndex} | {event.event_number}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.descriptionArea}>
          {wrapWithReviewable(
            'event_description',
            t('event.description'),
            <TextArea
              value={event.event_description}
              onChange={handleDescriptionChange}
              rows={8}
              placeholder={t('placeholders.event_description')}
              aria-label={t('event.description')}
              disabled={disabled}
            />
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t('basic_info.title')}</h4>
        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.date')}</label>
            {wrapWithReviewable(
              'event_date',
              t('basic_info.date'),
              <div className={styles.fieldInput}>
                <input
                  type="date"
                  value={event.date}
                  onChange={handleDateChange}
                  aria-label={t('basic_info.date')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.time')}</label>
            {wrapWithReviewable(
              'event_time',
              t('basic_info.time'),
              <div className={styles.fieldInput}>
                <input
                  type="time"
                  value={event.time || ''}
                  onChange={handleTimeChange}
                  aria-label={t('basic_info.time')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.aircraft_type')}</label>
            {wrapWithReviewable(
              'aircraft_type',
              t('basic_info.aircraft_type'),
              <div className={styles.fieldInput}>
                <input
                  type="text"
                  value={event.aircraft_type}
                  onChange={handleAircraftTypeChange}
                  placeholder={t('placeholders.enter_aircraft_type')}
                  aria-label={t('basic_info.aircraft_type')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.departure_airport')}</label>
            {wrapWithReviewable(
              'departure_airport',
              t('basic_info.departure_airport'),
              <div className={styles.fieldInput}>
                <input
                  type="text"
                  value={event.departure_airport}
                  onChange={handleDepartureAirportChange}
                  placeholder={t('placeholders.four_letter_code')}
                  aria-label={t('basic_info.departure_airport')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.landing_airport')}</label>
            {wrapWithReviewable(
              'arrival_airport',
              t('basic_info.landing_airport'),
              <div className={styles.fieldInput}>
                <input
                  type="text"
                  value={event.arrival_airport}
                  onChange={handleArrivalAirportChange}
                  placeholder={t('placeholders.four_letter_code')}
                  aria-label={t('basic_info.landing_airport')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.actual_landing')}</label>
            {wrapWithReviewable(
              'actual_landing_airport',
              t('basic_info.actual_landing'),
              <div className={styles.fieldInput}>
                <input
                  type="text"
                  value={event.actual_landing_airport}
                  onChange={handleActualLandingAirportChange}
                  placeholder={t('placeholders.four_letter_code')}
                  aria-label={t('basic_info.actual_landing')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${styles.section} ${styles.remarksSection}`}>
        <h4 className={styles.sectionTitle}>{t('basic_info.remarks')}</h4>
        {wrapWithReviewable(
          'event_remarks',
          t('basic_info.remarks'),
          <TextArea
            value={event.remarks}
            onChange={handleRemarksChange}
            rows={3}
            placeholder={t('placeholders.enter_remarks')}
            aria-label={t('basic_info.remarks')}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

export const EditableEventPanel = memo(EditableEventPanelComponent);
