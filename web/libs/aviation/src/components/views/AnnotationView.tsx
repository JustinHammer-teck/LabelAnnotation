import { type FC, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useCurrentUserAtom } from '@humansignal/core/lib/hooks/useCurrentUser';
import { useEvent, useLabelingItems, useAutoSave, useDropdownOptions, usePerformances, useTrainingTopics, useEvents, useAviationToast, useReview, useCanReviewItems, useCanEditItem, useApiErrorToast } from '../../hooks';
import { useAviationTranslation } from '../../i18n';
import { Panel, Button, StatusIndicator, Select, TextArea } from '../common';
import { EditableEventPanel, RecognitionSection, TrainingTopicsPanel, ResultPerformancePanel } from '../annotation';
import { ReviewPanel, ReviewHistory, RevisionIndicator } from '../review';
import { ReviewContextProvider } from '../../context';
import type { AviationEvent, LabelingItem, UserRole, FieldFeedback, ReviewableFieldName } from '../../types';
import styles from './AnnotationView.module.scss';

/**
 * Maps API role (PascalCase) to aviation module UserRole (lowercase).
 * Returns 'annotator' as default if role is unknown or null.
 */
const mapApiRoleToUserRole = (apiRole: string | null | undefined): UserRole => {
  if (!apiRole) return 'annotator';
  const normalized = apiRole.toLowerCase();
  if (normalized === 'admin' || normalized === 'manager' || normalized === 'researcher' || normalized === 'annotator') {
    return normalized as UserRole;
  }
  // Fallback: treat unknown roles as annotators (least privileged)
  return 'annotator';
};

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
  isSelected?: boolean;
  onSelect?: () => void;
  /** Whether the item is in read-only mode (editing disabled) */
  disabled?: boolean;
  /** Whether the delete button is disabled */
  deleteDisabled?: boolean;
  /** Tooltip message for disabled delete button */
  deleteTooltip?: string | null;
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
  isSelected = false,
  onSelect,
  disabled = false,
  deleteDisabled = false,
  deleteTooltip = null,
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

  const handleHeaderClick = useCallback(() => {
    // Select the item for review when clicking on it
    onSelect?.();
    setExpanded(!expanded);
  }, [onSelect, expanded]);

  return (
    <div
      className={`${styles.labelingItem} ${isSelected ? styles.labelingItemSelected : ''}`}
      data-testid="labeling-item-row"
      data-disabled={disabled}
    >
      <div
        className={styles.labelingItemHeader}
        onClick={handleHeaderClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleHeaderClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-selected={isSelected}
      >
        <div className={styles.labelingItemTitle}>
          <span className={styles.labelingItemName}>{headerText}</span>
          {typeSummary && <span className={styles.labelingItemSummary}>{typeSummary}</span>}
          {/* Status badge */}
          <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
            {item.status}
          </span>
        </div>
        <div className={styles.labelingItemActions}>
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (!deleteDisabled) {
                onDelete();
              }
            }}
            disabled={deleteDisabled}
            title={deleteTooltip ?? undefined}
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
              disabled={disabled}
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
                disabled={disabled}
              />
              <RecognitionSection
                category="error"
                title={t('recognition.error.title')}
                item={item}
                options={errorOptions}
                onUpdate={onUpdate}
                disabled={disabled}
              />
              <RecognitionSection
                category="uas"
                title={t('recognition.uas.title')}
                item={item}
                options={uasOptions}
                onUpdate={onUpdate}
                disabled={disabled}
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
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnotationView: FC<AnnotationViewProps> = ({ eventId, projectId }) => {
  const toast = useAviationToast();
  const { withErrorToast } = useApiErrorToast();
  const { t, currentLanguage } = useAviationTranslation();
  const { user } = useCurrentUserAtom();
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

  // State for current event index and selected labeling item for review
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Refs to track fetch state and prevent duplicate/concurrent fetches
  const lastFetchedItemIdRef = useRef<number | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  // Get user role from authentication and map to aviation UserRole
  const userRole: UserRole = useMemo(() => mapApiRoleToUserRole(user?.role), [user?.role]);

  // Check if user can review items based on their role
  const { canReview } = useCanReviewItems(userRole);

  // Review hook for the selected labeling item
  const {
    decisions: reviewDecisions,
    loading: reviewHistoryLoading,
    pendingFeedbacks,
    pendingRevisionFields,
    resolvedFields,
    canResubmit,
    unresolvedFieldCount,
    hasUnresolvedRevisions,
    failedItemIds,
    submit: submitItemForReview,
    approve: approveItem,
    reject: rejectItem,
    requestRevision: requestItemRevision,
    resubmit: resubmitItem,
    fetchHistory: fetchReviewHistory,
    addPendingFeedback,
    removePendingFeedback,
    markFieldAsResolved,
    unmarkFieldAsResolved,
  } = useReview(selectedItemId);

  // Get the current status of the selected item
  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedItemId);
  }, [items, selectedItemId]);

  // Determine edit permissions using the useCanEditItem hook
  const editPermissions = useCanEditItem({
    item: selectedItem ?? null,
    userRole,
    itemStatus: selectedItem?.status,
  });

  // Handle empty state: when no items exist, determine add permission by role only
  // Annotators and admins can add items, managers and researchers cannot
  const canAddWhenEmpty = useMemo(() => {
    if (items.length > 0) return editPermissions.canAdd;
    // No items: check role-based permissions for adding
    return userRole === 'annotator' || userRole === 'admin';
  }, [items.length, editPermissions.canAdd, userRole]);

  const {
    canDelete,
    isReadOnly,
    showBanner,
    bannerMessage,
    tooltipMessage,
  } = editPermissions;

  // Override showBanner for empty state - no banner when there are no items
  const showBannerOverride = useMemo(() => {
    if (items.length === 0) return false;
    return showBanner;
  }, [items.length, showBanner]);

  // Use canAddWhenEmpty for the canAdd permission
  const canAdd = canAddWhenEmpty;

  // Tooltip for empty state when manager/researcher cannot add
  const addTooltipMessage = useMemo(() => {
    if (items.length === 0 && !canAdd) {
      return `${userRole} role cannot add items`;
    }
    return tooltipMessage;
  }, [items.length, canAdd, userRole, tooltipMessage]);

  // Get field feedbacks for the selected item (from the most recent decision)
  const currentFieldFeedbacks = useMemo((): FieldFeedback[] => {
    if (reviewDecisions.length === 0) return [];
    // Get feedbacks from the most recent decision that has revision_requested status
    const revisionDecision = reviewDecisions.find(d => d.status === 'revision_requested');
    return revisionDecision?.field_feedbacks ?? [];
  }, [reviewDecisions]);

  // Determine if in review mode based on item status and user role
  const isReviewMode = useMemo(() => {
    if (!selectedItem) return false;
    // Review mode is enabled when user can review and item is submitted or reviewed
    // 'reviewed' status allows managers to add clarifications or follow-up feedback after rejection/revision
    return canReview && (selectedItem.status === 'submitted' || selectedItem.status === 'reviewed');
  }, [selectedItem, canReview]);

  // Field-level review action handlers for ReviewContextProvider
  const handleFieldApprove = useCallback((fieldName: ReviewableFieldName) => {
    // Mark field as resolved: remove any pending rejection and track as resolved
    removePendingFeedback(fieldName);
    markFieldAsResolved(fieldName);
  }, [removePendingFeedback, markFieldAsResolved]);

  const handleFieldReject = useCallback((fieldName: ReviewableFieldName, comment?: string) => {
    // Remove from resolved fields if previously resolved
    unmarkFieldAsResolved(fieldName);
    addPendingFeedback({
      field_name: fieldName,
      feedback_type: 'full',
      feedback_comment: comment ?? '',
    });
  }, [unmarkFieldAsResolved, addPendingFeedback]);

  const handleFieldRequestRevision = useCallback((fieldName: ReviewableFieldName, comment?: string) => {
    // Remove from resolved fields if previously resolved
    unmarkFieldAsResolved(fieldName);
    addPendingFeedback({
      field_name: fieldName,
      feedback_type: 'revision',
      feedback_comment: comment ?? '',
    });
  }, [unmarkFieldAsResolved, addPendingFeedback]);

  const handleFieldClearStatus = useCallback((fieldName: ReviewableFieldName) => {
    // Clear both pending rejection and resolved status
    removePendingFeedback(fieldName);
    unmarkFieldAsResolved(fieldName);
  }, [removePendingFeedback, unmarkFieldAsResolved]);

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

  // Auto-select first item when items are loaded
  useEffect(() => {
    if (items.length > 0 && selectedItemId === null) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  /**
   * Auto-reset invalid selection.
   *
   * When selectedItemId points to an item that no longer exists in the items array,
   * automatically reset the selection to the first available item (or null if empty).
   *
   * This handles edge cases like:
   * - Item deleted by another process
   * - Items array changed due to filtering
   * - Race conditions during concurrent operations
   *
   * Note: This is separate from the handleDeleteItem logic because it handles
   * ANY scenario where the selection becomes invalid, not just explicit deletions.
   */
  useEffect(() => {
    // Skip if no selection (nothing to validate)
    if (selectedItemId === null) return;

    // Skip if items array is empty (will be handled by the null case)
    if (items.length === 0) {
      setSelectedItemId(null);
      return;
    }

    // Check if current selection is valid
    const selectedItemExists = items.some(item => item.id === selectedItemId);

    if (!selectedItemExists) {
      // Selected item no longer exists - reset to first available item
      setSelectedItemId(items[0].id);
    }
  }, [selectedItemId, items]);

  // Fetch review history when selected item changes
  // Uses ref-based guards and validation to prevent duplicate/concurrent/invalid fetches
  useEffect(() => {
    // Guard 1: Skip if no item selected
    if (selectedItemId === null) return;

    // Guard 2: Skip if item doesn't exist in items array
    // This prevents fetching for deleted items or invalid IDs (e.g., race condition after deletion)
    const itemExists = items.some(item => item.id === selectedItemId);
    if (!itemExists) {
      // Item was likely deleted - don't attempt to fetch review history
      return;
    }

    // Guard 3: Skip if item is known to be failed (404)
    // This prevents repeated API calls for non-existent items that previously returned 404
    if (failedItemIds.has(selectedItemId)) {
      return;
    }

    // Guard 4: Skip if already fetched for this item
    if (selectedItemId === lastFetchedItemIdRef.current) return;

    // Guard 5: Skip if a fetch is already in progress
    if (isFetchingRef.current) return;

    // All guards passed - proceed with fetch
    // Mark as fetching and record the item ID BEFORE async call
    isFetchingRef.current = true;
    lastFetchedItemIdRef.current = selectedItemId;

    // Wrap in async IIFE to properly handle the promise
    (async () => {
      try {
        await fetchReviewHistory(selectedItemId);
      } finally {
        isFetchingRef.current = false;
      }
    })();
  }, [selectedItemId, items, failedItemIds]); // Include items and failedItemIds for guard validation

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

  /**
   * Handle item deletion with smart selection update.
   *
   * When deleting the currently selected item, this function determines
   * the next selection before deletion occurs:
   * - Priority 1: Select the next item in the list
   * - Priority 2: If no next item, select the previous item
   * - Priority 3: If this was the only item, set selection to null
   *
   * The selection update happens AFTER successful deletion to ensure
   * consistency with the new items array.
   */
  const handleDeleteItem = useCallback(async (itemId: number) => {
    // Determine next selection BEFORE deletion (items array still intact)
    let nextSelectedId: number | null = null;
    const isDeletingSelectedItem = itemId === selectedItemId;

    if (isDeletingSelectedItem) {
      const currentIndex = items.findIndex(item => item.id === itemId);

      if (currentIndex !== -1) {
        // Try to select next item (index + 1)
        if (currentIndex + 1 < items.length) {
          nextSelectedId = items[currentIndex + 1].id;
        }
        // If no next item, try previous item (index - 1)
        else if (currentIndex - 1 >= 0) {
          nextSelectedId = items[currentIndex - 1].id;
        }
        // Otherwise, set to null (was the only item)
        else {
          nextSelectedId = null;
        }
      }
    }

    // Perform deletion
    await deleteItem(itemId);
    await fetchPerformances();

    // Update selection AFTER successful deletion
    if (isDeletingSelectedItem) {
      setSelectedItemId(nextSelectedId);
    }
  }, [deleteItem, fetchPerformances, items, selectedItemId]);

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
    if (items.length === 0) return;

    // Find all draft items to submit
    const draftItems = items.filter(item => item.status === 'draft');
    if (draftItems.length === 0) {
      toast?.info(t('toast.no_draft_items', { defaultValue: 'No draft items to submit' }));
      return;
    }

    const result = await withErrorToast(
      async () => {
        // Submit all draft items
        await Promise.all(draftItems.map(item => submitItemForReview(item.id)));
        await fetchItems(); // Refresh items to get updated status
      },
      t('toast.submit_error', { defaultValue: 'Failed to submit items' })
    );

    if (result !== undefined) {
      toast?.success(t('toast.submit_success'));
    }
  }, [items, submitItemForReview, toast, t, fetchItems, withErrorToast]);

  // Review action handlers
  const handleApprove = useCallback(async () => {
    if (selectedItemId === null) return;
    const result = await withErrorToast(
      async () => {
        await approveItem(selectedItemId, 'Approved');
        await fetchItems();
      },
      t('toast.approve_error', { defaultValue: 'Failed to approve item' })
    );

    if (result !== undefined) {
      toast?.success(t('toast.approve_success', { defaultValue: 'Item approved successfully' }));
    }
  }, [selectedItemId, approveItem, toast, t, fetchItems, withErrorToast]);

  const handleReject = useCallback(async () => {
    if (selectedItemId === null) return;
    const result = await withErrorToast(
      async () => {
        await rejectItem(selectedItemId, {
          status: 'rejected_full',
          comment: 'Rejected by reviewer',
          field_feedbacks: pendingFeedbacks,
        });
        await fetchItems();
      },
      t('toast.reject_error', { defaultValue: 'Failed to reject item' })
    );

    if (result !== undefined) {
      toast?.success(t('toast.reject_success', { defaultValue: 'Item rejected' }));
    }
  }, [selectedItemId, rejectItem, pendingFeedbacks, toast, t, fetchItems, withErrorToast]);

  const handleRequestRevision = useCallback(async () => {
    if (selectedItemId === null) return;
    const result = await withErrorToast(
      async () => {
        await requestItemRevision(selectedItemId, {
          comment: 'Please revise the highlighted fields',
          field_feedbacks: pendingFeedbacks,
        });
        await fetchItems();
      },
      t('toast.revision_error', { defaultValue: 'Failed to request revision' })
    );

    if (result !== undefined) {
      toast?.success(t('toast.revision_success', { defaultValue: 'Revision requested' }));
    }
  }, [selectedItemId, requestItemRevision, pendingFeedbacks, toast, t, fetchItems, withErrorToast]);

  const handleResubmit = useCallback(async () => {
    if (selectedItemId === null) return;
    const result = await withErrorToast(
      async () => {
        await resubmitItem(selectedItemId, 'Resubmitted after revision');
        await fetchItems();
      },
      t('toast.resubmit_error', { defaultValue: 'Failed to resubmit item' })
    );

    if (result !== undefined) {
      toast?.success(t('toast.resubmit_success', { defaultValue: 'Item resubmitted' }));
    }
  }, [selectedItemId, resubmitItem, toast, t, fetchItems, withErrorToast]);

  // Handle item selection for review
  const handleItemSelect = useCallback((itemId: number) => {
    setSelectedItemId(itemId);
  }, []);

  // Check if resubmit instructions should be shown
  const showResubmitInstructions = useMemo(() => {
    if (!selectedItem) return false;
    return selectedItem.status === 'reviewed' && unresolvedFieldCount > 0;
  }, [selectedItem, unresolvedFieldCount]);

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
    <ReviewContextProvider
      userRole={userRole}
      isReviewMode={isReviewMode}
      pendingFeedbacks={pendingFeedbacks}
      resolvedFields={resolvedFields}
      onFieldApprove={handleFieldApprove}
      onFieldReject={handleFieldReject}
      onFieldRequestRevision={handleFieldRequestRevision}
      onFieldClearStatus={handleFieldClearStatus}
    >
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
            disabled={reviewHistoryLoading || (selectedItem?.status === 'reviewed' && !canResubmit)}
            title={
              selectedItem?.status === 'reviewed' && !canResubmit
                ? `${unresolvedFieldCount} field(s) need to be resolved`
                : undefined
            }
          >
            {t('toolbar.submit_for_review')}
          </Button>
        </div>
      </div>

      {/* Resubmit Instructions - shown when reviewed item has unresolved fields */}
      {showResubmitInstructions && (
        <div className={styles.resubmitInstructions}>
          <span className={styles.instructionIcon}>!</span>
          <span>Please mark all {unresolvedFieldCount} revision field(s) as resolved.</span>
        </div>
      )}

      {/* Combined Review Section - ReviewHistory and ReviewPanel side by side */}
      {/* Visible only to users with review permissions (manager and researcher roles) */}
      {canReview && selectedItemId !== null && selectedItem && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewHistoryColumn}>
            <ReviewHistory
              labelingItemId={selectedItemId}
              decisions={reviewDecisions}
              loading={reviewHistoryLoading}
            />
          </div>
          <div className={styles.reviewActionsColumn}>
            <ReviewPanel
              labelingItemId={selectedItemId}
              currentStatus={selectedItem.status}
              userRole={userRole}
              pendingFeedbacksCount={pendingFeedbacks.length}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestRevision={handleRequestRevision}
            />
          </div>
        </div>
      )}

      {/* Revision Indicator for annotators - shown when revisions are requested */}
      {userRole === 'annotator' && pendingRevisionFields.length > 0 && (
        <div className={styles.revisionIndicatorContainer}>
          <RevisionIndicator
            fieldName="general"
            feedbacks={currentFieldFeedbacks}
            onMarkResolved={handleResubmit}
          />
        </div>
      )}

      {/* Read-Only Banner - shown when item is not editable */}
      {showBannerOverride && bannerMessage && (
        <div className={styles.readOnlyBanner} data-testid="read-only-banner">
          <span className={styles.bannerIcon} data-testid="banner-icon" aria-hidden="true">!</span>
          <span>{bannerMessage}</span>
        </div>
      )}

        {/* Main Content */}
        <div className={styles.content}>
          {/* Left Column: Basic Info + Result Performance */}
          <div className={styles.leftColumn}>
            <EditableEventPanel
              event={currentEvent}
              eventIndex={currentEventIndex + 1}
              onUpdate={handleEventUpdate}
              disabled={isReadOnly}
            />
            <ResultPerformancePanel eventId={eventId} disabled={isReadOnly} />
          </div>

          {/* Right Column: Labeling Module */}
          <div className={styles.rightColumn}>
            <Panel
              title={t('labeling.title')}
              className={styles.labelingPanel}
              actions={
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleAddItem}
                  disabled={!canAdd}
                  title={!canAdd ? (addTooltipMessage ?? undefined) : undefined}
                  data-testid="button-add-item"
                >
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
                    isSelected={selectedItemId === item.id}
                    onSelect={() => handleItemSelect(item.id)}
                    disabled={isReadOnly}
                    deleteDisabled={!canDelete}
                    deleteTooltip={!canDelete ? tooltipMessage : null}
                  />
                ))
              )}
            </Panel>
          </div>
        </div>
      </div>
    </ReviewContextProvider>
  );
};
