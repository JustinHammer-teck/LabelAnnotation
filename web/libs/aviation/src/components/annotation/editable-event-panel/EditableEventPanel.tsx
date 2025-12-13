import { type FC, useCallback, memo } from 'react';
import { TextArea } from '../../common';
import type { AviationEvent } from '../../../types';
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
        <h3 className={styles.title}>事件描述</h3>
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
            placeholder="请输入事件描述..."
            aria-label="事件描述"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>基本信息</h4>
        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>日期</label>
            <div className={styles.fieldInput}>
              <input
                type="date"
                value={event.date}
                onChange={handleDateChange}
                aria-label="日期"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>时间</label>
            <div className={styles.fieldInput}>
              <input
                type="time"
                value={event.time || ''}
                onChange={handleTimeChange}
                aria-label="时间"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>机型</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.aircraft_type}
                onChange={handleAircraftTypeChange}
                placeholder="请输入机型"
                aria-label="机型"
              />
            </div>
          </div>
        </div>

        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>起飞机场</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.departure_airport}
                onChange={handleDepartureAirportChange}
                placeholder="四字代码"
                aria-label="起飞机场"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>落地机场</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.arrival_airport}
                onChange={handleArrivalAirportChange}
                placeholder="四字代码"
                aria-label="落地机场"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>实际降落机场</label>
            <div className={styles.fieldInput}>
              <input
                type="text"
                value={event.actual_landing_airport}
                onChange={handleActualLandingAirportChange}
                placeholder="四字代码"
                aria-label="实际降落机场"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.section} ${styles.remarksSection}`}>
        <h4 className={styles.sectionTitle}>备注</h4>
        <TextArea
          value={event.remarks}
          onChange={handleRemarksChange}
          rows={3}
          placeholder="请输入备注..."
          aria-label="备注"
        />
      </div>
    </div>
  );
};

export const EditableEventPanel = memo(EditableEventPanelComponent);
