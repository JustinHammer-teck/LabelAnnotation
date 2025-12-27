/**
 * RecognitionSection Review Integration Tests
 *
 * Tests for ReviewableField wrapper integration in RecognitionSection.
 * Validates that form fields are properly wrapped for Manager/Researcher
 * review functionality with hover tooltips.
 *
 * @module recognition-section/__tests__/RecognitionSection.review-integration.test
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecognitionSection } from '../RecognitionSection';
import type { LabelingItem } from '../../../../types/annotation.types';
import type { DropdownOption } from '../../../../types/dropdown.types';
import type { UserRole, ReviewableFieldName } from '../../../../types';
import type { FieldReviewState } from '../../../review/ReviewableField';

// Mock dependencies
jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        // Impact options
        'impact.none': 'None',
        'impact.leads_to_error': 'Leads to Error',
        'impact.leads_to_uas_t': 'Leads to UAS T',
        'impact.leads_to_uas_e': 'Leads to UAS E',
        // Management state options
        'management_state.managed': 'Managed',
        'management_state.unmanaged': 'Unmanaged',
        'management_state.ineffective': 'Ineffective',
        'management_state.unobserved': 'Unobserved',
        // Recognition section labels
        'recognition.threat.type': 'Threat Type',
        'recognition.error.type': 'Error Type',
        'recognition.uas.type': 'UAS Type',
        'recognition.management': 'Management',
        'recognition.impact': 'Impact',
        'recognition.coping_ability': 'Coping Ability',
        'recognition.description': 'Description',
        'recognition.select_management': 'Select management',
        'recognition.select_impact': 'Select impact',
        'recognition.select_coping': 'Select coping ability',
        'recognition.enter_threat_description': 'Enter threat description',
        'recognition.enter_error_description': 'Enter error description',
        'recognition.enter_uas_description': 'Enter UAS description',
        // Training topics
        'training_topics.title': 'Training Topics',
        // Error
        'error.load_failed': 'Load failed: {{message}}',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
    changeLanguage: jest.fn(),
    i18n: {} as any,
  }),
}));

jest.mock('../../../../hooks/use-coping-abilities.hook', () => ({
  useCopingAbilities: () => ({
    loading: false,
    error: null,
    groups: [],
    flatOptions: [
      { value: 'communication', label: 'Communication' },
      { value: 'workload', label: 'Workload Management' },
    ],
  }),
}));

/**
 * Creates a mock LabelingItem with sensible defaults.
 * Override specific fields as needed for test scenarios.
 */
const createMockItem = (overrides: Partial<LabelingItem> = {}): LabelingItem => ({
  id: 1,
  event: 1,
  created_by: null,
  sequence_number: 1,
  status: 'draft',
  threat_type_l1: null,
  threat_type_l1_detail: null,
  threat_type_l2: null,
  threat_type_l2_detail: null,
  threat_type_l3: null,
  threat_type_l3_detail: null,
  threat_management: {},
  threat_impact: {},
  threat_coping_abilities: { values: [] },
  threat_description: '',
  error_type_l1: null,
  error_type_l1_detail: null,
  error_type_l2: null,
  error_type_l2_detail: null,
  error_type_l3: null,
  error_type_l3_detail: null,
  error_relevance: '',
  error_management: {},
  error_impact: {},
  error_coping_abilities: { values: [] },
  error_description: '',
  uas_applicable: false,
  uas_relevance: '',
  uas_type_l1: null,
  uas_type_l1_detail: null,
  uas_type_l2: null,
  uas_type_l2_detail: null,
  uas_type_l3: null,
  uas_type_l3_detail: null,
  uas_management: {},
  uas_impact: {},
  uas_coping_abilities: { values: [] },
  uas_description: '',
  calculated_threat_topics: [],
  calculated_error_topics: [],
  calculated_uas_topics: [],
  notes: '',
  linked_result_id: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const mockOptions: DropdownOption[] = [
  {
    id: 1,
    category: 'threat',
    level: 1,
    parent_id: null,
    code: 'TE',
    label: 'TE Environment',
    label_zh: 'TE环境',
    training_topics: [],
    is_active: true,
    children: [
      {
        id: 2,
        category: 'threat',
        level: 2,
        parent_id: 1,
        code: 'TE-WX',
        label: 'Weather',
        label_zh: '天气',
        training_topics: [],
        is_active: true,
        children: [],
      },
    ],
  },
];

describe('RecognitionSection - Review Integration', () => {
  describe('ReviewableField wrapper visibility', () => {
    it('should wrap management field with ReviewableField for manager users', () => {
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );
      expect(managementField).toBeInTheDocument();
    });

    it('should NOT show ReviewableField wrapper for annotator users', () => {
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should NOT show ReviewableField wrapper when isReviewMode is false', () => {
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={false}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should wrap all category fields with ReviewableField for researcher users', () => {
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="researcher"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map((el) => el.getAttribute('data-field'));

      expect(fieldNames).toContain('threat_management');
      expect(fieldNames).toContain('threat_impact');
      expect(fieldNames).toContain('threat_coping_abilities');
      expect(fieldNames).toContain('threat_description');
    });

    it('should wrap fields for admin users', () => {
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="admin"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      expect(reviewableFields.length).toBeGreaterThan(0);
    });
  });

  describe('Tooltip actions', () => {
    it('should show tooltip on hover for manager users', async () => {
      const user = userEvent.setup();

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const reviewableField = screen.getAllByTestId('reviewable-field')[0];
      await user.hover(reviewableField);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });
    });

    it('should call onFieldApprove when approve button clicked', async () => {
      const mockOnApprove = jest.fn();
      const user = userEvent.setup();

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          onFieldApprove={mockOnApprove}
        />
      );

      // Find the management field specifically
      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );
      expect(managementField).toBeInTheDocument();

      await user.hover(managementField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledWith('threat_management');
    });

    it('should call onFieldReject when reject button clicked with comment', async () => {
      const mockOnReject = jest.fn();
      const user = userEvent.setup();

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          onFieldReject={mockOnReject}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );

      await user.hover(managementField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      // Click reject to show comment input
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      // Enter comment - use specific placeholder to find the tooltip's textarea
      const commentInput = screen.getByPlaceholderText(/explain why this field is incorrect/i);
      await user.type(commentInput, 'Incorrect threat type');

      // Confirm rejection
      const confirmButton = screen.getByRole('button', { name: /^reject$/i });
      await user.click(confirmButton);

      expect(mockOnReject).toHaveBeenCalledWith('threat_management', 'Incorrect threat type');
    });

    it('should call onFieldRequestRevision when revision button clicked', async () => {
      const mockOnRevision = jest.fn();
      const user = userEvent.setup();

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          onFieldRequestRevision={mockOnRevision}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );

      await user.hover(managementField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip')).toBeInTheDocument();
      });

      // Click revision to show comment input
      const revisionButton = screen.getByRole('button', { name: /request revision/i });
      await user.click(revisionButton);

      // Enter comment - use specific placeholder to find the tooltip's textarea
      const commentInput = screen.getByPlaceholderText(/what changes are needed/i);
      await user.type(commentInput, 'Please clarify this field');

      // Confirm revision
      const confirmButton = screen.getByRole('button', { name: /request revision/i });
      await user.click(confirmButton);

      expect(mockOnRevision).toHaveBeenCalledWith('threat_management', 'Please clarify this field');
    });
  });

  describe('Category-specific field names', () => {
    it.each(['threat', 'error', 'uas'] as const)(
      'should use correct field names for %s category',
      (category) => {
        render(
          <RecognitionSection
            category={category}
            title={`${category} Recognition`}
            item={createMockItem()}
            options={mockOptions}
            onUpdate={jest.fn()}
            userRole="manager"
            isReviewMode={true}
          />
        );

        const reviewableFields = screen.getAllByTestId('reviewable-field');
        const fieldNames = reviewableFields.map((el) => el.getAttribute('data-field'));

        expect(fieldNames).toContain(`${category}_management`);
        expect(fieldNames).toContain(`${category}_impact`);
        expect(fieldNames).toContain(`${category}_coping_abilities`);
        expect(fieldNames).toContain(`${category}_description`);
      }
    );
  });

  describe('Review status display', () => {
    it('should show approved status indicator when field is approved', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        threat_management: { status: 'approved' },
      };

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );

      expect(managementField).toHaveAttribute('data-status', 'approved');
    });

    it('should show rejected status indicator when field is rejected', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        threat_management: { status: 'rejected', comment: 'Wrong value' },
      };

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );

      expect(managementField).toHaveAttribute('data-status', 'rejected');
    });

    it('should show revision status indicator when revision is requested', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        threat_impact: { status: 'revision', comment: 'Needs clarification' },
      };

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const impactField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_impact'
      );

      expect(impactField).toHaveAttribute('data-status', 'revision');
    });

    it('should show pending status by default when no review state provided', () => {
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );

      expect(managementField).toHaveAttribute('data-status', 'pending');
    });
  });

  describe('Field clear status callback', () => {
    it('should call onFieldClearStatus when clear button is clicked on reviewed field', async () => {
      const mockOnClear = jest.fn();
      const user = userEvent.setup();

      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        threat_management: { status: 'approved' },
      };

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
          onFieldClearStatus={mockOnClear}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );

      await user.hover(managementField!);

      await waitFor(() => {
        expect(screen.getByTestId('field-review-tooltip-status')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear review status/i });
      await user.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledWith('threat_management');
    });
  });

  describe('No regression on existing functionality', () => {
    it('should still allow management selection changes for annotator', async () => {
      const mockOnUpdate = jest.fn();
      const user = userEvent.setup();

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={mockOnUpdate}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      const managementSelect = screen.getByLabelText('Management');
      expect(managementSelect).not.toBeDisabled();

      await user.click(managementSelect);
      await user.click(screen.getByText('Managed'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_management: { value: 'managed' },
        threat_impact: { value: 'none' },
      });
    });

    it('should still allow impact selection changes when enabled', async () => {
      const mockOnUpdate = jest.fn();
      const user = userEvent.setup();

      const item = createMockItem({
        threat_management: { value: 'unmanaged' },
      });

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={item}
          options={mockOptions}
          onUpdate={mockOnUpdate}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      const impactSelect = screen.getByLabelText('Impact');
      expect(impactSelect).not.toBeDisabled();

      await user.click(impactSelect);
      await user.click(screen.getByText('Leads to Error'));

      expect(mockOnUpdate).toHaveBeenCalledWith({
        threat_impact: { value: 'leads_to_error' },
      });
    });

    it('should still allow description changes', async () => {
      const mockOnUpdate = jest.fn();
      const user = userEvent.setup();

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={mockOnUpdate}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      const descriptionInput = screen.getByPlaceholderText('Enter threat description');
      await user.type(descriptionInput, 'Test description');

      // Since it debounces or updates on change, check any call
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('should work correctly when no review props are provided', () => {
      // Rendering without any review-related props should not break
      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
        />
      );

      // Component should render without errors
      expect(screen.getByLabelText('Management')).toBeInTheDocument();
      expect(screen.getByLabelText('Impact')).toBeInTheDocument();

      // No ReviewableField wrappers when userRole not provided
      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });
  });

  describe('Multiple fields with different states', () => {
    it('should show correct status for each field individually', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        threat_management: { status: 'approved' },
        threat_impact: { status: 'rejected', comment: 'Wrong' },
        threat_coping_abilities: { status: 'revision', comment: 'Check again' },
        threat_description: { status: 'pending' },
      };

      render(
        <RecognitionSection
          category="threat"
          title="Threat Recognition"
          item={createMockItem()}
          options={mockOptions}
          onUpdate={jest.fn()}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');

      const managementField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_management'
      );
      const impactField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_impact'
      );
      const copingField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_coping_abilities'
      );
      const descriptionField = reviewableFields.find(
        (el) => el.getAttribute('data-field') === 'threat_description'
      );

      expect(managementField).toHaveAttribute('data-status', 'approved');
      expect(impactField).toHaveAttribute('data-status', 'rejected');
      expect(copingField).toHaveAttribute('data-status', 'revision');
      expect(descriptionField).toHaveAttribute('data-status', 'pending');
    });
  });
});
