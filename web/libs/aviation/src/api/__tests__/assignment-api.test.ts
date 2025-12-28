/**
 * Tests for Aviation API Client - Assignment Methods
 *
 * TDD Phase: RED - Tests written first, will fail until implementation is added.
 *
 * These tests validate the API client methods for managing user assignments:
 * - getProjectAssignments(projectId) - Fetch assignments for a project
 * - toggleProjectAssignment(projectId, payload) - Toggle user assignments
 *
 * @module api/__tests__/assignment-api.test
 */
import { createDefaultApiClient, ForbiddenError, NotFoundError, NetworkError } from '../default-api-client';
import type { AviationApiClient } from '../api-client';
import type {
  AviationProjectAssignment,
  ToggleAssignmentPayload,
} from '../../types/assignment.types';

describe('AviationApiClient - Assignment Methods', () => {
  let apiClient: AviationApiClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    apiClient = createDefaultApiClient();
    originalFetch = global.fetch;
    global.fetch = jest.fn();

    // Mock CSRF token cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-csrf-token',
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('getProjectAssignments', () => {
    it('should fetch assignments for a project', async () => {
      const projectId = 42;
      const mockAssignments: AviationProjectAssignment[] = [
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

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAssignments),
      });

      const result = await apiClient.getProjectAssignments(projectId);

      expect(fetch).toHaveBeenCalledWith(
        '/api/aviation/projects/42/assignment/',
        expect.objectContaining({
          credentials: 'same-origin',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockAssignments);
    });

    it('should handle empty assignments list', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      const result = await apiClient.getProjectAssignments(1);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundError on 404 response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Project not found' })),
      });

      await expect(apiClient.getProjectAssignments(999)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError on 403 response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Permission denied' })),
      });

      await expect(apiClient.getProjectAssignments(1)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NetworkError on network failure', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.getProjectAssignments(1)).rejects.toThrow(NetworkError);
    });

    it('should validate projectId is positive', async () => {
      await expect(apiClient.getProjectAssignments(-1)).rejects.toThrow('Invalid project ID');
      await expect(apiClient.getProjectAssignments(0)).rejects.toThrow('Invalid project ID');
    });

    it('should include CSRF token in headers for GET request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await apiClient.getProjectAssignments(123);

      // GET requests should NOT include X-CSRFToken per the default-api-client pattern
      expect(fetch).toHaveBeenCalledWith(
        '/api/aviation/projects/123/assignment/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('toggleProjectAssignment', () => {
    it('should send toggle request with correct payload', async () => {
      const projectId = 42;
      const payload: ToggleAssignmentPayload = {
        users: [
          { user_id: 1, has_permission: true },
          { user_id: 2, has_permission: false },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient.toggleProjectAssignment(projectId, payload);

      expect(fetch).toHaveBeenCalledWith(
        '/api/aviation/projects/42/assignment/',
        expect.objectContaining({
          method: 'POST',
          credentials: 'same-origin',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-csrf-token',
          }),
          body: JSON.stringify(payload),
        })
      );
    });

    it('should handle single user toggle', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await expect(
        apiClient.toggleProjectAssignment(1, payload)
      ).resolves.not.toThrow();
    });

    it('should handle empty users array', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await expect(
        apiClient.toggleProjectAssignment(1, payload)
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenError on 403 Forbidden', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ detail: 'You do not have permission' })),
      });

      await expect(
        apiClient.toggleProjectAssignment(1, payload)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError on 404 response', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Project not found' })),
      });

      await expect(
        apiClient.toggleProjectAssignment(999, payload)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NetworkError on network failure', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        apiClient.toggleProjectAssignment(1, payload)
      ).rejects.toThrow(NetworkError);
    });

    it('should handle 204 No Content response', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await expect(
        apiClient.toggleProjectAssignment(1, payload)
      ).resolves.not.toThrow();
    });

    it('should validate projectId is positive', async () => {
      const payload: ToggleAssignmentPayload = {
        users: [{ user_id: 1, has_permission: true }],
      };

      await expect(apiClient.toggleProjectAssignment(-1, payload)).rejects.toThrow('Invalid project ID');
      await expect(apiClient.toggleProjectAssignment(0, payload)).rejects.toThrow('Invalid project ID');
    });
  });

  describe('API endpoint URLs', () => {
    it('should construct correct GET endpoint URL', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await apiClient.getProjectAssignments(123);

      const callUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toBe('/api/aviation/projects/123/assignment/');
    });

    it('should construct correct POST endpoint URL', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient.toggleProjectAssignment(456, { users: [] });

      const callUrl = (fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toBe('/api/aviation/projects/456/assignment/');
    });
  });

  describe('Response handling', () => {
    it('should return typed assignments array from GET', async () => {
      const mockAssignments: AviationProjectAssignment[] = [
        { user_id: 10, user_email: 'pilot@test.com', has_permission: true },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAssignments),
      });

      const result = await apiClient.getProjectAssignments(1);

      // Type assertions - result should be AviationProjectAssignment[]
      expect(result[0].user_id).toBe(10);
      expect(result[0].user_email).toBe('pilot@test.com');
      expect(result[0].has_permission).toBe(true);
    });

    it('should complete successfully from toggleProjectAssignment', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      // toggleProjectAssignment should not throw
      await expect(
        apiClient.toggleProjectAssignment(1, { users: [] })
      ).resolves.not.toThrow();
    });
  });
});
