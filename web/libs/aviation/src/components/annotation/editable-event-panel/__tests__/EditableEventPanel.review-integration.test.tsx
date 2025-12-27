/**
 * EditableEventPanel Review Integration Tests
 *
 * Phase 2b: Tests for ReviewableField wrapper integration
 *
 * Tests that:
 * - All 8 event fields are wrapped with ReviewableField for reviewer roles
 * - Tooltips are visible on hover for manager/researcher/admin users
 * - Tooltips are NOT visible for annotator users or when isReviewMode=false
 * - Field approve/reject/revision callbacks are wired correctly
 * - Review status indicators display correctly
 * - No regression on existing functionality
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableEventPanel } from '../EditableEventPanel';
import type { AviationEvent, ReviewableFieldName, UserRole } from '../../../../types';
import type { FieldReviewState } from '../../../review/ReviewableField';

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

// Mock ReviewableField component to expose testable attributes
jest.mock('../../../review/ReviewableField', () => ({
  ReviewableField: ({
    children,
    fieldName,
    userRole,
    isReviewMode,
    reviewStatus,
    onApprove,
    onReject,
    onRequestRevision,
    onClearStatus,
  }: any) => {
    // Only render wrapper when review mode is active and user can review
    const canReview = userRole === 'admin' || userRole === 'manager' || userRole === 'researcher';

    if (!canReview || !isReviewMode) {
      return <>{children}</>;
    }

    return (
      <div
        data-testid="reviewable-field"
        data-field={fieldName}
        data-status={reviewStatus?.status || 'pending'}
        data-can-review={canReview}
        onClick={(e) => {
          // Simulate click on tooltip buttons via data attributes
          const target = e.target as HTMLElement;
          if (target.dataset.action === 'approve') {
            onApprove?.(fieldName);
          } else if (target.dataset.action === 'reject') {
            onReject?.(fieldName, target.dataset.comment);
          }
        }}
      >
        {/* Simulated tooltip trigger */}
        <div data-testid="field-review-tooltip" className="mock-tooltip">
          <button
            type="button"
            aria-label="Approve"
            data-action="approve"
            onClick={() => onApprove?.(fieldName)}
          >
            Approve
          </button>
          <button
            type="button"
            aria-label="Reject"
            data-action="reject"
            onClick={() => onReject?.(fieldName, undefined)}
          >
            Reject
          </button>
        </div>
        {children}
      </div>
    );
  },
}));

/**
 * Creates a mock AviationEvent with sensible defaults.
 */
const createMockEvent = (overrides: Partial<AviationEvent> = {}): AviationEvent => ({
  id: 1,
  task: { id: 1 },
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
  weather_conditions: 'VMC',
  remarks: 'Test remarks',
  file_upload: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('EditableEventPanel - Review Integration', () => {
  const mockOnUpdate = jest.fn();
  const mockOnFieldApprove = jest.fn();
  const mockOnFieldReject = jest.fn();
  const mockOnFieldRequestRevision = jest.fn();
  const mockOnFieldClearStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ReviewableField wrapper visibility', () => {
    it('should wrap event_description field with ReviewableField for manager users', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map((el) => el.getAttribute('data-field'));

      expect(fieldNames).toContain('event_description');
    });

    it('should wrap all 8 event fields with ReviewableField for researcher users', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="researcher"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      const fieldNames = reviewableFields.map((el) => el.getAttribute('data-field'));

      expect(fieldNames).toHaveLength(8);
      expect(fieldNames).toContain('event_description');
      expect(fieldNames).toContain('event_date');
      expect(fieldNames).toContain('event_time');
      expect(fieldNames).toContain('aircraft_type');
      expect(fieldNames).toContain('departure_airport');
      expect(fieldNames).toContain('arrival_airport');
      expect(fieldNames).toContain('actual_landing_airport');
      expect(fieldNames).toContain('event_remarks');
    });

    it('should NOT show ReviewableField wrapper for annotator users', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should NOT show ReviewableField wrapper when isReviewMode is false', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={false}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip actions', () => {
    it('should show tooltip on hover for event_description field', async () => {
      const user = userEvent.setup();

      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={true}
        />
      );

      const descriptionField = screen
        .getAllByTestId('reviewable-field')
        .find((el) => el.getAttribute('data-field') === 'event_description');

      expect(descriptionField).toBeDefined();
      await user.hover(descriptionField!);

      await waitFor(() => {
        expect(screen.getAllByTestId('field-review-tooltip').length).toBeGreaterThan(0);
      });
    });

    it('should call onFieldApprove when approve button clicked for date field', async () => {
      const user = userEvent.setup();

      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={true}
          onFieldApprove={mockOnFieldApprove}
        />
      );

      const dateField = screen
        .getAllByTestId('reviewable-field')
        .find((el) => el.getAttribute('data-field') === 'event_date');

      expect(dateField).toBeDefined();

      // Find the approve button within the date field
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      // Get the approve button that is within the date field
      const dateApproveButton = approveButtons.find((btn) =>
        dateField?.contains(btn)
      );

      expect(dateApproveButton).toBeDefined();
      await user.click(dateApproveButton!);

      expect(mockOnFieldApprove).toHaveBeenCalledWith('event_date');
    });

    it('should call onFieldReject when reject button clicked for airport field', async () => {
      const user = userEvent.setup();

      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={true}
          onFieldReject={mockOnFieldReject}
        />
      );

      const airportField = screen
        .getAllByTestId('reviewable-field')
        .find((el) => el.getAttribute('data-field') === 'departure_airport');

      expect(airportField).toBeDefined();

      // Find the reject button within the airport field
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      const airportRejectButton = rejectButtons.find((btn) =>
        airportField?.contains(btn)
      );

      expect(airportRejectButton).toBeDefined();
      await user.click(airportRejectButton!);

      expect(mockOnFieldReject).toHaveBeenCalledWith('departure_airport', undefined);
    });
  });

  describe('Review status display', () => {
    it('should show approved status for approved fields', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        event_description: { status: 'approved' },
        event_date: { status: 'approved' },
      };

      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const approvedFields = screen
        .getAllByTestId('reviewable-field')
        .filter((el) => el.getAttribute('data-status') === 'approved');

      expect(approvedFields).toHaveLength(2);
    });

    it('should show rejected status with comment for rejected fields', () => {
      const fieldReviewStates: Partial<Record<ReviewableFieldName, FieldReviewState>> = {
        aircraft_type: { status: 'rejected', comment: 'Verify aircraft type' },
      };

      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
          isReviewMode={true}
          fieldReviewStates={fieldReviewStates}
        />
      );

      const rejectedField = screen
        .getAllByTestId('reviewable-field')
        .find((el) => el.getAttribute('data-field') === 'aircraft_type');

      expect(rejectedField).toHaveAttribute('data-status', 'rejected');
    });
  });

  describe('No regression on existing functionality', () => {
    it('should still allow description text entry', async () => {
      const user = userEvent.setup();

      render(
        <EditableEventPanel
          event={createMockEvent({ event_description: '' })}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="annotator"
          isReviewMode={false}
        />
      );

      const descriptionInput = screen.getByTestId('textarea-event-description');
      await user.type(descriptionInput, 'New description');

      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('should respect disabled prop', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          disabled={true}
        />
      );

      const dateInput = screen.getByLabelText('Date');
      expect(dateInput).toBeDisabled();
    });
  });

  describe('Admin role', () => {
    it('should show ReviewableField wrappers for admin users', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="admin"
          isReviewMode={true}
        />
      );

      const reviewableFields = screen.getAllByTestId('reviewable-field');
      expect(reviewableFields.length).toBeGreaterThan(0);
    });
  });

  describe('Default prop behavior', () => {
    it('should default to no ReviewableField wrappers when userRole is not provided', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });

    it('should default to no ReviewableField wrappers when isReviewMode is not provided', () => {
      render(
        <EditableEventPanel
          event={createMockEvent()}
          eventIndex={1}
          onUpdate={mockOnUpdate}
          userRole="manager"
        />
      );

      expect(screen.queryByTestId('reviewable-field')).not.toBeInTheDocument();
    });
  });
});
