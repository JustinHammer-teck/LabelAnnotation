import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { useReview } from '../use-review.hook';
import {
  reviewDecisionsAtom,
  reviewLoadingAtom,
  reviewErrorAtom,
  pendingFieldFeedbacksAtom,
  pendingRevisionFieldsAtom,
  currentReviewItemIdAtom,
  failedItemIdsAtom,
} from '../../stores/review.store';
import { AviationApiContext } from '../../api/context';
import type { AviationApiClient } from '../../api/api-client';
import type {
  RejectRequest,
  RevisionRequest,
  FieldFeedbackInput,
  ReviewDecision,
  ReviewHistoryResponse,
} from '../../types/review.types';
import type { LabelingItem } from '../../types';

// Mock the useApiErrorToast hook
jest.mock('../use-api-error-toast.hook', () => ({
  useApiErrorToast: () => ({
    handleApiError: jest.fn(),
    withErrorToast: jest.fn(),
  }),
}));

/**
 * Creates a mock API client with jest mocks for all review methods.
 */
const createMockApiClient = (): jest.Mocked<Pick<AviationApiClient, 'approveItem' | 'rejectItem' | 'requestRevision' | 'resubmitItem' | 'getReviewHistory'>> & Partial<AviationApiClient> => ({
  approveItem: jest.fn(),
  rejectItem: jest.fn(),
  requestRevision: jest.fn(),
  resubmitItem: jest.fn(),
  getReviewHistory: jest.fn(),
});

/**
 * Creates a mock review decision for testing.
 */
const createMockDecision = (
  id: number,
  labelingItemId: number,
  status: ReviewDecision['status'],
  comment: string,
  fieldFeedbacks: ReviewDecision['field_feedbacks'] = []
): ReviewDecision => ({
  id,
  labeling_item: labelingItemId,
  status,
  reviewer: 1,
  reviewer_name: 'Test Reviewer',
  reviewer_comment: comment,
  field_feedbacks: fieldFeedbacks,
  created_at: new Date().toISOString(),
});

/**
 * Helper to create a Jotai provider wrapper for testing with API client.
 */
const createWrapper = (mockApiClient?: Partial<AviationApiClient>) => {
  const store = createStore();
  const apiClient = mockApiClient ?? createMockApiClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AviationApiContext.Provider value={apiClient as AviationApiClient}>
      <Provider store={store}>{children}</Provider>
    </AviationApiContext.Provider>
  );
  return { Wrapper, store, apiClient: apiClient as jest.Mocked<Pick<AviationApiClient, 'approveItem' | 'rejectItem' | 'requestRevision' | 'resubmitItem' | 'getReviewHistory'>> };
};

describe('useReview', () => {
  describe('Initial State', () => {
    it('should return initial empty state when labelingItemId is null', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useReview(null), { wrapper: Wrapper });

      expect(result.current.decisions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pendingFeedbacks).toEqual([]);
      expect(result.current.pendingRevisionFields).toEqual([]);
    });

    it('should return initial empty state when labelingItemId is provided', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      expect(result.current.decisions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pendingFeedbacks).toEqual([]);
    });
  });

  describe('fetchHistory', () => {
    it('should set loading state while fetching', async () => {
      const mockApiClient = createMockApiClient();
      let resolvePromise: (value: ReviewHistoryResponse) => void;
      mockApiClient.getReviewHistory.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      act(() => {
        result.current.fetchHistory(123);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({
          labeling_item: 123,
          decisions: [],
          current_status: null,
          pending_revision_fields: [],
        });
      });

      expect(result.current.loading).toBe(false);
    });

    it('should clear error on successful fetch', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getReviewHistory.mockResolvedValue({
        labeling_item: 123,
        decisions: [],
        current_status: null,
        pending_revision_fields: [],
      });

      const { Wrapper, store } = createWrapper(mockApiClient);
      store.set(reviewErrorAtom, 'Previous error');

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.fetchHistory(123);
      });

      expect(result.current.error).toBeNull();
    });

    it('should populate decisions from API response', async () => {
      const mockApiClient = createMockApiClient();
      const mockDecisions = [
        createMockDecision(1, 123, 'approved', 'First approval'),
        createMockDecision(2, 123, 'revision_requested', 'Needs work'),
      ];
      mockApiClient.getReviewHistory.mockResolvedValue({
        labeling_item: 123,
        decisions: mockDecisions,
        current_status: 'revision_requested',
        pending_revision_fields: ['threat_type_l1'],
      });

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.fetchHistory(123);
      });

      expect(result.current.decisions).toEqual(mockDecisions);
      expect(result.current.pendingRevisionFields).toEqual(['threat_type_l1']);
    });

    it('should handle API error', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getReviewHistory.mockRejectedValue(new Error('Network error'));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await expect(result.current.fetchHistory(123)).rejects.toThrow('Network error');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('approve', () => {
    it('should create an approval decision with comment', async () => {
      const mockApiClient = createMockApiClient();
      const mockDecision = createMockDecision(1, 123, 'approved', 'Looks great!');
      mockApiClient.approveItem.mockResolvedValue(mockDecision);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.approve(123, 'Looks great!');
      });

      expect(mockApiClient.approveItem).toHaveBeenCalledWith(123, 'Looks great!');
      expect(result.current.decisions).toHaveLength(1);
      expect(result.current.decisions[0].status).toBe('approved');
      expect(result.current.decisions[0].reviewer_comment).toBe('Looks great!');
      expect(result.current.decisions[0].labeling_item).toBe(123);
    });

    it('should call API without comment when none provided', async () => {
      const mockApiClient = createMockApiClient();
      const mockDecision = createMockDecision(1, 123, 'approved', 'Approved');
      mockApiClient.approveItem.mockResolvedValue(mockDecision);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.approve(123);
      });

      expect(mockApiClient.approveItem).toHaveBeenCalledWith(123, undefined);
      expect(result.current.decisions[0].reviewer_comment).toBe('Approved');
    });

    it('should clear pending feedbacks after approval', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.approveItem.mockResolvedValue(createMockDecision(1, 123, 'approved', 'Approved'));

      const { Wrapper, store } = createWrapper(mockApiClient);
      store.set(pendingFieldFeedbacksAtom, [
        { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Test' },
      ]);

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.approve(123);
      });

      expect(result.current.pendingFeedbacks).toEqual([]);
    });

    it('should clear pending revision fields after approval', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.approveItem.mockResolvedValue(createMockDecision(1, 123, 'approved', 'Approved'));

      const { Wrapper, store } = createWrapper(mockApiClient);
      store.set(pendingRevisionFieldsAtom, ['threat_type_l1', 'error_type_l2']);

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.approve(123);
      });

      expect(result.current.pendingRevisionFields).toEqual([]);
    });

    it('should handle API error on approve', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.approveItem.mockRejectedValue(new Error('Failed to approve'));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await expect(result.current.approve(123)).rejects.toThrow('Failed to approve');
      });

      expect(result.current.error).toBe('Failed to approve');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('reject', () => {
    it('should create a rejection decision with field feedbacks', async () => {
      const mockApiClient = createMockApiClient();
      const fieldFeedbacks = [
        {
          id: 1,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'threat_type_l1' as const,
          feedback_type: 'partial' as const,
          feedback_comment: 'Wrong threat type',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
        {
          id: 2,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'error_management' as const,
          feedback_type: 'revision' as const,
          feedback_comment: 'Please clarify',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
      ];
      const mockDecision = createMockDecision(1, 123, 'rejected_partial', 'Some fields need work', fieldFeedbacks);
      mockApiClient.rejectItem.mockResolvedValue(mockDecision);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      const rejectRequest: RejectRequest = {
        status: 'rejected_partial',
        comment: 'Some fields need work',
        field_feedbacks: [
          { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Wrong threat type' },
          { field_name: 'error_management', feedback_type: 'revision', feedback_comment: 'Please clarify' },
        ],
      };

      await act(async () => {
        await result.current.reject(123, rejectRequest);
      });

      expect(mockApiClient.rejectItem).toHaveBeenCalledWith(123, rejectRequest);
      expect(result.current.decisions).toHaveLength(1);
      expect(result.current.decisions[0].status).toBe('rejected_partial');
      expect(result.current.decisions[0].reviewer_comment).toBe('Some fields need work');
      expect(result.current.decisions[0].field_feedbacks).toHaveLength(2);
    });

    it('should set pending revision fields from rejection', async () => {
      const mockApiClient = createMockApiClient();
      const fieldFeedbacks = [
        {
          id: 1,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'threat_type_l1' as const,
          feedback_type: 'full' as const,
          feedback_comment: 'Completely wrong',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
        {
          id: 2,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'threat_type_l2' as const,
          feedback_type: 'full' as const,
          feedback_comment: 'Also wrong',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
      ];
      const mockDecision = createMockDecision(1, 123, 'rejected_full', 'All fields incorrect', fieldFeedbacks);
      mockApiClient.rejectItem.mockResolvedValue(mockDecision);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      const rejectRequest: RejectRequest = {
        status: 'rejected_full',
        comment: 'All fields incorrect',
        field_feedbacks: [
          { field_name: 'threat_type_l1', feedback_type: 'full', feedback_comment: 'Completely wrong' },
          { field_name: 'threat_type_l2', feedback_type: 'full', feedback_comment: 'Also wrong' },
        ],
      };

      await act(async () => {
        await result.current.reject(123, rejectRequest);
      });

      expect(result.current.pendingRevisionFields).toEqual(['threat_type_l1', 'threat_type_l2']);
    });

    it('should clear pending feedbacks after rejection', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.rejectItem.mockResolvedValue(createMockDecision(1, 123, 'rejected_partial', 'Rejection', []));

      const { Wrapper, store } = createWrapper(mockApiClient);
      store.set(pendingFieldFeedbacksAtom, [
        { field_name: 'uas_type_l1', feedback_type: 'partial', feedback_comment: 'Staged' },
      ]);

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      const rejectRequest: RejectRequest = {
        status: 'rejected_partial',
        comment: 'Rejection',
        field_feedbacks: [],
      };

      await act(async () => {
        await result.current.reject(123, rejectRequest);
      });

      expect(result.current.pendingFeedbacks).toEqual([]);
    });

    it('should handle API error on reject', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.rejectItem.mockRejectedValue(new Error('Failed to reject'));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await expect(
          result.current.reject(123, { status: 'rejected_partial', comment: 'Test', field_feedbacks: [] })
        ).rejects.toThrow('Failed to reject');
      });

      expect(result.current.error).toBe('Failed to reject');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('requestRevision', () => {
    it('should create a revision request decision', async () => {
      const mockApiClient = createMockApiClient();
      const fieldFeedbacks = [
        {
          id: 1,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'threat_description' as const,
          feedback_type: 'revision' as const,
          feedback_comment: 'Needs more detail',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
      ];
      const mockDecision = createMockDecision(1, 123, 'revision_requested', 'Please clarify a few things', fieldFeedbacks);
      mockApiClient.requestRevision.mockResolvedValue(mockDecision);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      const revisionRequest: RevisionRequest = {
        comment: 'Please clarify a few things',
        field_feedbacks: [
          { field_name: 'threat_description', feedback_type: 'revision', feedback_comment: 'Needs more detail' },
        ],
      };

      await act(async () => {
        await result.current.requestRevision(123, revisionRequest);
      });

      expect(mockApiClient.requestRevision).toHaveBeenCalledWith(123, revisionRequest);
      expect(result.current.decisions).toHaveLength(1);
      expect(result.current.decisions[0].status).toBe('revision_requested');
      expect(result.current.decisions[0].field_feedbacks).toHaveLength(1);
      expect(result.current.decisions[0].field_feedbacks[0].field_name).toBe('threat_description');
    });

    it('should set pending revision fields from revision request', async () => {
      const mockApiClient = createMockApiClient();
      const fieldFeedbacks = [
        {
          id: 1,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'error_type_l3' as const,
          feedback_type: 'revision' as const,
          feedback_comment: 'Check this',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
        {
          id: 2,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'uas_management' as const,
          feedback_type: 'revision' as const,
          feedback_comment: 'Also check',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
      ];
      const mockDecision = createMockDecision(1, 123, 'revision_requested', 'Revision needed', fieldFeedbacks);
      mockApiClient.requestRevision.mockResolvedValue(mockDecision);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      const revisionRequest: RevisionRequest = {
        comment: 'Revision needed',
        field_feedbacks: [
          { field_name: 'error_type_l3', feedback_type: 'revision', feedback_comment: 'Check this' },
          { field_name: 'uas_management', feedback_type: 'revision', feedback_comment: 'Also check' },
        ],
      };

      await act(async () => {
        await result.current.requestRevision(123, revisionRequest);
      });

      expect(result.current.pendingRevisionFields).toEqual(['error_type_l3', 'uas_management']);
    });

    it('should handle API error on requestRevision', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.requestRevision.mockRejectedValue(new Error('Failed to request revision'));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await expect(
          result.current.requestRevision(123, { comment: 'Test', field_feedbacks: [] })
        ).rejects.toThrow('Failed to request revision');
      });

      expect(result.current.error).toBe('Failed to request revision');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('resubmit', () => {
    it('should clear pending revision fields on resubmit', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.resubmitItem.mockResolvedValue({
        id: 123,
        status: 'submitted',
      } as LabelingItem);

      const { Wrapper, store } = createWrapper(mockApiClient);
      store.set(pendingRevisionFieldsAtom, ['threat_type_l1', 'error_type_l2']);

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.resubmit(123, 'Fixed the issues');
      });

      expect(mockApiClient.resubmitItem).toHaveBeenCalledWith(123, 'Fixed the issues');
      expect(result.current.pendingRevisionFields).toEqual([]);
    });

    it('should work without comment', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.resubmitItem.mockResolvedValue({
        id: 123,
        status: 'submitted',
      } as LabelingItem);

      const { Wrapper, store } = createWrapper(mockApiClient);
      store.set(pendingRevisionFieldsAtom, ['threat_type_l1']);

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await result.current.resubmit(123);
      });

      expect(mockApiClient.resubmitItem).toHaveBeenCalledWith(123, undefined);
      expect(result.current.pendingRevisionFields).toEqual([]);
    });

    it('should handle API error on resubmit', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.resubmitItem.mockRejectedValue(new Error('Failed to resubmit'));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await expect(result.current.resubmit(123)).rejects.toThrow('Failed to resubmit');
      });

      expect(result.current.error).toBe('Failed to resubmit');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Pending Feedback Management', () => {
    describe('addPendingFeedback', () => {
      it('should add a new pending feedback', () => {
        const { Wrapper } = createWrapper();
        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        const feedback: FieldFeedbackInput = {
          field_name: 'threat_type_l1',
          feedback_type: 'partial',
          feedback_comment: 'Check the threat type',
        };

        act(() => {
          result.current.addPendingFeedback(feedback);
        });

        expect(result.current.pendingFeedbacks).toHaveLength(1);
        expect(result.current.pendingFeedbacks[0]).toEqual(feedback);
      });

      it('should replace existing feedback for the same field', () => {
        const { Wrapper } = createWrapper();
        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        const feedback1: FieldFeedbackInput = {
          field_name: 'threat_type_l1',
          feedback_type: 'partial',
          feedback_comment: 'First comment',
        };

        const feedback2: FieldFeedbackInput = {
          field_name: 'threat_type_l1',
          feedback_type: 'full',
          feedback_comment: 'Updated comment',
        };

        act(() => {
          result.current.addPendingFeedback(feedback1);
          result.current.addPendingFeedback(feedback2);
        });

        expect(result.current.pendingFeedbacks).toHaveLength(1);
        expect(result.current.pendingFeedbacks[0]).toEqual(feedback2);
      });

      it('should maintain feedbacks for different fields', () => {
        const { Wrapper } = createWrapper();
        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        const feedback1: FieldFeedbackInput = {
          field_name: 'threat_type_l1',
          feedback_type: 'partial',
          feedback_comment: 'Threat issue',
        };

        const feedback2: FieldFeedbackInput = {
          field_name: 'error_type_l2',
          feedback_type: 'revision',
          feedback_comment: 'Error issue',
        };

        act(() => {
          result.current.addPendingFeedback(feedback1);
          result.current.addPendingFeedback(feedback2);
        });

        expect(result.current.pendingFeedbacks).toHaveLength(2);
      });
    });

    describe('removePendingFeedback', () => {
      it('should remove a pending feedback by field name', () => {
        const { Wrapper, store } = createWrapper();
        // Set currentReviewItemIdAtom to prevent reset on mount
        store.set(currentReviewItemIdAtom, 123);
        store.set(pendingFieldFeedbacksAtom, [
          { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Comment 1' },
          { field_name: 'error_type_l2', feedback_type: 'full', feedback_comment: 'Comment 2' },
        ]);

        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        act(() => {
          result.current.removePendingFeedback('threat_type_l1');
        });

        expect(result.current.pendingFeedbacks).toHaveLength(1);
        expect(result.current.pendingFeedbacks[0].field_name).toBe('error_type_l2');
      });

      it('should do nothing if field name not found', () => {
        const { Wrapper, store } = createWrapper();
        // Set currentReviewItemIdAtom to prevent reset on mount
        store.set(currentReviewItemIdAtom, 123);
        store.set(pendingFieldFeedbacksAtom, [
          { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Comment' },
        ]);

        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        act(() => {
          result.current.removePendingFeedback('error_type_l2');
        });

        expect(result.current.pendingFeedbacks).toHaveLength(1);
      });
    });

    describe('updatePendingFeedback', () => {
      it('should update an existing pending feedback', () => {
        const { Wrapper, store } = createWrapper();
        // Set currentReviewItemIdAtom to prevent reset on mount
        store.set(currentReviewItemIdAtom, 123);
        store.set(pendingFieldFeedbacksAtom, [
          { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Original comment' },
        ]);

        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        act(() => {
          result.current.updatePendingFeedback('threat_type_l1', {
            feedback_comment: 'Updated comment',
            feedback_type: 'full',
          });
        });

        expect(result.current.pendingFeedbacks[0].feedback_comment).toBe('Updated comment');
        expect(result.current.pendingFeedbacks[0].feedback_type).toBe('full');
        expect(result.current.pendingFeedbacks[0].field_name).toBe('threat_type_l1');
      });

      it('should not modify other feedbacks', () => {
        const { Wrapper, store } = createWrapper();
        // Set currentReviewItemIdAtom to prevent reset on mount
        store.set(currentReviewItemIdAtom, 123);
        store.set(pendingFieldFeedbacksAtom, [
          { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Comment 1' },
          { field_name: 'error_type_l2', feedback_type: 'revision', feedback_comment: 'Comment 2' },
        ]);

        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        act(() => {
          result.current.updatePendingFeedback('threat_type_l1', { feedback_comment: 'Updated' });
        });

        expect(result.current.pendingFeedbacks[1].feedback_comment).toBe('Comment 2');
      });
    });

    describe('clearPendingFeedbacks', () => {
      it('should clear all pending feedbacks', () => {
        const { Wrapper, store } = createWrapper();
        store.set(pendingFieldFeedbacksAtom, [
          { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Comment 1' },
          { field_name: 'error_type_l2', feedback_type: 'full', feedback_comment: 'Comment 2' },
          { field_name: 'uas_type_l3', feedback_type: 'revision', feedback_comment: 'Comment 3' },
        ]);

        const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

        act(() => {
          result.current.clearPendingFeedbacks();
        });

        expect(result.current.pendingFeedbacks).toEqual([]);
      });
    });
  });

  describe('State Reset on Item Change', () => {
    it('should reset state when labelingItemId changes', async () => {
      const { Wrapper, store } = createWrapper();

      // Set up initial state - must set currentReviewItemIdAtom to match initial itemId
      store.set(currentReviewItemIdAtom, 123);
      store.set(reviewDecisionsAtom, [
        {
          id: 1,
          labeling_item: 123,
          status: 'approved',
          reviewer: 1,
          reviewer_comment: 'Approved',
          field_feedbacks: [],
          created_at: new Date().toISOString(),
        },
      ]);
      store.set(pendingFieldFeedbacksAtom, [
        { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Test' },
      ]);
      store.set(pendingRevisionFieldsAtom, ['threat_type_l1']);

      const { result, rerender } = renderHook(
        ({ itemId }) => useReview(itemId),
        { wrapper: Wrapper, initialProps: { itemId: 123 as number | null } }
      );

      // Verify initial state is present
      expect(result.current.decisions).toHaveLength(1);
      expect(result.current.pendingFeedbacks).toHaveLength(1);

      // Change to a different item
      rerender({ itemId: 456 });

      // State should be reset
      expect(result.current.decisions).toEqual([]);
      expect(result.current.pendingFeedbacks).toEqual([]);
      expect(result.current.pendingRevisionFields).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('should set loading during all async operations', async () => {
      const mockApiClient = createMockApiClient();

      // Create deferred promises for each operation
      let resolveHistory: () => void;
      let resolveApprove: () => void;
      let resolveReject: () => void;
      let resolveRevision: () => void;
      let resolveResubmit: () => void;

      mockApiClient.getReviewHistory.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveHistory = () => resolve({
            labeling_item: 123,
            decisions: [],
            current_status: null,
            pending_revision_fields: [],
          });
        })
      );
      mockApiClient.approveItem.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveApprove = () => resolve(createMockDecision(1, 123, 'approved', 'Approved'));
        })
      );
      mockApiClient.rejectItem.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveReject = () => resolve(createMockDecision(2, 123, 'rejected_partial', 'Rejected', []));
        })
      );
      mockApiClient.requestRevision.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRevision = () => resolve(createMockDecision(3, 123, 'revision_requested', 'Revision', []));
        })
      );
      mockApiClient.resubmitItem.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveResubmit = () => resolve({ id: 123, status: 'submitted' } as LabelingItem);
        })
      );

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      // Test fetchHistory
      act(() => {
        result.current.fetchHistory(123);
      });
      expect(result.current.loading).toBe(true);
      await act(async () => {
        resolveHistory!();
      });
      expect(result.current.loading).toBe(false);

      // Test approve
      act(() => {
        result.current.approve(123);
      });
      expect(result.current.loading).toBe(true);
      await act(async () => {
        resolveApprove!();
      });
      expect(result.current.loading).toBe(false);

      // Test reject
      act(() => {
        result.current.reject(123, { status: 'rejected_partial', comment: 'Test', field_feedbacks: [] });
      });
      expect(result.current.loading).toBe(true);
      await act(async () => {
        resolveReject!();
      });
      expect(result.current.loading).toBe(false);

      // Test requestRevision
      act(() => {
        result.current.requestRevision(123, { comment: 'Test', field_feedbacks: [] });
      });
      expect(result.current.loading).toBe(true);
      await act(async () => {
        resolveRevision!();
      });
      expect(result.current.loading).toBe(false);

      // Test resubmit
      act(() => {
        result.current.resubmit(123);
      });
      expect(result.current.loading).toBe(true);
      await act(async () => {
        resolveResubmit!();
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Multiple Decisions', () => {
    it('should accumulate multiple review decisions', async () => {
      const mockApiClient = createMockApiClient();
      const decision1 = createMockDecision(1, 123, 'rejected_partial', 'First rejection', [
        {
          id: 1,
          labeling_item: 123,
          review_decision: 1,
          field_name: 'threat_type_l1',
          feedback_type: 'partial',
          feedback_comment: 'Fix this',
          reviewed_by: 1,
          reviewed_at: new Date().toISOString(),
        },
      ]);
      const decision2 = createMockDecision(2, 123, 'approved', 'Fixed and approved');

      mockApiClient.rejectItem.mockResolvedValueOnce(decision1);
      mockApiClient.approveItem.mockResolvedValueOnce(decision2);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      // First: Reject with revision request
      await act(async () => {
        await result.current.reject(123, {
          status: 'rejected_partial',
          comment: 'First rejection',
          field_feedbacks: [
            { field_name: 'threat_type_l1', feedback_type: 'partial', feedback_comment: 'Fix this' },
          ],
        });
      });

      expect(result.current.decisions).toHaveLength(1);

      // Second: Approve after fixes
      await act(async () => {
        await result.current.approve(123, 'Fixed and approved');
      });

      expect(result.current.decisions).toHaveLength(2);
      expect(result.current.decisions[0].status).toBe('rejected_partial');
      expect(result.current.decisions[1].status).toBe('approved');
    });
  });

  describe('404 Error Handling', () => {
    it('should track failed item ID when getReviewHistory returns 404', async () => {
      const mockApiClient = createMockApiClient();
      const { Wrapper, store } = createWrapper(mockApiClient);
      const labelingItemId = 999;

      // Mock 404 error
      const notFoundError = new Error('Not found');
      (notFoundError as any).response = { status: 404 };
      mockApiClient.getReviewHistory.mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useReview(labelingItemId), { wrapper: Wrapper });

      // Attempt to fetch history
      await act(async () => {
        try {
          await result.current.fetchHistory(labelingItemId);
        } catch (e) {
          // Should NOT throw for 404
          throw new Error('fetchHistory should not throw for 404 errors');
        }
      });

      // Check that the item ID was tracked as failed
      const failedIds = store.get(failedItemIdsAtom);
      expect(failedIds.has(999)).toBe(true);
    });

    it('should NOT call toast error for 404 responses', async () => {
      const mockApiClient = createMockApiClient();
      const mockHandleApiError = jest.fn();

      // Override useApiErrorToast mock for this test
      jest.spyOn(require('../use-api-error-toast.hook'), 'useApiErrorToast').mockReturnValue({
        handleApiError: mockHandleApiError,
        withErrorToast: jest.fn(),
      });

      const { Wrapper } = createWrapper(mockApiClient);

      const notFoundError = new Error('Not found');
      (notFoundError as any).response = { status: 404 };
      mockApiClient.getReviewHistory.mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useReview(999), { wrapper: Wrapper });

      await act(async () => {
        await result.current.fetchHistory(999);
      });

      // Should NOT show error toast for 404
      expect(mockHandleApiError).not.toHaveBeenCalled();
    });

    it('should still throw and show toast for non-404 errors', async () => {
      const mockApiClient = createMockApiClient();
      const serverError = new Error('Internal Server Error');
      (serverError as any).response = { status: 500 };
      mockApiClient.getReviewHistory.mockRejectedValueOnce(serverError);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      await act(async () => {
        await expect(result.current.fetchHistory(123)).rejects.toThrow('Internal Server Error');
      });

      // Error should be set
      expect(result.current.error).toBeTruthy();
    });

    it('should clear failed ID when item is successfully fetched', async () => {
      const mockApiClient = createMockApiClient();
      const { Wrapper, store } = createWrapper(mockApiClient);
      const labelingItemId = 888;

      // First, add item to failed set manually
      store.set(failedItemIdsAtom, new Set([888]));

      // Mock successful response
      const mockResponse: ReviewHistoryResponse = {
        labeling_item: labelingItemId,
        decisions: [],
        current_status: null,
        pending_revision_fields: [],
      };
      mockApiClient.getReviewHistory.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useReview(labelingItemId), { wrapper: Wrapper });

      await act(async () => {
        await result.current.fetchHistory(labelingItemId);
      });

      // Failed ID should be removed on success
      const failedIds = store.get(failedItemIdsAtom);
      expect(failedIds.has(888)).toBe(false);
    });

    it('should return failedItemIds in the hook result', () => {
      const mockApiClient = createMockApiClient();
      const { Wrapper, store } = createWrapper(mockApiClient);

      // Set up some failed IDs
      store.set(failedItemIdsAtom, new Set([111, 222]));

      const { result } = renderHook(() => useReview(123), { wrapper: Wrapper });

      // Hook should expose failedItemIds
      expect(result.current.failedItemIds).toBeInstanceOf(Set);
      expect(result.current.failedItemIds.has(111)).toBe(true);
      expect(result.current.failedItemIds.has(222)).toBe(true);
    });
  });
});
