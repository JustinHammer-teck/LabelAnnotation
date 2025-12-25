import { type FC, useEffect, useCallback, useMemo, useState } from 'react';
import { useEvent, useLabelingItems, useAutoSave, useDropdownOptions, usePerformances, useTrainingTopics, useEvents, useReviewWorkflow, useAviationToast } from '../../hooks';
import { useAviationTranslation } from '../../i18n';
import { Panel, Button, StatusIndicator, Select, TextArea } from '../common';
import { EditableEventPanel, RecognitionSection, TrainingTopicsPanel, ResultPerformancePanel } from '../annotation';
import type { AviationEvent, LabelingItem } from '../../types';
import styles from './AnnotationView.module.scss';

export interface AnnotationViewProps {
  eventId: number;
  projectId: number;
}

interface LabelingItemRowProps {
  item: LabelingItem;
  index: number;
  performanceOptions: { value: number; label: string }[];
  threatOptions: ReturnType<typeof useDropdownOptions>['options'];
  errorOptions: ReturnType<typeof useDropdownOptions>['options'];
  uasOptions: ReturnType<typeof useDropdownOptions>['options'];
  onUpdate: (updates: Partial<LabelingItem>) => void;
  onDelete: () => void;
}

const LabelingItemRow: FC<LabelingItemRowProps> = ({
  item,
  index,
  performanceOptions,
  threatOptions,
  errorOptions,
  uasOptions,
  onUpdate,
  onDelete,
}) => {
  const { t } = useAviationTranslation();
  const [expanded, setExpanded] = useState(true);
  const trainingTopics = useTrainingTopics(item);

  const linkedPerformance = performanceOptions.find(p => p.value === item.linked_result_id);
  const headerText = linkedPerformance
    ? `${t('labeling.annotation_item', { index: index + 1 })} - ${t('labeling.linked_to', { type: linkedPerformance.label })}`
    : `${t('labeling.annotation_item', { index: index + 1 })} - ${t('labeling.not_linked')}`;

  const typeParts: string[] = [];
  if (item.threat_type_l3) {
    typeParts.push(t('recognition.threat.type_label', { label: item.threat_type_l3_detail?.label || item.threat_type_l3 }));
  }
  if (item.error_type_l3) {
    typeParts.push(t('recognition.error.type_label', { label: item.error_type_l3_detail?.label || item.error_type_l3 }));
  }
  if (item.uas_applicable && item.uas_type_l3) {
    typeParts.push(t('recognition.uas.type_label', { label: item.uas_type_l3_detail?.label || item.uas_type_l3 }));
  }
  const typeSummary = typeParts.join(' | ');

  return (
    <div className={styles.labelingItem}>
      <div
        className={styles.labelingItemHeader}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
      >
        <div className={styles.labelingItemTitle}>
          <span className={styles.labelingItemName}>{headerText}</span>
          {typeSummary && <span className={styles.labelingItemSummary}>{typeSummary}</span>}
        </div>
        <div className={styles.labelingItemActions}>
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {t('common.delete')}
          </Button>
          <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>▼</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.labelingItemContent}>
          <div className={styles.linkageField}>
            <label className={styles.fieldLabel}>{t('labeling.link_event_type')}</label>
            <Select
              value={item.linked_result_id}
              onChange={(value) => onUpdate({ linked_result_id: value ? Number(value) : null })}
              options={performanceOptions}
              placeholder={t('placeholders.select_result')}
              allowClear
            />
          </div>

          <div className={styles.modulesRow}>
            <div className={styles.modulesColumn}>
              <RecognitionSection
                category="threat"
                title={t('recognition.threat.title')}
                item={item}
                options={threatOptions}
                onUpdate={onUpdate}
              />
              <RecognitionSection
                category="error"
                title={t('recognition.error.title')}
                item={item}
                options={errorOptions}
                onUpdate={onUpdate}
              />
              <RecognitionSection
                category="uas"
                title={t('recognition.uas.title')}
                item={item}
                options={uasOptions}
                onUpdate={onUpdate}
              />
            </div>
            <div className={styles.topicsColumn}>
              <TrainingTopicsPanel
                threatTopics={trainingTopics.threat}
                errorTopics={trainingTopics.error}
                uasTopics={trainingTopics.uas}
              />
            </div>
          </div>

          <div className={styles.notesField}>
            <label className={styles.fieldLabel}>{t('labeling.notes_label')}</label>
            <TextArea
              value={item.notes || ''}
              onChange={(value) => onUpdate({ notes: value })}
              placeholder={t('labeling.notes_placeholder')}
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnotationView: FC<AnnotationViewProps> = ({ eventId, projectId }) => {
  const toast = useAviationToast();
  const { t, currentLanguage } = useAviationTranslation();
  const { events, fetchEvents } = useEvents(projectId);
  const { currentEvent, loading: eventLoading, error: eventError, fetchEvent, updateEvent } = useEvent();
  const {
    items,
    loading: itemsLoading,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  } = useLabelingItems(eventId);
  const { saveStatus, saveNow } = useAutoSave(eventId, {
    onSuccess: () => toast?.success(t('toast.save_success')),
    onError: () => toast?.error(t('toast.save_error')),
  });
  const { options: threatOptions } = useDropdownOptions('threat');
  const { options: errorOptions } = useDropdownOptions('error');
  const { options: uasOptions } = useDropdownOptions('uas');
  const { options: eventTypeOptions } = useDropdownOptions('event_type');
  const { options: flightPhaseOptions } = useDropdownOptions('flight_phase');
  const { performances, fetchPerformances } = usePerformances(eventId);
  const { submitForReview, isLoading: reviewLoading } = useReviewWorkflow();

  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchEvent(eventId);
    fetchItems();
    fetchPerformances();
  }, [eventId, fetchEvent, fetchEvents, fetchItems, fetchPerformances]);

  useEffect(() => {
    if (events.length > 0) {
      const idx = events.findIndex(e => e.id === eventId);
      if (idx >= 0) setCurrentEventIndex(idx);
    }
  }, [events, eventId]);

  const performanceOptions = useMemo(() => {
    const getEventTypeLabel = (code: string) => {
      const opt = eventTypeOptions.find((o) => o.code === code);
      const label = currentLanguage === 'cn' ? (opt?.label_zh || opt?.label) : opt?.label;
      return label || code || t('defaults.unnamed_type');
    };
    const getFlightPhaseLabel = (code: string) => {
      const opt = flightPhaseOptions.find((o) => o.code === code);
      const label = currentLanguage === 'cn' ? (opt?.label_zh || opt?.label) : opt?.label;
      return label || code || t('defaults.no_phase');
    };
    return performances.map((p, index) => ({
      value: p.id,
      label: t('defaults.result_label', {
        index: index + 1,
        eventType: getEventTypeLabel(p.event_type),
        flightPhase: getFlightPhaseLabel(p.flight_phase),
      }),
    }));
  }, [performances, eventTypeOptions, flightPhaseOptions, t, currentLanguage]);

  const handleAddItem = useCallback(async () => {
    await addItem();
  }, [addItem]);

  const handleDeleteItem = useCallback(async (itemId: number) => {
    await deleteItem(itemId);
    await fetchPerformances();
  }, [deleteItem, fetchPerformances]);

  const handleEventUpdate = useCallback(
    async (field: keyof AviationEvent, value: string) => {
      if (currentEvent) {
        await updateEvent(currentEvent.id, { [field]: value });
      }
    },
    [currentEvent, updateEvent]
  );

  const handleUpdateItem = useCallback(
    async (itemId: number, updates: Partial<LabelingItem>) => {
      await updateItem(itemId, updates);
      await fetchPerformances();
    },
    [updateItem, fetchPerformances]
  );

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (events.length === 0) return;
    let newIndex = currentEventIndex;
    if (direction === 'prev' && currentEventIndex > 0) {
      newIndex = currentEventIndex - 1;
    } else if (direction === 'next' && currentEventIndex < events.length - 1) {
      newIndex = currentEventIndex + 1;
    }
    if (newIndex !== currentEventIndex) {
      const newEvent = events[newIndex];
      window.location.href = `/aviation/projects/${projectId}/events/${newEvent.id}`;
    }
  }, [events, currentEventIndex, projectId]);

  const handleSave = useCallback(async () => {
    await saveNow();
    // Toast handled by useAutoSave callbacks
  }, [saveNow]);

  const handleSubmit = useCallback(async () => {
    if (!currentEvent) return;
    try {
      await submitForReview(currentEvent.id);
      toast?.success(t('toast.submit_success'));
    } catch {
      toast?.error(t('toast.submit_error'));
    }
  }, [currentEvent, submitForReview, toast, t]);

  const loading = eventLoading || itemsLoading;

  if (loading && !currentEvent) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className={styles.error}>
        <p>{t('error.load_failed', { message: eventError })}</p>
        <Button variant="primary" onClick={() => fetchEvent(eventId)}>
          {t('error.retry')}
        </Button>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className={styles.emptyState}>
        <h2>{t('empty.no_event')}</h2>
        <p>{t('empty.no_event_hint')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarLeft}>
          {events.length > 0 && (
            <div className={styles.navigation}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleNavigate('prev')}
                disabled={currentEventIndex === 0}
              >
                {`← ${t('common.prev')}`}
              </Button>
              <span className={styles.navCounter}>
                {t('navigation.event_counter', { current: currentEventIndex + 1, total: events.length })}
              </span>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleNavigate('next')}
                disabled={currentEventIndex === events.length - 1}
              >
                {`${t('common.next')} →`}
              </Button>
            </div>
          )}
        </div>
        <div className={styles.actionBarRight}>
          <StatusIndicator
            status={saveStatus.state === 'idle' ? 'saved' : saveStatus.state}
          />
          <Button variant="secondary" onClick={handleSave}>
            {t('toolbar.save_annotation')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={reviewLoading}
          >
            {t('toolbar.submit_for_review')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left Column: Basic Info + Result Performance */}
        <div className={styles.leftColumn}>
          <EditableEventPanel
            event={currentEvent}
            eventIndex={currentEventIndex + 1}
            onUpdate={handleEventUpdate}
          />
          <ResultPerformancePanel eventId={eventId} />
        </div>

        {/* Right Column: Labeling Module */}
        <div className={styles.rightColumn}>
          <Panel
            title={t('labeling.title')}
            className={styles.labelingPanel}
            actions={
              <Button variant="primary" size="small" onClick={handleAddItem}>
                {t('labeling.add')}
              </Button>
            }
          >
            {items.length === 0 ? (
              <div className={styles.emptyLabeling}>
                <p>{t('empty.no_annotations')}</p>
              </div>
            ) : (
              items.map((item, index) => (
                <LabelingItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  performanceOptions={performanceOptions}
                  threatOptions={threatOptions}
                  errorOptions={errorOptions}
                  uasOptions={uasOptions}
                  onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
