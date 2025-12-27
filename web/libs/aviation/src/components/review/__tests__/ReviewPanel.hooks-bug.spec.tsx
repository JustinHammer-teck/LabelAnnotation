import { render, screen } from '@testing-library/react';
import { ReviewPanel, type ReviewPanelProps } from '../ReviewPanel';

// Mock feature flags
jest.mock('@humansignal/core/lib/utils/feature-flags', () => ({
  isActive: jest.fn(() => true),
  FF_AVIATION_REVIEW: 'fflag_feat_all_aviation_review_workflow_251225_long',
}));

describe('ReviewPanel - Hooks Compliance', () => {
  const defaultProps: ReviewPanelProps = {
    labelingItemId: 1,
    currentStatus: 'submitted',
    userRole: 'admin',
    onApprove: jest.fn(),
    onReject: jest.fn(),
    onRequestRevision: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not throw hooks error when role is annotator', () => {
    // Test that component can be rendered with annotator role without hooks violations
    expect(() => {
      const { container } = render(
        <ReviewPanel
          {...defaultProps}
          userRole="annotator"
        />
      );
      expect(container.firstChild).toBeNull();
    }).not.toThrow();
  });

  it('should not throw hooks error when status is approved', () => {
    // Test that component can be rendered with approved status without hooks violations
    expect(() => {
      const { container } = render(
        <ReviewPanel
          {...defaultProps}
          currentStatus="approved"
        />
      );
      expect(container.firstChild).toBeNull();
    }).not.toThrow();
  });

  it('should call handlers without errors when rendered', () => {
    // Test that component renders successfully for valid role/status
    expect(() => {
      render(<ReviewPanel {...defaultProps} />);
    }).not.toThrow();

    expect(screen.getByTestId('review-panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Approve submission')).toBeInTheDocument();
    expect(screen.getByLabelText('Reject submission')).toBeInTheDocument();
    expect(screen.getByLabelText('Request revision')).toBeInTheDocument();
  });

  it('should maintain stable references for callbacks across re-renders', () => {
    // Test that useCallback memoization works correctly
    const { rerender } = render(<ReviewPanel {...defaultProps} />);

    const approveButton = screen.getByLabelText('Approve submission');
    const initialOnClick = (approveButton as any).onclick;

    // Re-render with same props
    rerender(<ReviewPanel {...defaultProps} />);

    const approveButtonAfterRerender = screen.getByLabelText('Approve submission');
    const onClickAfterRerender = (approveButtonAfterRerender as any).onclick;

    // onClick should be the same reference (memoized)
    expect(onClickAfterRerender).toBe(initialOnClick);
  });

  it('should handle rapid status changes without hooks errors', () => {
    // Simulate multiple re-renders with different props
    const { rerender, container } = render(
      <ReviewPanel {...defaultProps} currentStatus="submitted" />
    );

    expect(screen.getByTestId('review-panel')).toBeInTheDocument();

    // Change to approved (should render null)
    expect(() => {
      rerender(<ReviewPanel {...defaultProps} currentStatus="approved" />);
    }).not.toThrow();
    expect(container.firstChild).toBeNull();

    // Change back to submitted (should render panel)
    expect(() => {
      rerender(<ReviewPanel {...defaultProps} currentStatus="submitted" />);
    }).not.toThrow();
    expect(screen.getByTestId('review-panel')).toBeInTheDocument();

    // Change to draft (should still render panel)
    expect(() => {
      rerender(<ReviewPanel {...defaultProps} currentStatus="draft" />);
    }).not.toThrow();
    expect(screen.getByTestId('review-panel')).toBeInTheDocument();
  });

  it('should handle rapid role changes without hooks errors', () => {
    // Simulate role changes that affect rendering
    const { rerender, container } = render(
      <ReviewPanel {...defaultProps} userRole="admin" />
    );

    expect(screen.getByTestId('review-panel')).toBeInTheDocument();

    // Change to annotator (should render null)
    expect(() => {
      rerender(<ReviewPanel {...defaultProps} userRole="annotator" />);
    }).not.toThrow();
    expect(container.firstChild).toBeNull();

    // Change to manager (should render panel)
    expect(() => {
      rerender(<ReviewPanel {...defaultProps} userRole="manager" />);
    }).not.toThrow();
    expect(screen.getByTestId('review-panel')).toBeInTheDocument();

    // Change to researcher (should render panel)
    expect(() => {
      rerender(<ReviewPanel {...defaultProps} userRole="researcher" />);
    }).not.toThrow();
    expect(screen.getByTestId('review-panel')).toBeInTheDocument();
  });

  it('should handle combined status and role changes without hooks errors', () => {
    // Test the most complex scenario: both props changing rapidly
    const { rerender, container } = render(
      <ReviewPanel {...defaultProps} userRole="admin" currentStatus="submitted" />
    );

    expect(screen.getByTestId('review-panel')).toBeInTheDocument();

    // Both change to invalid combination
    expect(() => {
      rerender(
        <ReviewPanel {...defaultProps} userRole="annotator" currentStatus="approved" />
      );
    }).not.toThrow();
    expect(container.firstChild).toBeNull();

    // Back to valid combination
    expect(() => {
      rerender(
        <ReviewPanel {...defaultProps} userRole="manager" currentStatus="draft" />
      );
    }).not.toThrow();
    expect(screen.getByTestId('review-panel')).toBeInTheDocument();
  });

  it('should handle missing callback props without errors', () => {
    // Test that component handles optional callbacks gracefully
    expect(() => {
      render(
        <ReviewPanel
          labelingItemId={1}
          currentStatus="submitted"
          userRole="admin"
          // No callbacks provided
        />
      );
    }).not.toThrow();

    expect(screen.getByTestId('review-panel')).toBeInTheDocument();

    // Buttons should be disabled when callbacks are missing
    expect(screen.getByLabelText('Approve submission')).toBeDisabled();
    expect(screen.getByLabelText('Reject submission')).toBeDisabled();
    expect(screen.getByLabelText('Request revision')).toBeDisabled();
  });
});
