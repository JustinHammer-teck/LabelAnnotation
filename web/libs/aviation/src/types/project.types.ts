export interface NestedProject {
  id: number;
  title: string;
}

export interface AviationProject {
  id: number;
  project: NestedProject;
  threat_mapping: Record<string, unknown>;
  error_mapping: Record<string, unknown>;
  uas_mapping: Record<string, unknown>;
  default_workflow: string;
  require_uas_assessment: boolean;
  auto_calculate_training: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  title?: string;
  description?: string;
  project_id?: number;
  default_workflow?: string;
  require_uas_assessment?: boolean;
}

export interface AvailableProject {
  id: number;
  title: string;
}

export interface ExcelUploadRowError {
  row: number;
  message: string;
}

export interface ExcelUploadResult {
  success: boolean;
  created_count: number;
  first_event_id: number | null;
  errors: ExcelUploadRowError[];
}

export interface ExportData {
  metadata: Record<string, unknown>;
  events: Record<string, unknown>[];
  result_performances: Record<string, unknown>[];
}
