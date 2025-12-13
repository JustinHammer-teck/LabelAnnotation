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
}
