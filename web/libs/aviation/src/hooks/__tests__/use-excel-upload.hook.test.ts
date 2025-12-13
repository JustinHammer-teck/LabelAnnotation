import { renderHook, waitFor, act } from '@testing-library/react';
import { useExcelUpload } from '../use-excel-upload.hook';

const mockUploadExcel = jest.fn();

const mockApi = {
  uploadExcel: mockUploadExcel,
};

jest.mock('../../api', () => ({
  useAviationApi: () => mockApi,
}));

describe('useExcelUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockFile = () => new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  describe('Initial State', () => {
    it('should have idle status initially', () => {
      const { result } = renderHook(() => useExcelUpload());

      expect(result.current.uploadStatus).toBe('idle');
      expect(result.current.uploadProgress).toBe(0);
      expect(result.current.createdCount).toBe(0);
      expect(result.current.firstEventId).toBeNull();
      expect(result.current.uploadErrors).toEqual([]);
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('Successful Upload', () => {
    it('should return { firstEventId, createdCount } on success', async () => {
      const successResponse = {
        success: true,
        created_count: 5,
        first_event_id: 42,
        errors: [],
      };
      mockUploadExcel.mockResolvedValue(successResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      let uploadResult: { firstEventId: number | null; createdCount: number } | null = null;
      await act(async () => {
        uploadResult = await result.current.upload(1, file);
      });

      expect(uploadResult).toEqual({
        firstEventId: 42,
        createdCount: 5,
      });
    });

    it('should return firstEventId as null when no events created', async () => {
      const successResponse = {
        success: true,
        created_count: 0,
        first_event_id: null,
        errors: [],
      };
      mockUploadExcel.mockResolvedValue(successResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      let uploadResult: { firstEventId: number | null; createdCount: number } | null = null;
      await act(async () => {
        uploadResult = await result.current.upload(1, file);
      });

      expect(uploadResult).toEqual({
        firstEventId: null,
        createdCount: 0,
      });
    });

    it('should update state on successful upload', async () => {
      const successResponse = {
        success: true,
        created_count: 3,
        first_event_id: 10,
        errors: [],
      };
      mockUploadExcel.mockResolvedValue(successResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      await act(async () => {
        await result.current.upload(1, file);
      });

      expect(result.current.uploadStatus).toBe('success');
      expect(result.current.createdCount).toBe(3);
      expect(result.current.firstEventId).toBe(10);
      expect(result.current.uploadErrors).toEqual([]);
    });

    it('should call API with projectId and file', async () => {
      const successResponse = {
        success: true,
        created_count: 1,
        first_event_id: 1,
        errors: [],
      };
      mockUploadExcel.mockResolvedValue(successResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      await act(async () => {
        await result.current.upload(123, file);
      });

      expect(mockUploadExcel).toHaveBeenCalledWith(123, file, expect.any(Function));
    });
  });

  describe('Failed Upload - Validation Errors', () => {
    it('should return null when API returns success=false', async () => {
      const errorResponse = {
        success: false,
        created_count: 0,
        first_event_id: null,
        errors: [
          { row: 1, message: 'Invalid date format' },
          { row: 3, message: 'Missing required field' },
        ],
      };
      mockUploadExcel.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      let uploadResult: unknown = undefined;
      await act(async () => {
        uploadResult = await result.current.upload(1, file);
      });

      expect(uploadResult).toBeNull();
    });

    it('should set error state with row errors', async () => {
      const errorResponse = {
        success: false,
        created_count: 0,
        first_event_id: null,
        errors: [
          { row: 2, message: 'Invalid event number' },
        ],
      };
      mockUploadExcel.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      await act(async () => {
        await result.current.upload(1, file);
      });

      expect(result.current.uploadStatus).toBe('error');
      expect(result.current.uploadErrors).toEqual([
        { row: 2, message: 'Invalid event number' },
      ]);
    });
  });

  describe('Failed Upload - Exception', () => {
    it('should return null when API throws error', async () => {
      mockUploadExcel.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      let uploadResult: unknown = undefined;
      await act(async () => {
        uploadResult = await result.current.upload(1, file);
      });

      expect(uploadResult).toBeNull();
    });

    it('should set errorMessage when API throws error', async () => {
      mockUploadExcel.mockRejectedValue(new Error('Connection refused'));

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      await act(async () => {
        await result.current.upload(1, file);
      });

      expect(result.current.uploadStatus).toBe('error');
      expect(result.current.errorMessage).toBe('Connection refused');
    });

    it('should handle non-Error exceptions', async () => {
      mockUploadExcel.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      await act(async () => {
        await result.current.upload(1, file);
      });

      expect(result.current.uploadStatus).toBe('error');
      expect(result.current.errorMessage).toBe('Upload failed');
    });
  });

  describe('Upload Progress', () => {
    it('should update progress via callback', async () => {
      let progressCallback: ((progress: number) => void) | undefined;
      mockUploadExcel.mockImplementation((_projectId, _file, onProgress) => {
        progressCallback = onProgress;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              created_count: 1,
              first_event_id: 1,
              errors: [],
            });
          }, 100);
        });
      });

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      act(() => {
        result.current.upload(1, file);
      });

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('uploading');
      });

      act(() => {
        progressCallback?.(50);
      });

      expect(result.current.uploadProgress).toBe(50);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });
    });
  });

  describe('Reset', () => {
    it('should reset all state to initial values', async () => {
      const successResponse = {
        success: true,
        created_count: 5,
        first_event_id: 42,
        errors: [],
      };
      mockUploadExcel.mockResolvedValue(successResponse);

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      await act(async () => {
        await result.current.upload(1, file);
      });

      expect(result.current.uploadStatus).toBe('success');

      act(() => {
        result.current.reset();
      });

      expect(result.current.uploadStatus).toBe('idle');
      expect(result.current.uploadProgress).toBe(0);
      expect(result.current.createdCount).toBe(0);
      expect(result.current.firstEventId).toBeNull();
      expect(result.current.uploadErrors).toEqual([]);
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('Concurrent Upload Prevention', () => {
    it('should return null if upload already in progress', async () => {
      mockUploadExcel.mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          created_count: 1,
          first_event_id: 1,
          errors: [],
        }), 100))
      );

      const { result } = renderHook(() => useExcelUpload());
      const file = createMockFile();

      let firstResult: unknown;
      let secondResult: unknown;

      await act(async () => {
        const firstPromise = result.current.upload(1, file);
        secondResult = await result.current.upload(1, file);
        firstResult = await firstPromise;
      });

      expect(secondResult).toBeNull();
      expect(firstResult).toEqual({
        firstEventId: 1,
        createdCount: 1,
      });
      expect(mockUploadExcel).toHaveBeenCalledTimes(1);
    });
  });
});
