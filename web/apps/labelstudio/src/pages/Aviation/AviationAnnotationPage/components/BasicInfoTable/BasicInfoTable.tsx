import React, { useState, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom, currentIncidentAtom, updateFieldAtom, dropdownOptionsAtom } from '../../stores/aviation-annotation.store';
import { SelectModal } from './SelectModal';
import { MultiSelectModal } from './MultiSelectModal';
import styles from './BasicInfoTable.module.scss';

export const BasicInfoTable: React.FC = () => {
  const { t } = useTranslation();
  const data = useAtomValue(annotationDataAtom);
  const incident = useAtomValue(currentIncidentAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const updateField = useSetAtom(updateFieldAtom);

  const [aircraftModalOpen, setAircraftModalOpen] = useState(false);
  const [eventLabelsModalOpen, setEventLabelsModalOpen] = useState(false);

  const displayDate = incident?.date || '';
  const displayLocation = incident?.location || incident?.airport || '';
  const displayFlightPhase = incident?.flight_phase || '';

  const displayAircraftType = data.aircraft_type || '';
  const eventLabels = data.event_labels || [];
  const displayEventLabels = eventLabels.length > 0 ? eventLabels.join(', ') : '';

  const handleAircraftConfirm = useCallback((value: string) => {
    updateField({ field: 'aircraft_type', value });
  }, [updateField]);

  const handleEventLabelsConfirm = useCallback((values: string[]) => {
    updateField({ field: 'event_labels', value: values });
  }, [updateField]);

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
            <button
              type="button"
              onClick={() => setAircraftModalOpen(true)}
              className={styles.selectButton}
            >
              {displayAircraftType || 'Select Aircraft Type'}
            </button>
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
            <button
              type="button"
              onClick={() => setEventLabelsModalOpen(true)}
              className={styles.selectButton}
            >
              {displayEventLabels || 'Select Event Labels'}
            </button>
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

      <SelectModal
        isOpen={aircraftModalOpen}
        onClose={() => setAircraftModalOpen(false)}
        title="Select Aircraft Type"
        options={dropdownOptions?.aircraft || []}
        value={data.aircraft_type}
        onConfirm={handleAircraftConfirm}
      />

      <MultiSelectModal
        isOpen={eventLabelsModalOpen}
        onClose={() => setEventLabelsModalOpen(false)}
        title="Select Event Labels"
        options={dropdownOptions?.event_labels || []}
        values={eventLabels}
        onConfirm={handleEventLabelsConfirm}
      />
    </table>
  );
};
