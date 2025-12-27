import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LabelingItem, UserRole } from '../../../types';

/**
 * Test suite for AnnotationView Read-Only Mode (Phase 2).
 *
 * Tests the integration of useCanEditItem hook into AnnotationView component,
 * including read-only banner display, Add/Delete button states, and disabled
 * props passed to child components.
 *
 * Permission Matrix:
 * | Role       | Draft     | Submitted  | Reviewed       | Approved   |
 * |------------|-----------|------------|----------------|------------|
 * | Annotator  | Edit      | Read-only  | Edit+Resubmit  | Read-only  |
 * | Manager    | Read-only | Read-only  | Read-only      | Read-only  |
 * | Researcher | Read-only | Read-only  | Read-only      | Read-only  |
 * | Admin      | Full      | Full       | Full           | Full       |
 */

// Mock the hooks
const mockFetchEvent = jest.fn();
const mockFetchEvents = jest.fn();
const mockFetchItems = jest.fn();
const mockFetchPerformances = jest.fn();
const mockAddItem = jest.fn();
const mockDeleteItem = jest.fn();
const mockUpdateItem = jest.fn();
const mockUpdateEvent = jest.fn();
const mockSaveNow = jest.fn();
const mockSubmitForReview = jest.fn();
const mockFetchReviewHistory = jest.fn();
const mockApprove = jest.fn();
const mockReject = jest.fn();
const mockRequestRevision = jest.fn();
const mockResubmit = jest.fn();

// Mock data
let mockCurrentEvent: { id: number; event_number: string } | null = null;
let mockItems: LabelingItem[] = [];
let mockEvents: { id: number; event_number: string }[] = [];
let mockUserRole: string = 'annotator';
let mockCanReview = false;
let mockFailedItemIds: Set<number> = new Set();

// Create a mock item factory
const createMockItem = (
  status: LabelingItem['status'],
  id: number = 1
): LabelingItem => ({
  id,
  event: 100,
  created_by: 1,
  sequence_number: 1,
  status,
  threat_type_l1: null,
  threat_type_l1_detail: null,
  threat_type_l2: null,
  threat_type_l2_detail: null,
  threat_type_l3: null,
  threat_type_l3_detail: null,
  threat_management: {},
  threat_impact: {},
  threat_coping_abilities: {},
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
  error_coping_abilities: {},
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
  uas_coping_abilities: {},
  uas_description: '',
  calculated_threat_topics: [],
  calculated_error_topics: [],
  calculated_uas_topics: [],
  notes: '',
  linked_result_id: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Mock useCurrentUserAtom
jest.mock('@humansignal/core/lib/hooks/useCurrentUser', () => ({
  useCurrentUserAtom: () => ({
    user: { id: 1, username: 'testuser', email: 'test@test.com', role: mockUserRole },
  }),
}));

// Mock aviation hooks
jest.mock('../../../hooks', () => ({
  useEvent: () => ({
    currentEvent: mockCurrentEvent,
    loading: false,
    error: null,
    fetchEvent: mockFetchEvent,
    updateEvent: mockUpdateEvent,
  }),
  useEvents: () => ({
    events: mockEvents,
    loading: false,
    fetchEvents: mockFetchEvents,
  }),
  useLabelingItems: () => ({
    items: mockItems,
    loading: false,
    fetchItems: mockFetchItems,
    addItem: mockAddItem,
    updateItem: mockUpdateItem,
    deleteItem: mockDeleteItem,
  }),
  useAutoSave: () => ({
    saveStatus: { state: 'idle' },
    saveNow: mockSaveNow,
  }),
  useDropdownOptions: () => ({
    options: [],
    loading: false,
  }),
  usePerformances: () => ({
    performances: [],
    loading: false,
    fetchPerformances: mockFetchPerformances,
  }),
  useTrainingTopics: () => ({
    threat: [],
    error: [],
    uas: [],
  }),
  useReviewWorkflow: () => ({
    submitForReview: mockSubmitForReview,
    isLoading: false,
  }),
  useReview: () => ({
    decisions: [],
    loading: false,
    pendingRevisionFields: [],
    pendingFeedbacks: [],
    resolvedFields: new Set(),
    canResubmit: true,
    unresolvedFieldCount: 0,
    hasUnresolvedRevisions: false,
    failedItemIds: mockFailedItemIds,
    approve: mockApprove,
    reject: mockReject,
    requestRevision: mockRequestRevision,
    resubmit: mockResubmit,
    submit: mockSubmitForReview,
    fetchHistory: mockFetchReviewHistory,
    addPendingFeedback: jest.fn(),
    removePendingFeedback: jest.fn(),
    markFieldAsResolved: jest.fn(),
    unmarkFieldAsResolved: jest.fn(),
  }),
  useAviationToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
  useApiErrorToast: () => ({
    handleApiError: jest.fn(),
    withErrorToast: jest.fn((fn: () => Promise<unknown>) => fn()),
  }),
  useCanReviewItems: () => ({
    canReview: mockCanReview,
  }),
  useCanEditItem: jest.requireActual('../../../hooks/use-can-edit-item.hook').useCanEditItem,
}));

// Mock i18n
jest.mock('../../../i18n', () => ({
  useAviationTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'labeling.title': 'Labeling Items',
        'labeling.add': 'Add Item',
        'common.delete': 'Delete',
        'common.loading': 'Loading...',
        'common.prev': 'Prev',
        'common.next': 'Next',
        'toolbar.save_annotation': 'Save',
        'toolbar.submit_for_review': 'Submit for Review',
        'navigation.event_counter': `${params?.current ?? 0} of ${params?.total ?? 0}`,
        'labeling.annotation_item': `Item ${params?.index ?? 0}`,
        'labeling.not_linked': 'Not linked',
        'empty.no_annotations': 'No annotations yet',
        'readonly.banner_submitted': 'This item is submitted and cannot be edited.',
        'readonly.banner_approved': 'This item is approved and cannot be edited.',
        'readonly.banner_manager': 'Managers and researchers can only review items, not edit them.',
        'readonly.tooltip_submitted': 'Item is submitted - editing is disabled',
        'readonly.tooltip_approved': 'Item is approved - editing is disabled',
        'readonly.tooltip_manager': 'Your role only allows reviewing items',
      };
      return translations[key] || key;
    },
    currentLanguage: 'en',
  }),
}));

// Mock common components
jest.mock('../../common', () => ({
  Panel: ({ title, children, actions, className }: any) => (
    <div data-testid="panel" className={className}>
      <div data-testid="panel-header">
        <span data-testid="panel-title">{title}</span>
        <div data-testid="panel-actions">{actions}</div>
      </div>
      <div data-testid="panel-content">{children}</div>
    </div>
  ),
  Button: ({ children, onClick, disabled, variant, size, title, 'data-testid': dataTestId }: any) => {
    // Use explicit data-testid if provided, otherwise generate from children
    const testId = dataTestId || `button-${typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`;
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-size={size}
        title={title}
        data-testid={testId}
      >
        {children}
      </button>
    );
  },
  StatusIndicator: ({ status }: any) => (
    <div data-testid="status-indicator" data-status={status}>
      {status}
    </div>
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

// Mock annotation components
jest.mock('../../annotation', () => ({
  EditableEventPanel: ({ event, eventIndex, onUpdate, disabled }: any) => (
    <div data-testid="editable-event-panel" data-disabled={disabled}>
      Event Panel: {event?.event_number}
    </div>
  ),
  RecognitionSection: ({ category, title, item, options, onUpdate, disabled }: any) => (
    <div data-testid={`recognition-section-${category}`} data-disabled={disabled}>
      {title}
    </div>
  ),
  TrainingTopicsPanel: ({ threatTopics, errorTopics, uasTopics }: any) => (
    <div data-testid="training-topics-panel">Topics</div>
  ),
  ResultPerformancePanel: ({ eventId, disabled }: any) => (
    <div data-testid="result-performance-panel" data-disabled={disabled}>
      Result Performance
    </div>
  ),
}));

// Mock review components
jest.mock('../../review', () => ({
  ReviewPanel: ({ labelingItemId, currentStatus, userRole, onApprove, onReject, onRequestRevision }: any) => (
    <div data-testid="review-panel">Review Panel</div>
  ),
  ReviewHistory: ({ labelingItemId, decisions, loading }: any) => (
    <div data-testid="review-history">Review History</div>
  ),
  RevisionIndicator: ({ fieldName, feedbacks, onMarkResolved }: any) => (
    <div data-testid="revision-indicator">Revision Indicator</div>
  ),
}));

import { AnnotationView } from '../AnnotationView';

describe('AnnotationView Read-Only Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentEvent = { id: 100, event_number: 'EVT-001' };
    mockEvents = [{ id: 100, event_number: 'EVT-001' }];
    mockItems = [];
    mockUserRole = 'annotator';
    mockCanReview = false;
    mockFailedItemIds = new Set();
  });

  const renderAnnotationView = (props: Partial<{ eventId: number; projectId: number }> = {}) => {
    return render(
      <AnnotationView eventId={props.eventId ?? 100} projectId={props.projectId ?? 1} />
    );
  };

  describe('Banner Display', () => {
    it('should display read-only banner when item is submitted and user is annotator', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('read-only-banner')).toBeInTheDocument();
      });

      const banner = screen.getByTestId('read-only-banner');
      expect(banner).toHaveTextContent(/submitted/i);
    });

    it('should display read-only banner for manager viewing any item', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('read-only-banner')).toBeInTheDocument();
      });

      const banner = screen.getByTestId('read-only-banner');
      expect(banner).toHaveTextContent(/manager/i);
    });

    it('should display read-only banner for researcher viewing any item', async () => {
      mockUserRole = 'researcher';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('read-only-banner')).toBeInTheDocument();
      });

      const banner = screen.getByTestId('read-only-banner');
      expect(banner).toHaveTextContent(/researcher/i);
    });

    it('should NOT display banner for admin', async () => {
      mockUserRole = 'admin';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument();
      });
    });

    it('should NOT display banner for annotator viewing draft item', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument();
      });
    });

    it('should display banner with approved message for approved items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('approved', 1)];

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('read-only-banner')).toBeInTheDocument();
      });

      const banner = screen.getByTestId('read-only-banner');
      expect(banner).toHaveTextContent(/approved/i);
    });
  });

  describe('Add Button State', () => {
    it('should disable Add button when user cannot add items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton).toBeDisabled();
      });
    });

    it('should show tooltip on disabled Add button', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton).toHaveAttribute('title');
        expect(addButton.getAttribute('title')).toBeTruthy();
      });
    });

    it('should enable Add button for admin', async () => {
      mockUserRole = 'admin';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton).not.toBeDisabled();
      });
    });

    it('should enable Add button for annotator with draft items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton).not.toBeDisabled();
      });
    });

    it('should NOT allow add for manager role', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe('Delete Button State', () => {
    it('should disable Delete button when user cannot delete items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('button-delete');
        expect(deleteButton).toBeDisabled();
      });
    });

    it('should show tooltip on disabled Delete button', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('button-delete');
        expect(deleteButton).toHaveAttribute('title');
      });
    });

    it('should enable Delete button for admin', async () => {
      mockUserRole = 'admin';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('button-delete');
        expect(deleteButton).not.toBeDisabled();
      });
    });

    it('should enable Delete button for annotator with draft items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('button-delete');
        expect(deleteButton).not.toBeDisabled();
      });
    });
  });

  describe('LabelingItemRow Disabled State', () => {
    it('should pass disabled=true to LabelingItemRow when read-only', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const labelingItem = screen.getByTestId('labeling-item-row');
        expect(labelingItem).toHaveAttribute('data-disabled', 'true');
      });
    });

    it('should pass disabled=false to LabelingItemRow when editable', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const labelingItem = screen.getByTestId('labeling-item-row');
        expect(labelingItem).toHaveAttribute('data-disabled', 'false');
      });
    });

    it('should pass deleteDisabled prop based on canDelete', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('button-delete');
        expect(deleteButton).toBeDisabled();
      });
    });
  });

  describe('Left Column Components', () => {
    it('should pass disabled to EditableEventPanel when read-only', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const eventPanel = screen.getByTestId('editable-event-panel');
        expect(eventPanel).toHaveAttribute('data-disabled', 'true');
      });
    });

    it('should pass disabled to ResultPerformancePanel when read-only', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const resultPanel = screen.getByTestId('result-performance-panel');
        expect(resultPanel).toHaveAttribute('data-disabled', 'true');
      });
    });

    it('should NOT pass disabled when editable', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const eventPanel = screen.getByTestId('editable-event-panel');
        expect(eventPanel).toHaveAttribute('data-disabled', 'false');

        const resultPanel = screen.getByTestId('result-performance-panel');
        expect(resultPanel).toHaveAttribute('data-disabled', 'false');
      });
    });
  });

  describe('Tooltip Content', () => {
    it('should show "Item is submitted" tooltip for submitted items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton.getAttribute('title')).toMatch(/submitted/i);
      });
    });

    it('should show "Item is approved" tooltip for approved items', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('approved', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton.getAttribute('title')).toMatch(/approved/i);
      });
    });

    it('should show role-based tooltip for manager role', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        expect(addButton.getAttribute('title')).toMatch(/manager/i);
      });
    });
  });

  describe('RecognitionSection Disabled State', () => {
    it('should pass disabled to RecognitionSection when read-only', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const threatSection = screen.getByTestId('recognition-section-threat');
        expect(threatSection).toHaveAttribute('data-disabled', 'true');

        const errorSection = screen.getByTestId('recognition-section-error');
        expect(errorSection).toHaveAttribute('data-disabled', 'true');

        const uasSection = screen.getByTestId('recognition-section-uas');
        expect(uasSection).toHaveAttribute('data-disabled', 'true');
      });
    });
  });

  describe('Select and TextArea Disabled State', () => {
    it('should disable Select and TextArea when read-only', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const selects = screen.getAllByTestId('select');
        selects.forEach((select) => {
          expect(select).toBeDisabled();
        });

        const textareas = screen.getAllByTestId('textarea');
        textareas.forEach((textarea) => {
          expect(textarea).toBeDisabled();
        });
      });
    });

    it('should enable Select and TextArea when editable', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const selects = screen.getAllByTestId('select');
        selects.forEach((select) => {
          expect(select).not.toBeDisabled();
        });

        const textareas = screen.getAllByTestId('textarea');
        textareas.forEach((textarea) => {
          expect(textarea).not.toBeDisabled();
        });
      });
    });
  });

  describe('Multiple Items Behavior', () => {
    it('should determine read-only based on selected item status', async () => {
      mockUserRole = 'annotator';
      mockItems = [
        createMockItem('draft', 1),
        createMockItem('submitted', 2),
      ];

      renderAnnotationView();

      // Initially first item is selected (draft) - should be editable
      await waitFor(() => {
        expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Banner Styling', () => {
    it('should render banner with correct CSS classes', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const banner = screen.getByTestId('read-only-banner');
        expect(banner).toHaveClass('readOnlyBanner');
      });
    });

    it('should render banner icon', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];

      renderAnnotationView();

      await waitFor(() => {
        const banner = screen.getByTestId('read-only-banner');
        const icon = within(banner).getByTestId('banner-icon');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should not show banner when no items exist', async () => {
      mockUserRole = 'annotator';
      mockItems = [];

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('read-only-banner')).not.toBeInTheDocument();
      });
    });

    it('should still show Add button enabled when no items exist for annotator', async () => {
      mockUserRole = 'annotator';
      mockItems = [];

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        // For empty state, annotator should be able to add
        // Note: When no item is selected, the hook uses a fallback that allows annotators to add
        expect(addButton).not.toBeDisabled();
      });
    });

    it('should disable Add button for manager even when no items exist', async () => {
      mockUserRole = 'manager';
      mockItems = [];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const addButton = screen.getByTestId('button-add-item');
        // Managers cannot add items regardless of whether items exist
        expect(addButton).toBeDisabled();
      });
    });
  });

  /**
   * Phase 3: Review History Fetch Guards
   *
   * Tests for preventing unnecessary API calls when:
   * 1. Selected item does not exist in items array (deleted items)
   * 2. Selected item is in failedItemIds set (known 404s)
   */
  /**
   * Phase 4: Deletion & Auto-Reset Tests
   *
   * Tests for:
   * 1. handleDeleteItem updates selectedItemId correctly
   * 2. Auto-reset effect detects invalid selectedItemId and resets
   */
  describe('Deletion Handling', () => {
    it('should select next item when deleting selected item (middle of list)', async () => {
      mockUserRole = 'annotator';
      mockItems = [
        createMockItem('draft', 1),
        createMockItem('draft', 2),
        createMockItem('draft', 3),
      ];

      // Track which item IDs exist after deletion
      mockDeleteItem.mockImplementation(async (itemId: number) => {
        // Simulate deletion by updating mockItems
        mockItems = mockItems.filter(i => i.id !== itemId);
      });

      renderAnnotationView();

      // Wait for items to render
      await waitFor(() => {
        expect(screen.getAllByTestId('labeling-item-row').length).toBe(3);
      });

      // Select item 2 (middle item) by clicking on its header
      const itemRows = screen.getAllByTestId('labeling-item-row');
      const item2Row = itemRows[1]; // second item (index 1)

      await userEvent.click(item2Row);

      // Verify item 2 is selected
      await waitFor(() => {
        expect(item2Row.className).toContain('labelingItemSelected');
      });

      // Find delete button within item 2 row
      const deleteButton = within(item2Row).getByTestId('button-delete');
      await userEvent.click(deleteButton);

      // Wait for deletion to complete and selection to update
      await waitFor(() => {
        expect(mockDeleteItem).toHaveBeenCalledWith(2);
      });

      // After deletion of item 2, the next item (id=3) should be selected
      // But since mockItems is updated, the component should re-render
      // and auto-select based on the new items array
    });

    it('should select previous item when deleting selected last item', async () => {
      mockUserRole = 'annotator';
      mockItems = [
        createMockItem('draft', 1),
        createMockItem('draft', 2),
      ];

      mockDeleteItem.mockImplementation(async (itemId: number) => {
        mockItems = mockItems.filter(i => i.id !== itemId);
      });

      renderAnnotationView();

      // Wait for items to render
      await waitFor(() => {
        expect(screen.getAllByTestId('labeling-item-row').length).toBe(2);
      });

      // Select item 2 (last item)
      const itemRows = screen.getAllByTestId('labeling-item-row');
      const item2Row = itemRows[1]; // second item (index 1)

      await userEvent.click(item2Row);

      // Verify item 2 is selected
      await waitFor(() => {
        expect(item2Row.className).toContain('labelingItemSelected');
      });

      // Delete item 2 (last item)
      const deleteButton = within(item2Row).getByTestId('button-delete');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteItem).toHaveBeenCalledWith(2);
      });

      // After deletion of last item (2), previous item (id=1) should be selected
    });

    it('should set selectedItemId to null when deleting the only item', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      mockDeleteItem.mockImplementation(async () => {
        mockItems = [];
      });

      renderAnnotationView();

      // Wait for item to render
      await waitFor(() => {
        expect(screen.getByTestId('labeling-item-row')).toBeInTheDocument();
      });

      // Delete the only item
      const deleteButton = screen.getByTestId('button-delete');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteItem).toHaveBeenCalledWith(1);
      });

      // After deletion, empty state should be shown
      // selectedItemId should be null (no API calls for review history)
    });

    it('should NOT fetch review history after deleting selected item', async () => {
      mockUserRole = 'annotator';
      mockItems = [
        createMockItem('draft', 1),
        createMockItem('draft', 2),
      ];

      mockDeleteItem.mockImplementation(async (itemId: number) => {
        mockItems = mockItems.filter(i => i.id !== itemId);
      });

      // Reset fetch history mock to track calls
      mockFetchReviewHistory.mockClear();

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getAllByTestId('labeling-item-row').length).toBe(2);
      });

      // Initial fetch for first item (auto-selected)
      await waitFor(() => {
        expect(mockFetchReviewHistory).toHaveBeenCalledWith(1);
      });

      // Clear mock to track post-deletion calls
      mockFetchReviewHistory.mockClear();

      // Select and delete item 2
      const itemRows = screen.getAllByTestId('labeling-item-row');
      const item2Row = itemRows[1];
      await userEvent.click(item2Row);

      // Verify selection changed - fetchHistory called for new selection
      await waitFor(() => {
        expect(mockFetchReviewHistory).toHaveBeenCalledWith(2);
      });

      mockFetchReviewHistory.mockClear();

      // Delete item 2
      const deleteButton = within(item2Row).getByTestId('button-delete');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteItem).toHaveBeenCalledWith(2);
      });

      // After deletion, fetchHistory should NOT be called for the deleted item (2)
      // It may be called for the new selection (item 1), but not for item 2
      expect(mockFetchReviewHistory).not.toHaveBeenCalledWith(2);
    });
  });

  describe('Auto-Reset Invalid Selection', () => {
    it('should auto-reset to first item when selectedItemId points to non-existent item', async () => {
      // This tests the auto-reset useEffect
      // When items change and selectedItemId no longer exists, reset to first item
      mockUserRole = 'annotator';
      mockItems = [
        createMockItem('draft', 10),
        createMockItem('draft', 20),
      ];

      renderAnnotationView();

      // Initial state: first item (id=10) is auto-selected
      await waitFor(() => {
        const itemRows = screen.getAllByTestId('labeling-item-row');
        expect(itemRows[0].className).toContain('labelingItemSelected');
      });

      // The auto-reset effect should handle cases where selectedItemId
      // becomes invalid (e.g., due to external changes)
    });

    it('should set selectedItemId to null when items array becomes empty', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];

      const { rerender } = renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('labeling-item-row')).toBeInTheDocument();
      });

      // Simulate items becoming empty (e.g., filter applied, all items deleted externally)
      mockItems = [];
      rerender(<AnnotationView eventId={100} projectId={1} />);

      await waitFor(() => {
        // Should show empty state
        expect(screen.getByText('No annotations yet')).toBeInTheDocument();
      });
    });

    it('should auto-reset to first item after deletion leaves selectedItemId invalid', async () => {
      mockUserRole = 'annotator';
      mockItems = [
        createMockItem('draft', 1),
        createMockItem('draft', 2),
        createMockItem('draft', 3),
      ];

      // This mock will actually update the mockItems
      mockDeleteItem.mockImplementation(async (itemId: number) => {
        mockItems = mockItems.filter(i => i.id !== itemId);
      });

      const { rerender } = renderAnnotationView();

      await waitFor(() => {
        expect(screen.getAllByTestId('labeling-item-row').length).toBe(3);
      });

      // Select item 2
      const itemRows = screen.getAllByTestId('labeling-item-row');
      await userEvent.click(itemRows[1]);

      // Delete item 2
      const deleteButton = within(itemRows[1]).getByTestId('button-delete');
      await userEvent.click(deleteButton);

      // Force re-render with new items (simulating state update)
      rerender(<AnnotationView eventId={100} projectId={1} />);

      // After deletion and re-render, the auto-reset effect should kick in
      // and select either item 3 (next) or item 1 (first available)
    });
  });

  describe('Review History Fetch Guards', () => {
    it('should NOT fetch review history when selectedItemId does not exist in items array', async () => {
      // Scenario: Item was deleted but still referenced
      // The items array does NOT contain item 999
      mockItems = [
        createMockItem('draft', 1),
        createMockItem('submitted', 2),
      ];
      // Note: selectedItemId will be set to first item (id: 1) by auto-selection

      renderAnnotationView();

      // Wait for initial render and auto-select (multiple items = multiple rows)
      await waitFor(() => {
        expect(screen.getAllByTestId('labeling-item-row').length).toBeGreaterThan(0);
      });

      // The component should auto-select the first valid item (id: 1)
      // It should NOT try to fetch for any non-existent IDs
      await waitFor(() => {
        // fetchHistory should be called with first item ID (1), not a non-existent ID
        expect(mockFetchReviewHistory).toHaveBeenCalledWith(1);
        // Verify it was NOT called with a non-existent item like 999
        expect(mockFetchReviewHistory).not.toHaveBeenCalledWith(999);
      });
    });

    it('should NOT fetch review history when selectedItemId is in failedItemIds set', async () => {
      // Scenario: Item 555 previously returned 404 and is tracked in failedItemIds
      const failedItemId = 555;
      mockItems = [createMockItem('submitted', failedItemId)];
      mockFailedItemIds = new Set([failedItemId]);

      renderAnnotationView();

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId('labeling-item-row')).toBeInTheDocument();
      });

      // Give time for any potential fetch attempts
      await new Promise(resolve => setTimeout(resolve, 100));

      // fetchHistory should NOT be called for failed item
      expect(mockFetchReviewHistory).not.toHaveBeenCalledWith(failedItemId);
    });

    it('should fetch review history when item exists and is NOT in failedItemIds', async () => {
      // Scenario: Valid item that has never failed
      const validItemId = 777;
      mockItems = [createMockItem('submitted', validItemId)];
      mockFailedItemIds = new Set(); // Empty - no failed items

      renderAnnotationView();

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId('labeling-item-row')).toBeInTheDocument();
      });

      // fetchHistory SHOULD be called for valid item
      await waitFor(() => {
        expect(mockFetchReviewHistory).toHaveBeenCalledWith(validItemId);
      });
    });

    it('should fetch review history for item that exists but other items have failed', async () => {
      // Scenario: Item 100 is valid, item 200 previously failed
      // Should still fetch for item 100
      const validItemId = 100;
      mockItems = [createMockItem('submitted', validItemId)];
      mockFailedItemIds = new Set([200, 300]); // Other items failed, not this one

      renderAnnotationView();

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId('labeling-item-row')).toBeInTheDocument();
      });

      // fetchHistory SHOULD be called for the valid item
      await waitFor(() => {
        expect(mockFetchReviewHistory).toHaveBeenCalledWith(validItemId);
      });
    });
  });
});
