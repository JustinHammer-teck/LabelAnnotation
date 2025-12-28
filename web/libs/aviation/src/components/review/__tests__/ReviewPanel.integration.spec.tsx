import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { ReviewPanel } from '../ReviewPanel';
import { ReviewHistory } from '../ReviewHistory';
import { AviationApiContext } from '../../../api/context';
import type { AviationApiClient } from '../../../api/api-client';
import {
  reviewDecisionsAtom,
  reviewLoadingAtom,
  reviewErrorAtom,
  pendingFieldFeedbacksAtom,
  pendingRevisionFieldsAtom,
  currentReviewItemIdAtom,
} from '../../../stores/review.store';
import type {
  ReviewDecision,
  RejectRequest,
  RevisionRequest,
  ReviewHistoryResponse,
  FieldFeedback,
} from '../../../types/review.types';
import type { LabelingItem } from '../../../types';
import {
  createMockReviewDecision,
  createMockFieldFeedback,
  createMockReviewHistory,
  MOCK_REVIEW_DECISION_APPROVED,
  MOCK_REVIEW_DECISION_REJECTED_PARTIAL,
  MOCK_REVIEW_DECISION_REVISION_REQUESTED,
  MOCK_REVIEW_HISTORY_MULTI_CYCLE,
  MOCK_REVIEW_HISTORY_PENDING_REVISION,
} from '../../../__mocks__/review.mocks';

/**
 * Integration tests for ReviewPanel component.
 * Tests the complete approval/rejection/revision workflow with mocked API.
 */

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a mock API client with jest mocks for all review methods.
 */
const createMockApiClient = (): jest.Mocked<
  Pick<
    AviationApiClient,
    'approveItem' | 'rejectItem' | 'requestRevision' | 'resubmitItem' | 'getReviewHistory'
  >
> &
  Partial<AviationApiClient> => ({
  approveItem: jest.fn(),
  rejectItem: jest.fn(),
  requestRevision: jest.fn(),
  resubmitItem: jest.fn(),
  getReviewHistory: jest.fn(),
});

/**
 * Creates a Jotai provider wrapper for testing with API client context.
 */
const createWrapper = (mockApiClient?: Partial<AviationApiClient>) => {
  const store = createStore();
  const apiClient = mockApiClient ?? createMockApiClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AviationApiContext.Provider value={apiClient as AviationApiClient}>
      <Provider store={store}>{children}</Provider>
    </AviationApiContext.Provider>
  );
  return {
    Wrapper,
    store,
    apiClient: apiClient as jest.Mocked<
      Pick<
        AviationApiClient,
        'approveItem' | 'rejectItem' | 'requestRevision' | 'resubmitItem' | 'getReviewHistory'
      >
    >,
  };
};

/**
 * Helper to create a mock labeling item.
 */
const createMockLabelingItem = (
  overrides: Partial<LabelingItem> = {}
): LabelingItem =>
  ({
    id: 123,
    event: 1,
    sequence_number: 1,
    status: 'submitted',
    threat_type_l1: null,
    threat_type_l2: null,
    threat_type_l3: null,
    threat_management: null,
    threat_impact: null,
    threat_coping_abilities: null,
    error_type_l1: null,
    error_type_l2: null,
    error_type_l3: null,
    error_management: null,
    error_impact: null,
    error_coping_abilities: null,
    uas_applicable: false,
    uas_type_l1: null,
    uas_type_l2: null,
    uas_type_l3: null,
    uas_management: null,
    uas_impact: null,
    uas_coping_abilities: null,
    calculated_threat_topics: [],
    calculated_error_topics: [],
    calculated_uas_topics: [],
    linked_result_id: null,
    ...overrides,
  } as LabelingItem);

// =============================================================================
// Test Suite: ReviewPanel Integration
// =============================================================================

describe('ReviewPanel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log from ReviewPanel debug statements
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Approval Flow Tests
  // ---------------------------------------------------------------------------

  describe('Approval Flow', () => {
    it('should render approval button for admin users with submitted status', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('review-panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });

    it('should render approval button for researcher users', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="researcher"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('review-panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });

    it('should not render for annotator users', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="annotator"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
    });

    it('should call onApprove when approve button is clicked', async () => {
      const onApprove = jest.fn().mockResolvedValue(undefined);
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={onApprove}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await userEvent.click(approveButton);

      expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during approval', async () => {
      let resolveApproval: () => void;
      const onApprove = jest.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolveApproval = resolve;
        })
      );
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={onApprove}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      // Check loading text appears
      await waitFor(() => {
        expect(screen.getByText(/approving/i)).toBeInTheDocument();
      });

      // Resolve the promise
      await waitFor(() => {
        resolveApproval!();
      });

      // Check loading text is removed
      await waitFor(() => {
        expect(screen.getByText(/^approve$/i)).toBeInTheDocument();
      });
    });

    it('should disable all buttons during approval action', async () => {
      let resolveApproval: () => void;
      const onApprove = jest.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolveApproval = resolve;
        })
      );
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={onApprove}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      // All buttons should be disabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toBeDisabled();
        });
      });

      // Resolve and check buttons are re-enabled
      await waitFor(() => {
        resolveApproval!();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve/i })).not.toBeDisabled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rejection Flow Tests
  // ---------------------------------------------------------------------------

  describe('Rejection Flow', () => {
    it('should render reject button for reviewer users', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('should call onReject when reject button is clicked', async () => {
      const onReject = jest.fn().mockResolvedValue(undefined);
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={onReject}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await userEvent.click(rejectButton);

      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during rejection', async () => {
      let resolveRejection: () => void;
      const onReject = jest.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolveRejection = resolve;
        })
      );
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={onReject}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      // Check loading text appears
      await waitFor(() => {
        expect(screen.getByText(/rejecting/i)).toBeInTheDocument();
      });

      // Resolve the promise
      await waitFor(() => {
        resolveRejection!();
      });

      // Check loading text is removed
      await waitFor(() => {
        expect(screen.getByText(/^reject$/i)).toBeInTheDocument();
      });
    });

    it('should display field feedbacks after rejection in ReviewHistory', async () => {
      const mockApiClient = createMockApiClient();
      const { Wrapper, store } = createWrapper(mockApiClient);

      // Pre-populate with a rejection decision
      const rejectionDecision = createMockReviewDecision({
        id: 1,
        labeling_item: 123,
        status: 'rejected_partial',
        reviewer_comment: 'Some fields need work',
        field_feedbacks: [
          createMockFieldFeedback({
            id: 1,
            field_name: 'threat_type_l1',
            feedback_type: 'partial',
            feedback_comment: 'Wrong threat type selected',
          }),
          createMockFieldFeedback({
            id: 2,
            field_name: 'error_management',
            feedback_type: 'full',
            feedback_comment: 'Management classification incorrect',
          }),
        ],
      });

      render(
        <Wrapper>
          <ReviewHistory
            labelingItemId={123}
            decisions={[rejectionDecision]}
            loading={false}
          />
        </Wrapper>
      );

      // Check the history panel renders
      expect(screen.getByTestId('review-history')).toBeInTheDocument();

      // Check the decision is displayed
      expect(screen.getByText(/partially rejected/i)).toBeInTheDocument();
      expect(screen.getByText(/some fields need work/i)).toBeInTheDocument();

      // Check field feedbacks are visible (first item is expanded by default)
      expect(screen.getByText('threat_type_l1')).toBeInTheDocument();
      expect(screen.getByText('error_management')).toBeInTheDocument();
      expect(screen.getByText('Wrong threat type selected')).toBeInTheDocument();
      expect(screen.getByText('Management classification incorrect')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Request Revision Flow Tests
  // ---------------------------------------------------------------------------

  describe('Request Revision Flow', () => {
    it('should render request revision button for reviewer users', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.getByRole('button', { name: /request revision/i })).toBeInTheDocument();
    });

    it('should call onRequestRevision when revision button is clicked', async () => {
      const onRequestRevision = jest.fn().mockResolvedValue(undefined);
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={onRequestRevision}
          />
        </Wrapper>
      );

      const revisionButton = screen.getByRole('button', { name: /request revision/i });
      await userEvent.click(revisionButton);

      expect(onRequestRevision).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during revision request', async () => {
      let resolveRevision: () => void;
      const onRequestRevision = jest.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolveRevision = resolve;
        })
      );
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={onRequestRevision}
          />
        </Wrapper>
      );

      const revisionButton = screen.getByRole('button', { name: /request revision/i });
      fireEvent.click(revisionButton);

      // Check loading text appears
      await waitFor(() => {
        expect(screen.getByText(/requesting/i)).toBeInTheDocument();
      });

      // Resolve the promise
      await waitFor(() => {
        resolveRevision!();
      });

      // Check loading text is removed
      await waitFor(() => {
        expect(screen.getByText(/request revision/i)).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Review History Display Tests
  // ---------------------------------------------------------------------------

  describe('Review History Display', () => {
    it('should display empty state when no decisions', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByTestId('review-history')).toBeInTheDocument();
      expect(screen.getByText(/no review history available/i)).toBeInTheDocument();
    });

    it('should display loading state', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[]} loading={true} />
        </Wrapper>
      );

      expect(screen.getByText(/loading review history/i)).toBeInTheDocument();
    });

    it('should display multiple decisions in chronological order (newest first)', () => {
      const { Wrapper } = createWrapper();

      const decisions: ReviewDecision[] = [
        createMockReviewDecision({
          id: 1,
          status: 'rejected_partial',
          reviewer_comment: 'First review - needs work',
          created_at: '2025-01-10T10:00:00Z',
        }),
        createMockReviewDecision({
          id: 2,
          status: 'revision_requested',
          reviewer_comment: 'Second review - minor fixes',
          created_at: '2025-01-12T14:00:00Z',
        }),
        createMockReviewDecision({
          id: 3,
          status: 'approved',
          reviewer_comment: 'Third review - approved',
          created_at: '2025-01-14T09:00:00Z',
        }),
      ];

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={decisions} loading={false} />
        </Wrapper>
      );

      // Check all decisions are displayed
      expect(screen.getByText('3 decision(s)')).toBeInTheDocument();
      // Use getAllBy since "approved" text appears in both status badge and comment
      expect(screen.getAllByText(/approved/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/revision requested/i)).toBeInTheDocument();
      expect(screen.getByText(/partially rejected/i)).toBeInTheDocument();

      // Verify the timeline order - newest should be first in the DOM
      const timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems).toHaveLength(3);

      // The first item should have the "Approved" status badge (newest)
      expect(within(timelineItems[0]).getByText('Approved')).toBeInTheDocument();
    });

    it('should display field feedbacks for each decision', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'rejected_partial',
        reviewer_comment: 'Some issues found',
        field_feedbacks: [
          createMockFieldFeedback({
            id: 1,
            field_name: 'threat_type_l1',
            feedback_type: 'partial',
            feedback_comment: 'Threat type needs refinement',
          }),
          createMockFieldFeedback({
            id: 2,
            field_name: 'error_description',
            feedback_type: 'revision',
            feedback_comment: 'Add more details',
          }),
        ],
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      // Field feedbacks should be visible (first item expanded by default)
      expect(screen.getByText('threat_type_l1')).toBeInTheDocument();
      expect(screen.getByText('error_description')).toBeInTheDocument();
      expect(screen.getByText('Threat type needs refinement')).toBeInTheDocument();
      expect(screen.getByText('Add more details')).toBeInTheDocument();
    });

    it('should show reviewer name and timestamp', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        reviewer_name: 'Dr. Sarah Chen',
        created_at: new Date().toISOString(), // Current time = "just now"
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('Dr. Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should expand/collapse field feedbacks on click', async () => {
      const { Wrapper } = createWrapper();

      const decisions = [
        createMockReviewDecision({
          id: 1,
          status: 'rejected_partial',
          created_at: '2025-01-14T10:00:00Z',
          field_feedbacks: [
            createMockFieldFeedback({
              id: 1,
              field_name: 'threat_type_l1',
              feedback_comment: 'First feedback',
            }),
          ],
        }),
        createMockReviewDecision({
          id: 2,
          status: 'revision_requested',
          created_at: '2025-01-10T10:00:00Z',
          field_feedbacks: [
            createMockFieldFeedback({
              id: 2,
              field_name: 'error_type_l2',
              feedback_comment: 'Second feedback',
            }),
          ],
        }),
      ];

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={decisions} loading={false} />
        </Wrapper>
      );

      // First item (newest) is expanded by default, second is collapsed
      expect(screen.getByText('First feedback')).toBeInTheDocument();
      expect(screen.queryByText('Second feedback')).not.toBeInTheDocument();

      // Find the button by its aria-expanded attribute (all expandable headers have role="button")
      const buttons = screen.getAllByRole('button');
      // First button is expanded (first item), second button is collapsed (second item)
      const secondItemButton = buttons.find(
        (btn) => btn.getAttribute('aria-expanded') === 'false'
      );
      expect(secondItemButton).toBeDefined();
      await userEvent.click(secondItemButton!);

      // Now both should be visible
      expect(screen.getByText('First feedback')).toBeInTheDocument();
      expect(screen.getByText('Second feedback')).toBeInTheDocument();
    });

    it('should display multi-cycle review history correctly', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewHistory
            labelingItemId={100}
            decisions={MOCK_REVIEW_HISTORY_MULTI_CYCLE.decisions}
            loading={false}
          />
        </Wrapper>
      );

      // Check all three decisions are displayed
      expect(screen.getByText('3 decision(s)')).toBeInTheDocument();

      // Check the progression is visible
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
      expect(screen.getByText(/revision requested/i)).toBeInTheDocument();
      expect(screen.getByText(/partially rejected/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Visibility Conditions Tests
  // ---------------------------------------------------------------------------

  describe('Visibility Conditions', () => {
    it('should not render for non-submitted status (approved)', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="approved"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
    });

    it('should not render for non-submitted status (reviewed)', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="reviewed"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
    });

    it('should render for draft status during development', () => {
      // Note: This is the current development behavior
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="draft"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      // Currently renders for draft during development
      expect(screen.getByTestId('review-panel')).toBeInTheDocument();
    });

    it('should include data-item-id attribute with correct ID', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={456}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const panel = screen.getByTestId('review-panel');
      expect(panel).toHaveAttribute('data-item-id', '456');
    });
  });

  // ---------------------------------------------------------------------------
  // Button State Tests
  // ---------------------------------------------------------------------------

  describe('Button States', () => {
    it('should disable approve button when no onApprove handler', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton).toBeDisabled();
    });

    it('should disable reject button when no onReject handler', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      expect(rejectButton).toBeDisabled();
    });

    it('should disable revision button when no onRequestRevision handler', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
          />
        </Wrapper>
      );

      const revisionButton = screen.getByRole('button', { name: /request revision/i });
      expect(revisionButton).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewPanel
            labelingItemId={123}
            currentStatus="submitted"
            userRole="admin"
            onApprove={jest.fn()}
            onReject={jest.fn()}
            onRequestRevision={jest.fn()}
          />
        </Wrapper>
      );

      // aria-labels now match translated button text: "Approve", "Reject", "Request Revision"
      expect(screen.getByLabelText(/^approve$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^reject$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/request revision/i)).toBeInTheDocument();
    });

    it('should have accessible timeline in ReviewHistory', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'approved',
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(
        screen.getByRole('list', { name: /review decisions timeline/i })
      ).toBeInTheDocument();
    });

    it('should have loading status with aria-live', () => {
      const { Wrapper } = createWrapper();

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[]} loading={true} />
        </Wrapper>
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation for expandable items', async () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'rejected_partial',
        field_feedbacks: [
          createMockFieldFeedback({
            id: 1,
            field_name: 'threat_type_l1',
            feedback_comment: 'Test feedback',
          }),
        ],
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      // Find the expandable header
      const expandButton = screen.getByRole('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');

      // Press Enter to toggle
      fireEvent.keyDown(expandButton, { key: 'Enter' });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      // Press Space to toggle back
      fireEvent.keyDown(expandButton, { key: ' ' });
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // Integration with Review Decision Types
  // ---------------------------------------------------------------------------

  describe('Review Decision Status Display', () => {
    it('should display approved status correctly', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'approved',
        reviewer_comment: 'All good',
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('All good')).toBeInTheDocument();
    });

    it('should display partially rejected status correctly', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'rejected_partial',
        reviewer_comment: 'Some fields need work',
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('Partially Rejected')).toBeInTheDocument();
    });

    it('should display fully rejected status correctly', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'rejected_full',
        reviewer_comment: 'Major issues',
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('Fully Rejected')).toBeInTheDocument();
    });

    it('should display revision requested status correctly', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'revision_requested',
        reviewer_comment: 'Please revise',
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('Revision Requested')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Field Feedback Type Display
  // ---------------------------------------------------------------------------

  describe('Field Feedback Type Display', () => {
    it('should display partial feedback type', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'rejected_partial',
        field_feedbacks: [
          createMockFieldFeedback({
            id: 1,
            feedback_type: 'partial',
          }),
        ],
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('partial')).toBeInTheDocument();
    });

    it('should display full feedback type', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'rejected_full',
        field_feedbacks: [
          createMockFieldFeedback({
            id: 1,
            feedback_type: 'full',
          }),
        ],
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('full')).toBeInTheDocument();
    });

    it('should display revision feedback type', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({
        id: 1,
        status: 'revision_requested',
        field_feedbacks: [
          createMockFieldFeedback({
            id: 1,
            feedback_type: 'revision',
          }),
        ],
      });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      expect(screen.getByText('revision')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Decision Count Display
  // ---------------------------------------------------------------------------

  describe('Decision Count Display', () => {
    it('should show singular "decision" for one decision', () => {
      const { Wrapper } = createWrapper();

      const decision = createMockReviewDecision({ id: 1 });

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={[decision]} loading={false} />
        </Wrapper>
      );

      // Translation uses "{{count}} decision(s)" format
      expect(screen.getByText('1 decision(s)')).toBeInTheDocument();
    });

    it('should show plural "decisions" for multiple decisions', () => {
      const { Wrapper } = createWrapper();

      const decisions = [
        createMockReviewDecision({ id: 1 }),
        createMockReviewDecision({ id: 2 }),
        createMockReviewDecision({ id: 3 }),
      ];

      render(
        <Wrapper>
          <ReviewHistory labelingItemId={123} decisions={decisions} loading={false} />
        </Wrapper>
      );

      // Translation uses "{{count}} decision(s)" format
      expect(screen.getByText('3 decision(s)')).toBeInTheDocument();
    });
  });
});
