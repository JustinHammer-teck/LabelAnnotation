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

export const ErrorSection: React.FC = () => {
  const annotationData = useAtomValue(annotationDataAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const updateField = useSetAtom(updateFieldAtom);

  const errorTypeValidation = useFieldBlurValidation('error_type');
  const managementValidation = useFieldBlurValidation('error_management');
  const outcomeValidation = useFieldBlurValidation('error_outcome');

  if (!dropdownOptions) return null;

  const isRelevant = annotationData.error_relevancy === 'YES';

  return (
    <SectionContainer title="差错识别" variant="orange">
      <FieldRow label="Error Relevancy">
        <select
          className={styles.select}
          value={annotationData.error_relevancy}
          onChange={(e) => updateField({ field: 'error_relevancy', value: e.target.value })}
        >
          <option value="">Select relevancy...</option>
          {dropdownOptions.error_relevancy.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      {isRelevant && (
        <>
          <FieldRow
            label="Error Type"
            required
            error={errorTypeValidation.error}
          >
            <HierarchicalDropdown
              category="error"
              value={annotationData.error_type}
              onChange={(value) => updateField({ field: 'error_type', value })}
              placeholder="Select error type..."
              required
            />
          </FieldRow>

          <FieldRow
            label="Error Management"
            required
            error={managementValidation.error}
          >
            <select
              className={styles.select}
              value={annotationData.error_management}
              onChange={(e) => updateField({ field: 'error_management', value: e.target.value })}
              onBlur={managementValidation.onBlur}
              onFocus={managementValidation.onFocus}
            >
              <option value="">Select management...</option>
              {dropdownOptions.error_management.map((option) => (
                <option key={option.id} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow
            label="Error Outcome"
            required
            error={outcomeValidation.error}
          >
            <select
              className={styles.select}
              value={annotationData.error_outcome}
              onChange={(e) => updateField({ field: 'error_outcome', value: e.target.value })}
              onBlur={outcomeValidation.onBlur}
              onFocus={outcomeValidation.onFocus}
            >
              <option value="">Select outcome...</option>
              {dropdownOptions.error_outcome.map((option) => (
                <option key={option.id} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="Error Description" fullWidth>
            <textarea
              className={styles.textarea}
              value={annotationData.error_description}
              onChange={(e) => updateField({ field: 'error_description', value: e.target.value })}
              placeholder="Enter error description..."
              rows={4}
            />
          </FieldRow>
        </>
      )}
    </SectionContainer>
  );
};