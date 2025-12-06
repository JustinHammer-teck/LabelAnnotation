import React, { useEffect, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Provider } from 'jotai';
import { useTranslation } from 'react-i18next';
import { ExportOutlined } from '@ant-design/icons';
import { BasicInfoTable } from './components/BasicInfoTable/BasicInfoTable';
import { EventDescriptionPanel } from './components/EventDescriptionPanel/EventDescriptionPanel';
import { ResultsTable } from './components/ResultsTable/ResultsTable';
import { RecognitionSection } from './components/RecognitionSection/RecognitionSection';
import { TrainingTopicsPanel } from './components/TrainingTopicsPanel/TrainingTopicsPanel';
import { CompetencyIndicatorsRow } from './components/CompetencyIndicatorsRow/CompetencyIndicatorsRow';
import { SaveStatusIndicator } from './components/SaveStatusIndicator/SaveStatusIndicator';
import { useAnnotationData } from './hooks/use-annotation-data.hook';
import { useDropdownOptions } from './hooks/use-dropdown-options.hook';
import { useAutoSave } from './hooks/use-auto-save.hook';
import { useAtomValue } from 'jotai';
import { hasUnsavedChangesAtom } from './stores/aviation-annotation.store';
import styles from './AviationAnnotationPage.module.scss';

export const AviationAnnotationPage: React.FC = () => {
  const { t } = useTranslation();
  const { taskId: taskIdParam, projectId } = useParams<{ taskId: string; projectId: string }>();
  const history = useHistory();

  const taskId = useMemo(() => {
    if (taskIdParam) {
      return parseInt(taskIdParam, 10);
    }
    return null;
  }, [taskIdParam]);

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

  const { retrySave, saveNow, isSaving } = useAutoSave(taskId, annotationId, {
    enabled: true,
    debounceMs: 2000,
  });

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
    if (!taskIdParam || (dataError && !dataLoading)) {
      if (projectId) {
        history.push(`/aviation/${projectId}/tasks`);
      } else {
        history.push('/aviation');
      }
    }
  }, [taskIdParam, projectId, dataError, dataLoading, history]);

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
        <div className={styles.breadcrumb}>
          <button
            className={styles.breadcrumbLink}
            onClick={() => history.push('/aviation')}
          >
            Aviation
          </button>
          <span className={styles.breadcrumbSeparator}>/</span>
          <button
            className={styles.breadcrumbLink}
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm(t('aviation.unsaved_changes'))) {
                  history.push(`/aviation/${projectId}/tasks`);
                }
              } else {
                history.push(`/aviation/${projectId}/tasks`);
              }
            }}
          >
            Tasks
          </button>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>
            {incident?.event_number || taskId}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.exportButton}
            onClick={() => window.open(`/api/aviation/tasks/${taskId}/export/`, '_blank')}
            disabled={!taskId}
          >
            <ExportOutlined /> {t('aviation.export')}
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={saveNow}
            disabled={!hasUnsavedChanges || isSaving}
            aria-label={t('aviation.save_annotation')}
          >
            {isSaving ? t('aviation.saving') : t('aviation.save')}
          </button>
          <SaveStatusIndicator onRetry={retrySave} />
        </div>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.mainContent}>
          <div className={styles.topLayoutGrid}>
            <div className={styles.eventDescriptionCell}>
              <EventDescriptionPanel />
            </div>
            <div className={styles.basicInfoCell}>
              <BasicInfoTable />
            </div>
            <div className={styles.resultsTableCell}>
              <ResultsTable />
            </div>
          </div>

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

          <CompetencyIndicatorsRow />
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