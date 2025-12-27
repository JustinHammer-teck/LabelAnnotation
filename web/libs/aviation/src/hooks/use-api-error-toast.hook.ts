import { useCallback, useMemo } from 'react';
import { useAviationToast } from './use-toast.hook';
import {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  NetworkError,
} from '../api/default-api-client';

export interface UseApiErrorToastResult {
  /**
   * Handle an API error and show appropriate toast notification.
   * @param error - The error object to handle
   * @param context - Optional context message to prepend (e.g., "Failed to approve item")
   * @returns true if error was handled, false otherwise
   */
  handleApiError: (error: unknown, context?: string) => boolean;

  /**
   * Wrapper function that executes an async operation and shows error toast on failure.
   * @param fn - Async function to execute
   * @param context - Optional context message for error
   * @returns Result of the function on success, undefined on error
   */
  withErrorToast: <T>(fn: () => Promise<T>, context?: string) => Promise<T | undefined>;
}

/**
 * Hook for showing API error toasts with consistent formatting.
 * Handles different error types and provides helpful user messages.
 *
 * @example
 * ```tsx
 * const { handleApiError, withErrorToast } = useApiErrorToast();
 *
 * // Manual error handling
 * try {
 *   await apiClient.approveItem(id);
 * } catch (error) {
 *   handleApiError(error, 'Failed to approve item');
 * }
 *
 * // Automatic error handling
 * const result = await withErrorToast(
 *   () => apiClient.approveItem(id),
 *   'Failed to approve item'
 * );
 * if (result !== undefined) {
 *   toast.success('Item approved successfully');
 * }
 * ```
 */
export const useApiErrorToast = (): UseApiErrorToastResult => {
  const toast = useAviationToast();

  const handleApiError = useCallback(
    (error: unknown, context?: string): boolean => {
      if (!toast) return false;

      const prefix = context ? `${context}: ` : '';

      // ValidationError - show field-specific errors
      if (error instanceof ValidationError) {
        const fieldErrors = error.fieldErrors
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');
        const message = fieldErrors || error.message;
        toast.error(`${prefix}Validation error: ${message}`);
        return true;
      }

      // UnauthorizedError - session expired
      if (error instanceof UnauthorizedError) {
        toast.error(`${prefix}Session expired. Please log in again.`);
        return true;
      }

      // ForbiddenError - permission denied
      if (error instanceof ForbiddenError) {
        toast.error(`${prefix}You don't have permission to perform this action.`);
        return true;
      }

      // NotFoundError - resource not found
      if (error instanceof NotFoundError) {
        toast.error(`${prefix}The requested resource was not found.`);
        return true;
      }

      // ServerError - server issues
      if (error instanceof ServerError) {
        toast.error(`${prefix}Server error. Please try again later.`);
        return true;
      }

      // NetworkError - connection issues
      if (error instanceof NetworkError) {
        toast.error(`${prefix}Network error. Please check your connection.`);
        return true;
      }

      // Generic ApiError - show custom message
      if (error instanceof ApiError) {
        toast.error(`${prefix}${error.message}`);
        return true;
      }

      // Standard Error - show error message
      if (error instanceof Error) {
        toast.error(`${prefix}${error.message}`);
        return true;
      }

      // Unknown error type - generic message
      toast.error(`${prefix}An unexpected error occurred.`);
      return true;
    },
    [toast]
  );

  const withErrorToast = useCallback(
    async <T>(fn: () => Promise<T>, context?: string): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (error) {
        handleApiError(error, context);
        return undefined;
      }
    },
    [handleApiError]
  );

  // Memoize the return object to maintain stable reference
  return useMemo(
    () => ({ handleApiError, withErrorToast }),
    [handleApiError, withErrorToast]
  );
};
