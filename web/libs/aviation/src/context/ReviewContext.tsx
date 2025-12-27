import { createContext, useContext, useMemo, useCallback, type FC, type ReactNode } from 'react';
import type {
  UserRole,
  ReviewableFieldName,
  FieldFeedbackInput,
  FeedbackType,
} from '../types';
import type { FieldReviewState } from '../components/review/ReviewableField';

/**
 * Value provided by the ReviewContext.
 * Contains all review state and action callbacks for field-level reviews.
 */
export interface ReviewContextValue {
  // State
  /** Current user's role */
  userRole: UserRole;
  /** Whether the UI is in review mode */
  isReviewMode: boolean;
  /** Pending field feedbacks not yet submitted */
  pendingFeedbacks: FieldFeedbackInput[];
  /** Whether the current user can perform reviews */
  canReview: boolean;

  // State accessors
  /** Get the review state for a specific field */
  getFieldReviewState: (fieldName: ReviewableFieldName) => FieldReviewState | undefined;
  /** Get the feedback comment for a specific field */
  getFieldFeedbackComment: (fieldName: ReviewableFieldName) => string | undefined;
  /** Check if a field is pending revision (has revision feedback but not approved) */
  isFieldPendingRevision: (fieldName: ReviewableFieldName) => boolean;

  // Actions
  /** Callback when a field is approved */
  onFieldApprove?: (fieldName: ReviewableFieldName) => void;
  /** Callback when a field is rejected */
  onFieldReject?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback when revision is requested on a field */
  onFieldRequestRevision?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback to clear the review status of a field */
  onFieldClearStatus?: (fieldName: ReviewableFieldName) => void;
}

/**
 * Props for the ReviewContextProvider component.
 */
export interface ReviewContextProviderProps {
  children: ReactNode;
  /** User role (default: 'annotator') */
  userRole?: UserRole;
  /** Whether in review mode (default: false) */
  isReviewMode?: boolean;
  /** Pending field feedbacks (default: []) */
  pendingFeedbacks?: FieldFeedbackInput[];
  /** Fields that have been marked as resolved during the current review session */
  resolvedFields?: Set<ReviewableFieldName>;
  /** Callback when field is approved */
  onFieldApprove?: (fieldName: ReviewableFieldName) => void;
  /** Callback when field is rejected */
  onFieldReject?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback when revision is requested */
  onFieldRequestRevision?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Callback to clear field status */
  onFieldClearStatus?: (fieldName: ReviewableFieldName) => void;
}

/**
 * React Context for review state and actions.
 * Null when outside of ReviewContextProvider.
 */
const ReviewContext = createContext<ReviewContextValue | null>(null);

/**
 * Empty array constant to use as stable default value.
 * Prevents unnecessary re-renders when pendingFeedbacks is not provided.
 */
const EMPTY_FEEDBACKS: FieldFeedbackInput[] = [];

/**
 * Convert feedback type to review status.
 * Maps API feedback types to UI review status values.
 *
 * @param type - The feedback type from the API
 * @returns The corresponding field review status
 */
const feedbackTypeToStatus = (type: FeedbackType): FieldReviewState['status'] => {
  switch (type) {
    case 'partial':
    case 'full':
      return 'rejected';
    case 'revision':
      return 'revision';
    default:
      return 'pending';
  }
};

/**
 * Check if a user role has review permissions.
 * Admin, manager, and researcher roles can review.
 *
 * @param role - The user role to check
 * @returns True if the role can review, false otherwise
 */
const checkCanReview = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager' || role === 'researcher';
};

/**
 * Provider component for review context.
 *
 * Wraps annotation components to provide review state and callbacks.
 * Use this at the top level of the annotation view to enable field-level
 * review functionality in all child components.
 *
 * @example
 * ```tsx
 * <ReviewContextProvider
 *   userRole="manager"
 *   isReviewMode={true}
 *   pendingFeedbacks={feedbacks}
 *   onFieldApprove={handleApprove}
 *   onFieldReject={handleReject}
 * >
 *   <RecognitionSection ... />
 *   <EditableEventPanel ... />
 * </ReviewContextProvider>
 * ```
 */
export const ReviewContextProvider: FC<ReviewContextProviderProps> = ({
  children,
  userRole = 'annotator',
  isReviewMode = false,
  pendingFeedbacks = EMPTY_FEEDBACKS,
  resolvedFields,
  onFieldApprove,
  onFieldReject,
  onFieldRequestRevision,
  onFieldClearStatus,
}) => {
  // Memoize canReview based on userRole
  const canReview = useMemo(() => checkCanReview(userRole), [userRole]);

  /**
   * Get the review state for a specific field.
   * First checks if the field is in the resolved set, then looks up pending feedbacks.
   */
  const getFieldReviewState = useCallback(
    (fieldName: ReviewableFieldName): FieldReviewState | undefined => {
      // Check if field is resolved first
      if (resolvedFields?.has(fieldName)) {
        return { status: 'approved' };
      }

      // Check if field has rejection/revision feedback
      const feedback = pendingFeedbacks.find(fb => fb.field_name === fieldName);
      if (!feedback) return undefined;

      return {
        status: feedbackTypeToStatus(feedback.feedback_type),
        comment: feedback.feedback_comment,
      };
    },
    [resolvedFields, pendingFeedbacks]
  );

  /**
   * Get the feedback comment for a specific field.
   * Returns undefined if no feedback exists for the field.
   */
  const getFieldFeedbackComment = useCallback(
    (fieldName: ReviewableFieldName): string | undefined => {
      const feedback = pendingFeedbacks.find(fb => fb.field_name === fieldName);
      return feedback?.feedback_comment;
    },
    [pendingFeedbacks]
  );

  /**
   * Check if a field is pending revision.
   * Returns true if the field has revision feedback and is not resolved.
   */
  const isFieldPendingRevision = useCallback(
    (fieldName: ReviewableFieldName): boolean => {
      // Not pending if already resolved
      if (resolvedFields?.has(fieldName)) {
        return false;
      }

      // Check if field has revision feedback
      const feedback = pendingFeedbacks.find(fb => fb.field_name === fieldName);
      return feedback?.feedback_type === 'revision';
    },
    [resolvedFields, pendingFeedbacks]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<ReviewContextValue>(
    () => ({
      userRole,
      isReviewMode,
      pendingFeedbacks,
      canReview,
      getFieldReviewState,
      getFieldFeedbackComment,
      isFieldPendingRevision,
      onFieldApprove,
      onFieldReject,
      onFieldRequestRevision,
      onFieldClearStatus,
    }),
    [
      userRole,
      isReviewMode,
      pendingFeedbacks,
      canReview,
      getFieldReviewState,
      getFieldFeedbackComment,
      isFieldPendingRevision,
      onFieldApprove,
      onFieldReject,
      onFieldRequestRevision,
      onFieldClearStatus,
    ]
  );

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

/**
 * Hook to access review context.
 *
 * Must be used within a ReviewContextProvider.
 * Throws an error if used outside of a provider.
 *
 * @returns The review context value
 * @throws Error if used outside of ReviewContextProvider
 *
 * @example
 * ```tsx
 * const { userRole, canReview, onFieldApprove } = useReviewContext();
 *
 * if (canReview) {
 *   onFieldApprove?.('threat_type_l1');
 * }
 * ```
 */
export const useReviewContext = (): ReviewContextValue => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviewContext must be used within a ReviewContextProvider');
  }
  return context;
};

/**
 * Hook to optionally access review context.
 *
 * Returns null if used outside of a provider.
 * Useful for components that may be used both inside and outside review context.
 *
 * @returns The review context value, or null if outside provider
 *
 * @example
 * ```tsx
 * const context = useOptionalReviewContext();
 *
 * if (context?.canReview) {
 *   // Render review controls
 * }
 * ```
 */
export const useOptionalReviewContext = (): ReviewContextValue | null => {
  return useContext(ReviewContext);
};
