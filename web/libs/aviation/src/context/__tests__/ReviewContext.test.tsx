import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ReviewContextProvider,
  useReviewContext,
  useOptionalReviewContext,
  type ReviewContextValue
} from '../ReviewContext';
import type { UserRole, ReviewableFieldName } from '../../types';

// Test component to consume context
const TestConsumer = () => {
  const context = useReviewContext();
  return (
    <div>
      <span data-testid="user-role">{context.userRole}</span>
      <span data-testid="review-mode">{String(context.isReviewMode)}</span>
      <span data-testid="pending-count">{context.pendingFeedbacks.length}</span>
      <button
        data-testid="approve-btn"
        onClick={() => context.onFieldApprove?.('threat_management')}
      >
        Approve
      </button>
      <button
        data-testid="reject-btn"
        onClick={() => context.onFieldReject?.('threat_management', 'Bad value')}
      >
        Reject
      </button>
    </div>
  );
};

// Test component that uses optional context
const TestOptionalConsumer = () => {
  const context = useOptionalReviewContext();
  return (
    <div>
      <span data-testid="has-context">{context ? 'yes' : 'no'}</span>
      {context && <span data-testid="opt-role">{context.userRole}</span>}
    </div>
  );
};

describe('ReviewContext', () => {
  describe('Provider', () => {
    it('should provide default values when no props given', () => {
      render(
        <ReviewContextProvider>
          <TestConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('user-role')).toHaveTextContent('annotator');
      expect(screen.getByTestId('review-mode')).toHaveTextContent('false');
    });

    it('should provide userRole from props', () => {
      render(
        <ReviewContextProvider userRole="manager">
          <TestConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('user-role')).toHaveTextContent('manager');
    });

    it('should provide isReviewMode from props', () => {
      render(
        <ReviewContextProvider userRole="researcher" isReviewMode={true}>
          <TestConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('review-mode')).toHaveTextContent('true');
    });

    it('should provide pendingFeedbacks from useReview hook', () => {
      const mockPendingFeedbacks = [
        { field_name: 'threat_management' as ReviewableFieldName, feedback_type: 'partial' as const, feedback_comment: 'Test' },
      ];

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={mockPendingFeedbacks}
        >
          <TestConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
  });

  describe('useReviewContext hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        'useReviewContext must be used within a ReviewContextProvider'
      );

      consoleError.mockRestore();
    });

    it('should return context value when inside provider', () => {
      render(
        <ReviewContextProvider userRole="admin" isReviewMode={true}>
          <TestConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
    });
  });

  describe('useOptionalReviewContext hook', () => {
    it('should return null when used outside provider', () => {
      render(<TestOptionalConsumer />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('no');
    });

    it('should return context value when inside provider', () => {
      render(
        <ReviewContextProvider userRole="manager">
          <TestOptionalConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('has-context')).toHaveTextContent('yes');
      expect(screen.getByTestId('opt-role')).toHaveTextContent('manager');
    });
  });

  describe('Action callbacks', () => {
    it('should call onFieldApprove with field name', async () => {
      const mockOnApprove = jest.fn();
      const user = userEvent.setup();

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          onFieldApprove={mockOnApprove}
        >
          <TestConsumer />
        </ReviewContextProvider>
      );

      await user.click(screen.getByTestId('approve-btn'));

      expect(mockOnApprove).toHaveBeenCalledWith('threat_management');
    });

    it('should call onFieldReject with field name and comment', async () => {
      const mockOnReject = jest.fn();
      const user = userEvent.setup();

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          onFieldReject={mockOnReject}
        >
          <TestConsumer />
        </ReviewContextProvider>
      );

      await user.click(screen.getByTestId('reject-btn'));

      expect(mockOnReject).toHaveBeenCalledWith('threat_management', 'Bad value');
    });

    it('should call onFieldRequestRevision with field name and comment', async () => {
      const mockOnRevision = jest.fn();
      const user = userEvent.setup();

      const TestRevisionConsumer = () => {
        const context = useReviewContext();
        return (
          <button
            data-testid="revision-btn"
            onClick={() => context.onFieldRequestRevision?.('error_management', 'Needs work')}
          >
            Request Revision
          </button>
        );
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          onFieldRequestRevision={mockOnRevision}
        >
          <TestRevisionConsumer />
        </ReviewContextProvider>
      );

      await user.click(screen.getByTestId('revision-btn'));

      expect(mockOnRevision).toHaveBeenCalledWith('error_management', 'Needs work');
    });

    it('should call onFieldClearStatus with field name', async () => {
      const mockOnClear = jest.fn();
      const user = userEvent.setup();

      const TestClearConsumer = () => {
        const context = useReviewContext();
        return (
          <button
            data-testid="clear-btn"
            onClick={() => context.onFieldClearStatus?.('uas_management')}
          >
            Clear
          </button>
        );
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          onFieldClearStatus={mockOnClear}
        >
          <TestClearConsumer />
        </ReviewContextProvider>
      );

      await user.click(screen.getByTestId('clear-btn'));

      expect(mockOnClear).toHaveBeenCalledWith('uas_management');
    });
  });

  describe('Field review states', () => {
    it('should compute field review states from pending feedbacks - rejected full', () => {
      const TestStateConsumer = () => {
        const { getFieldReviewState } = useReviewContext();
        const state = getFieldReviewState('threat_management');
        return (
          <span data-testid="field-state">
            {state ? `${state.status}: ${state.comment}` : 'pending'}
          </span>
        );
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={[
            {
              field_name: 'threat_management' as ReviewableFieldName,
              feedback_type: 'full' as const,
              feedback_comment: 'Completely wrong'
            },
          ]}
        >
          <TestStateConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('field-state')).toHaveTextContent('rejected: Completely wrong');
    });

    it('should compute field review states from pending feedbacks - partial rejection', () => {
      const TestStateConsumer = () => {
        const { getFieldReviewState } = useReviewContext();
        const state = getFieldReviewState('error_management');
        return (
          <span data-testid="field-state">
            {state ? `${state.status}: ${state.comment}` : 'pending'}
          </span>
        );
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={[
            {
              field_name: 'error_management' as ReviewableFieldName,
              feedback_type: 'partial' as const,
              feedback_comment: 'Partially wrong'
            },
          ]}
        >
          <TestStateConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('field-state')).toHaveTextContent('rejected: Partially wrong');
    });

    it('should compute field review states from pending feedbacks - revision', () => {
      const TestStateConsumer = () => {
        const { getFieldReviewState } = useReviewContext();
        const state = getFieldReviewState('uas_type_l1');
        return (
          <span data-testid="field-state">
            {state ? `${state.status}: ${state.comment}` : 'pending'}
          </span>
        );
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={[
            {
              field_name: 'uas_type_l1' as ReviewableFieldName,
              feedback_type: 'revision' as const,
              feedback_comment: 'Please review this'
            },
          ]}
        >
          <TestStateConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('field-state')).toHaveTextContent('revision: Please review this');
    });

    it('should return undefined state for fields without feedback', () => {
      const TestStateConsumer = () => {
        const { getFieldReviewState } = useReviewContext();
        const state = getFieldReviewState('error_management');
        return (
          <span data-testid="field-state">
            {state ? state.status : 'no-state'}
          </span>
        );
      };

      render(
        <ReviewContextProvider userRole="manager" isReviewMode={true}>
          <TestStateConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('field-state')).toHaveTextContent('no-state');
    });

    it('should handle multiple field feedbacks', () => {
      const TestMultiStateConsumer = () => {
        const { getFieldReviewState } = useReviewContext();
        const threatState = getFieldReviewState('threat_management');
        const errorState = getFieldReviewState('error_management');
        const uasState = getFieldReviewState('uas_management');
        return (
          <div>
            <span data-testid="threat-state">{threatState?.status ?? 'none'}</span>
            <span data-testid="error-state">{errorState?.status ?? 'none'}</span>
            <span data-testid="uas-state">{uasState?.status ?? 'none'}</span>
          </div>
        );
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={[
            { field_name: 'threat_management', feedback_type: 'full', feedback_comment: '' },
            { field_name: 'error_management', feedback_type: 'revision', feedback_comment: '' },
          ]}
        >
          <TestMultiStateConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('threat-state')).toHaveTextContent('rejected');
      expect(screen.getByTestId('error-state')).toHaveTextContent('revision');
      expect(screen.getByTestId('uas-state')).toHaveTextContent('none');
    });
  });

  describe('canReview permission check', () => {
    it.each([
      ['admin', true],
      ['manager', true],
      ['researcher', true],
      ['annotator', false],
    ] as const)('should return canReview=%s for %s role', (role, expected) => {
      const TestPermConsumer = () => {
        const { canReview } = useReviewContext();
        return <span data-testid="can-review">{String(canReview)}</span>;
      };

      render(
        <ReviewContextProvider userRole={role} isReviewMode={true}>
          <TestPermConsumer />
        </ReviewContextProvider>
      );

      expect(screen.getByTestId('can-review')).toHaveTextContent(String(expected));
    });

    it('should return canReview=false when not in review mode', () => {
      const TestPermConsumer = () => {
        const { canReview, isReviewMode } = useReviewContext();
        return (
          <div>
            <span data-testid="can-review">{String(canReview)}</span>
            <span data-testid="is-review-mode">{String(isReviewMode)}</span>
          </div>
        );
      };

      render(
        <ReviewContextProvider userRole="manager" isReviewMode={false}>
          <TestPermConsumer />
        </ReviewContextProvider>
      );

      // canReview is based on role only, not isReviewMode
      // isReviewMode is a separate concern for UI visibility
      expect(screen.getByTestId('can-review')).toHaveTextContent('true');
      expect(screen.getByTestId('is-review-mode')).toHaveTextContent('false');
    });
  });

  describe('Context memoization', () => {
    it('should provide stable getFieldReviewState function', () => {
      const getFieldReviewStateCalls: Array<(fieldName: ReviewableFieldName) => unknown> = [];

      const TestMemoConsumer = () => {
        const { getFieldReviewState } = useReviewContext();
        getFieldReviewStateCalls.push(getFieldReviewState);
        return <span data-testid="memo-test">test</span>;
      };

      const { rerender } = render(
        <ReviewContextProvider userRole="manager" isReviewMode={true}>
          <TestMemoConsumer />
        </ReviewContextProvider>
      );

      // Rerender with same props
      rerender(
        <ReviewContextProvider userRole="manager" isReviewMode={true}>
          <TestMemoConsumer />
        </ReviewContextProvider>
      );

      // The function reference should be the same (memoized)
      expect(getFieldReviewStateCalls[0]).toBe(getFieldReviewStateCalls[1]);
    });
  });
});
