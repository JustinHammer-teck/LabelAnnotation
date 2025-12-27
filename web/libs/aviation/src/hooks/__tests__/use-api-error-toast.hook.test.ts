import { renderHook, act } from '@testing-library/react';
import { useApiErrorToast } from '../use-api-error-toast.hook';
import {
  ValidationError,
  NetworkError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  ApiError,
} from '../../api/default-api-client';

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('../use-toast.hook', () => ({
  useAviationToast: () => mockToast,
}));

describe('useApiErrorToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should show validation error with field details', () => {
      const { result } = renderHook(() => useApiErrorToast());

      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid format' },
      ]);

      act(() => {
        result.current.handleApiError(error, 'Submit');
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Submit: Validation error: email: Invalid format'
      );
    });

    it('should show validation error with multiple field errors', () => {
      const { result } = renderHook(() => useApiErrorToast());

      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid format' },
        { field: 'name', message: 'Required field' },
      ]);

      act(() => {
        result.current.handleApiError(error);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Validation error: email: Invalid format, name: Required field'
      );
    });

    it('should show validation error message when no field errors', () => {
      const { result } = renderHook(() => useApiErrorToast());

      const error = new ValidationError('Invalid data', []);

      act(() => {
        result.current.handleApiError(error);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Validation error: Invalid data');
    });

    it('should show network error message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new NetworkError('Failed to fetch'));
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Network error. Please check your connection.'
      );
    });

    it('should show unauthorized error message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new UnauthorizedError());
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Session expired. Please log in again.'
      );
    });

    it('should show forbidden error message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new ForbiddenError());
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "You don't have permission to perform this action."
      );
    });

    it('should show not found error message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new NotFoundError());
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'The requested resource was not found.'
      );
    });

    it('should show server error message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new ServerError());
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Server error. Please try again later.'
      );
    });

    it('should show generic ApiError message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      const error = new ApiError('Something went wrong', 'UNKNOWN_ERROR', 418);

      act(() => {
        result.current.handleApiError(error);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('should show generic Error message', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new Error('Unexpected error'));
      });

      expect(mockToast.error).toHaveBeenCalledWith('Unexpected error');
    });

    it('should handle unknown error types', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError('String error');
      });

      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred.');
    });

    it('should prepend context message when provided', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(new NetworkError(), 'Failed to approve item');
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to approve item: Network error. Please check your connection.'
      );
    });

    it('should return true when toast shown', () => {
      const { result } = renderHook(() => useApiErrorToast());

      let wasHandled = false;
      act(() => {
        wasHandled = result.current.handleApiError(new Error('Test'));
      });

      expect(wasHandled).toBe(true);
    });
  });

  describe('withErrorToast', () => {
    it('should return result on success', async () => {
      const { result } = renderHook(() => useApiErrorToast());

      const value = await result.current.withErrorToast(
        () => Promise.resolve('success'),
        'Operation'
      );

      expect(value).toBe('success');
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('should handle error and return undefined', async () => {
      const { result } = renderHook(() => useApiErrorToast());

      const value = await result.current.withErrorToast(
        () => Promise.reject(new Error('Failed')),
        'Operation'
      );

      expect(value).toBeUndefined();
      expect(mockToast.error).toHaveBeenCalledWith('Operation: Failed');
    });

    it('should handle error without context', async () => {
      const { result } = renderHook(() => useApiErrorToast());

      const value = await result.current.withErrorToast(
        () => Promise.reject(new NetworkError())
      );

      expect(value).toBeUndefined();
      expect(mockToast.error).toHaveBeenCalledWith(
        'Network error. Please check your connection.'
      );
    });

    it('should preserve return type', async () => {
      const { result } = renderHook(() => useApiErrorToast());

      const numberValue = await result.current.withErrorToast(
        () => Promise.resolve(42)
      );

      expect(numberValue).toBe(42);

      const objectValue = await result.current.withErrorToast(
        () => Promise.resolve({ id: 1, name: 'test' })
      );

      expect(objectValue).toEqual({ id: 1, name: 'test' });
    });

    it('should handle synchronous throws', async () => {
      const { result } = renderHook(() => useApiErrorToast());

      const value = await result.current.withErrorToast(() => {
        throw new Error('Sync error');
      });

      expect(value).toBeUndefined();
      expect(mockToast.error).toHaveBeenCalledWith('Sync error');
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined errors gracefully', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError(null);
      });

      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred.');

      jest.clearAllMocks();

      act(() => {
        result.current.handleApiError(undefined);
      });

      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred.');
    });

    it('should handle objects without message property', () => {
      const { result } = renderHook(() => useApiErrorToast());

      act(() => {
        result.current.handleApiError({ someKey: 'someValue' });
      });

      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred.');
    });
  });
});
