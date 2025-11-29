import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  annotationDataAtom,
  updateFieldAtom,
  dropdownOptionsAtom,
} from '../../stores/aviation-annotation.store';
import { HierarchicalDropdown } from '../HierarchicalDropdown/HierarchicalDropdown';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { FieldRow } from '../FieldRow/FieldRow';
import { useFieldBlurValidation } from '../../hooks/use-field-validation.hook';
import styles from './Sections.module.scss';

export const ThreatSection: React.FC = () => {
  const annotationData = useAtomValue(annotationDataAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const updateField = useSetAtom(updateFieldAtom);

  const threatTypeValidation = useFieldBlurValidation('threat_type');
  const managementValidation = useFieldBlurValidation('threat_management');
  const outcomeValidation = useFieldBlurValidation('threat_outcome');

  if (!dropdownOptions) return null;

  return (
    <SectionContainer title="威胁识别" variant="orange">
      <FieldRow
        label="Threat Type"
        error={threatTypeValidation.error}
      >
        <HierarchicalDropdown
          category="threat"
          value={annotationData.threat_type}
          onChange={(value) => updateField({ field: 'threat_type', value })}
          placeholder="Select threat type..."
        />
      </FieldRow>

      <FieldRow
        label="Threat Management"
        error={managementValidation.error}
      >
        <select
          className={styles.select}
          value={annotationData.threat_management}
          onChange={(e) => updateField({ field: 'threat_management', value: e.target.value })}
          onBlur={managementValidation.onBlur}
          onFocus={managementValidation.onFocus}
        >
          <option value="">Select management...</option>
          {dropdownOptions.threat_management.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow
        label="Threat Outcome"
        error={outcomeValidation.error}
      >
        <select
          className={styles.select}
          value={annotationData.threat_outcome}
          onChange={(e) => updateField({ field: 'threat_outcome', value: e.target.value })}
          onBlur={outcomeValidation.onBlur}
          onFocus={outcomeValidation.onFocus}
        >
          <option value="">Select outcome...</option>
          {dropdownOptions.threat_outcome.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Threat Description" fullWidth>
        <textarea
          className={styles.textarea}
          value={annotationData.threat_description}
          onChange={(e) => updateField({ field: 'threat_description', value: e.target.value })}
          placeholder="Enter threat description..."
          rows={4}
        />
      </FieldRow>
    </SectionContainer>
  );
};