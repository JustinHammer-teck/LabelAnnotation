import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableEventPanel } from '../EditableEventPanel';
import type { AviationEvent } from '../../../../types';

// Mock i18n
jest.mock('../../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'event.description': 'Event Description',
        'basic_info.title': 'Basic Info',
        'basic_info.date': 'Date',
        'basic_info.time': 'Time',
        'basic_info.aircraft_type': 'Aircraft Type',
        'basic_info.departure_airport': 'Departure Airport',
        'basic_info.landing_airport': 'Landing Airport',
        'basic_info.actual_landing': 'Actual Landing',
        'basic_info.remarks': 'Remarks',
        'placeholders.event_description': 'Enter event description...',
        'placeholders.enter_aircraft_type': 'Enter aircraft type...',
        'placeholders.four_letter_code': 'ICAO code...',
        'placeholders.enter_remarks': 'Enter remarks...',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
  }),
}));

// Mock common components
jest.mock('../../../common', () => ({
  TextArea: ({ value, onChange, placeholder, disabled, 'aria-label': ariaLabel }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={`textarea-${ariaLabel?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
    />
  ),
}));

/**
 * Test suite for EditableEventPanel Disabled State (Phase 4).
 *
 * Tests the disabled prop implementation for read-only mode:
 * - All input fields should be disabled when disabled=true
 * - All TextAreas should be disabled when disabled=true
 * - onUpdate should NOT be called when disabled=true
 * - Disabled styling should be applied when disabled=true
 */

const createMockEvent = (overrides?: Partial<AviationEvent>): AviationEvent => ({
  id: 1,
  task: { id: 100 },
  event_number: 'EVT-001',
  event_description: 'Test event description',
  date: '2024-01-15',
  time: '14:30',
  location: '',
  airport: '',
  departure_airport: 'KJFK',
  arrival_airport: 'KLAX',
  actual_landing_airport: 'KLAX',
  flight_phase: 'cruise',
  aircraft_type: 'B737',
  aircraft_registration: 'N12345',
  crew_composition: {},
  weather_conditions: 'clear',
  remarks: 'Test remarks',
  file_upload: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('EditableEventPanel Disabled State', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disable all input fields when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    // Check that all native inputs are disabled
    const dateInput = screen.getByLabelText('Date');
    expect(dateInput).toBeDisabled();

    const timeInput = screen.getByLabelText('Time');
    expect(timeInput).toBeDisabled();

    const aircraftTypeInput = screen.getByLabelText('Aircraft Type');
    expect(aircraftTypeInput).toBeDisabled();

    const departureAirportInput = screen.getByLabelText('Departure Airport');
    expect(departureAirportInput).toBeDisabled();

    const landingAirportInput = screen.getByLabelText('Landing Airport');
    expect(landingAirportInput).toBeDisabled();

    const actualLandingInput = screen.getByLabelText('Actual Landing');
    expect(actualLandingInput).toBeDisabled();
  });

  it('should disable TextArea for event description when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const descriptionTextarea = screen.getByTestId('textarea-event-description');
    expect(descriptionTextarea).toBeDisabled();
  });

  it('should disable date input when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const dateInput = screen.getByLabelText('Date');
    expect(dateInput).toBeDisabled();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('should disable time input when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const timeInput = screen.getByLabelText('Time');
    expect(timeInput).toBeDisabled();
    expect(timeInput).toHaveAttribute('type', 'time');
  });

  it('should disable aircraft_type input when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const aircraftInput = screen.getByLabelText('Aircraft Type');
    expect(aircraftInput).toBeDisabled();
  });

  it('should disable departure_airport input when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const departureInput = screen.getByLabelText('Departure Airport');
    expect(departureInput).toBeDisabled();
  });

  it('should disable arrival_airport input when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const arrivalInput = screen.getByLabelText('Landing Airport');
    expect(arrivalInput).toBeDisabled();
  });

  it('should disable actual_landing_airport input when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const actualLandingInput = screen.getByLabelText('Actual Landing');
    expect(actualLandingInput).toBeDisabled();
  });

  it('should disable remarks TextArea when disabled=true', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    const remarksTextarea = screen.getByTestId('textarea-remarks');
    expect(remarksTextarea).toBeDisabled();
  });

  it('should enable all fields when disabled=false', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={false}
      />
    );

    // Check native inputs
    expect(screen.getByLabelText('Date')).not.toBeDisabled();
    expect(screen.getByLabelText('Time')).not.toBeDisabled();
    expect(screen.getByLabelText('Aircraft Type')).not.toBeDisabled();
    expect(screen.getByLabelText('Departure Airport')).not.toBeDisabled();
    expect(screen.getByLabelText('Landing Airport')).not.toBeDisabled();
    expect(screen.getByLabelText('Actual Landing')).not.toBeDisabled();

    // Check TextAreas
    expect(screen.getByTestId('textarea-event-description')).not.toBeDisabled();
    expect(screen.getByTestId('textarea-remarks')).not.toBeDisabled();
  });

  it('should apply disabled styling when disabled=true', () => {
    const event = createMockEvent();

    const { container } = render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    // The root panel should have disabled class
    const panel = container.firstChild;
    expect(panel).toHaveClass('disabled');
  });

  it('should NOT call onUpdate when field is disabled and user tries to type', async () => {
    const event = createMockEvent();
    const user = userEvent.setup();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={true}
      />
    );

    // Try to type in the aircraft type input (which should be disabled)
    const aircraftInput = screen.getByLabelText('Aircraft Type');

    // The input is disabled, so typing should not work
    // We simulate an attempt - the handler should check disabled state
    await user.type(aircraftInput, 'A320');

    // onUpdate should NOT have been called
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should call onUpdate when field is enabled and user types', async () => {
    const event = createMockEvent();
    const user = userEvent.setup();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
        disabled={false}
      />
    );

    // Type in the aircraft type input
    const aircraftInput = screen.getByLabelText('Aircraft Type');
    await user.clear(aircraftInput);
    await user.type(aircraftInput, 'A320');

    // onUpdate should have been called
    expect(mockOnUpdate).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalledWith('aircraft_type', expect.any(String));
  });

  it('should default to disabled=false when prop is not provided', () => {
    const event = createMockEvent();

    render(
      <EditableEventPanel
        event={event}
        eventIndex={1}
        onUpdate={mockOnUpdate}
      />
    );

    // All inputs should be enabled by default
    expect(screen.getByLabelText('Date')).not.toBeDisabled();
    expect(screen.getByLabelText('Time')).not.toBeDisabled();
    expect(screen.getByLabelText('Aircraft Type')).not.toBeDisabled();
  });
});
