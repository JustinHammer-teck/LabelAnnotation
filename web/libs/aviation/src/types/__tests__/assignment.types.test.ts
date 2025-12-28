/**
 * Tests for Aviation Project Assignment types.
 * Validates TypeScript interfaces for user assignment to aviation projects.
 *
 * These types support the assignment API endpoints:
 * - GET /api/aviation/projects/<pk>/assignment/ - Returns assignment list
 * - POST /api/aviation/projects/<pk>/assignment/ - Toggle user assignments
 *
 * @module types/__tests__/assignment.types.test
 */
import type {
  AviationProjectAssignment,
  ToggleAssignmentPayload,
  AssignmentUser,
  AssignmentApiResponse,
} from '../assignment.types';

import {
  isAviationProjectAssignment,
  isAssignmentUser,
  assignmentsToMap,
  type AssignmentMap,
} from '../assignment.types';

describe('Assignment Types', () => {
  describe('AviationProjectAssignment', () => {
    it('should accept valid assignment object', () => {
      const validAssignment: AviationProjectAssignment = {
        user_id: 1,
        user_email: 'test@example.com',
        has_permission: true,
      };

      expect(validAssignment.user_id).toBe(1);
      expect(validAssignment.user_email).toBe('test@example.com');
      expect(validAssignment.has_permission).toBe(true);
    });

    it('should require all fields', () => {
      // TypeScript compilation test - this would fail if fields are missing
      // @ts-expect-error - missing has_permission
      const invalid: AviationProjectAssignment = {
        user_id: 1,
        user_email: 'test@example.com',
      };

      expect(invalid).toBeDefined();
    });

    it('should enforce correct types', () => {
      // @ts-expect-error - user_id should be number
      const invalid: AviationProjectAssignment = {
        user_id: '1',
        user_email: 'test@example.com',
        has_permission: true,
      };

      expect(invalid).toBeDefined();
    });

    it('should accept assignment with false permission', () => {
      const assignment: AviationProjectAssignment = {
        user_id: 42,
        user_email: 'user@aviation.com',
        has_permission: false,
      };

      expect(assignment.has_permission).toBe(false);
    });
  });

  describe('AssignmentUser', () => {
    it('should accept valid user assignment change', () => {
      const validUser: AssignmentUser = {
        user_id: 1,
        has_permission: false,
      };

      expect(validUser.user_id).toBe(1);
      expect(validUser.has_permission).toBe(false);
    });

    it('should require user_id to be number', () => {
      // @ts-expect-error - user_id should be number
      const invalid: AssignmentUser = {
        user_id: 'invalid',
        has_permission: true,
      };

      expect(invalid).toBeDefined();
    });

    it('should require has_permission to be boolean', () => {
      // @ts-expect-error - has_permission should be boolean
      const invalid: AssignmentUser = {
        user_id: 1,
        has_permission: 'true',
      };

      expect(invalid).toBeDefined();
    });
  });

  describe('ToggleAssignmentPayload', () => {
    it('should accept array of user changes', () => {
      const validPayload: ToggleAssignmentPayload = {
        users: [
          { user_id: 1, has_permission: true },
          { user_id: 2, has_permission: false },
        ],
      };

      expect(validPayload.users).toHaveLength(2);
      expect(validPayload.users[0].user_id).toBe(1);
    });

    it('should accept empty users array', () => {
      const emptyPayload: ToggleAssignmentPayload = {
        users: [],
      };

      expect(emptyPayload.users).toHaveLength(0);
    });

    it('should accept single user change', () => {
      const singlePayload: ToggleAssignmentPayload = {
        users: [{ user_id: 99, has_permission: true }],
      };

      expect(singlePayload.users).toHaveLength(1);
      expect(singlePayload.users[0].user_id).toBe(99);
    });

    it('should require users array', () => {
      // @ts-expect-error - users is required
      const invalid: ToggleAssignmentPayload = {};

      expect(invalid).toBeDefined();
    });
  });

  describe('AssignmentApiResponse', () => {
    it('should accept success response', () => {
      const response: AssignmentApiResponse = {
        success: true,
      };

      expect(response.success).toBe(true);
    });

    it('should accept error response', () => {
      const response: AssignmentApiResponse = {
        success: false,
        error: 'Permission denied',
      };

      expect(response.error).toBe('Permission denied');
    });

    it('should allow empty response', () => {
      const response: AssignmentApiResponse = {};

      expect(response.success).toBeUndefined();
      expect(response.error).toBeUndefined();
    });
  });

  describe('Type compatibility with backend API', () => {
    it('should match backend GET response structure', () => {
      // Simulate backend response
      const backendResponse = [
        {
          user_id: 1,
          user_email: 'user1@test.com',
          has_permission: true,
        },
        {
          user_id: 2,
          user_email: 'user2@test.com',
          has_permission: false,
        },
      ];

      // Should be assignable to our type
      const assignments: AviationProjectAssignment[] = backendResponse;

      expect(assignments).toHaveLength(2);
      expect(assignments[0].user_id).toBe(1);
    });

    it('should match backend POST request structure', () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      // Simulate what gets sent to backend
      const requestBody = JSON.stringify(payload);
      const parsed = JSON.parse(requestBody);

      expect(parsed.users).toBeDefined();
      expect(parsed.users[0].user_id).toBe(1);
    });
  });
});

describe('Type Guards', () => {
  describe('isAviationProjectAssignment', () => {
    it('should return true for valid assignment object', () => {
      const valid = {
        user_id: 1,
        user_email: 'test@example.com',
        has_permission: true,
      };

      expect(isAviationProjectAssignment(valid)).toBe(true);
    });

    it('should return false for missing fields', () => {
      const invalid = {
        user_id: 1,
        user_email: 'test@example.com',
      };

      expect(isAviationProjectAssignment(invalid)).toBe(false);
    });

    it('should return false for wrong types', () => {
      const invalid = {
        user_id: '1',
        user_email: 'test@example.com',
        has_permission: true,
      };

      expect(isAviationProjectAssignment(invalid)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAviationProjectAssignment(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAviationProjectAssignment(undefined)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isAviationProjectAssignment(42)).toBe(false);
      expect(isAviationProjectAssignment('string')).toBe(false);
    });
  });

  describe('isAssignmentUser', () => {
    it('should return true for valid assignment user', () => {
      const valid = {
        user_id: 1,
        has_permission: false,
      };

      expect(isAssignmentUser(valid)).toBe(true);
    });

    it('should return false for missing has_permission', () => {
      const invalid = {
        user_id: 1,
      };

      expect(isAssignmentUser(invalid)).toBe(false);
    });

    it('should return false for wrong user_id type', () => {
      const invalid = {
        user_id: '1',
        has_permission: true,
      };

      expect(isAssignmentUser(invalid)).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('assignmentsToMap', () => {
    it('should convert assignments array to map', () => {
      const assignments: AviationProjectAssignment[] = [
        { user_id: 1, user_email: 'user1@test.com', has_permission: true },
        { user_id: 2, user_email: 'user2@test.com', has_permission: false },
      ];

      const map: AssignmentMap = assignmentsToMap(assignments);

      expect(map[1]).toBe(true);
      expect(map[2]).toBe(false);
    });

    it('should return empty map for empty array', () => {
      const map = assignmentsToMap([]);

      expect(Object.keys(map)).toHaveLength(0);
    });

    it('should handle single assignment', () => {
      const assignments: AviationProjectAssignment[] = [
        { user_id: 42, user_email: 'solo@test.com', has_permission: true },
      ];

      const map = assignmentsToMap(assignments);

      expect(map[42]).toBe(true);
      expect(map[1]).toBeUndefined();
    });

    it('should overwrite duplicate user_ids with last value', () => {
      const assignments: AviationProjectAssignment[] = [
        { user_id: 1, user_email: 'user1@test.com', has_permission: false },
        { user_id: 1, user_email: 'user1@test.com', has_permission: true },
      ];

      const map = assignmentsToMap(assignments);

      expect(map[1]).toBe(true);
    });
  });
});
