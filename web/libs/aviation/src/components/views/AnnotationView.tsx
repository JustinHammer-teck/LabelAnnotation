import { type FC, useEffect, useCallback, useMemo, useState } from 'react';
import { useEvent, useLabelingItems, useAutoSave, useDropdownOptions, usePerformances, useTrainingTopics, useEvents, useReviewWorkflow } from '../../hooks';
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
  const [expanded, setExpanded] = useState(true);
  const trainingTopics = useTrainingTopics(item);

  const linkedPerformance = performanceOptions.find(p => p.value === item.linked_result_id);
  const headerText = linkedPerformance
    ? `标注 ${index + 1} - 已关联: ${linkedPerformance.label}`
    : `标注 ${index + 1} - 未关联`;

  const typeParts: string[] = [];
  if (item.threat_type_l3) {
    typeParts.push(`威胁: ${item.threat_type_l3_detail?.label || item.threat_type_l3}`);
  }
  if (item.error_type_l3) {
    typeParts.push(`差错: ${item.error_type_l3_detail?.label || item.error_type_l3}`);
  }
  if (item.uas_applicable && item.uas_type_l3) {
    typeParts.push(`UAS: ${item.uas_type_l3_detail?.label || item.uas_type_l3}`);
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
            Delete
          </Button>
          <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>▼</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.labelingItemContent}>
          <div className={styles.linkageField}>
            <label className={styles.fieldLabel}>关联事件类型</label>
            <Select
              value={item.linked_result_id}
              onChange={(value) => onUpdate({ linked_result_id: value ? Number(value) : null })}
              options={performanceOptions}
              placeholder="请选择关联的结果绩效"
              allowClear
            />
          </div>

          <div className={styles.modulesRow}>
            <div className={styles.modulesColumn}>
              <RecognitionSection
                category="threat"
                title="威胁识别"
                item={item}
                options={threatOptions}
                onUpdate={onUpdate}
              />
              <RecognitionSection
                category="error"
                title="差错识别"
                item={item}
                options={errorOptions}
                onUpdate={onUpdate}
              />
              <RecognitionSection
                category="uas"
                title="UAS识别"
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
            <label className={styles.fieldLabel}>结束状态描述</label>
            <TextArea
              value={item.notes || ''}
              onChange={(value) => onUpdate({ notes: value })}
              placeholder="可补充该事件结束状态的文字说明"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnotationView: FC<AnnotationViewProps> = ({ eventId, projectId }) => {
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
  const { saveStatus } = useAutoSave(eventId);
  const { options: threatOptions } = useDropdownOptions('threat');
  const { options: errorOptions } = useDropdownOptions('error');
  const { options: uasOptions } = useDropdownOptions('uas');
  const { options: eventTypeOptions } = useDropdownOptions('event_type');
  const { options: flightPhaseOptions } = useDropdownOptions('flight_phase');
  const { performances, fetchPerformances } = usePerformances(projectId);
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
      return opt?.label_zh || opt?.label || code || '未命名类型';
    };
    const getFlightPhaseLabel = (code: string) => {
      const opt = flightPhaseOptions.find((o) => o.code === code);
      return opt?.label_zh || opt?.label || code || '未选阶段';
    };
    return performances.map((p, index) => ({
      value: p.id,
      label: `结果 ${index + 1}: ${getEventTypeLabel(p.event_type)} - ${getFlightPhaseLabel(p.flight_phase)}`,
    }));
  }, [performances, eventTypeOptions, flightPhaseOptions]);

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

  const handleSave = useCallback(() => {
    // Auto-save is already handling saves
  }, []);

  const handleSubmit = useCallback(async () => {
    if (currentEvent) {
      await submitForReview(currentEvent.id);
    }
  }, [currentEvent, submitForReview]);

  const loading = eventLoading || itemsLoading;

  if (loading && !currentEvent) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading event...</span>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className={styles.error}>
        <p>Failed to load event: {eventError}</p>
        <Button variant="primary" onClick={() => fetchEvent(eventId)}>
          Retry
        </Button>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className={styles.emptyState}>
        <h2>No Event Selected</h2>
        <p>Please select an event from the task list.</p>
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
                ← Prev
              </Button>
              <span className={styles.navCounter}>
                {currentEventIndex + 1} / {events.length}
              </span>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleNavigate('next')}
                disabled={currentEventIndex === events.length - 1}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
        <div className={styles.actionBarRight}>
          <StatusIndicator
            status={saveStatus.state === 'idle' ? 'saved' : saveStatus.state}
          />
          <Button variant="secondary" onClick={handleSave}>
            Save
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={reviewLoading}
          >
            Submit
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
          <ResultPerformancePanel projectId={projectId} />
        </div>

        {/* Right Column: Labeling Module */}
        <div className={styles.rightColumn}>
          <Panel
            title="Labeling Module"
            className={styles.labelingPanel}
            actions={
              <Button variant="primary" size="small" onClick={handleAddItem}>
                Add
              </Button>
            }
          >
            {items.length === 0 ? (
              <div className={styles.emptyLabeling}>
                <p>No annotations, click Add to create</p>
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
