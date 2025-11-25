import React from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { annotationDataAtom } from '../../stores/aviation-annotation.store';
import { useDropdownOptions } from '../../hooks/use-dropdown-options.hook';
import styles from './BasicInfoTable.module.scss';

export const BasicInfoTable: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useAtom(annotationDataAtom);
  const { options } = useDropdownOptions();

  const updateField = <K extends keyof typeof data>(field: K, value: typeof data[K]) => {
    setData({ ...data, [field]: value });
  };

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
              value={data.aircraft_type}
              onChange={(e) => updateField('aircraft_type', e.target.value)}
              placeholder={t('aviation.basic_info.placeholder_date')}
              className={styles.input}
            />
          </td>
          <td>
            <select
              value={data.aircraft_type}
              onChange={(e) => updateField('aircraft_type', e.target.value)}
              className={styles.select}
            >
              <option value="">{t('aviation.basic_info.select_aircraft')}</option>
              {options?.aircraft?.map((aircraft) => (
                <option key={aircraft.id} value={aircraft.code}>
                  {aircraft.label}
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="text"
              value={data.aircraft_type}
              onChange={(e) => updateField('aircraft_type', e.target.value)}
              placeholder={t('aviation.basic_info.placeholder_location')}
              className={styles.input}
            />
          </td>
          <td>
            <select
              multiple
              value={data.event_labels}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateField('event_labels', selected);
              }}
              className={styles.multiSelect}
            >
              {options?.event_labels?.map((label) => (
                <option key={label.id} value={label.code}>
                  {label.label}
                </option>
              ))}
            </select>
          </td>
          <td>
            <select
              value={data.flight_phase}
              onChange={(e) => updateField('flight_phase', e.target.value)}
              className={styles.select}
            >
              <option value="">{t('aviation.basic_info.select_phase')}</option>
              {options?.flight_phases?.map((phase) => (
                <option key={phase.id} value={phase.code}>
                  {phase.label}
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="text"
              value={data.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={t('aviation.basic_info.placeholder_notes')}
              className={styles.input}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
