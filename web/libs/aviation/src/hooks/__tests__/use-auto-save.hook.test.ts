import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../use-auto-save.hook';

// Mock the API
const mockUpdateItem = jest.fn();
jest.mock('../../api', () => ({
  useAviationApi: () => ({
    updateItem: mockUpdateItem,
  }),
}));

// Mock stores with simple objects that Jest can hoist
jest.mock('../../stores', () => ({
  saveStatusAtom: Symbol('saveStatusAtom'),
  labelingItemsAtom: Symbol('labelingItemsAtom'),
}));

// Create mock data that can be configured per test
let mockSaveStatus = { state: 'idle' as const, lastSaved: null as Date | null, error: null as string | null };
const mockSetSaveStatus = jest.fn((newStatus) => {
  mockSaveStatus = { ...mockSaveStatus, ...newStatus };
});
const mockItems = [{ id: 1, event: 1, sequence_number: 1 }];

// Mock jotai's useAtom - must use require to avoid hoisting issues
jest.mock('jotai', () => {
  const actual = jest.requireActual('jotai');
  return {
    ...actual,
    useAtom: jest.fn(),
    atom: actual.atom,
  };
});

// Configure useAtom mock in beforeEach
beforeEach(() => {
  const { useAtom } = require('jotai');
  const { saveStatusAtom, labelingItemsAtom } = require('../../stores');

  (useAtom as jest.Mock).mockImplementation((atom: unknown) => {
    if (atom === saveStatusAtom) {
      return [mockSaveStatus, mockSetSaveStatus];
    }
    if (atom === labelingItemsAtom) {
      return [mockItems, jest.fn()];
    }
    return [undefined, jest.fn()];
  });
});

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset save status
    mockSaveStatus = { state: 'idle', lastSaved: null, error: null };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('callback functionality', () => {
    /**
     * TDD Red: Test onSuccess callback when save succeeds
     * This test should FAIL until we implement the callback in useAutoSave
     */
    it('should call onSuccess callback when save succeeds', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      mockUpdateItem.mockResolvedValueOnce({ id: 1 });

      const { result } = renderHook(() =>
        useAutoSave(1, {
          debounceMs: 100,
          onSuccess,
          onError,
        }),
      );

      // Trigger a debounced save
      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Wait for async save to complete
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith(1, { threat_type_l1: 5 });
      });

      // Verify callbacks - THIS SHOULD FAIL (TDD Red)
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    /**
     * TDD Red: Test onError callback when save fails
     * This test should FAIL until we implement the callback in useAutoSave
     */
    it('should call onError callback with message when save fails', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const errorMessage = 'Network error: Failed to save';
      mockUpdateItem.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useAutoSave(1, {
          debounceMs: 100,
          onSuccess,
          onError,
        }),
      );

      // Trigger a debounced save
      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Wait for async save to fail
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalled();
      });

      // Verify callbacks - THIS SHOULD FAIL (TDD Red)
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      expect(onSuccess).not.toHaveBeenCalled();
    });

    /**
     * Test saveNow also triggers callbacks
     */
    it('should call onSuccess callback when saveNow succeeds', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      mockUpdateItem.mockResolvedValueOnce({ id: 1 });

      const { result } = renderHook(() =>
        useAutoSave(1, {
          onSuccess,
          onError,
        }),
      );

      // Queue pending data first
      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      // Force immediate save
      await act(async () => {
        await result.current.saveNow();
      });

      // Verify callback - THIS SHOULD FAIL (TDD Red)
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    /**
     * Test saveNow calls onSuccess even when no pending data (user feedback)
     */
    it('should call onSuccess callback when saveNow called with no pending data', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAutoSave(1, {
          onSuccess,
          onError,
        }),
      );

      // Call saveNow without any pending data
      await act(async () => {
        await result.current.saveNow();
      });

      // Should still trigger onSuccess for user feedback
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
      // API should NOT have been called since no pending data
      expect(mockUpdateItem).not.toHaveBeenCalled();
    });

    /**
     * Ensure existing behavior: no crash when callbacks are undefined
     */
    it('should not throw if callbacks are undefined', async () => {
      mockUpdateItem.mockResolvedValueOnce({ id: 1 });

      const { result } = renderHook(() =>
        useAutoSave(1, { debounceMs: 100 }),
      );

      // Trigger save without callbacks
      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should complete without throwing
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalled();
      });

      // No error means test passes - this should PASS (existing behavior)
    });

    /**
     * Ensure callbacks are not called when itemId is null
     */
    it('should not call callbacks when itemId is null', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAutoSave(null, {
          debounceMs: 100,
          onSuccess,
          onError,
        }),
      );

      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not call API or callbacks when itemId is null
      expect(mockUpdateItem).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('existing behavior', () => {
    it('should return item, saveStatus, debouncedSave, and saveNow', () => {
      const { result } = renderHook(() => useAutoSave(1));

      expect(result.current.item).toBeDefined();
      expect(result.current.saveStatus).toBeDefined();
      expect(typeof result.current.debouncedSave).toBe('function');
      expect(typeof result.current.saveNow).toBe('function');
    });

    it('should set saveStatus to saving then saved on success', async () => {
      mockUpdateItem.mockResolvedValueOnce({ id: 1 });

      const { result } = renderHook(() => useAutoSave(1, { debounceMs: 100 }));

      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        // Check that setSaveStatus was called with 'saving' state
        expect(mockSetSaveStatus).toHaveBeenCalledWith(
          expect.objectContaining({ state: 'saving' }),
        );
      });

      await waitFor(() => {
        // Check that setSaveStatus was called with 'saved' state
        expect(mockSetSaveStatus).toHaveBeenCalledWith(
          expect.objectContaining({ state: 'saved' }),
        );
      });
    });

    it('should set saveStatus to error on failure', async () => {
      mockUpdateItem.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useAutoSave(1, { debounceMs: 100 }));

      act(() => {
        result.current.debouncedSave({ threat_type_l1: 5 });
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockSetSaveStatus).toHaveBeenCalledWith(
          expect.objectContaining({ state: 'error' }),
        );
      });
    });
  });
});
