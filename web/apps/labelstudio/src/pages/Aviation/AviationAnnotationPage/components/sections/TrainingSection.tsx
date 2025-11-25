import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  annotationDataAtom,
  updateFieldAtom,
  dropdownOptionsAtom,
  calculatedTrainingAtom,
} from '../../stores/aviation-annotation.store';
import { MultiSelectDropdown } from '../MultiSelectDropdown/MultiSelectDropdown';
import { AutoCalculatedField } from '../AutoCalculatedField/AutoCalculatedField';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { FieldRow } from '../FieldRow/FieldRow';
import styles from './Sections.module.scss';

export const TrainingSection: React.FC = () => {
  const annotationData = useAtomValue(annotationDataAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const calculatedTraining = useAtomValue(calculatedTrainingAtom);
  const updateField = useSetAtom(updateFieldAtom);

  if (!dropdownOptions) return null;

  return (
    <>
      <SectionContainer title="训练主题" variant="green">
        <AutoCalculatedField
          label="威胁相关"
          value={calculatedTraining.threat_training_topics}
          emptyText="No threat-related training topics"
          variant="green"
        />

        <AutoCalculatedField
          label="差错相关"
          value={calculatedTraining.error_training_topics}
          emptyText="No error-related training topics"
          variant="green"
        />

        <AutoCalculatedField
          label="UAS相关"
          value={calculatedTraining.uas_training_topics}
          emptyText="No UAS-related training topics"
          variant="green"
        />

        <FieldRow label="CRM Training Topics">
          <MultiSelectDropdown
            options={dropdownOptions.crm_topics}
            value={annotationData.crm_training_topics}
            onChange={(value) => updateField({ field: 'crm_training_topics', value })}
            placeholder="Select CRM training topics..."
            maxChipsDisplay={3}
          />
        </FieldRow>
      </SectionContainer>

      <SectionContainer title="训练计划" variant="default">
        <FieldRow label="Training Plan Ideas" fullWidth>
          <textarea
            className={styles.textarea}
            value={annotationData.training_plan_ideas}
            onChange={(e) => updateField({ field: 'training_plan_ideas', value: e.target.value })}
            placeholder="Enter training plan ideas..."
            rows={4}
          />
        </FieldRow>

        <FieldRow label="Goals to Achieve" fullWidth>
          <textarea
            className={styles.textarea}
            value={annotationData.goals_to_achieve}
            onChange={(e) => updateField({ field: 'goals_to_achieve', value: e.target.value })}
            placeholder="Enter goals to achieve..."
            rows={4}
          />
        </FieldRow>

        <FieldRow label="Notes" fullWidth>
          <textarea
            className={styles.textarea}
            value={annotationData.notes}
            onChange={(e) => updateField({ field: 'notes', value: e.target.value })}
            placeholder="Enter additional notes..."
            rows={4}
          />
        </FieldRow>
      </SectionContainer>
    </>
  );
};