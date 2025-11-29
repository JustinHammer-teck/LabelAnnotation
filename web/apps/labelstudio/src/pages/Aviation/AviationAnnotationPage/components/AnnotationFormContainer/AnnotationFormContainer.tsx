import React from 'react';
import { SaveStatusIndicator } from '../SaveStatusIndicator/SaveStatusIndicator';
import { BasicInfoSection } from '../sections/BasicInfoSection';
import { ThreatSection } from '../sections/ThreatSection';
import { ErrorSection } from '../sections/ErrorSection';
import { UASSection } from '../sections/UASSection';
import { CompetencySection } from '../sections/CompetencySection';
import { TrainingSection } from '../sections/TrainingSection';
import { useAutoSave } from '../../hooks/use-auto-save.hook';
import styles from './AnnotationFormContainer.module.scss';

interface AnnotationFormContainerProps {
  taskId: number;
  annotationId: number | null;
}

export const AnnotationFormContainer: React.FC<AnnotationFormContainerProps> = ({
  taskId,
  annotationId,
}) => {
  const { retrySave } = useAutoSave(taskId, annotationId);

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Aviation Annotation</h1>
        <SaveStatusIndicator onRetry={retrySave} />
      </div>

      <div className={styles.formContent}>
        <BasicInfoSection />
        <ThreatSection />
        <ErrorSection />
        <UASSection />
        <CompetencySection />
        <TrainingSection />
      </div>
    </div>
  );
};