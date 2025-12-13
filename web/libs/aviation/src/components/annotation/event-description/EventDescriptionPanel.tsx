import { type FC, useMemo, memo } from 'react';
import type { AviationEvent } from '../../../types/event.types';
import styles from './event-description-panel.module.scss';

export interface EventDescriptionPanelProps {
  event: AviationEvent;
}

interface InfoField {
  label: string;
  value: string;
}

interface InfoFieldInput {
  label: string;
  value: string | null;
}

const EventDescriptionPanelInner: FC<EventDescriptionPanelProps> = ({ event }) => {
  const primaryFields = useMemo((): InfoField[] => {
    const fields: InfoFieldInput[] = [
      { label: '事件编号', value: event.event_number },
      { label: '日期', value: event.date },
      { label: '时间', value: event.time },
      { label: '地点', value: event.location },
      { label: '机场', value: event.airport },
      { label: '飞行阶段', value: event.flight_phase },
    ];
    return fields.filter((field): field is InfoField => field.value !== null && field.value !== '');
  }, [event]);

  const aircraftFields = useMemo((): InfoField[] => {
    const fields: InfoFieldInput[] = [
      { label: '机型', value: event.aircraft_type },
      { label: '注册号', value: event.aircraft_registration },
    ];
    return fields.filter((field): field is InfoField => field.value !== null && field.value !== '');
  }, [event]);

  const hasCrewInfo = event.crew_composition != null && Object.keys(event.crew_composition).length > 0;
  const hasWeather = Boolean(event.weather_conditions);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>事件信息</h3>
        <span className={styles.eventNumber}>{event.event_number}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            {primaryFields.map((field) => (
              <div key={field.label} className={styles.field}>
                <span className={styles.fieldLabel}>{field.label}</span>
                <span className={styles.fieldValue}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>

        {aircraftFields.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>航空器信息</h4>
            <div className={styles.fieldsRow}>
              {aircraftFields.map((field) => (
                <div key={field.label} className={styles.field}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <span className={styles.fieldValue}>{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasCrewInfo && event.crew_composition && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>机组信息</h4>
            <div className={styles.crewInfo}>
              {Object.entries(event.crew_composition).map(([key, value]) => (
                <div key={key} className={styles.crewItem}>
                  <span className={styles.crewRole}>{key}</span>
                  <span className={styles.crewValue}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasWeather && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>天气条件</h4>
            <p className={styles.weatherText}>{event.weather_conditions}</p>
          </div>
        )}

        {event.event_description && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>事件描述</h4>
            <p className={styles.description}>{event.event_description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const EventDescriptionPanel = memo(EventDescriptionPanelInner);
