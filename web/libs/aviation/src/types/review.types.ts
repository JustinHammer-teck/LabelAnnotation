/**
 * Review types for the Aviation approval/rejection review system.
 *
 * This module defines TypeScript interfaces for:
 * - Review decision status tracking
 * - Field-level feedback for rejected fields
 * - Review decision audit trail
 * - API request/response types
 * - User role permissions
 */

/**
 * Review decision status.
 * - approved: All fields approved, item moves to 'approved' status
 * - rejected_partial: Some fields rejected, requires revision
 * - rejected_full: All fields rejected, requires full revision
 * - revision_requested: Reviewer requests changes without full rejection
 */
export type ReviewStatus = 'approved' | 'rejected_partial' | 'rejected_full' | 'revision_requested';

/**
 * Feedback type for rejected fields.
 * - partial: Field has some issues but is partially correct
 * - full: Field is completely incorrect
 * - revision: Field needs revision/clarification
 */
export type FeedbackType = 'partial' | 'full' | 'revision';

/**
 * Valid field names that can receive feedback.
 * Maps to LabelingItem field names for threat, error, UAS sections,
 * event panel fields, and result performance fields.
 */
export type ReviewableFieldName =
  // Threat fields
  | 'threat_type'
  | 'threat_type_l1'
  | 'threat_type_l2'
  | 'threat_type_l3'
  | 'threat_management'
  | 'threat_impact'
  | 'threat_coping_abilities'
  | 'threat_description'
  // Error fields
  | 'error_type'
  | 'error_type_l1'
  | 'error_type_l2'
  | 'error_type_l3'
  | 'error_relevance'
  | 'error_management'
  | 'error_impact'
  | 'error_coping_abilities'
  | 'error_description'
  // UAS fields
  | 'uas_type'
  | 'uas_type_l1'
  | 'uas_type_l2'
  | 'uas_type_l3'
  | 'uas_relevance'
  | 'uas_management'
  | 'uas_impact'
  | 'uas_coping_abilities'
  | 'uas_description'
  // Event panel fields
  | 'event_description'
  | 'event_date'
  | 'event_time'
  | 'aircraft_type'
  | 'departure_airport'
  | 'arrival_airport'
  | 'actual_landing_airport'
  | 'event_remarks'
  // Result performance fields
  | 'result_event_type'
  | 'result_flight_phase'
  | 'result_likelihood'
  | 'result_severity'
  | 'result_training_effect'
  | 'result_training_plan'
  | 'result_training_topics'
  | 'result_objectives';

/**
 * Field-level feedback on a specific field within a labeling item.
 * Allows reviewers to provide targeted feedback on individual annotation fields.
 */
export interface FieldFeedback {
  id: number;
  labeling_item: number;
  review_decision: number;
  field_name: ReviewableFieldName;
  feedback_type: FeedbackType;
  feedback_comment: string;
  reviewed_by: number;
  reviewed_at: string;
}

/**
 * Review decision audit trail record.
 * Captures each review action with associated field feedbacks.
 */
export interface ReviewDecision {
  id: number;
  labeling_item: number;
  status: ReviewStatus;
  reviewer: number;
  reviewer_name?: string;
  reviewer_comment: string;
  field_feedbacks: FieldFeedback[];
  created_at: string;
}

/**
 * Field feedback data for API requests (without server-generated fields).
 */
export interface FieldFeedbackInput {
  field_name: ReviewableFieldName;
  feedback_type: FeedbackType;
  feedback_comment: string;
}

/**
 * Request payload for approving a labeling item.
 * Simple approval with optional comment.
 */
export interface ApproveRequest {
  comment?: string;
}

/**
 * Request payload for rejecting a labeling item.
 * Requires rejection status, comment, and field-level feedbacks.
 */
export interface RejectRequest {
  status: 'rejected_partial' | 'rejected_full';
  comment: string;
  field_feedbacks: FieldFeedbackInput[];
}

/**
 * Request payload for requesting revision on a labeling item.
 * Requires comment and field-level feedbacks.
 */
export interface RevisionRequest {
  comment: string;
  field_feedbacks: FieldFeedbackInput[];
}

/**
 * Request payload for annotator resubmitting after revision.
 * Optional comment explaining the changes made.
 */
export interface ResubmitRequest {
  comment?: string;
}

/**
 * Response from review history endpoint.
 */
export interface ReviewHistoryResponse {
  labeling_item: number;
  decisions: ReviewDecision[];
  current_status: ReviewStatus | null;
  pending_revision_fields: ReviewableFieldName[];
}

/**
 * User roles for permission checks.
 * - admin: Full access, can review
 * - manager: Can review annotations
 * - researcher: Can review annotations
 * - annotator: Can annotate and resubmit revisions
 */
export type UserRole = 'admin' | 'manager' | 'researcher' | 'annotator';

/**
 * User with role information for review permission checks.
 */
export interface ReviewUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

/**
 * Check if a user role has permission to review.
 */
export const canReview = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager' || role === 'researcher';
};

/**
 * Check if a user role can resubmit after revision.
 */
export const canResubmit = (role: UserRole): boolean => {
  return role === 'annotator' || role === 'admin' || role === 'researcher';
};
