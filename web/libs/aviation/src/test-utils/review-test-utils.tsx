/**
 * Shared test utilities for review integration testing.
 *
 * Provides helper functions and mock context creators for testing
 * review-related functionality across the aviation module.
 *
 * @module test-utils/review-test-utils
 */
import { type FC, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import type { UserRole, FieldFeedbackInput, ReviewableFieldName } from '../types';
import { ReviewContextProvider } from '../context/ReviewContext';

/**
 * Interface for review test context with all required properties
 * for testing review-related components and hooks.
 */
export interface ReviewTestContext {
  /** Current user's role for permission checks */
  userRole: UserRole;
  /** Whether the UI is in review mode (manager/admin reviewing) */
  isReviewMode: boolean;
  /** Array of pending field feedbacks not yet submitted */
  pendingFeedbacks: FieldFeedbackInput[];
  /** Mock function for approving a field/item */
  onApprove: jest.Mock;
  /** Mock function for rejecting a field/item */
  onReject: jest.Mock;
  /** Mock function for requesting revision on a field/item */
  onRequestRevision: jest.Mock;
  /** Mock function for clearing the status of a field/item */
  onClearStatus: jest.Mock;
}

/**
 * Creates a mock review context with sensible defaults.
 * All callbacks are Jest mock functions that can be asserted against.
 *
 * @param overrides - Partial context to override default values
 * @returns Complete ReviewTestContext with mocked functions
 *
 * @example
 * ```typescript
 * const context = createMockReviewContext({ userRole: 'manager', isReviewMode: true });
 * expect(context.isReviewMode).toBe(true);
 *
 * context.onApprove();
 * expect(context.onApprove).toHaveBeenCalled();
 * ```
 */
export const createMockReviewContext = (
  overrides: Partial<ReviewTestContext> = {}
): ReviewTestContext => ({
  userRole: 'annotator',
  isReviewMode: false,
  pendingFeedbacks: [],
  onApprove: jest.fn(),
  onReject: jest.fn(),
  onRequestRevision: jest.fn(),
  onClearStatus: jest.fn(),
  ...overrides,
});

/**
 * Options for creating a review test wrapper component.
 */
export interface CreateReviewTestWrapperOptions {
  /** User role to simulate (default: 'annotator') */
  userRole?: UserRole;
  /** Whether review mode is enabled (default: false) */
  isReviewMode?: boolean;
  /** Pending field feedbacks (default: []) */
  pendingFeedbacks?: FieldFeedbackInput[];
  /** Mock function for approving a field */
  onFieldApprove?: (fieldName: ReviewableFieldName) => void;
  /** Mock function for rejecting a field */
  onFieldReject?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Mock function for requesting revision on a field */
  onFieldRequestRevision?: (fieldName: ReviewableFieldName, comment?: string) => void;
  /** Mock function for clearing a field status */
  onFieldClearStatus?: (fieldName: ReviewableFieldName) => void;
}

/**
 * Creates a React wrapper component for testing review-related functionality.
 * The wrapper provides the ReviewContextProvider for review features.
 *
 * @param options - Configuration options for the wrapper
 * @returns A React functional component that wraps children with ReviewContextProvider
 *
 * @example
 * ```typescript
 * const Wrapper = createReviewTestWrapper({ userRole: 'manager', isReviewMode: true });
 * render(<ComponentUnderTest />, { wrapper: Wrapper });
 * ```
 */
export const createReviewTestWrapper = (
  options: CreateReviewTestWrapperOptions = {}
): FC<{ children: ReactNode }> => {
  const {
    userRole = 'annotator',
    isReviewMode = false,
    pendingFeedbacks = [],
    onFieldApprove,
    onFieldReject,
    onFieldRequestRevision,
    onFieldClearStatus,
  } = options;

  /**
   * Test wrapper component that provides review context to children.
   * Uses the actual ReviewContextProvider with configurable options.
   */
  const TestWrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <ReviewContextProvider
      userRole={userRole}
      isReviewMode={isReviewMode}
      pendingFeedbacks={pendingFeedbacks}
      onFieldApprove={onFieldApprove}
      onFieldReject={onFieldReject}
      onFieldRequestRevision={onFieldRequestRevision}
      onFieldClearStatus={onFieldClearStatus}
    >
      {children}
    </ReviewContextProvider>
  );

  TestWrapper.displayName = 'ReviewTestWrapper';

  return TestWrapper;
};

/**
 * Options for renderWithReviewContext, extending wrapper options
 * with standard React Testing Library render options.
 */
export interface RenderWithReviewContextOptions extends CreateReviewTestWrapperOptions {
  /** Additional render options passed to RTL render function */
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

/**
 * Renders a React component with review context for testing.
 * Combines createReviewTestWrapper with React Testing Library's render.
 *
 * @param ui - The React element to render
 * @param options - Wrapper and render options
 * @returns RTL render result with all query methods
 *
 * @example
 * ```typescript
 * const { getByText, container } = renderWithReviewContext(
 *   <ReviewTooltip fieldName="threat_type_l1" />,
 *   { userRole: 'manager', isReviewMode: true }
 * );
 * expect(getByText('Approve')).toBeInTheDocument();
 * ```
 */
export const renderWithReviewContext = (
  ui: ReactNode,
  options: RenderWithReviewContextOptions = {}
) => {
  const { renderOptions, ...wrapperOptions } = options;
  const wrapper = createReviewTestWrapper(wrapperOptions);
  return render(ui as React.ReactElement, { wrapper, ...renderOptions });
};
