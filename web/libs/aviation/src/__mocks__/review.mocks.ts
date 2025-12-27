/**
 * Mock data for the Aviation review system.
 * Used in tests and Storybook stories.
 */

import type {
  FieldFeedback,
  FieldFeedbackInput,
  ReviewDecision,
  ReviewHistoryResponse,
  ReviewUser,
} from '../types/review.types';

// =============================================================================
// Mock Users
// =============================================================================

export const MOCK_ADMIN_USER: ReviewUser = {
  id: 1,
  username: 'admin_user',
  email: 'admin@example.com',
  role: 'admin',
};

export const MOCK_RESEARCHER_USER: ReviewUser = {
  id: 2,
  username: 'researcher_user',
  email: 'researcher@example.com',
  role: 'researcher',
};

export const MOCK_ANNOTATOR_USER: ReviewUser = {
  id: 3,
  username: 'annotator_user',
  email: 'annotator@example.com',
  role: 'annotator',
};

// =============================================================================
// Mock Field Feedbacks
// =============================================================================

export const MOCK_FIELD_FEEDBACK_THREAT_L1: FieldFeedback = {
  id: 1,
  labeling_item: 100,
  review_decision: 1,
  field_name: 'threat_type_l1',
  feedback_type: 'partial',
  feedback_comment: 'The threat category selection is close but should be more specific. Consider reviewing the environmental threat options.',
  reviewed_by: 2,
  reviewed_at: '2025-01-15T10:30:00Z',
};

export const MOCK_FIELD_FEEDBACK_THREAT_MANAGEMENT: FieldFeedback = {
  id: 2,
  labeling_item: 100,
  review_decision: 1,
  field_name: 'threat_management',
  feedback_type: 'full',
  feedback_comment: 'The management classification is incorrect. This threat was clearly managed as evidenced by the crew response documented in the event description.',
  reviewed_by: 2,
  reviewed_at: '2025-01-15T10:30:00Z',
};

export const MOCK_FIELD_FEEDBACK_ERROR_DESCRIPTION: FieldFeedback = {
  id: 3,
  labeling_item: 100,
  review_decision: 1,
  field_name: 'error_description',
  feedback_type: 'revision',
  feedback_comment: 'Please add more detail about the timing of the error relative to the approach phase.',
  reviewed_by: 2,
  reviewed_at: '2025-01-15T10:30:00Z',
};

export const MOCK_FIELD_FEEDBACK_UAS_TYPE: FieldFeedback = {
  id: 4,
  labeling_item: 101,
  review_decision: 2,
  field_name: 'uas_type_l2',
  feedback_type: 'partial',
  feedback_comment: 'The UAS subcategory needs refinement. Check if this better fits under operational deviations.',
  reviewed_by: 1,
  reviewed_at: '2025-01-16T14:00:00Z',
};

export const MOCK_FIELD_FEEDBACK_ERROR_IMPACT: FieldFeedback = {
  id: 5,
  labeling_item: 102,
  review_decision: 3,
  field_name: 'error_impact',
  feedback_type: 'full',
  feedback_comment: 'The error clearly led to a UAS condition. Please review the impact classification.',
  reviewed_by: 2,
  reviewed_at: '2025-01-17T09:15:00Z',
};

// =============================================================================
// Mock Field Feedback Inputs (for API requests)
// =============================================================================

export const MOCK_FIELD_FEEDBACK_INPUT_PARTIAL: FieldFeedbackInput = {
  field_name: 'threat_type_l1',
  feedback_type: 'partial',
  feedback_comment: 'The threat category selection is close but should be more specific.',
};

export const MOCK_FIELD_FEEDBACK_INPUT_FULL: FieldFeedbackInput = {
  field_name: 'error_management',
  feedback_type: 'full',
  feedback_comment: 'The management classification is incorrect.',
};

export const MOCK_FIELD_FEEDBACK_INPUT_REVISION: FieldFeedbackInput = {
  field_name: 'uas_description',
  feedback_type: 'revision',
  feedback_comment: 'Please provide more context about the UAS recovery procedure.',
};

// =============================================================================
// Mock Review Decisions
// =============================================================================

export const MOCK_REVIEW_DECISION_APPROVED: ReviewDecision = {
  id: 1,
  labeling_item: 100,
  status: 'approved',
  reviewer: 2,
  reviewer_name: 'Dr. Sarah Chen',
  reviewer_comment: 'Excellent annotation work. All classifications are accurate and well-documented.',
  field_feedbacks: [],
  created_at: '2025-01-15T16:00:00Z',
};

export const MOCK_REVIEW_DECISION_REJECTED_PARTIAL: ReviewDecision = {
  id: 2,
  labeling_item: 101,
  status: 'rejected_partial',
  reviewer: 2,
  reviewer_name: 'Dr. Sarah Chen',
  reviewer_comment: 'Good work overall, but some fields need adjustment. Please review the highlighted fields.',
  field_feedbacks: [
    MOCK_FIELD_FEEDBACK_THREAT_L1,
    MOCK_FIELD_FEEDBACK_ERROR_DESCRIPTION,
  ],
  created_at: '2025-01-15T10:30:00Z',
};

export const MOCK_REVIEW_DECISION_REJECTED_FULL: ReviewDecision = {
  id: 3,
  labeling_item: 102,
  status: 'rejected_full',
  reviewer: 1,
  reviewer_name: 'Admin User',
  reviewer_comment: 'This annotation requires significant revision. Multiple classification errors were identified.',
  field_feedbacks: [
    MOCK_FIELD_FEEDBACK_THREAT_MANAGEMENT,
    MOCK_FIELD_FEEDBACK_ERROR_IMPACT,
    {
      id: 6,
      labeling_item: 102,
      review_decision: 3,
      field_name: 'uas_type_l1',
      feedback_type: 'full',
      feedback_comment: 'UAS type needs to be completely reconsidered based on the event outcome.',
      reviewed_by: 1,
      reviewed_at: '2025-01-16T11:00:00Z',
    },
  ],
  created_at: '2025-01-16T11:00:00Z',
};

export const MOCK_REVIEW_DECISION_REVISION_REQUESTED: ReviewDecision = {
  id: 4,
  labeling_item: 103,
  status: 'revision_requested',
  reviewer: 2,
  reviewer_name: 'Dr. Sarah Chen',
  reviewer_comment: 'Please add more detail to certain fields before final approval.',
  field_feedbacks: [
    {
      id: 7,
      labeling_item: 103,
      review_decision: 4,
      field_name: 'threat_description',
      feedback_type: 'revision',
      feedback_comment: 'Please elaborate on the environmental conditions that contributed to this threat.',
      reviewed_by: 2,
      reviewed_at: '2025-01-17T13:00:00Z',
    },
    {
      id: 8,
      labeling_item: 103,
      review_decision: 4,
      field_name: 'error_coping_abilities',
      feedback_type: 'revision',
      feedback_comment: 'Add assessment of crew workload management during error recovery.',
      reviewed_by: 2,
      reviewed_at: '2025-01-17T13:00:00Z',
    },
  ],
  created_at: '2025-01-17T13:00:00Z',
};

// =============================================================================
// Mock Review History
// =============================================================================

/**
 * Review history for an item that went through multiple review cycles.
 * Shows progression: initial submission -> partial rejection -> revision -> approval
 */
export const MOCK_REVIEW_HISTORY_MULTI_CYCLE: ReviewHistoryResponse = {
  labeling_item: 100,
  decisions: [
    {
      id: 10,
      labeling_item: 100,
      status: 'rejected_partial',
      reviewer: 2,
      reviewer_name: 'Dr. Sarah Chen',
      reviewer_comment: 'Initial review found some issues with threat classification.',
      field_feedbacks: [
        {
          id: 20,
          labeling_item: 100,
          review_decision: 10,
          field_name: 'threat_type_l2',
          feedback_type: 'partial',
          feedback_comment: 'Please reconsider the subcategory selection.',
          reviewed_by: 2,
          reviewed_at: '2025-01-10T09:00:00Z',
        },
      ],
      created_at: '2025-01-10T09:00:00Z',
    },
    {
      id: 11,
      labeling_item: 100,
      status: 'revision_requested',
      reviewer: 2,
      reviewer_name: 'Dr. Sarah Chen',
      reviewer_comment: 'Improvements made, but description needs more detail.',
      field_feedbacks: [
        {
          id: 21,
          labeling_item: 100,
          review_decision: 11,
          field_name: 'threat_description',
          feedback_type: 'revision',
          feedback_comment: 'Good correction on type, now please expand the description.',
          reviewed_by: 2,
          reviewed_at: '2025-01-12T14:30:00Z',
        },
      ],
      created_at: '2025-01-12T14:30:00Z',
    },
    {
      id: 12,
      labeling_item: 100,
      status: 'approved',
      reviewer: 2,
      reviewer_name: 'Dr. Sarah Chen',
      reviewer_comment: 'All issues addressed. Excellent revision work.',
      field_feedbacks: [],
      created_at: '2025-01-14T10:00:00Z',
    },
  ],
  current_status: 'approved',
  pending_revision_fields: [],
};

/**
 * Review history for an item currently pending revision.
 */
export const MOCK_REVIEW_HISTORY_PENDING_REVISION: ReviewHistoryResponse = {
  labeling_item: 103,
  decisions: [MOCK_REVIEW_DECISION_REVISION_REQUESTED],
  current_status: 'revision_requested',
  pending_revision_fields: ['threat_description', 'error_coping_abilities'],
};

/**
 * Review history for a newly submitted item with no reviews yet.
 */
export const MOCK_REVIEW_HISTORY_EMPTY: ReviewHistoryResponse = {
  labeling_item: 200,
  decisions: [],
  current_status: null,
  pending_revision_fields: [],
};

/**
 * Review history for a fully rejected item.
 */
export const MOCK_REVIEW_HISTORY_FULL_REJECTION: ReviewHistoryResponse = {
  labeling_item: 102,
  decisions: [MOCK_REVIEW_DECISION_REJECTED_FULL],
  current_status: 'rejected_full',
  pending_revision_fields: [
    'threat_management',
    'error_impact',
    'uas_type_l1',
  ],
};

// =============================================================================
// Mock Collections (for list views and testing)
// =============================================================================

export const MOCK_ALL_USERS: ReviewUser[] = [
  MOCK_ADMIN_USER,
  MOCK_RESEARCHER_USER,
  MOCK_ANNOTATOR_USER,
];

export const MOCK_ALL_FIELD_FEEDBACKS: FieldFeedback[] = [
  MOCK_FIELD_FEEDBACK_THREAT_L1,
  MOCK_FIELD_FEEDBACK_THREAT_MANAGEMENT,
  MOCK_FIELD_FEEDBACK_ERROR_DESCRIPTION,
  MOCK_FIELD_FEEDBACK_UAS_TYPE,
  MOCK_FIELD_FEEDBACK_ERROR_IMPACT,
];

export const MOCK_ALL_REVIEW_DECISIONS: ReviewDecision[] = [
  MOCK_REVIEW_DECISION_APPROVED,
  MOCK_REVIEW_DECISION_REJECTED_PARTIAL,
  MOCK_REVIEW_DECISION_REJECTED_FULL,
  MOCK_REVIEW_DECISION_REVISION_REQUESTED,
];

// =============================================================================
// Factory Functions (for generating custom mock data)
// =============================================================================

/**
 * Create a mock FieldFeedback with custom properties.
 */
export const createMockFieldFeedback = (
  overrides: Partial<FieldFeedback> = {}
): FieldFeedback => ({
  id: Math.floor(Math.random() * 10000),
  labeling_item: 100,
  review_decision: 1,
  field_name: 'threat_type_l1',
  feedback_type: 'partial',
  feedback_comment: 'Mock feedback comment',
  reviewed_by: 2,
  reviewed_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock ReviewDecision with custom properties.
 */
export const createMockReviewDecision = (
  overrides: Partial<ReviewDecision> = {}
): ReviewDecision => ({
  id: Math.floor(Math.random() * 10000),
  labeling_item: 100,
  status: 'approved',
  reviewer: 2,
  reviewer_name: 'Mock Reviewer',
  reviewer_comment: 'Mock review comment',
  field_feedbacks: [],
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock ReviewHistoryResponse with custom properties.
 */
export const createMockReviewHistory = (
  overrides: Partial<ReviewHistoryResponse> = {}
): ReviewHistoryResponse => ({
  labeling_item: 100,
  decisions: [],
  current_status: null,
  pending_revision_fields: [],
  ...overrides,
});

/**
 * Create a mock ReviewUser with custom properties.
 */
export const createMockReviewUser = (
  overrides: Partial<ReviewUser> = {}
): ReviewUser => ({
  id: Math.floor(Math.random() * 10000),
  username: 'mock_user',
  email: 'mock@example.com',
  role: 'annotator',
  ...overrides,
});
