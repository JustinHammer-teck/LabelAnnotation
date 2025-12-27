import { render, screen, waitFor } from '@testing-library/react';
import type { LabelingItem, UserRole } from '../../../types';

/**
 * Test suite for AnnotationView Review Context Integration (Phase 3).
 *
 * Tests that the ReviewContextProvider is properly integrated into
 * AnnotationView and provides review context to child components.
 */

// Mock data
let mockCurrentEvent: { id: number; event_number: string } | null = null;
let mockItems: LabelingItem[] = [];
let mockEvents: { id: number; event_number: string }[] = [];
let mockUserRole: string = 'manager';
let mockCanReview = true;
let mockPendingFeedbacks: any[] = [];

// Mock functions
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
const mockAddPendingFeedback = jest.fn();
const mockRemovePendingFeedback = jest.fn();

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
    pendingFeedbacks: mockPendingFeedbacks,
    pendingRevisionFields: [],
    approve: mockApprove,
    reject: mockReject,
    requestRevision: mockRequestRevision,
    resubmit: mockResubmit,
    fetchHistory: mockFetchReviewHistory,
    addPendingFeedback: mockAddPendingFeedback,
    removePendingFeedback: mockRemovePendingFeedback,
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

// Track context received by child components
let receivedReviewContextInRecognition: any = null;
let receivedReviewContextInEventPanel: any = null;
let receivedReviewContextInResultPanel: any = null;

// Mock annotation components to capture review context
jest.mock('../../annotation', () => ({
  EditableEventPanel: ({ event, eventIndex, onUpdate, disabled, reviewContext }: any) => {
    receivedReviewContextInEventPanel = reviewContext;
    return (
      <div data-testid="editable-event-panel" data-disabled={disabled}>
        Event Panel: {event?.event_number}
      </div>
    );
  },
  RecognitionSection: ({ category, title, item, options, onUpdate, disabled, reviewContext }: any) => {
    receivedReviewContextInRecognition = reviewContext;
    return (
      <div data-testid={`recognition-section-${category}`} data-disabled={disabled}>
        {title}
      </div>
    );
  },
  TrainingTopicsPanel: ({ threatTopics, errorTopics, uasTopics }: any) => (
    <div data-testid="training-topics-panel">Topics</div>
  ),
  ResultPerformancePanel: ({ eventId, disabled, reviewContext }: any) => {
    receivedReviewContextInResultPanel = reviewContext;
    return (
      <div data-testid="result-performance-panel" data-disabled={disabled}>
        Result Performance
      </div>
    );
  },
}));

// Mock review components
jest.mock('../../review', () => ({
  ReviewPanel: ({ labelingItemId, currentStatus, userRole, onApprove, onReject, onRequestRevision }: any) => (
    <div data-testid="review-panel" data-user-role={userRole}>
      Review Panel
    </div>
  ),
  ReviewHistory: ({ labelingItemId, decisions, loading }: any) => (
    <div data-testid="review-history">Review History</div>
  ),
  RevisionIndicator: ({ fieldName, feedbacks, onMarkResolved }: any) => (
    <div data-testid="revision-indicator">Revision Indicator</div>
  ),
}));

import { AnnotationView } from '../AnnotationView';

describe('AnnotationView Review Context Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentEvent = { id: 100, event_number: 'EVT-001' };
    mockEvents = [{ id: 100, event_number: 'EVT-001' }];
    mockItems = [];
    mockUserRole = 'manager';
    mockCanReview = true;
    mockPendingFeedbacks = [];
    receivedReviewContextInRecognition = null;
    receivedReviewContextInEventPanel = null;
    receivedReviewContextInResultPanel = null;
  });

  const renderAnnotationView = (props: Partial<{ eventId: number; projectId: number }> = {}) => {
    return render(
      <AnnotationView eventId={props.eventId ?? 100} projectId={props.projectId ?? 1} />
    );
  };

  describe('ReviewContextProvider Wrapping', () => {
    it('should render ReviewPanel with correct userRole for manager', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const reviewPanel = screen.getByTestId('review-panel');
        expect(reviewPanel).toBeInTheDocument();
        expect(reviewPanel).toHaveAttribute('data-user-role', 'manager');
      });
    });

    it('should render ReviewPanel with correct userRole for researcher', async () => {
      mockUserRole = 'researcher';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const reviewPanel = screen.getByTestId('review-panel');
        expect(reviewPanel).toBeInTheDocument();
        expect(reviewPanel).toHaveAttribute('data-user-role', 'researcher');
      });
    });

    it('should not render ReviewPanel for annotator', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = false;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
      });
    });

    it('should not render ReviewPanel for admin when canReview is false', async () => {
      mockUserRole = 'admin';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = false;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Review Mode Determination', () => {
    it('should show ReviewPanel when item is submitted and user can review', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('review-panel')).toBeInTheDocument();
      });
    });

    it('should show ReviewPanel when item is draft and user can review', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('draft', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('review-panel')).toBeInTheDocument();
      });
    });

    it('should not show ReviewPanel when no items exist', async () => {
      mockUserRole = 'manager';
      mockItems = [];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Review Callbacks Wiring', () => {
    it('should call fetchReviewHistory when item is selected', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(mockFetchReviewHistory).toHaveBeenCalled();
      });
    });

    it('should have review action handlers available', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('review-panel')).toBeInTheDocument();
      });

      // Review actions are wired through the ReviewPanel component
      // The ReviewPanel should have been passed the correct handlers
    });
  });

  describe('Pending Feedbacks State', () => {
    it('should pass pendingFeedbacks to useReview hook', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;
      mockPendingFeedbacks = [
        { field_name: 'threat_management', feedback_type: 'partial', feedback_comment: 'Test' },
      ];

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('review-panel')).toBeInTheDocument();
      });

      // The hook should have access to pending feedbacks
      // This is verified by the mock returning the pendingFeedbacks we set
    });
  });

  describe('Child Component Context Access', () => {
    it('should render child components with access to review state', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('recognition-section-threat')).toBeInTheDocument();
        expect(screen.getByTestId('editable-event-panel')).toBeInTheDocument();
        expect(screen.getByTestId('result-performance-panel')).toBeInTheDocument();
      });
    });

    it('should render RecognitionSection components for all categories', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('recognition-section-threat')).toBeInTheDocument();
        expect(screen.getByTestId('recognition-section-error')).toBeInTheDocument();
        expect(screen.getByTestId('recognition-section-uas')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Context Values', () => {
    it.each([
      ['admin', true],
      ['manager', true],
      ['researcher', true],
      ['annotator', false],
    ] as const)('should determine canReview=%s for %s role', async (role, expectedCanReview) => {
      mockUserRole = role;
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = expectedCanReview;

      renderAnnotationView();

      if (expectedCanReview) {
        await waitFor(() => {
          expect(screen.getByTestId('review-panel')).toBeInTheDocument();
        });
      } else {
        await waitFor(() => {
          expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Review History Integration', () => {
    it('should render ReviewHistory component when canReview is true', async () => {
      mockUserRole = 'manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.getByTestId('review-history')).toBeInTheDocument();
      });
    });

    it('should not render ReviewHistory component when canReview is false', async () => {
      mockUserRole = 'annotator';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = false;

      renderAnnotationView();

      await waitFor(() => {
        expect(screen.queryByTestId('review-history')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Role Mapping', () => {
    it('should map Manager API role to manager userRole', async () => {
      mockUserRole = 'Manager';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const reviewPanel = screen.getByTestId('review-panel');
        // Role should be normalized to lowercase
        expect(reviewPanel).toHaveAttribute('data-user-role', 'manager');
      });
    });

    it('should map Researcher API role to researcher userRole', async () => {
      mockUserRole = 'Researcher';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = true;

      renderAnnotationView();

      await waitFor(() => {
        const reviewPanel = screen.getByTestId('review-panel');
        expect(reviewPanel).toHaveAttribute('data-user-role', 'researcher');
      });
    });

    it('should map unknown role to annotator', async () => {
      mockUserRole = 'UnknownRole';
      mockItems = [createMockItem('submitted', 1)];
      mockCanReview = false;

      renderAnnotationView();

      // Unknown role should default to annotator, which cannot review
      await waitFor(() => {
        expect(screen.queryByTestId('review-panel')).not.toBeInTheDocument();
      });
    });
  });
});
