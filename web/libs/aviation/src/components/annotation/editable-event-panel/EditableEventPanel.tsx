import { type FC, useCallback, memo } from 'react';
import { TextArea } from '../../common';
import type { AviationEvent } from '../../../types';
import { useAviationTranslation } from '../../../i18n';
import styles from './editable-event-panel.module.scss';

export interface EditableEventPanelProps {
  event: AviationEvent;
  eventIndex: number;
  onUpdate: (field: keyof AviationEvent, value: string) => void;
}

const EditableEventPanelComponent: FC<EditableEventPanelProps> = ({
  event,
  eventIndex,
  onUpdate,
}) => {
  const { t } = useAviationTranslation();

  const handleDescriptionChange = useCallback(
    (value: string) => onUpdate('event_description', value),
    [onUpdate],
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate('date', e.target.value),
    [onUpdate],
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate('time', e.target.value),
    [onUpdate],
  );

  const handleAircraftTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate('aircraft_type', e.target.value),
    [onUpdate],
  );

  const handleDepartureAirportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate('departure_airport', e.target.value),
    [onUpdate],
  );

  const handleArrivalAirportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate('arrival_airport', e.target.value),
    [onUpdate],
  );

  const handleActualLandingAirportChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate('actual_landing_airport', e.target.value),
    [onUpdate],
  );

  const handleRemarksChange = useCallback(
    (value: string) => onUpdate('remarks', value),
    [onUpdate],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('event.description')}</h3>
        <div className={styles.eventBadge}>
          Event_{eventIndex} | {event.event_number}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.descriptionArea}>
          <TextArea
            value={event.event_description}
            onChange={handleDescriptionChange}
            rows={8}
            placeholder={t('placeholders.event_description')}
            aria-label={t('event.description')}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t('basic_info.title')}</h4>
        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.date')}</label>
            <div className={styles.fieldInput}>
              <input
                type="date"
                value={event.date}
                onChange={handleDateChange}
                aria-label={t('basic_info.date')}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.time')}</label>
            <div className={styles.fieldInput}>
              <input
                type="time"
                value={event.time || ''}
                onChange={handleTimeChange}
                aria-label={t('basic_info.time')}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.aircraft_type')}</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.aircraft_type}
                onChange={handleAircraftTypeChange}
                placeholder={t('placeholders.enter_aircraft_type')}
                aria-label={t('basic_info.aircraft_type')}
              />
            </div>
          </div>
        </div>

        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.departure_airport')}</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.departure_airport}
                onChange={handleDepartureAirportChange}
                placeholder={t('placeholders.four_letter_code')}
                aria-label={t('basic_info.departure_airport')}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.landing_airport')}</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.arrival_airport}
                onChange={handleArrivalAirportChange}
                placeholder={t('placeholders.four_letter_code')}
                aria-label={t('basic_info.landing_airport')}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('basic_info.actual_landing')}</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.actual_landing_airport}
                onChange={handleActualLandingAirportChange}
                placeholder={t('placeholders.four_letter_code')}
                aria-label={t('basic_info.actual_landing')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.section} ${styles.remarksSection}`}>
        <h4 className={styles.sectionTitle}>{t('basic_info.remarks')}</h4>
        <TextArea
          value={event.remarks}
          onChange={handleRemarksChange}
          rows={3}
          placeholder={t('placeholders.enter_remarks')}
          aria-label={t('basic_info.remarks')}
        />
      </div>
    </div>
  );
};

export const EditableEventPanel = memo(EditableEventPanelComponent);
