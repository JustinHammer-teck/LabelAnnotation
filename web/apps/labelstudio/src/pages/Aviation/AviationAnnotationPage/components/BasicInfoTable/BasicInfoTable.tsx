import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom, currentIncidentAtom, updateFieldAtom } from '../../stores/aviation-annotation.store';
import styles from './BasicInfoTable.module.scss';

export const BasicInfoTable: React.FC = () => {
  const { t } = useTranslation();
  const data = useAtomValue(annotationDataAtom);
  const incident = useAtomValue(currentIncidentAtom);
  const updateField = useSetAtom(updateFieldAtom);

  const displayDate = incident?.date || '';
  const displayLocation = incident?.location || incident?.airport || '';
  const displayAircraftType = incident?.aircraft_type || '';
  const displayEventLabels = incident?.event_labels || '';
  const displayFlightPhase = incident?.flight_phase || '';

  return (
    <table className={styles.basicInfoTable}>
      <thead>
        <tr>
          <th>{t('aviation.basic_info.date')}</th>
          <th>{t('aviation.basic_info.aircraft_type')}</th>
          <th>{t('aviation.basic_info.location')}</th>
          <th>{t('aviation.basic_info.event_labels')}</th>
          <th>{t('aviation.basic_info.flight_phase')}</th>
          <th>{t('aviation.basic_info.notes')}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input
              type="text"
              value={displayDate}
              readOnly
              className={styles.inputReadonly}
            />
          </td>
          <td>
            <input
              type="text"
              value={displayAircraftType}
              readOnly
              className={styles.inputReadonly}
            />
          </td>
          <td>
            <input
              type="text"
              value={displayLocation}
              readOnly
              className={styles.inputReadonly}
            />
          </td>
          <td>
            <input
              type="text"
              value={displayEventLabels}
              readOnly
              className={styles.inputReadonly}
            />
          </td>
          <td>
            <input
              type="text"
              value={displayFlightPhase}
              readOnly
              className={styles.inputReadonly}
            />
          </td>
          <td>
            <input
              type="text"
              value={data.notes}
              onChange={(e) => updateField({ field: 'notes', value: e.target.value })}
              placeholder={t('aviation.basic_info.placeholder_notes')}
              className={styles.input}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
