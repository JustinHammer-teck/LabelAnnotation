import { useCallback, useState } from 'react';
import { useAviationApi } from '../api';
import type { EventStatus } from '../components/annotation/action-toolbar';

export type ReviewAction = 'submit' | 'approve' | 'reject' | 'revise';

export interface UseReviewWorkflowResult {
  submitForReview: (eventId: number) => Promise<void>;
  approveAnnotation: (eventId: number) => Promise<void>;
  rejectAnnotation: (eventId: number) => Promise<void>;
  requestRevision: (eventId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const STATUS_TRANSITIONS: Record<ReviewAction, EventStatus> = {
  submit: 'submitted',
  approve: 'approved',
  reject: 'rejected',
  revise: 'draft',
};

export const useReviewWorkflow = (): UseReviewWorkflowResult => {
  const apiClient = useAviationApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (eventId: number, action: ReviewAction) => {
      setIsLoading(true);
      setError(null);

      try {
        const newStatus = STATUS_TRANSITIONS[action];
        await apiClient.updateEvent(eventId, { status: newStatus });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient]
  );

  const submitForReview = useCallback(
    (eventId: number) => updateStatus(eventId, 'submit'),
    [updateStatus]
  );

  const approveAnnotation = useCallback(
    (eventId: number) => updateStatus(eventId, 'approve'),
    [updateStatus]
  );

  const rejectAnnotation = useCallback(
    (eventId: number) => updateStatus(eventId, 'reject'),
    [updateStatus]
  );

  const requestRevision = useCallback(
    (eventId: number) => updateStatus(eventId, 'revise'),
    [updateStatus]
  );

  return {
    submitForReview,
    approveAnnotation,
    rejectAnnotation,
    requestRevision,
    isLoading,
    error,
  };
};
