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
import styles from './Sections.module.scss';

export const CompetencySection: React.FC = () => {
  const annotationData = useAtomValue(annotationDataAtom);
  const dropdownOptions = useAtomValue(dropdownOptionsAtom);
  const updateField = useSetAtom(updateFieldAtom);

  if (!dropdownOptions) return null;

  // Group competency options by category
  const competencyGroups = dropdownOptions.competency.reduce((acc, option) => {
    const category = option.code.substring(0, 3); // First 3 chars are category
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {} as Record<string, typeof dropdownOptions.competency>);

  const categoryLabels: Record<string, string> = {
    'KNO': 'Knowledge',
    'PRO': 'Procedural',
    'FPA': 'Flight Path Management - Automation',
    'FPM': 'Flight Path Management - Manual',
    'COM': 'Communication',
    'LTW': 'Leadership & Teamwork',
    'SAW': 'Situational Awareness',
    'WLM': 'Workload Management',
    'PSD': 'Problem Solving & Decision Making'
  };

  return (
    <SectionContainer title="胜任力" variant="default">
      <div className={styles.competencyGrid}>
        {Object.entries(competencyGroups).map(([category, options]) => (
          <div key={category} className={styles.competencyCategory}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryCode}>{category}</span>
              <span className={styles.categoryLabel}>
                {categoryLabels[category] || category}
              </span>
            </div>
            <FieldRow label="" fullWidth>
              <MultiSelectDropdown
                options={options}
                value={annotationData.competency_indicators}
                onChange={(value) => updateField({ field: 'competency_indicators', value })}
                placeholder="Select indicators..."
                maxChipsDisplay={2}
                searchable={false}
              />
            </FieldRow>
          </div>
        ))}
      </div>

      <FieldRow label="Likelihood" required>
        <select
          className={styles.select}
          value={annotationData.likelihood}
          onChange={(e) => updateField({ field: 'likelihood', value: e.target.value })}
        >
          <option value="">Select likelihood...</option>
          {dropdownOptions.likelihood.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Severity" required>
        <select
          className={styles.select}
          value={annotationData.severity}
          onChange={(e) => updateField({ field: 'severity', value: e.target.value })}
        >
          <option value="">Select severity...</option>
          {dropdownOptions.severity.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Training Benefit" required>
        <select
          className={styles.select}
          value={annotationData.training_benefit}
          onChange={(e) => updateField({ field: 'training_benefit', value: e.target.value })}
        >
          <option value="">Select training benefit...</option>
          {dropdownOptions.training_benefit.map((option) => (
            <option key={option.id} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldRow>
    </SectionContainer>
  );
};