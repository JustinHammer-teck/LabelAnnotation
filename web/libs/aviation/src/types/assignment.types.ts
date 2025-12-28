/**
 * Aviation Project Assignment Types
 *
 * TypeScript interfaces for managing user assignments to aviation projects
 * via Guardian permissions. These types match the backend serializer structure
 * for the assignment API endpoints.
 *
 * API Endpoints:
 * - GET /api/aviation/projects/<pk>/assignment/ - List all users with assignment status
 * - POST /api/aviation/projects/<pk>/assignment/ - Toggle user assignments
 *
 * @module types/assignment.types
 */

/**
 * Represents a user's assignment status for an aviation project.
 * Returned by GET /api/aviation/projects/<pk>/assignment/
 *
 * @example
 * ```typescript
 * const assignment: AviationProjectAssignment = {
 *   user_id: 42,
 *   user_email: 'pilot@aviation.com',
 *   has_permission: true,
 * };
 * ```
 */
export interface AviationProjectAssignment {
  /** User ID from Django auth_user */
  user_id: number;

  /** User email address */
  user_email: string;

  /** Whether user has assigned_to_aviation_project permission for this project */
  has_permission: boolean;
}

/**
 * Represents a single user assignment change.
 * Used in POST payload to toggle assignment status.
 *
 * @example
 * ```typescript
 * const change: AssignmentUser = {
 *   user_id: 42,
 *   has_permission: false, // Unassign user
 * };
 * ```
 */
export interface AssignmentUser {
  /** User ID to assign/unassign */
  user_id: number;

  /** True to assign, false to unassign */
  has_permission: boolean;
}

/**
 * Payload for toggling user assignments.
 * Sent to POST /api/aviation/projects/<pk>/assignment/
 *
 * @example
 * ```typescript
 * const payload: ToggleAssignmentPayload = {
 *   users: [
 *     { user_id: 1, has_permission: true },
 *     { user_id: 2, has_permission: false },
 *   ],
 * };
 * ```
 */
export interface ToggleAssignmentPayload {
  /** Array of user assignment changes */
  users: AssignmentUser[];
}

/**
 * Response from assignment API operations.
 * Both fields are optional to handle various response scenarios.
 */
export interface AssignmentApiResponse {
  /** Success status */
  success?: boolean;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Map of user_id to has_permission for quick lookups.
 * Used for efficient permission checking in UI components.
 */
export type AssignmentMap = Record<number, boolean>;

/**
 * Type guard to check if an object is a valid AviationProjectAssignment.
 *
 * @param obj - Object to check
 * @returns True if object matches AviationProjectAssignment structure
 *
 * @example
 * ```typescript
 * const data = await fetchAssignment();
 * if (isAviationProjectAssignment(data)) {
 *   console.log(data.user_email); // TypeScript knows this is safe
 * }
 * ```
 */
export function isAviationProjectAssignment(
  obj: unknown
): obj is AviationProjectAssignment {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  return (
    typeof candidate.user_id === 'number' &&
    typeof candidate.user_email === 'string' &&
    typeof candidate.has_permission === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid AssignmentUser.
 *
 * @param obj - Object to check
 * @returns True if object matches AssignmentUser structure
 *
 * @example
 * ```typescript
 * const change = { user_id: 1, has_permission: true };
 * if (isAssignmentUser(change)) {
 *   payload.users.push(change);
 * }
 * ```
 */
export function isAssignmentUser(obj: unknown): obj is AssignmentUser {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  return (
    typeof candidate.user_id === 'number' &&
    typeof candidate.has_permission === 'boolean'
  );
}

/**
 * Convert assignment array to map for quick permission lookups.
 *
 * @param assignments - Array of assignments from API
 * @returns Map of user_id to has_permission
 *
 * @example
 * ```typescript
 * const assignments = await api.getAssignments(projectId);
 * const map = assignmentsToMap(assignments);
 *
 * // Quick lookup
 * if (map[userId]) {
 *   console.log('User is assigned');
 * }
 * ```
 */
export function assignmentsToMap(
  assignments: AviationProjectAssignment[]
): AssignmentMap {
  return assignments.reduce((map, assignment) => {
    map[assignment.user_id] = assignment.has_permission;
    return map;
  }, {} as AssignmentMap);
}
