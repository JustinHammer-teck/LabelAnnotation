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

export const UASSection: React.FC = () => {
  const annotationData = useAtomValue(annotationDataAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const updateField = useSetAtom(updateFieldAtom);

  const uasTypeValidation = useFieldBlurValidation('uas_type');
  const managementValidation = useFieldBlurValidation('uas_management');

  if (!dropdownOptions) return null;

  const isRelevant = annotationData.uas_relevancy === 'YES';

  return (
    <SectionContainer title="UAS识别" variant="orange">
      <FieldRow label="UAS Relevancy">
        <select
          className={styles.select}
          value={annotationData.uas_relevancy}
          onChange={(e) => updateField({ field: 'uas_relevancy', value: e.target.value })}
        >
          <option value="">Select relevancy...</option>
          {dropdownOptions.uas_relevancy.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      {isRelevant && (
        <>
          <FieldRow
            label="UAS Type"
            required
            error={uasTypeValidation.error}
          >
            <HierarchicalDropdown
              category="uas"
              value={annotationData.uas_type}
              onChange={(value) => updateField({ field: 'uas_type', value })}
              placeholder="Select UAS type..."
              required
            />
          </FieldRow>

          <FieldRow
            label="UAS Management"
            required
            error={managementValidation.error}
          >
            <select
              className={styles.select}
              value={annotationData.uas_management}
              onChange={(e) => updateField({ field: 'uas_management', value: e.target.value })}
              onBlur={managementValidation.onBlur}
              onFocus={managementValidation.onFocus}
            >
              <option value="">Select management...</option>
              {dropdownOptions.uas_management.map((option) => (
                <option key={option.id} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="UAS Description" fullWidth>
            <textarea
              className={styles.textarea}
              value={annotationData.uas_description}
              onChange={(e) => updateField({ field: 'uas_description', value: e.target.value })}
              placeholder="Enter UAS description..."
              rows={4}
            />
          </FieldRow>
        </>
      )}
    </SectionContainer>
  );
};