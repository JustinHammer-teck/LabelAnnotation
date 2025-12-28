import { useCallback, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { useAviationApi } from '../api/context';
import {
  assignmentsAtom,
  assignmentsLoadingAtom,
  assignmentsErrorAtom,
  assignmentsTogglingAtom,
} from '../stores/assignment.store';
import type {
  AviationProjectAssignment,
  ToggleAssignmentPayload,
} from '../types/assignment.types';

/**
 * Options for the useProjectAssignments hook.
 */
export interface UseProjectAssignmentsOptions {
  /** Aviation project ID to fetch assignments for */
  projectId: number;
  /** Optional callback for displaying toast notifications */
  showToast?: (options: { message: string; type: 'success' | 'error' }) => void;
}

/**
 * Return type for the useProjectAssignments hook.
 */
export interface UseProjectAssignmentsReturn {
  /** List of user assignments for the project */
  assignments: AviationProjectAssignment[];
  /** True when initial fetch is in progress */
  isLoading: boolean;
  /** True when an error occurred during fetch */
  isError: boolean;
  /** Error object if an error occurred, null otherwise */
  error: Error | null;
  /** Toggle a user's assignment status */
  toggleAssignment: (userId: number, currentPermission: boolean) => Promise<void>;
  /** True when a toggle operation is in progress */
  isToggling: boolean;
  /** Manually trigger a refetch of assignments */
  refetch: () => Promise<void>;
}

/**
 * Hook for managing aviation project user assignments.
 *
 * Provides fetching, toggling with optimistic updates, and error handling
 * for project assignment operations.
 *
 * @param options - Hook configuration options
 * @returns Assignment state and operations
 *
 * @example
 * ```tsx
 * const { assignments, toggleAssignment, isLoading } = useProjectAssignments({
 *   projectId: 42,
 *   showToast: ({ message, type }) => toast.show(message, type),
 * });
 *
 * // Toggle user assignment
 * await toggleAssignment(userId, currentPermission);
 * ```
 */
export const useProjectAssignments = ({
  projectId,
  showToast,
}: UseProjectAssignmentsOptions): UseProjectAssignmentsReturn => {
  const apiClient = useAviationApi();

  const [assignments, setAssignments] = useAtom(assignmentsAtom);
  const [isLoading, setIsLoading] = useAtom(assignmentsLoadingAtom);
  const [errorState, setErrorState] = useAtom(assignmentsErrorAtom);
  const [isToggling, setIsToggling] = useAtom(assignmentsTogglingAtom);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAssignments = useCallback(async () => {
    // Don't fetch if projectId is invalid
    if (!projectId || projectId <= 0) {
      return;
    }

    setIsLoading(true);
    setErrorState(null);

    try {
      const data = await apiClient.getProjectAssignments(projectId);

      if (isMountedRef.current) {
        setAssignments(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch assignments';
        setErrorState(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [projectId, apiClient, setAssignments, setIsLoading, setErrorState]);

  const toggleAssignment = useCallback(
    async (userId: number, currentPermission: boolean) => {
      const newPermission = !currentPermission;

      // Store previous state for rollback
      const previousAssignments = [...assignments];

      // Optimistic update
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.user_id === userId
            ? { ...assignment, has_permission: newPermission }
            : assignment
        )
      );

      setIsToggling(true);

      try {
        const payload: ToggleAssignmentPayload = {
          users: [{ user_id: userId, has_permission: newPermission }],
        };

        await apiClient.toggleProjectAssignment(projectId, payload);

        // Find user for toast message
        const user = previousAssignments.find((a) => a.user_id === userId);
        const action = newPermission ? 'granted' : 'revoked';

        showToast?.({
          message: `Permission ${action} for ${user?.user_email || 'user'}`,
          type: 'success',
        });
      } catch (error) {
        // Rollback on error
        if (isMountedRef.current) {
          setAssignments(previousAssignments);
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update permission';

        showToast?.({
          message: `Failed to update permission: ${errorMessage}`,
          type: 'error',
        });

        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsToggling(false);
        }
      }
    },
    [projectId, assignments, apiClient, setAssignments, setIsToggling, showToast]
  );

  // Fetch on mount and when projectId changes
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    isLoading,
    isError: !!errorState,
    error: errorState ? new Error(errorState) : null,
    toggleAssignment,
    isToggling,
    refetch: fetchAssignments,
  };
};
