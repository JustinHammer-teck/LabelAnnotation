import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = jest.fn();
jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: mockPush }),
}));

const mockFetchEvents = jest.fn();
const mockUpload = jest.fn();
const mockReset = jest.fn();
const mockDownloadExport = jest.fn();

let mockEventsData: { id: number; event_number: string }[] = [];

jest.mock('../../../hooks', () => ({
  useEvents: () => ({
    events: mockEventsData,
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

jest.mock('../../../api', () => ({
  useAviationApi: () => ({
    downloadExport: mockDownloadExport,
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
    mockEventsData = [];
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

  describe('Export Functionality', () => {
    it('should render Export Excel button', () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      render(<TaskListView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
    });

    it('should render Export JSON button', () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      render(<TaskListView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    });

    it('should disable export buttons when no events exist', () => {
      mockEventsData = [];
      render(<TaskListView {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /export excel/i });
      const jsonButton = screen.getByRole('button', { name: /export json/i });

      expect(excelButton).toBeDisabled();
      expect(jsonButton).toBeDisabled();
    });

    it('should enable export buttons when events exist', () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      render(<TaskListView {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /export excel/i });
      const jsonButton = screen.getByRole('button', { name: /export json/i });

      expect(excelButton).not.toBeDisabled();
      expect(jsonButton).not.toBeDisabled();
    });

    it('should call downloadExport with xlsx format when Export Excel clicked', async () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      mockDownloadExport.mockResolvedValue(undefined);

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} projectId={42} />);

      const excelButton = screen.getByRole('button', { name: /export excel/i });
      await user.click(excelButton);

      expect(mockDownloadExport).toHaveBeenCalledWith(42, 'xlsx');
    });

    it('should call downloadExport with json format when Export JSON clicked', async () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      mockDownloadExport.mockResolvedValue(undefined);

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} projectId={42} />);

      const jsonButton = screen.getByRole('button', { name: /export json/i });
      await user.click(jsonButton);

      expect(mockDownloadExport).toHaveBeenCalledWith(42, 'json');
    });

    it('should show loading state during export', async () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      let resolveExport: () => void;
      mockDownloadExport.mockImplementation(() => new Promise((resolve) => {
        resolveExport = resolve;
      }));

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /export excel/i });
      await user.click(excelButton);

      expect(screen.getByRole('button', { name: /exporting/i })).toBeInTheDocument();
      expect(excelButton).toBeDisabled();

      await act(async () => {
        resolveExport!();
      });

      expect(screen.queryByRole('button', { name: /exporting/i })).not.toBeInTheDocument();
    });

    it('should display error message on export failure', async () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      mockDownloadExport.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /export excel/i });
      await user.click(excelButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message for non-Error failures', async () => {
      mockEventsData = [{ id: 1, event_number: 'EVT-001' }];
      mockDownloadExport.mockRejectedValue('Unknown failure');

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TaskListView {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /export excel/i });
      await user.click(excelButton);

      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
    });
  });
});
