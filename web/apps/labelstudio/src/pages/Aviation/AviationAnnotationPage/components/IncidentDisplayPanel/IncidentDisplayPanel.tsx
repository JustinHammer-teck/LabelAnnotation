import React from 'react';
import { AviationIncident } from '../../types/aviation.types';
import { FormattingUtil } from '../../utils/formatting.util';
import styles from './IncidentDisplayPanel.module.scss';

interface IncidentDisplayPanelProps {
  incident: AviationIncident | null;
  loading?: boolean;
}

export const IncidentDisplayPanel: React.FC<IncidentDisplayPanelProps> = ({
  incident,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={styles.incidentPanel}>
        <div className={styles.loading}>Loading incident data...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className={styles.incidentPanel}>
        <div className={styles.noData}>No incident data available</div>
      </div>
    );
  }

  return (
    <div className={styles.incidentPanel}>
      <h2 className={styles.panelTitle}>事件概述</h2>

      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Event Number</label>
          <div className={styles.fieldValue}>{incident.event_number}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Date</label>
          <div className={styles.fieldValue}>
            {FormattingUtil.formatDate(incident.date)}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Time</label>
          <div className={styles.fieldValue}>
            {FormattingUtil.formatTime(incident.time)}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Location</label>
          <div className={styles.fieldValue}>{incident.location}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Airport</label>
          <div className={styles.fieldValue}>{incident.airport}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Flight Phase</label>
          <div className={styles.fieldValue}>{incident.flight_phase}</div>
        </div>
      </div>

      <div className={styles.descriptionSection}>
        <label className={styles.fieldLabel}>Event Description</label>
        <div className={styles.description}>{incident.event_description}</div>
      </div>
    </div>
  );
};