import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultPerformancePanel } from '../ResultPerformancePanel';
import type { ResultPerformance } from '../../../../types';

// Mock data
let mockPerformances: ResultPerformance[] = [];
const mockFetchPerformances = jest.fn();
const mockCreatePerformance = jest.fn();
const mockUpdatePerformance = jest.fn();
const mockDeletePerformance = jest.fn();

// Mock hooks
jest.mock('../../../../hooks', () => ({
  usePerformances: () => ({
    performances: mockPerformances,
    loading: false,
    error: null,
    fetchPerformances: mockFetchPerformances,
    createPerformance: mockCreatePerformance,
    updatePerformance: mockUpdatePerformance,
    deletePerformance: mockDeletePerformance,
  }),
  useDropdownOptions: () => ({
    options: [],
    loading: false,
  }),
}));

// Mock i18n
jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'result_performance.panel_title': 'Result Performance',
        'result_performance.add_result': 'Add Result',
        'result_performance.result_item': `Result ${params?.index ?? 0}`,
        'common.loading': 'Loading...',
        'common.delete': 'Delete',
        'empty.no_results': 'No results yet',
        'readonly.tooltip_add_disabled': 'Cannot add results in read-only mode',
        'defaults.new_assessment': 'New Assessment',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
  }),
}));

// Mock common components
jest.mock('../../../common', () => ({
  Button: ({ children, onClick, disabled, variant, size, title, 'data-testid': testId }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      title={title}
      data-testid={testId || `button-${typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}
    >
      {children}
    </button>
  ),
  Select: ({ value, onChange, options, placeholder, disabled }: any) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      data-testid="select"
    >
      <option value="">{placeholder}</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  MultiSelect: ({ value, onChange, options, placeholder, disabled }: any) => (
    <div
      data-testid="multi-select"
      data-disabled={disabled}
      role="combobox"
      aria-disabled={disabled}
    >
      {placeholder}
    </div>
  ),
  TextArea: ({ value, onChange, placeholder, disabled }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid="textarea"
    />
  ),
}));

// Mock ResultPerformanceItem to track disabled prop
jest.mock('../ResultPerformanceItem', () => ({
  ResultPerformanceItem: ({ item, index, onUpdate, onDelete, defaultExpanded, disabled, deleteTooltip }: any) => (
    <div
      data-testid={`result-performance-item-${index}`}
      data-disabled={disabled}
      data-delete-tooltip={deleteTooltip}
    >
      Result Item {index}
      <button
        data-testid={`delete-button-${index}`}
        disabled={disabled}
        onClick={() => onDelete(item.id)}
      >
        Delete
      </button>
    </div>
  ),
}));

/**
 * Test suite for ResultPerformancePanel Disabled State (Phase 4).
 *
 * Tests the disabled prop implementation for read-only mode:
 * - Add button should be disabled when disabled=true
 * - Tooltip should appear on disabled Add button
 * - Disabled prop should be passed to all ResultPerformanceItem children
 * - createPerformance should NOT be called when disabled
 */

const createMockPerformance = (id: number): ResultPerformance => ({
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
});

describe('ResultPerformancePanel Disabled State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformances = [];
  });

  it('should disable Add button when disabled=true', () => {
    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={true}
      />
    );

    const addButton = screen.getByTestId('button-add-result');
    expect(addButton).toBeDisabled();
  });

  it('should show tooltip on disabled Add button', () => {
    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={true}
        disabledTooltip="Cannot add results in read-only mode"
      />
    );

    const addButton = screen.getByTestId('button-add-result');
    expect(addButton).toHaveAttribute('title', 'Cannot add results in read-only mode');
  });

  it('should pass disabled prop to all ResultPerformanceItem children', () => {
    mockPerformances = [
      createMockPerformance(1),
      createMockPerformance(2),
      createMockPerformance(3),
    ];

    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={true}
      />
    );

    // All ResultPerformanceItem components should have disabled=true
    const item0 = screen.getByTestId('result-performance-item-0');
    expect(item0).toHaveAttribute('data-disabled', 'true');

    const item1 = screen.getByTestId('result-performance-item-1');
    expect(item1).toHaveAttribute('data-disabled', 'true');

    const item2 = screen.getByTestId('result-performance-item-2');
    expect(item2).toHaveAttribute('data-disabled', 'true');
  });

  it('should pass deleteTooltip to ResultPerformanceItem children when disabled', () => {
    mockPerformances = [createMockPerformance(1)];

    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={true}
        disabledTooltip="Cannot modify in read-only mode"
      />
    );

    const item = screen.getByTestId('result-performance-item-0');
    expect(item).toHaveAttribute('data-delete-tooltip', 'Cannot modify in read-only mode');
  });

  it('should enable Add button when disabled=false', () => {
    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={false}
      />
    );

    const addButton = screen.getByTestId('button-add-result');
    expect(addButton).not.toBeDisabled();
  });

  it('should NOT call createPerformance when Add button is disabled', async () => {
    const user = userEvent.setup();

    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={true}
      />
    );

    const addButton = screen.getByTestId('button-add-result');

    // Try to click the disabled button
    await user.click(addButton);

    // createPerformance should NOT have been called
    expect(mockCreatePerformance).not.toHaveBeenCalled();
  });

  it('should call createPerformance when Add button is clicked and enabled', async () => {
    const user = userEvent.setup();

    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={false}
      />
    );

    const addButton = screen.getByTestId('button-add-result');
    await user.click(addButton);

    // createPerformance should have been called
    expect(mockCreatePerformance).toHaveBeenCalledWith({});
  });

  it('should default to disabled=false when prop is not provided', () => {
    render(
      <ResultPerformancePanel
        eventId={100}
      />
    );

    const addButton = screen.getByTestId('button-add-result');
    expect(addButton).not.toBeDisabled();
  });

  it('should pass disabled=false to children when disabled prop is false', () => {
    mockPerformances = [createMockPerformance(1)];

    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={false}
      />
    );

    const item = screen.getByTestId('result-performance-item-0');
    expect(item).toHaveAttribute('data-disabled', 'false');
  });

  it('should not have tooltip on Add button when enabled', () => {
    render(
      <ResultPerformancePanel
        eventId={100}
        disabled={false}
      />
    );

    const addButton = screen.getByTestId('button-add-result');
    // When not disabled, should not have a tooltip (or should be empty)
    expect(addButton).not.toHaveAttribute('title');
  });
});
