import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = jest.fn();
jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: mockPush }),
}));

const mockFetchEvents = jest.fn();
const mockUpload = jest.fn();
const mockReset = jest.fn();

jest.mock('../../../hooks', () => ({
  useEvents: () => ({
    events: [],
    loading: false,
    error: null,
    fetchEvents: mockFetchEvents,
  }),
  useExcelUpload: () => ({
    uploadProgress: 0,
    uploadStatus: 'idle',
    createdCount: 0,
    firstEventId: null,
    uploadErrors: [],
    errorMessage: null,
    upload: mockUpload,
    reset: mockReset,
  }),
}));

jest.mock('../../common', () => ({
  Table: ({ data, loading }: any) => (
    <div data-testid="mock-table">
      {loading ? 'Loading...' : `${data?.length || 0} rows`}
    </div>
  ),
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

let capturedOnUpload: ((file: File) => Promise<void>) | null = null;

jest.mock('../../excel-upload', () => ({
  ExcelUploadModal: ({ open, onClose, onUpload }: any) => {
    capturedOnUpload = onUpload;
    if (!open) return null;
    return <div data-testid="excel-upload-modal">Modal Open</div>;
  },
}));

import { TaskListView } from '../TaskListView';

describe('TaskListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    capturedOnUpload = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    projectId: 1,
    onSelect: jest.fn(),
  };

  describe('Upload Navigation Behavior', () => {
    it('should navigate to first event when upload returns firstEventId', async () => {
      mockUpload.mockResolvedValue({
        firstEventId: 42,
        createdCount: 5,
      });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} />);

      const importButtons = screen.getAllByRole('button', { name: /import excel/i });
      await user.click(importButtons[0]);

      expect(screen.getByTestId('excel-upload-modal')).toBeInTheDocument();
      expect(capturedOnUpload).not.toBeNull();

      await act(async () => {
        await capturedOnUpload!(new File(['test'], 'test.xlsx'));
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockUpload).toHaveBeenCalledWith(1, expect.any(File));
      expect(mockPush).toHaveBeenCalledWith('/aviation/projects/1/events/42');
    });

    it('should call fetchEvents when upload returns null firstEventId', async () => {
      mockUpload.mockResolvedValue({
        firstEventId: null,
        createdCount: 0,
      });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} />);

      const importButtons = screen.getAllByRole('button', { name: /import excel/i });
      await user.click(importButtons[0]);

      mockFetchEvents.mockClear();

      await act(async () => {
        await capturedOnUpload!(new File(['test'], 'test.xlsx'));
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockFetchEvents).toHaveBeenCalled();
    });

    it('should not navigate or fetch when upload returns null (failure)', async () => {
      mockUpload.mockResolvedValue(null);

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} />);

      const importButtons = screen.getAllByRole('button', { name: /import excel/i });
      await user.click(importButtons[0]);

      mockFetchEvents.mockClear();

      await act(async () => {
        await capturedOnUpload!(new File(['test'], 'test.xlsx'));
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockFetchEvents).not.toHaveBeenCalled();
    });

    it('should use projectId in navigation path', async () => {
      mockUpload.mockResolvedValue({
        firstEventId: 100,
        createdCount: 1,
      });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} projectId={99} />);

      const importButtons = screen.getAllByRole('button', { name: /import excel/i });
      await user.click(importButtons[0]);

      await act(async () => {
        await capturedOnUpload!(new File(['test'], 'test.xlsx'));
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockUpload).toHaveBeenCalledWith(99, expect.any(File));
      expect(mockPush).toHaveBeenCalledWith('/aviation/projects/99/events/100');
    });
  });
});
