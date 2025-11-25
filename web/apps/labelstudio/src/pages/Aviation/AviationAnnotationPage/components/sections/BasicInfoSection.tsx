import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  annotationDataAtom,
  updateFieldAtom,
  dropdownOptionsAtom,
} from '../../stores/aviation-annotation.store';
import { MultiSelectDropdown } from '../MultiSelectDropdown/MultiSelectDropdown';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { FieldRow } from '../FieldRow/FieldRow';
import { useFieldBlurValidation } from '../../hooks/use-field-validation.hook';
import styles from './Sections.module.scss';

export const BasicInfoSection: React.FC = () => {
  const annotationData = useAtomValue(annotationDataAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const updateField = useSetAtom(updateFieldAtom);

  const aircraftValidation = useFieldBlurValidation('aircraft_type', true);
  const labelsValidation = useFieldBlurValidation('event_labels', true);

  if (!dropdownOptions) return null;

  return (
    <SectionContainer title="基本信息" variant="default">
      <FieldRow
        label="Aircraft Type"
        required
        error={aircraftValidation.error}
      >
        <select
          className={styles.select}
          value={annotationData.aircraft_type}
          onChange={(e) => updateField({ field: 'aircraft_type', value: e.target.value })}
          onBlur={aircraftValidation.onBlur}
          onFocus={aircraftValidation.onFocus}
        >
          <option value="">Select aircraft type...</option>
          {dropdownOptions.aircraft.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow
        label="Event Labels"
        required
        error={labelsValidation.error}
      >
        <MultiSelectDropdown
          options={dropdownOptions.event_labels}
          value={annotationData.event_labels}
          onChange={(value) => updateField({ field: 'event_labels', value })}
          placeholder="Select event labels..."
          maxChipsDisplay={3}
        />
      </FieldRow>

      <FieldRow label="Flight Phase">
        <select
          className={styles.select}
          value={annotationData.flight_phase}
          onChange={(e) => updateField({ field: 'flight_phase', value: e.target.value })}
        >
          <option value="">Select flight phase...</option>
          {dropdownOptions.flight_phases.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>
    </SectionContainer>
  );
};