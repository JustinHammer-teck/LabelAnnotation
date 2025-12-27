import type { AviationApiClient } from './api-client';
import type {
  AviationProject,
  CreateProjectData,
  AvailableProject,
  AviationEvent,
  LabelingItem,
  ResultPerformance,
  DropdownCategory,
  DropdownOption,
  CreateLabelingItemData,
  CreateResultPerformanceData,
  LinkItemsData,
  ExcelUploadResult,
  ExportData,
  ReviewDecision,
  RejectRequest,
  RevisionRequest,
  ReviewHistoryResponse,
} from '../types';

const BASE_URL = '/api/aviation';
const isDevelopment = process.env.NODE_ENV === 'development';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
    public readonly details?: ValidationErrorDetail[] | Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly fieldErrors: ValidationErrorDetail[]
  ) {
    super(message, 'VALIDATION_ERROR', 400, fieldErrors);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message = 'An unexpected server error occurred') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

function getCsrfToken(): string {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  if (!token) {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag?.getAttribute('content') ?? '';
  }

  return token;
}

function logRequest(method: string, url: string, body?: string): void {
  if (!isDevelopment) return;
  console.groupCollapsed(`[API] ${method} ${url}`);
  if (body) {
    try {
      console.log('Request body:', JSON.parse(body));
    } catch {
      console.log('Request body:', body);
    }
  }
  console.groupEnd();
}

function logResponse(method: string, url: string, status: number, data?: unknown): void {
  if (!isDevelopment) return;
  const statusColor = status >= 400 ? 'color: red' : 'color: green';
  console.groupCollapsed(`[API] ${method} ${url} %c${status}`, statusColor);
  if (data !== undefined) {
    console.log('Response:', data);
  }
  console.groupEnd();
}

function logError(method: string, url: string, error: Error): void {
  if (!isDevelopment) return;
  console.groupCollapsed(`[API] ${method} ${url} %cERROR`, 'color: red');
  console.error(error);
  console.groupEnd();
}

function parseValidationErrors(data: Record<string, unknown>): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  for (const [field, value] of Object.entries(data)) {
    if (field === 'detail' || field === 'non_field_errors') continue;

    if (Array.isArray(value)) {
      for (const msg of value) {
        errors.push({ field, message: String(msg) });
      }
    } else if (typeof value === 'string') {
      errors.push({ field, message: value });
    }
  }

  return errors;
}

function handleUnauthorized(): void {
  const currentPath = window.location.pathname + window.location.search;
  const loginUrl = `/user/login/?next=${encodeURIComponent(currentPath)}`;
  window.location.href = loginUrl;
}

async function handleErrorResponse(res: Response, method: string, url: string): Promise<never> {
  let errorData: Record<string, unknown> | null = null;

  try {
    const text = await res.text();
    if (text) {
      errorData = JSON.parse(text);
    }
  } catch {
    errorData = null;
  }

  const detail = errorData?.detail as string | undefined;

  switch (res.status) {
    case 400: {
      const fieldErrors = errorData ? parseValidationErrors(errorData) : [];
      const message = detail || (fieldErrors.length > 0
        ? `Validation failed: ${fieldErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`
        : 'Invalid request data');
      const error = new ValidationError(message, fieldErrors);
      logError(method, url, error);
      throw error;
    }
    case 401: {
      const error = new UnauthorizedError(detail);
      logError(method, url, error);
      handleUnauthorized();
      throw error;
    }
    case 403: {
      const error = new ForbiddenError(detail || 'You do not have permission to perform this action');
      logError(method, url, error);
      throw error;
    }
    case 404: {
      const error = new NotFoundError(detail || 'The requested resource was not found');
      logError(method, url, error);
      throw error;
    }
    case 500:
    case 502:
    case 503:
    case 504: {
      const error = new ServerError(
        detail || 'A server error occurred. Please try again later.'
      );
      logError(method, url, error);
      throw error;
    }
    default: {
      const error = new ApiError(
        detail || `Request failed with status ${res.status}`,
        'UNKNOWN_ERROR',
        res.status,
        errorData ?? undefined
      );
      logError(method, url, error);
      throw error;
    }
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const body = options?.body as string | undefined;

  logRequest(method, url, body);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (method !== 'GET') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRFToken'] = csrfToken;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  } catch (fetchError) {
    const error = new NetworkError(
      fetchError instanceof Error
        ? `Network error: ${fetchError.message}`
        : 'Failed to connect to server'
    );
    logError(method, url, error);
    throw error;
  }

  if (!res.ok) {
    await handleErrorResponse(res, method, url);
  }

  if (res.status === 204) {
    logResponse(method, url, res.status);
    return undefined as T;
  }

  const data = await res.json();
  logResponse(method, url, res.status, data);
  return data;
}

export const createDefaultApiClient = (): AviationApiClient => ({
  async getProjects(): Promise<AviationProject[]> {
    return request<AviationProject[]>(`${BASE_URL}/projects/`);
  },

  async getProject(id: number): Promise<AviationProject> {
    return request<AviationProject>(`${BASE_URL}/projects/${id}/`);
  },

  async getAvailableProjects(): Promise<AvailableProject[]> {
    return request<AvailableProject[]>(`${BASE_URL}/projects/available_projects/`);
  },

  async createProject(data: CreateProjectData): Promise<AviationProject> {
    return request<AviationProject>(`${BASE_URL}/projects/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: number, data: Partial<AviationProject>): Promise<AviationProject> {
    return request<AviationProject>(`${BASE_URL}/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: number): Promise<void> {
    return request<void>(`${BASE_URL}/projects/${id}/`, {
      method: 'DELETE',
    });
  },

  async getEvents(projectId: number): Promise<AviationEvent[]> {
    return request<AviationEvent[]>(`${BASE_URL}/events/?project=${projectId}`);
  },

  async getEvent(id: number): Promise<AviationEvent> {
    return request<AviationEvent>(`${BASE_URL}/events/${id}/`);
  },

  async updateEvent(id: number, data: Partial<AviationEvent>): Promise<AviationEvent> {
    return request<AviationEvent>(`${BASE_URL}/events/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getItems(eventId: number): Promise<LabelingItem[]> {
    return request<LabelingItem[]>(`${BASE_URL}/items/?event=${eventId}`);
  },

  async createItem(eventId: number, data: CreateLabelingItemData): Promise<LabelingItem> {
    return request<LabelingItem>(`${BASE_URL}/items/`, {
      method: 'POST',
      body: JSON.stringify({ ...data, event: eventId }),
    });
  },

  async updateItem(id: number, data: Partial<LabelingItem>): Promise<LabelingItem> {
    return request<LabelingItem>(`${BASE_URL}/items/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteItem(id: number): Promise<void> {
    return request<void>(`${BASE_URL}/items/${id}/`, {
      method: 'DELETE',
    });
  },

  async getPerformances(eventId: number): Promise<ResultPerformance[]> {
    return request<ResultPerformance[]>(`${BASE_URL}/performances/?event=${eventId}`);
  },

  async createPerformance(eventId: number, data: CreateResultPerformanceData): Promise<ResultPerformance> {
    return request<ResultPerformance>(`${BASE_URL}/performances/`, {
      method: 'POST',
      body: JSON.stringify({ ...data, event: eventId }),
    });
  },

  async updatePerformance(id: number, data: Partial<ResultPerformance>): Promise<ResultPerformance> {
    return request<ResultPerformance>(`${BASE_URL}/performances/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deletePerformance(id: number): Promise<void> {
    return request<void>(`${BASE_URL}/performances/${id}/`, {
      method: 'DELETE',
    });
  },

  async linkItems(performanceId: number, data: LinkItemsData): Promise<void> {
    return request<void>(`${BASE_URL}/performances/${performanceId}/link-items/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async unlinkItems(performanceId: number, itemIds: number[]): Promise<void> {
    return request<void>(`${BASE_URL}/performances/${performanceId}/unlink-items/`, {
      method: 'POST',
      body: JSON.stringify({ item_ids: itemIds }),
    });
  },

  async getTypeHierarchy(category: DropdownCategory): Promise<DropdownOption[]> {
    return request<DropdownOption[]>(`${BASE_URL}/types/hierarchy/?category=${category}`);
  },

  async searchTypes(query: string, category?: DropdownCategory): Promise<DropdownOption[]> {
    const params = new URLSearchParams({ q: query });
    if (category) {
      params.append('category', category);
    }
    return request<DropdownOption[]>(`${BASE_URL}/types/search/?${params.toString()}`);
  },

  async uploadExcel(
    projectId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ExcelUploadResult> {
    const url = `${BASE_URL}/projects/${projectId}/import-excel/`;

    logRequest('POST', url, `[File: ${file.name}]`);

    const formData = new FormData();
    formData.append('file', file);

    const csrfToken = getCsrfToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        let data: ExcelUploadResult | Record<string, unknown>;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          const error = new ServerError('Invalid response from server');
          logError('POST', url, error);
          reject(error);
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          logResponse('POST', url, xhr.status, data);
          resolve(data as ExcelUploadResult);
        } else if (xhr.status === 400) {
          const fieldErrors = parseValidationErrors(data as Record<string, unknown>);
          const detail = (data as Record<string, unknown>).detail as string | undefined;
          const message = detail || (fieldErrors.length > 0
            ? `Validation failed: ${fieldErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`
            : 'Invalid request data');
          const error = new ValidationError(message, fieldErrors);
          logError('POST', url, error);
          reject(error);
        } else if (xhr.status === 401) {
          const error = new UnauthorizedError();
          logError('POST', url, error);
          handleUnauthorized();
          reject(error);
        } else if (xhr.status === 403) {
          const error = new ForbiddenError();
          logError('POST', url, error);
          reject(error);
        } else if (xhr.status === 404) {
          const error = new NotFoundError();
          logError('POST', url, error);
          reject(error);
        } else {
          const error = new ServerError();
          logError('POST', url, error);
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        const error = new NetworkError('Failed to upload file');
        logError('POST', url, error);
        reject(error);
      });

      xhr.open('POST', url);
      xhr.setRequestHeader('X-CSRFToken', csrfToken);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  },

  async exportEvents(projectId: number, format: 'json' | 'xlsx'): Promise<Blob | ExportData> {
    const url = `${BASE_URL}/projects/${projectId}/export/?export_format=${format}`;
    const method = 'GET';

    logRequest(method, url);

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {
      'X-CSRFToken': csrfToken,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
      });
    } catch (fetchError) {
      const error = new NetworkError(
        fetchError instanceof Error
          ? `Network error: ${fetchError.message}`
          : 'Failed to connect to server'
      );
      logError(method, url, error);
      throw error;
    }

    if (!res.ok) {
      await handleErrorResponse(res, method, url);
    }

    if (format === 'xlsx') {
      const blob = await res.blob();
      logResponse(method, url, res.status, '[Blob data]');
      return blob;
    }

    const data = await res.json();
    logResponse(method, url, res.status, data);
    return data as ExportData;
  },

  async downloadExport(projectId: number, format: 'json' | 'xlsx', filename?: string): Promise<void> {
    const data = await this.exportEvents(projectId, format);
    const defaultFilename = `aviation-export-${projectId}.${format}`;
    const downloadFilename = filename ?? defaultFilename;

    let blob: Blob;
    if (data instanceof Blob) {
      blob = data;
    } else {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadFilename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  // Review endpoints
  async submitItem(itemId: number): Promise<LabelingItem> {
    return request<LabelingItem>(`${BASE_URL}/items/${itemId}/submit/`, {
      method: 'POST',
    });
  },

  async approveItem(itemId: number, comment?: string): Promise<ReviewDecision> {
    return request<ReviewDecision>(`${BASE_URL}/items/${itemId}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  async rejectItem(itemId: number, reqBody: RejectRequest): Promise<ReviewDecision> {
    return request<ReviewDecision>(`${BASE_URL}/items/${itemId}/reject/`, {
      method: 'POST',
      body: JSON.stringify(reqBody),
    });
  },

  async requestRevision(itemId: number, reqBody: RevisionRequest): Promise<ReviewDecision> {
    return request<ReviewDecision>(`${BASE_URL}/items/${itemId}/revision/`, {
      method: 'POST',
      body: JSON.stringify(reqBody),
    });
  },

  async resubmitItem(itemId: number, comment?: string): Promise<LabelingItem> {
    return request<LabelingItem>(`${BASE_URL}/items/${itemId}/resubmit/`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  async getReviewHistory(itemId: number): Promise<ReviewHistoryResponse> {
    return request<ReviewHistoryResponse>(`${BASE_URL}/items/${itemId}/review-history/`);
  },
});
