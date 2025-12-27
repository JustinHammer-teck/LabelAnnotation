import { atom } from 'jotai';
import type { ReviewDecision, FieldFeedbackInput, ReviewableFieldName } from '../types/review.types';

/**
 * Review decisions for the current labeling item.
 * Contains the audit trail of all review actions.
 */
export const reviewDecisionsAtom = atom<ReviewDecision[]>([]);

/**
 * Loading state for review operations.
 */
export const reviewLoadingAtom = atom<boolean>(false);

/**
 * Error state for review operations.
 */
export const reviewErrorAtom = atom<string | null>(null);

/**
 * Pending field feedbacks being composed before submission.
 * These are staged feedbacks that will be included in the next reject/revision request.
 */
export const pendingFieldFeedbacksAtom = atom<FieldFeedbackInput[]>([]);

/**
 * Current labeling item ID being reviewed.
 * Used to track which item the review state belongs to.
 */
export const currentReviewItemIdAtom = atom<number | null>(null);

/**
 * Fields that are pending revision based on the latest review decision.
 * Derived from the most recent review decision's field feedbacks.
 */
export const pendingRevisionFieldsAtom = atom<ReviewableFieldName[]>([]);

/**
 * Fields that have been marked as resolved during the current review session.
 * Tracks which fields the annotator has fixed and are ready for resubmission.
 * This is separate from pendingFeedbacks which only tracks rejections/revisions.
 */
export const EMPTY_RESOLVED_FIELDS = new Set<ReviewableFieldName>();
export const resolvedFieldsAtom = atom<Set<ReviewableFieldName>>(EMPTY_RESOLVED_FIELDS);

/**
 * Empty Set for failed item IDs.
 * Reusable constant for initialization and reset operations.
 */
export const EMPTY_FAILED_ITEM_IDS = new Set<number>();

/**
 * Set of labeling item IDs that returned 404 errors on getReviewHistory().
 * Used to prevent repeated API calls for non-existent items.
 *
 * When an item is deleted or doesn't exist, we track its ID here.
 * The AnnotationView can check this set before attempting to fetch review history.
 */
export const failedItemIdsAtom = atom<Set<number>>(EMPTY_FAILED_ITEM_IDS);

/**
 * Derived atom: Can the annotator resubmit?
 * True only when all pending revision fields have been marked as resolved.
 */
export const canResubmitAtom = atom<boolean>((get) => {
  const pendingFields = get(pendingRevisionFieldsAtom);
  const resolvedFields = get(resolvedFieldsAtom);

  if (pendingFields.length === 0) return true;
  return pendingFields.every(field => resolvedFields.has(field));
});

/**
 * Derived atom: Count of unresolved fields.
 * Returns the number of pending revision fields that have not been marked as resolved yet.
 */
export const unresolvedFieldCountAtom = atom<number>((get) => {
  const pendingFields = get(pendingRevisionFieldsAtom);
  const resolvedFields = get(resolvedFieldsAtom);

  return pendingFields.filter(field => !resolvedFields.has(field)).length;
});

/**
 * Derived atom: Are there unresolved revisions?
 * Returns true if there are pending revision fields that have not been marked as resolved.
 */
export const hasUnresolvedRevisionsAtom = atom<boolean>((get) => {
  const pendingFields = get(pendingRevisionFieldsAtom);
  const resolvedFields = get(resolvedFieldsAtom);

  if (pendingFields.length === 0) return false;
  return pendingFields.some(field => !resolvedFields.has(field));
});
