import { useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  reviewDecisionsAtom,
  reviewLoadingAtom,
  reviewErrorAtom,
  pendingFieldFeedbacksAtom,
  currentReviewItemIdAtom,
  pendingRevisionFieldsAtom,
  resolvedFieldsAtom,
  canResubmitAtom,
  unresolvedFieldCountAtom,
  hasUnresolvedRevisionsAtom,
  failedItemIdsAtom,
  EMPTY_RESOLVED_FIELDS,
  EMPTY_FAILED_ITEM_IDS,
} from '../stores/review.store';
import { useAviationApi } from '../api/context';
import { useApiErrorToast } from './use-api-error-toast.hook';
import type {
  ReviewDecision,
  FieldFeedbackInput,
  RejectRequest,
  RevisionRequest,
  ReviewableFieldName,
} from '../types/review.types';

/**
 * Result type for the useReview hook.
 */
export interface UseReviewResult {
  // State
  decisions: ReviewDecision[];
  loading: boolean;
  error: string | null;
  pendingFeedbacks: FieldFeedbackInput[];
  pendingRevisionFields: ReviewableFieldName[];
  resolvedFields: Set<ReviewableFieldName>;
  failedItemIds: Set<number>;

  // Submission validation
  canResubmit: boolean;
  unresolvedFieldCount: number;
  hasUnresolvedRevisions: boolean;

  // Actions
  fetchHistory: (labelingItemId: number) => Promise<void>;
  submit: (labelingItemId: number) => Promise<void>;
  approve: (labelingItemId: number, comment?: string) => Promise<void>;
  reject: (labelingItemId: number, request: RejectRequest) => Promise<void>;
  requestRevision: (labelingItemId: number, request: RevisionRequest) => Promise<void>;
  resubmit: (labelingItemId: number, comment?: string) => Promise<void>;

  // Field feedback management
  addPendingFeedback: (feedback: FieldFeedbackInput) => void;
  removePendingFeedback: (fieldName: ReviewableFieldName) => void;
  updatePendingFeedback: (fieldName: ReviewableFieldName, updates: Partial<FieldFeedbackInput>) => void;
  clearPendingFeedbacks: () => void;

  // Resolved fields management
  markFieldAsResolved: (fieldName: ReviewableFieldName) => void;
  unmarkFieldAsResolved: (fieldName: ReviewableFieldName) => void;
  clearResolvedFields: () => void;
}

/**
 * Hook for managing review operations on labeling items.
 *
 * Provides state and actions for:
 * - Fetching review history
 * - Approving, rejecting, or requesting revision on items
 * - Managing pending field-level feedbacks
 * - Handling annotator resubmissions
 *
 * @param labelingItemId - The ID of the labeling item to manage reviews for, or null if none selected.
 * @returns Review state and action functions.
 *
 * @example
 * ```tsx
 * const {
 *   decisions,
 *   loading,
 *   approve,
 *   reject,
 *   addPendingFeedback,
 * } = useReview(labelingItemId);
 *
 * // Approve the item
 * await approve(labelingItemId, 'Looks good!');
 *
 * // Or reject with field feedback
 * addPendingFeedback({
 *   field_name: 'threat_type_l1',
 *   feedback_type: 'partial',
 *   feedback_comment: 'Please verify the threat type',
 * });
 * await reject(labelingItemId, {
 *   status: 'rejected_partial',
 *   comment: 'Some fields need revision',
 *   field_feedbacks: pendingFeedbacks,
 * });
 * ```
 */
export const useReview = (labelingItemId: number | null): UseReviewResult => {
  const apiClient = useAviationApi();
  const errorToast = useApiErrorToast();

  // Read state values with useAtomValue (stable references)
  const decisions = useAtomValue(reviewDecisionsAtom);
  const loading = useAtomValue(reviewLoadingAtom);
  const error = useAtomValue(reviewErrorAtom);
  const pendingFeedbacks = useAtomValue(pendingFieldFeedbacksAtom);
  const currentItemId = useAtomValue(currentReviewItemIdAtom);
  const pendingRevisionFields = useAtomValue(pendingRevisionFieldsAtom);
  const resolvedFields = useAtomValue(resolvedFieldsAtom);
  const canResubmit = useAtomValue(canResubmitAtom);
  const unresolvedFieldCount = useAtomValue(unresolvedFieldCountAtom);
  const hasUnresolvedRevisions = useAtomValue(hasUnresolvedRevisionsAtom);
  const failedItemIds = useAtomValue(failedItemIdsAtom);

  // Get stable setter references with useSetAtom (doesn't change across renders)
  const setDecisions = useSetAtom(reviewDecisionsAtom);
  const setLoading = useSetAtom(reviewLoadingAtom);
  const setError = useSetAtom(reviewErrorAtom);
  const setPendingFeedbacks = useSetAtom(pendingFieldFeedbacksAtom);
  const setCurrentItemId = useSetAtom(currentReviewItemIdAtom);
  const setPendingRevisionFields = useSetAtom(pendingRevisionFieldsAtom);
  const setResolvedFields = useSetAtom(resolvedFieldsAtom);
  const setFailedItemIds = useSetAtom(failedItemIdsAtom);

  // Reset state when labeling item changes
  // Note: failedItemIds is NOT reset here - it tracks globally failed items across all items
  useEffect(() => {
    if (labelingItemId !== currentItemId) {
      setCurrentItemId(labelingItemId);
      setDecisions([]);
      setPendingFeedbacks([]);
      setPendingRevisionFields([]);
      setResolvedFields(EMPTY_RESOLVED_FIELDS);
      // Do NOT reset failedItemIds - it should persist across item changes
      // to prevent re-fetching for items that previously returned 404
      setError(null);
    }
  }, [labelingItemId, currentItemId, setCurrentItemId, setDecisions, setPendingFeedbacks, setPendingRevisionFields, setResolvedFields, setError]);

  /**
   * Fetch review history for a labeling item.
   *
   * Special handling for 404 errors:
   * - 404 errors are tracked in `failedItemIdsAtom` to prevent repeated fetch attempts
   * - 404 errors do NOT throw to the caller (silent failure)
   * - 404 errors do NOT show error toast (expected when items are deleted)
   * - Non-404 errors are thrown and show toast as normal
   */
  const fetchHistory = useCallback(
    async (itemId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getReviewHistory(itemId);
        setDecisions(response.decisions);
        setPendingRevisionFields(response.pending_revision_fields);

        // Success: remove from failed IDs if it was there
        setFailedItemIds((prev) => {
          if (!prev.has(itemId)) return prev;  // Early return
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      } catch (e) {
        // Defensive check for malformed errors
        if (!e || typeof e !== 'object') {
          const message = 'Failed to fetch review history';
          setError(message);
          errorToast.handleApiError(e, message);
          throw e;
        }

        // Check if this is a 404 error
        const is404 = (e as any)?.response?.status === 404;

        if (is404) {
          // Track the failed item ID to prevent future fetch attempts
          setFailedItemIds((prev) => {
            if (prev.has(itemId)) return prev;  // Early return for idempotency
            const next = new Set(prev);
            next.add(itemId);
            return next;
          });

          // Set generic error message (no toast)
          setError('Item not found');

          // Do NOT throw or show toast for 404 - it's expected when items are deleted
          // Just silently track the failure
        } else {
          // Non-404 errors: handle normally
          const message = e instanceof Error ? e.message : 'Failed to fetch review history';
          setError(message);
          errorToast.handleApiError(e, 'Failed to load review history');
          throw e;
        }
      } finally {
        setLoading(false);
      }
    },
    [apiClient, setLoading, setError, setDecisions, setPendingRevisionFields, setFailedItemIds, errorToast]
  );

  /**
   * Submit a labeling item for review.
   * Changes status from 'draft' to 'submitted'.
   */
  const submit = useCallback(
    async (itemId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await apiClient.submitItem(itemId);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to submit item';
        setError(message);
        errorToast.handleApiError(e, 'Failed to submit item');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, setLoading, setError, errorToast]
  );

  /**
   * Approve a labeling item.
   */
  const approve = useCallback(
    async (itemId: number, comment?: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const decision = await apiClient.approveItem(itemId, comment);
        setDecisions((prev) => [...prev, decision]);
        setPendingFeedbacks([]);
        setPendingRevisionFields([]);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to approve item';
        setError(message);
        errorToast.handleApiError(e, 'Failed to approve item');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, setLoading, setError, setDecisions, setPendingFeedbacks, setPendingRevisionFields, errorToast]
  );

  /**
   * Reject a labeling item with field-level feedback.
   */
  const reject = useCallback(
    async (itemId: number, request: RejectRequest): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const decision = await apiClient.rejectItem(itemId, request);
        setDecisions((prev) => [...prev, decision]);
        setPendingFeedbacks([]);
        // Extract field names from the decision's field feedbacks
        setPendingRevisionFields(decision.field_feedbacks.map((fb) => fb.field_name));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to reject item';
        setError(message);
        errorToast.handleApiError(e, 'Failed to reject item');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, setLoading, setError, setDecisions, setPendingFeedbacks, setPendingRevisionFields, errorToast]
  );

  /**
   * Request revision on a labeling item with field-level feedback.
   */
  const requestRevision = useCallback(
    async (itemId: number, request: RevisionRequest): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const decision = await apiClient.requestRevision(itemId, request);
        setDecisions((prev) => [...prev, decision]);
        setPendingFeedbacks([]);
        // Extract field names from the decision's field feedbacks
        setPendingRevisionFields(decision.field_feedbacks.map((fb) => fb.field_name));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to request revision';
        setError(message);
        errorToast.handleApiError(e, 'Failed to request revision');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, setLoading, setError, setDecisions, setPendingFeedbacks, setPendingRevisionFields, errorToast]
  );

  /**
   * Resubmit a labeling item after making revisions.
   */
  const resubmit = useCallback(
    async (itemId: number, comment?: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await apiClient.resubmitItem(itemId, comment);
        setPendingRevisionFields([]);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to resubmit item';
        setError(message);
        errorToast.handleApiError(e, 'Failed to resubmit item');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, setLoading, setError, setPendingRevisionFields, errorToast]
  );

  /**
   * Add a pending field feedback.
   * Replaces existing feedback for the same field.
   */
  const addPendingFeedback = useCallback(
    (feedback: FieldFeedbackInput): void => {
      setPendingFeedbacks((prev) => {
        const filtered = prev.filter((fb) => fb.field_name !== feedback.field_name);
        return [...filtered, feedback];
      });
    },
    [setPendingFeedbacks]
  );

  /**
   * Remove a pending field feedback by field name.
   */
  const removePendingFeedback = useCallback(
    (fieldName: ReviewableFieldName): void => {
      setPendingFeedbacks((prev) => prev.filter((fb) => fb.field_name !== fieldName));
    },
    [setPendingFeedbacks]
  );

  /**
   * Update an existing pending field feedback.
   */
  const updatePendingFeedback = useCallback(
    (fieldName: ReviewableFieldName, updates: Partial<FieldFeedbackInput>): void => {
      setPendingFeedbacks((prev) =>
        prev.map((fb) =>
          fb.field_name === fieldName ? { ...fb, ...updates } : fb
        )
      );
    },
    [setPendingFeedbacks]
  );

  /**
   * Clear all pending field feedbacks.
   */
  const clearPendingFeedbacks = useCallback((): void => {
    setPendingFeedbacks([]);
  }, [setPendingFeedbacks]);

  /**
   * Mark a field as resolved.
   * Indicates that the annotator has addressed the reviewer's feedback.
   */
  const markFieldAsResolved = useCallback(
    (fieldName: ReviewableFieldName): void => {
      setResolvedFields((prev) => {
        const next = new Set(prev);
        next.add(fieldName);
        return next;
      });
    },
    [setResolvedFields]
  );

  /**
   * Unmark a field as resolved.
   * Removes the field from the resolved set.
   */
  const unmarkFieldAsResolved = useCallback(
    (fieldName: ReviewableFieldName): void => {
      setResolvedFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    },
    [setResolvedFields]
  );

  /**
   * Clear all resolved fields.
   * Resets the resolved fields tracking.
   */
  const clearResolvedFields = useCallback((): void => {
    setResolvedFields(EMPTY_RESOLVED_FIELDS);
  }, [setResolvedFields]);

  return {
    // State
    decisions,
    loading,
    error,
    pendingFeedbacks,
    pendingRevisionFields,
    resolvedFields,
    failedItemIds,

    // Submission validation
    canResubmit,
    unresolvedFieldCount,
    hasUnresolvedRevisions,

    // Actions
    fetchHistory,
    submit,
    approve,
    reject,
    requestRevision,
    resubmit,

    // Field feedback management
    addPendingFeedback,
    removePendingFeedback,
    updatePendingFeedback,
    clearPendingFeedbacks,

    // Resolved fields management
    markFieldAsResolved,
    unmarkFieldAsResolved,
    clearResolvedFields,
  };
};
