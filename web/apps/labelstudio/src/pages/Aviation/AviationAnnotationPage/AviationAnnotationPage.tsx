import React, { useEffect, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Provider } from 'jotai';
import { useTranslation } from 'react-i18next';
import { IncidentDisplayPanel } from './components/IncidentDisplayPanel/IncidentDisplayPanel';
import { BasicInfoTable } from './components/BasicInfoTable/BasicInfoTable';
import { ResultsTable } from './components/ResultsTable/ResultsTable';
import { RecognitionSection } from './components/RecognitionSection/RecognitionSection';
import { TrainingTopicsPanel } from './components/TrainingTopicsPanel/TrainingTopicsPanel';
import { CRMTopicsRow } from './components/CRMTopicsRow/CRMTopicsRow';
import { useAnnotationData } from './hooks/use-annotation-data.hook';
import { useDropdownOptions } from './hooks/use-dropdown-options.hook';
import { useAtomValue } from 'jotai';
import { hasUnsavedChangesAtom } from './stores/aviation-annotation.store';
import { isAviationMockEnabled } from './utils/feature-flags';
import styles from './AviationAnnotationPage.module.scss';

export const AviationAnnotationPage: React.FC = () => {
  const { t } = useTranslation();
  const { taskId: taskIdParam } = useParams<{ taskId: string }>();
  const history = useHistory();
  const isMockMode = isAviationMockEnabled();

  const taskId = useMemo(() => {
    if (taskIdParam) {
      return parseInt(taskIdParam, 10);
    }
    return isMockMode ? 1 : null;
  }, [taskIdParam, isMockMode]);

  const {
    incident,
    annotation,
    annotationId,
    loading: dataLoading,
    error: dataError,
  } = useAnnotationData(taskId);

  const {
    options,
    loading: optionsLoading,
    error: optionsError,
  } = useDropdownOptions();

  const hasUnsavedChanges = useAtomValue(hasUnsavedChangesAtom);

  // Handle navigation with unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!isMockMode && (!taskIdParam || (dataError && !dataLoading))) {
      history.push('/tasks');
    }
  }, [taskIdParam, dataError, dataLoading, history, isMockMode]);

  const loading = dataLoading || optionsLoading;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>{t('aviation.loading')}</p>
        </div>
      </div>
    );
  }

  if (dataError || optionsError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h2>{t('aviation.error_loading')}</h2>
          <p>{dataError?.message || optionsError?.message || 'An unexpected error occurred'}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            {t('aviation.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!taskId || !options) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => {
            if (hasUnsavedChanges) {
              if (window.confirm(t('aviation.unsaved_changes'))) {
                history.push('/tasks');
              }
            } else {
              history.push('/tasks');
            }
          }}
        >
          ← {t('aviation.back_to_tasks')}
        </button>
        <span className={styles.eventNumber}>
          {t('aviation.event_number')}{incident?.event_number || taskId}
          {isMockMode && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#ff9800' }}>({t('aviation.mock_mode')})</span>}
        </span>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.leftPanel}>
          <IncidentDisplayPanel
            incident={incident}
            loading={dataLoading}
          />
        </div>

        <div className={styles.mainContent}>
          <BasicInfoTable />
          <ResultsTable />

          <div className={styles.recognitionRow}>
            <div className={styles.recognitionColumn}>
              <RecognitionSection
                type="threat"
                backgroundColor="#ffd699"
              />
              <RecognitionSection
                type="error"
                backgroundColor="#ffd699"
              />
              <RecognitionSection
                type="uas"
                backgroundColor="#ffd699"
              />
            </div>

            <div className={styles.topicsColumn}>
              <TrainingTopicsPanel />
            </div>
          </div>

          <CRMTopicsRow />
        </div>
      </div>
    </div>
  );
};

// Wrap with Provider at the app level or here
export const AviationAnnotationPageWithProvider: React.FC = () => {
  return (
    <Provider>
      <AviationAnnotationPage />
    </Provider>
  );
};