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
  AviationProjectAssignment,
  ToggleAssignmentPayload,
  AnalyticsFilters,
  PaginatedAnalyticsResponse,
  AnalyticsFilterOptions,
} from '../types';

export interface AviationApiClient {
  getProjects(): Promise<AviationProject[]>;
  getProject(id: number): Promise<AviationProject>;
  getAvailableProjects(): Promise<AvailableProject[]>;
  createProject(data: CreateProjectData): Promise<AviationProject>;
  updateProject(id: number, data: Partial<AviationProject>): Promise<AviationProject>;
  deleteProject(id: number): Promise<void>;

  getEvents(projectId: number): Promise<AviationEvent[]>;
  getEvent(id: number): Promise<AviationEvent>;
  updateEvent(id: number, data: Partial<AviationEvent>): Promise<AviationEvent>;

  getItems(eventId: number): Promise<LabelingItem[]>;
  createItem(eventId: number, data: CreateLabelingItemData): Promise<LabelingItem>;
  updateItem(id: number, data: Partial<LabelingItem>): Promise<LabelingItem>;
  deleteItem(id: number): Promise<void>;

  getPerformances(eventId: number): Promise<ResultPerformance[]>;
  createPerformance(eventId: number, data: CreateResultPerformanceData): Promise<ResultPerformance>;
  updatePerformance(id: number, data: Partial<ResultPerformance>): Promise<ResultPerformance>;
  deletePerformance(id: number): Promise<void>;
  linkItems(performanceId: number, data: LinkItemsData): Promise<void>;
  unlinkItems(performanceId: number, itemIds: number[]): Promise<void>;

  getTypeHierarchy(category: DropdownCategory): Promise<DropdownOption[]>;
  searchTypes(query: string, category?: DropdownCategory): Promise<DropdownOption[]>;

  uploadExcel(
    projectId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ExcelUploadResult>;

  exportEvents(projectId: number, format: 'json' | 'xlsx'): Promise<Blob | ExportData>;
  downloadExport(projectId: number, format: 'json' | 'xlsx', filename?: string): Promise<void>;

  // Review endpoints
  /**
   * Submit a labeling item for review.
   * Changes status from 'draft' to 'submitted'.
   */
  submitItem(itemId: number): Promise<LabelingItem>;
  approveItem(itemId: number, comment?: string): Promise<ReviewDecision>;
  rejectItem(itemId: number, request: RejectRequest): Promise<ReviewDecision>;
  requestRevision(itemId: number, request: RevisionRequest): Promise<ReviewDecision>;
  resubmitItem(itemId: number, comment?: string): Promise<LabelingItem>;
  getReviewHistory(itemId: number): Promise<ReviewHistoryResponse>;

  // Assignment endpoints
  /**
   * Get user assignments for an aviation project.
   * Returns all users with their assignment status for the project.
   *
   * @param projectId - Aviation project ID
   * @returns Array of user assignments with permission status
   */
  getProjectAssignments(projectId: number): Promise<AviationProjectAssignment[]>;

  /**
   * Toggle user assignments for an aviation project.
   * Assigns or unassigns users based on the payload.
   *
   * @param projectId - Aviation project ID
   * @param payload - Assignment changes to apply
   * @returns Promise that resolves when assignments are updated
   */
  toggleProjectAssignment(
    projectId: number,
    payload: ToggleAssignmentPayload
  ): Promise<void>;

  // Analytics endpoints
  /**
   * Get paginated analytics events with optional filters.
   * Supports server-side filtering for date range, aircraft, airport,
   * event type, flight phase, threat/error/UAS types, training topics,
   * and competency.
   *
   * @param projectId - Aviation project ID
   * @param filters - Optional filter parameters
   * @param page - Page number (default: 1)
   * @param pageSize - Number of results per page (default: 50)
   * @returns Paginated analytics response with filtered events
   */
  getEventsAnalytics(
    projectId: number,
    filters?: AnalyticsFilters,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedAnalyticsResponse>;

  /**
   * Get available filter options for the analytics endpoint.
   * Returns distinct values for aircraft, airports, event types,
   * flight phases, and training topics.
   *
   * @param projectId - Aviation project ID
   * @returns Filter options with available values for each filter type
   */
  getFilterOptions(projectId: number): Promise<AnalyticsFilterOptions>;

  // Organization-wide analytics endpoints (no projectId required)

  /**
   * Get paginated analytics events across all projects in the organization.
   * Supports server-side filtering for date range, aircraft, airport,
   * event type, flight phase, threat/error/UAS types, training topics,
   * and competency.
   *
   * @param filters - Optional filter parameters
   * @param page - Page number (default: 1)
   * @param pageSize - Number of results per page (default: 50)
   * @returns Paginated analytics response with filtered events
   */
  getAllEventsAnalytics(
    filters?: AnalyticsFilters,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedAnalyticsResponse>;

  /**
   * Get available filter options for organization-wide analytics.
   * Returns distinct values for aircraft, airports, event types,
   * flight phases, and training topics across all projects.
   *
   * @returns Filter options with available values for each filter type
   */
  getAllFilterOptions(): Promise<AnalyticsFilterOptions>;
}
