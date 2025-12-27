import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultPerformanceItem } from '../ResultPerformanceItem';
import type { ResultPerformance } from '../../../../types';

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
 * Test suite for ResultPerformanceItem Disabled State (Phase 4).
 *
 * Tests the disabled prop implementation for read-only mode:
 * - Delete button should be disabled when disabled=true
 * - All Select components should be disabled when disabled=true
 * - All TextArea components should be disabled when disabled=true
 * - MultiSelect should be disabled when disabled=true
 * - Tooltip should appear on disabled delete button
 * - onUpdate/onDelete should NOT be called when disabled=true
 * - Disabled styling should be applied
 */

const createMockPerformance = (id: number, overrides?: Partial<ResultPerformance>): ResultPerformance => ({
  id,
  event: 100,
  aviation_project: 1,
  event_type: 'incident',
  severity: 'low',
  likelihood: 'possible',
  flight_phase: 'cruise',
  training_effect: 'positive',
  training_plan: 'Test training plan',
  training_topics: ['topic1', 'topic2'],
  training_goals: 'Test goals',
  recommendations: 'Test recommendations',
  threat_summary: 'Threat summary',
  error_summary: 'Error summary',
  competency_summary: 'Competency summary',
  linked_items: [],
  status: 'draft',
  objectives: 'Test objectives',
  created_by: null,
  reviewed_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('ResultPerformanceItem Disabled State', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disable delete button when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeDisabled();
  });

  it('should disable event_type Select when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const eventTypeSelect = screen.getByTestId('select-event-type');
    expect(eventTypeSelect).toBeDisabled();
  });

  it('should disable flight_phase Select when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const flightPhaseSelect = screen.getByTestId('select-flight-phase');
    expect(flightPhaseSelect).toBeDisabled();
  });

  it('should disable likelihood Select when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const likelihoodSelect = screen.getByTestId('select-likelihood');
    expect(likelihoodSelect).toBeDisabled();
  });

  it('should disable severity Select when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const severitySelect = screen.getByTestId('select-severity');
    expect(severitySelect).toBeDisabled();
  });

  it('should disable training_effect Select when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const trainingEffectSelect = screen.getByTestId('select-training-effect');
    expect(trainingEffectSelect).toBeDisabled();
  });

  it('should disable training_plan TextArea when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const trainingPlanTextarea = screen.getByTestId('textarea-training-plan');
    expect(trainingPlanTextarea).toBeDisabled();
  });

  it('should disable training_topics MultiSelect when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const trainingTopicsMultiSelect = screen.getByTestId('multi-select-training-topics');
    expect(trainingTopicsMultiSelect).toHaveAttribute('data-disabled', 'true');
    expect(trainingTopicsMultiSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('should disable objectives TextArea when disabled=true', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const objectivesTextarea = screen.getByTestId('textarea-objectives');
    expect(objectivesTextarea).toBeDisabled();
  });

  it('should show tooltip on disabled delete button when deleteTooltip provided', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
        deleteTooltip="Cannot delete in read-only mode"
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toHaveAttribute('title', 'Cannot delete in read-only mode');
  });

  it('should NOT call onUpdate when fields are disabled', async () => {
    const item = createMockPerformance(1);
    const user = userEvent.setup();

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    // Try to change a select value
    const eventTypeSelect = screen.getByTestId('select-event-type');
    await user.selectOptions(eventTypeSelect, 'option1');

    // onUpdate should NOT have been called (since disabled)
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should NOT call onDelete when delete button is disabled', async () => {
    const item = createMockPerformance(1);
    const user = userEvent.setup();

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    // onDelete should NOT have been called
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should apply disabled styling class when disabled=true', () => {
    const item = createMockPerformance(1);

    const { container } = render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={true}
      />
    );

    // The root element should have disabled class
    const rootElement = container.firstChild;
    expect(rootElement).toHaveClass('disabled');
  });

  it('should enable all fields when disabled=false', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={false}
      />
    );

    // Check all Selects are enabled
    expect(screen.getByTestId('select-event-type')).not.toBeDisabled();
    expect(screen.getByTestId('select-flight-phase')).not.toBeDisabled();
    expect(screen.getByTestId('select-likelihood')).not.toBeDisabled();
    expect(screen.getByTestId('select-severity')).not.toBeDisabled();
    expect(screen.getByTestId('select-training-effect')).not.toBeDisabled();

    // Check TextAreas are enabled
    expect(screen.getByTestId('textarea-training-plan')).not.toBeDisabled();
    expect(screen.getByTestId('textarea-objectives')).not.toBeDisabled();

    // Check MultiSelect is enabled
    expect(screen.getByTestId('multi-select-training-topics')).toHaveAttribute('data-disabled', 'false');

    // Check delete button is enabled
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeDisabled();
  });

  it('should call onUpdate when field is enabled and changed', async () => {
    const item = createMockPerformance(1);
    const user = userEvent.setup();

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={false}
      />
    );

    // Change event type
    const eventTypeSelect = screen.getByTestId('select-event-type');
    await user.selectOptions(eventTypeSelect, 'option1');

    // onUpdate should have been called
    expect(mockOnUpdate).toHaveBeenCalledWith(1, { event_type: 'option1' });
  });

  it('should call onDelete when delete button is clicked and enabled', async () => {
    const item = createMockPerformance(1);
    const user = userEvent.setup();

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={false}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    // onDelete should have been called
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should default to disabled=false when prop is not provided', () => {
    const item = createMockPerformance(1);

    render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // All fields should be enabled by default
    expect(screen.getByTestId('select-event-type')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeDisabled();
  });

  it('should not apply disabled styling when disabled=false', () => {
    const item = createMockPerformance(1);

    const { container } = render(
      <ResultPerformanceItem
        item={item}
        index={0}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        disabled={false}
      />
    );

    // The root element should NOT have disabled class
    const rootElement = container.firstChild;
    expect(rootElement).not.toHaveClass('disabled');
  });
});
