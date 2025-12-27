/**
 * Review Integration Tests for ResultPerformanceItem component.
 *
 * Tests the integration of ReviewableField wrappers with ResultPerformanceItem
 * to enable field-level review tooltips for Manager/Researcher users.
 *
 * Following TDD: RED -> GREEN -> REFACTOR
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultPerformanceItem } from '../ResultPerformanceItem';
import type { ResultPerformance } from '../../../../types';
import type { UserRole, ReviewableFieldName } from '../../../../types';
import type { FieldReviewState } from '../../../review/ReviewableField';

import { ReviewContextProvider } from '../../../../context';

// Mock hooks
jest.mock('../../../../hooks', () => ({
  useDropdownOptions: (category: string) => ({
    options: [
      { code: 'option1', label: 'Option 1', label_zh: 'Option 1 ZH' },
      { code: 'option2', label: 'Option 2', label_zh: 'Option 2 ZH' },
    ],
    loading: false,
  }),
}));

// Mock i18n
jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'result_performance.event_type': 'Event Type',
        'result_performance.flight_phase': 'Flight Phase',
        'result_performance.likelihood': 'Likelihood',
        'result_performance.severity': 'Severity',
        'result_performance.training_effect': 'Training Effect',
        'result_performance.training_plan': 'Training Plan',
        'result_performance.training_topics': 'Training Topics',
        'result_performance.objectives': 'Objectives',
        'result_performance.auto_summary': 'Auto Summary',
        'result_performance.threat_summary': 'Threat Summary',
        'result_performance.error_summary': 'Error Summary',
        'result_performance.competency_summary': 'Competency Summary',
        'result_performance.result_item': `Result ${params?.index ?? 0}`,
        'result_performance.select_training_topics': 'Select training topics',
        'common.delete': 'Delete',
        'placeholders.select': 'Select...',
        'placeholders.enter_training_plan': 'Enter training plan...',
        'placeholders.enter_goal': 'Enter goal...',
        'defaults.new_assessment': 'New Assessment',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
  }),
}));

// Mock common components
jest.mock('../../../common', () => ({
  Select: ({ value, onChange, options, placeholder, disabled, 'aria-label': ariaLabel }: any) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      data-testid={`select-${ariaLabel?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
      aria-label={ariaLabel}
    >
      <option value="">{placeholder}</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  MultiSelect: ({ value, onChange, options, placeholder, disabled, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid={`multi-select-${ariaLabel?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
      data-disabled={disabled}
      role="combobox"
      aria-disabled={disabled}
      aria-label={ariaLabel}
      onClick={() => !disabled && onChange(['topic1'])}
    >
      {value?.length > 0 ? value.join(', ') : placeholder}
    </div>
  ),
  TextArea: ({ value, onChange, placeholder, disabled, 'aria-label': ariaLabel }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={`textarea-${ariaLabel?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
      aria-label={ariaLabel}
    />
  ),
}));

/**
 * Creates a mock ResultPerformance object for testing.
 */
const createMockPerformance = (overrides: Partial<ResultPerformance> = {}): ResultPerformance => ({
  id: 1,
  event: 1,
  aviation_project: 1,
  event_type: '',
  flight_phase: '',
  severity: '',
  likelihood: '',
  training_effect: '',
  training_plan: '',
  training_topics: [],
  objectives: '',
  training_goals: '',
  recommendations: '',
  threat_summary: 'Auto-generated threat summary',
  error_summary: 'Auto-generated error summary',
  competency_summary: 'Auto-generated competency summary',
  linked_items: [],
  status: 'draft',
  created_by: null,
  reviewed_by: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('ResultPerformanceItem - Review Integration', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ReviewableField wrapper visibility', () => {
    it('should wrap event_type field with ReviewableField for manager users', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map(el => el.getAttribute('data-field'));

      expect(fieldNames).toContain('result_event_type');
    });

    it('should wrap all 8 editable fields with ReviewableField for researcher users', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="researcher"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map(el => el.getAttribute('data-field'));

      expect(fieldNames).toHaveLength(8);
      expect(fieldNames).toContain('result_event_type');
      expect(fieldNames).toContain('result_flight_phase');
      expect(fieldNames).toContain('result_likelihood');
      expect(fieldNames).toContain('result_severity');
      expect(fieldNames).toContain('result_training_effect');
      expect(fieldNames).toContain('result_training_plan');
      expect(fieldNames).toContain('result_training_topics');
      expect(fieldNames).toContain('result_objectives');
    });

    it('should wrap all 8 editable fields with ReviewableField for admin users', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="admin"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map(el => el.getAttribute('data-field'));

      expect(fieldNames).toHaveLength(8);
    });

    it('should NOT wrap auto-summary fields (read-only)', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map(el => el.getAttribute('data-field'));

      // Summary fields should NOT be wrapped
      expect(fieldNames).not.toContain('threat_summary');
      expect(fieldNames).not.toContain('error_summary');
      expect(fieldNames).not.toContain('competency_summary');
    });

    it('should NOT show ReviewableField wrapper for annotator users', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should NOT show ReviewableField wrapper when isReviewMode is false', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={false}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should NOT show ReviewableField wrapper when userRole is not provided', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should have collapsed styling when defaultExpanded is false', () => {
      const { container } = render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={false}
          userRole="manager"
          isReviewMode={true}
        />
      );

      // When collapsed, the container should have collapsed class
      // Note: Elements still exist in DOM but are visually hidden via CSS
      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('collapsed');

      // The reviewable fields are still in the DOM but hidden
      const reviewableFields = screen.queryAllByTestId('reviewable-field');
      expect(reviewableFields.length).toBe(8);
    });
  });

  describe('Tooltip actions', () => {
    it('should show tooltip on hover for severity field', async () => {
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const severityField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_severity');

      expect(severityField).toBeDefined();
      await user.hover(severityField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });
    });

    it('should call onFieldApprove when approve action is triggered', async () => {
      const mockOnApprove = jest.fn();
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          onFieldApprove={mockOnApprove}
        />
      );

      const trainingPlanField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_training_plan');

      await user.hover(trainingPlanField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      // Find and click the approve button (has title "Approve")
      const approveButton = screen.getByTitle('Approve');
      await user.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledWith('result_training_plan');
    });

    it('should call onFieldRequestRevision when revision is requested', async () => {
      const mockOnRevision = jest.fn();
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          onFieldRequestRevision={mockOnRevision}
        />
      );

      const topicsField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_training_topics');

      await user.hover(topicsField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      // Find and click the revision button (has title "Request Revision")
      const revisionButton = screen.getByTitle('Request Revision');
      await user.click(revisionButton);

      // Enter a comment
      const commentInput = screen.getByPlaceholderText(/what changes are needed/i);
      await user.type(commentInput, 'Please add more specific topics');

      // Confirm the revision
      const confirmButton = screen.getByRole('button', { name: /request revision/i });
      await user.click(confirmButton);

      expect(mockOnRevision).toHaveBeenCalledWith('result_training_topics', 'Please add more specific topics');
    });

    it('should call onFieldReject when reject action is triggered', async () => {
      const mockOnReject = jest.fn();
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          onFieldReject={mockOnReject}
        />
      );

      const eventTypeField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_event_type');

      await user.hover(eventTypeField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      // Find and click the reject button (has title "Reject")
      const rejectButton = screen.getByTitle('Reject');
      await user.click(rejectButton);

      // Enter a comment
      const commentInput = screen.getByPlaceholderText(/explain why this field is incorrect/i);
      await user.type(commentInput, 'Wrong event type selected');

      // Confirm the rejection
      const confirmButton = screen.getByRole('button', { name: /^reject$/i });
      await user.click(confirmButton);

      expect(mockOnReject).toHaveBeenCalledWith('result_event_type', 'Wrong event type selected');
    });
  });

  describe('Review status display', () => {
    it('should show approved status for approved field', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_event_type: { status: 'approved' },
      };

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const eventTypeField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_event_type');
      expect(eventTypeField).toHaveAttribute('data-status', 'approved');
    });

    it('should show rejected status for rejected field', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_severity: { status: 'rejected', comment: 'Incorrect severity level' },
      };

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const severityField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_severity');
      expect(severityField).toHaveAttribute('data-status', 'rejected');
    });

    it('should show revision status for revision field', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_training_plan: { status: 'revision', comment: 'More detail needed' },
      };

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const trainingPlanField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_training_plan');
      expect(trainingPlanField).toHaveAttribute('data-status', 'revision');
    });

    it('should show mixed statuses for different fields', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_event_type: { status: 'approved' },
        result_severity: { status: 'rejected', comment: 'Incorrect severity level' },
        result_training_plan: { status: 'revision', comment: 'More detail needed' },
      };

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');

      const eventTypeField = reviewableFields.find(el => el.getAttribute('data-field') === 'result_event_type');
      expect(eventTypeField).toHaveAttribute('data-status', 'approved');

      const severityField = reviewableFields.find(el => el.getAttribute('data-field') === 'result_severity');
      expect(severityField).toHaveAttribute('data-status', 'rejected');

      const trainingPlanField = reviewableFields.find(el => el.getAttribute('data-field') === 'result_training_plan');
      expect(trainingPlanField).toHaveAttribute('data-status', 'revision');

      // Fields without explicit status should be pending
      const likelihoodField = reviewableFields.find(el => el.getAttribute('data-field') === 'result_likelihood');
      expect(likelihoodField).toHaveAttribute('data-status', 'pending');
    });

    it('should show pending status for fields without explicit status', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={{}}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');

      reviewableFields.forEach(field => {
        expect(field).toHaveAttribute('data-status', 'pending');
      });
    });
  });

  describe('Clear status callback', () => {
    it('should call onFieldClearStatus when clear status is triggered on approved field', async () => {
      const mockOnClearStatus = jest.fn();
      const user = userEvent.setup();

      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_event_type: { status: 'approved' },
      };

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
          onFieldClearStatus={mockOnClearStatus}
        />
      );

      const eventTypeField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_event_type');

      await user.hover(eventTypeField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip-status')).toBeInTheDocument();
      });

      // Find and click the clear button
      const clearButton = screen.getByTitle('Remove status');
      await user.click(clearButton);

      expect(mockOnClearStatus).toHaveBeenCalledWith('result_event_type');
    });
  });

  describe('No regression on existing functionality', () => {
    it('should still allow event type selection when not in review mode', async () => {
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      const eventTypeSelect = screen.getByTestId('select-event-type');
      await user.selectOptions(eventTypeSelect, 'option1');

      expect(mockOnUpdate).toHaveBeenCalledWith(1, { event_type: 'option1' });
    });

    it('should still allow event type selection in review mode', async () => {
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const eventTypeSelect = screen.getByTestId('select-event-type');
      await user.selectOptions(eventTypeSelect, 'option1');

      expect(mockOnUpdate).toHaveBeenCalledWith(1, { event_type: 'option1' });
    });

    it('should respect disabled prop even in review mode', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
          disabled={true}
        />
      );

      const eventTypeSelect = screen.getByTestId('select-event-type');
      expect(eventTypeSelect).toBeDisabled();
    });

    it('should toggle expand/collapse correctly with review wrappers', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={false}
          userRole="manager"
          isReviewMode={true}
        />
      );

      // Initially collapsed - container has collapsed class
      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('collapsed');

      // Click header to expand
      const header = screen.getByRole('heading', { level: 4 });
      await user.click(header);

      // Container should no longer have collapsed class
      await waitFor(() => {
        expect(rootElement).not.toHaveClass('collapsed');
      });

      // Fields should exist and are now visible
      expect(screen.getAllByTestId('reviewable-field').length).toBe(8);

      // Click header to collapse
      await user.click(header);

      // Container should have collapsed class again
      await waitFor(() => {
        expect(rootElement).toHaveClass('collapsed');
      });
    });

    it('should still call onDelete correctly', async () => {
      const user = userEvent.setup();

      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('Props interface', () => {
    it('should accept all new review-related props without error', () => {
      const mockHandlers = {
        onFieldApprove: jest.fn(),
        onFieldReject: jest.fn(),
        onFieldRequestRevision: jest.fn(),
        onFieldClearStatus: jest.fn(),
      };

      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_event_type: { status: 'approved' },
      };

      // This should render without error
      expect(() => {
        render(
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
            userRole="manager"
            isReviewMode={true}
            fieldReviewStates={fieldReviewStates}
            {...mockHandlers}
          />
        );
      }).not.toThrow();
    });
  });

  describe('ReviewContext integration', () => {
    it('should get userRole and isReviewMode from context when not provided as props', () => {
      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
        >
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
          />
        </ReviewContextProvider>
      );

      // ReviewableField wrappers should be present from context values
      const reviewableFields = screen.getAllByTestId('reviewable-field');
      expect(reviewableFields.length).toBe(8);
    });

    it('should get review callbacks from context', async () => {
      const mockOnApprove = jest.fn();
      const user = userEvent.setup();

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          onFieldApprove={mockOnApprove}
        >
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
          />
        </ReviewContextProvider>
      );

      const eventTypeField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_event_type');

      await user.hover(eventTypeField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      const approveButton = screen.getByTitle('Approve');
      await user.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledWith('result_event_type');
    });

    it('should get field review states from context via getFieldReviewState', () => {
      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={[
            { field_name: 'result_event_type', feedback_type: 'partial', feedback_comment: 'Needs review' },
          ]}
        >
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
          />
        </ReviewContextProvider>
      );

      const eventTypeField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_event_type');

      // Feedback type 'partial' maps to 'rejected' status
      expect(eventTypeField).toHaveAttribute('data-status', 'rejected');
    });

    it('should prefer props over context values when both are provided', () => {
      const mockContextApprove = jest.fn();
      const mockPropApprove = jest.fn();

      render(
        <ReviewContextProvider
          userRole="annotator"
          isReviewMode={false}
          onFieldApprove={mockContextApprove}
        >
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
            userRole="manager"
            isReviewMode={true}
            onFieldApprove={mockPropApprove}
          />
        </ReviewContextProvider>
      );

      // Props should override context - ReviewableField wrappers should be present
      const reviewableFields = screen.getAllByTestId('reviewable-field');
      expect(reviewableFields.length).toBe(8);
    });

    it('should work without context (outside of provider)', () => {
      render(
        <ResultPerformanceItem
          item={createMockPerformance()}
          index={0}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          defaultExpanded={true}
          userRole="manager"
          isReviewMode={true}
        />
      );

      // Should still work with props-only
      const reviewableFields = screen.getAllByTestId('reviewable-field');
      expect(reviewableFields.length).toBe(8);
    });

    it('should NOT show ReviewableField when context has annotator role and no props override', () => {
      render(
        <ReviewContextProvider
          userRole="annotator"
          isReviewMode={false}
        >
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
          />
        </ReviewContextProvider>
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should prefer fieldReviewStates prop over context pendingFeedbacks', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        result_event_type: { status: 'approved' },
      };

      render(
        <ReviewContextProvider
          userRole="manager"
          isReviewMode={true}
          pendingFeedbacks={[
            { field_name: 'result_event_type', feedback_type: 'partial', feedback_comment: 'Needs review' },
          ]}
        >
          <ResultPerformanceItem
            item={createMockPerformance()}
            index={0}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            defaultExpanded={true}
            fieldReviewStates={fieldReviewStates}
          />
        </ReviewContextProvider>
      );

      const eventTypeField = screen.getAllByTestId('reviewable-field')
        .find(el => el.getAttribute('data-field') === 'result_event_type');

      // Props should take precedence - 'approved' from props instead of 'rejected' from context
      expect(eventTypeField).toHaveAttribute('data-status', 'approved');
    });
  });
});
