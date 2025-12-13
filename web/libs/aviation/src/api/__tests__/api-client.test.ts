import { createDefaultApiClient } from '../default-api-client';
import type { AviationApiClient } from '../api-client';

describe('AviationApiClient - Export', () => {
  let apiClient: AviationApiClient;
  let originalFetch: typeof global.fetch;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    apiClient = createDefaultApiClient();
    originalFetch = global.fetch;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalCreateElement = document.createElement.bind(document);

    global.fetch = jest.fn();

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-csrf-token',
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  describe('exportEvents', () => {
    it('should call correct URL with json format', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ metadata: {}, events: [], result_performances: [] }),
      });

      await apiClient.exportEvents(123, 'json');

      expect(fetch).toHaveBeenCalledWith(
        '/api/aviation/projects/123/export/?export_format=json',
        expect.objectContaining({
          credentials: 'same-origin',
        })
      );
    });

    it('should call correct URL with xlsx format', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      await apiClient.exportEvents(123, 'xlsx');

      expect(fetch).toHaveBeenCalledWith(
        '/api/aviation/projects/123/export/?export_format=xlsx',
        expect.objectContaining({
          credentials: 'same-origin',
        })
      );
    });

    it('should return Blob for xlsx format', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      const result = await apiClient.exportEvents(123, 'xlsx');

      expect(result).toBeInstanceOf(Blob);
    });

    it('should return parsed JSON for json format', async () => {
      const mockData = { metadata: { project_id: 1 }, events: [{ id: 1 }], result_performances: [] };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.exportEvents(123, 'json');

      expect(result).toEqual(mockData);
    });

    it('should throw on 403 forbidden response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Permission denied' })),
      });

      await expect(apiClient.exportEvents(123, 'json')).rejects.toThrow();
    });

    it('should throw on 404 not found response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Project not found' })),
      });

      await expect(apiClient.exportEvents(123, 'json')).rejects.toThrow();
    });

    it('should include CSRF token in headers', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ metadata: {}, events: [], result_performances: [] }),
      });

      await apiClient.exportEvents(123, 'json');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRFToken': 'test-csrf-token',
          }),
        })
      );
    });
  });

  describe('downloadExport', () => {
    it('should trigger file download for xlsx format', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      const createObjectURL = jest.fn(() => 'blob:http://localhost/test-blob-url');
      const revokeObjectURL = jest.fn();
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;

      const clickMock = jest.fn();
      const mockAnchor = {
        click: clickMock,
        href: '',
        download: '',
      } as unknown as HTMLAnchorElement;

      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      await apiClient.downloadExport(123, 'xlsx');

      expect(createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockAnchor.download).toBe('aviation-export-123.xlsx');
      expect(clickMock).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob-url');
    });

    it('should trigger file download for json format', async () => {
      const mockData = { metadata: {}, events: [], result_performances: [] };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const createObjectURL = jest.fn(() => 'blob:http://localhost/test-blob-url');
      const revokeObjectURL = jest.fn();
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;

      const clickMock = jest.fn();
      const mockAnchor = {
        click: clickMock,
        href: '',
        download: '',
      } as unknown as HTMLAnchorElement;

      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      await apiClient.downloadExport(123, 'json');

      expect(createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('aviation-export-123.json');
      expect(clickMock).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    });

    it('should use custom filename when provided', async () => {
      const mockBlob = new Blob(['test']);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      URL.createObjectURL = jest.fn(() => 'blob:url');
      URL.revokeObjectURL = jest.fn();

      const mockAnchor = {
        click: jest.fn(),
        href: '',
        download: '',
      } as unknown as HTMLAnchorElement;

      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      await apiClient.downloadExport(123, 'xlsx', 'custom-report.xlsx');

      expect(mockAnchor.download).toBe('custom-report.xlsx');
    });
  });
});
