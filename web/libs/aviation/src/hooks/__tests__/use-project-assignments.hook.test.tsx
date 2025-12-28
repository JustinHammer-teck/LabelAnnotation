import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { useProjectAssignments } from '../use-project-assignments.hook';
import { AviationApiContext } from '../../api/context';
import type { AviationApiClient } from '../../api/api-client';
import type { AviationProjectAssignment } from '../../types/assignment.types';
import {
  assignmentsAtom,
  assignmentsLoadingAtom,
  assignmentsErrorAtom,
  assignmentsTogglingAtom,
} from '../../stores/assignment.store';

/**
 * Creates a mock API client with jest mocks for assignment methods.
 */
const createMockApiClient = (): jest.Mocked<
  Pick<AviationApiClient, 'getProjectAssignments' | 'toggleProjectAssignment'>
> &
  Partial<AviationApiClient> => ({
  getProjectAssignments: jest.fn(),
  toggleProjectAssignment: jest.fn(),
});

/**
 * Helper to create a Jotai provider wrapper for testing with API client.
 */
const createWrapper = (mockApiClient?: Partial<AviationApiClient>) => {
  const store = createStore();
  const apiClient = mockApiClient ?? createMockApiClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AviationApiContext.Provider value={apiClient as AviationApiClient}>
      <Provider store={store}>{children}</Provider>
    </AviationApiContext.Provider>
  );
  return {
    Wrapper,
    store,
    apiClient: apiClient as jest.Mocked<
      Pick<AviationApiClient, 'getProjectAssignments' | 'toggleProjectAssignment'>
    >,
  };
};

describe('useProjectAssignments', () => {
  const mockAssignments: AviationProjectAssignment[] = [
    { user_id: 1, user_email: 'user1@test.com', has_permission: true },
    { user_id: 2, user_email: 'user2@test.com', has_permission: false },
  ];

  describe('Fetching Assignments', () => {
    it('should fetch assignments on mount', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClient.getProjectAssignments).toHaveBeenCalledWith(42);
      expect(result.current.assignments).toEqual(mockAssignments);
    });

    it('should handle fetch errors', async () => {
      const mockApiClient = createMockApiClient();
      const error = new Error('Fetch failed');
      mockApiClient.getProjectAssignments.mockRejectedValue(error);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Fetch failed');
    });

    it('should not fetch if projectId is null', () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue([]);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: null as unknown as number }),
        { wrapper: Wrapper }
      );

      expect(mockApiClient.getProjectAssignments).not.toHaveBeenCalled();
      expect(result.current.assignments).toEqual([]);
    });

    it('should not fetch if projectId is zero', () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue([]);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 0 }),
        { wrapper: Wrapper }
      );

      expect(mockApiClient.getProjectAssignments).not.toHaveBeenCalled();
      expect(result.current.assignments).toEqual([]);
    });

    it('should return empty array initially', () => {
      const mockApiClient = createMockApiClient();
      // Never resolve to keep it loading
      mockApiClient.getProjectAssignments.mockReturnValue(new Promise(() => {}));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      expect(result.current.assignments).toEqual([]);
    });
  });

  describe('Toggling Assignments', () => {
    it('should toggle assignment successfully', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);
      mockApiClient.toggleProjectAssignment.mockResolvedValue(undefined);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle assignment (user 1 has_permission: true -> false)
      await act(async () => {
        await result.current.toggleAssignment(1, true);
      });

      expect(mockApiClient.toggleProjectAssignment).toHaveBeenCalledWith(42, {
        users: [{ user_id: 1, has_permission: false }], // Flipped
      });
    });

    it('should perform optimistic update', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);
      // Create a never-resolving promise to keep toggle pending
      mockApiClient.toggleProjectAssignment.mockReturnValue(new Promise(() => {}));

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // User 2 starts with has_permission: false
      const user2Before = result.current.assignments.find((a) => a.user_id === 2);
      expect(user2Before?.has_permission).toBe(false);

      // Toggle - should update immediately (optimistic)
      act(() => {
        result.current.toggleAssignment(2, false);
      });

      // Optimistic update applied
      const user2After = result.current.assignments.find((a) => a.user_id === 2);
      expect(user2After?.has_permission).toBe(true);
    });

    it('should rollback on error', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);
      const error = new Error('Toggle failed');
      mockApiClient.toggleProjectAssignment.mockRejectedValue(error);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Original state
      const originalAssignments = [...result.current.assignments];

      // Attempt toggle
      await act(async () => {
        try {
          await result.current.toggleAssignment(1, true);
        } catch (e) {
          // Expected to fail
        }
      });

      // Should rollback to original state
      expect(result.current.assignments).toEqual(originalAssignments);
    });

    it('should show success toast on toggle', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);
      mockApiClient.toggleProjectAssignment.mockResolvedValue(undefined);

      const mockShowToast = jest.fn();

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () =>
          useProjectAssignments({
            projectId: 42,
            showToast: mockShowToast,
          }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle user 1 (has_permission: true -> false = revoked)
      await act(async () => {
        await result.current.toggleAssignment(1, true);
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: expect.stringContaining('revoked'),
        type: 'success',
      });
    });

    it('should show success toast with granted message', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);
      mockApiClient.toggleProjectAssignment.mockResolvedValue(undefined);

      const mockShowToast = jest.fn();

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () =>
          useProjectAssignments({
            projectId: 42,
            showToast: mockShowToast,
          }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle user 2 (has_permission: false -> true = granted)
      await act(async () => {
        await result.current.toggleAssignment(2, false);
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: expect.stringContaining('granted'),
        type: 'success',
      });
    });

    it('should show error toast on toggle failure', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);
      const error = new Error('Permission denied');
      mockApiClient.toggleProjectAssignment.mockRejectedValue(error);

      const mockShowToast = jest.fn();

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () =>
          useProjectAssignments({
            projectId: 42,
            showToast: mockShowToast,
          }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.toggleAssignment(1, true);
        } catch (e) {
          // Expected
        }
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: expect.stringContaining('Permission denied'),
        type: 'error',
      });
    });

    it('should set toggling state during toggle', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);

      let resolveToggle: (value: void) => void;
      const togglePromise = new Promise<void>((resolve) => {
        resolveToggle = resolve;
      });
      mockApiClient.toggleProjectAssignment.mockReturnValue(togglePromise);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start toggle
      act(() => {
        result.current.toggleAssignment(1, true);
      });

      // Should be toggling
      expect(result.current.isToggling).toBe(true);

      // Complete toggle
      await act(async () => {
        resolveToggle!();
        await togglePromise;
      });

      // No longer toggling
      expect(result.current.isToggling).toBe(false);
    });
  });

  describe('Return Values', () => {
    it('should return all expected properties', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('assignments');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('toggleAssignment');
      expect(result.current).toHaveProperty('isToggling');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should allow manual refetch', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);

      const { Wrapper } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock calls
      mockApiClient.getProjectAssignments.mockClear();

      // Manual refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApiClient.getProjectAssignments).toHaveBeenCalledWith(42);
    });
  });

  describe('Store State', () => {
    it('should initialize atoms correctly', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);

      const { Wrapper, store } = createWrapper(mockApiClient);
      renderHook(() => useProjectAssignments({ projectId: 42 }), {
        wrapper: Wrapper,
      });

      // Initially loading
      expect(store.get(assignmentsLoadingAtom)).toBe(true);

      await waitFor(() => {
        expect(store.get(assignmentsLoadingAtom)).toBe(false);
      });

      expect(store.get(assignmentsAtom)).toEqual(mockAssignments);
      expect(store.get(assignmentsErrorAtom)).toBeNull();
      expect(store.get(assignmentsTogglingAtom)).toBe(false);
    });

    it('should set error atom on fetch failure', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockRejectedValue(
        new Error('Network error')
      );

      const { Wrapper, store } = createWrapper(mockApiClient);
      renderHook(() => useProjectAssignments({ projectId: 42 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(store.get(assignmentsLoadingAtom)).toBe(false);
      });

      expect(store.get(assignmentsErrorAtom)).toBe('Network error');
    });

    it('should set toggling atom during toggle operation', async () => {
      const mockApiClient = createMockApiClient();
      mockApiClient.getProjectAssignments.mockResolvedValue(mockAssignments);

      let resolveToggle: () => void;
      mockApiClient.toggleProjectAssignment.mockReturnValue(
        new Promise((resolve) => {
          resolveToggle = resolve;
        })
      );

      const { Wrapper, store } = createWrapper(mockApiClient);
      const { result } = renderHook(
        () => useProjectAssignments({ projectId: 42 }),
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(store.get(assignmentsLoadingAtom)).toBe(false);
      });

      act(() => {
        result.current.toggleAssignment(1, true);
      });

      expect(store.get(assignmentsTogglingAtom)).toBe(true);

      await act(async () => {
        resolveToggle!();
      });

      expect(store.get(assignmentsTogglingAtom)).toBe(false);
    });
  });
});
