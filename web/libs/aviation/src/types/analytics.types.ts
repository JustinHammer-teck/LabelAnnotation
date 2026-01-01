/**
 * Analytics Types for Aviation Server-Side Filtering
 *
 * These types match the backend serializer output from the
 * /api/aviation/projects/:pk/events/analytics/ endpoint.
 */

// ============================================
// Filter Types
// ============================================

/**
 * Filter parameters for analytics API requests.
 * All filters are optional - when omitted, no filtering is applied.
 */
export interface AnalyticsFilters {
  /** Date range filter: [startDate, endDate] in ISO format (YYYY-MM-DD) */
  dateRange?: [string, string];

  /** Aircraft type filter (multi-select) */
  aircraft?: string[];

  /** Airport filter - matches departure, arrival, or actual landing airport (single select) */
  airport?: string;

  /** Event type filter (multi-select) */
  eventType?: string[];

  /** Flight phase filter (multi-select) */
  flightPhase?: string[];

  /** Threat type cascader values: [l1?, l2?, l3?] */
  threatType?: string[];

  /** Error type cascader values: [l1?, l2?, l3?] */
  errorType?: string[];

  /** UAS type cascader values: [l1?, l2?, l3?] */
  uasType?: string[];

  /** Training topic filter (multi-select) */
  trainingTopic?: string[];

  /** Competency filter - multi-select cascader: [[category], [category, item], ...] */
  competency?: string[][];
}

// ============================================
// Response Types (matching backend serializers)
// ============================================

/**
 * Basic event information in the analytics response.
 * Field names are in Chinese to match the backend serializer.
 */
export interface AnalyticsBasicInfo {
  /** Event number / identifier */
  事件编号: string;

  /** Event date (YYYY-MM-DD format) */
  日期: string;

  /** Event time (HH:MM:SS format or null) */
  时间: string | null;

  /** Aircraft type */
  机型: string;

  /** Departure airport */
  起飞机场: string;

  /** Arrival airport */
  落地机场: string;

  /** Actual landing airport */
  实际降落: string;

  /** Reporting unit */
  报告单位: string;

  /** Notes/remarks */
  备注: string;
}

/**
 * Type hierarchy information (threat/error/UAS) in analytics response.
 */
export interface AnalyticsTypeHierarchy {
  /** Level 1 type (or null if not set) */
  level1: string | null;

  /** Level 2 type (or null if not set) */
  level2: string | null;

  /** Level 3 type (or null if not set) */
  level3: string | null;

  /** Management status */
  管理: string;

  /** Impact value */
  影响: string;

  /** Coping abilities list */
  应对能力: string[];

  /** Description text */
  描述: string;
}

/**
 * Labeling item in the analytics response.
 */
export interface AnalyticsLabelingItem {
  /** Item ID (string format for consistency) */
  id: string;

  /** Associated result performance ID (or null if not linked) */
  关联事件类型ID: string | null;

  /** Threat type hierarchy (or null if not set) */
  威胁列表: AnalyticsTypeHierarchy | null;

  /** Error type hierarchy (or null if not set) */
  差错列表: AnalyticsTypeHierarchy | null;

  /** UAS type hierarchy (or null if not set) */
  UAS列表: AnalyticsTypeHierarchy | null;

  /** End state description */
  结束状态描述: string;
}

/**
 * Result performance record in the analytics response.
 */
export interface AnalyticsResultPerformance {
  /** Performance ID (string format for consistency) */
  id: string;

  /** Event type classification */
  事件类型: string;

  /** Flight phase */
  飞行阶段: string;

  /** Likelihood assessment */
  可能性: string;

  /** Severity level */
  严重程度: string;

  /** Training effectiveness */
  训练效果: string;

  /** Training plan proposal */
  训练方案设想: string;

  /** Training topics list */
  训练主题: string[];

  /** Training objectives */
  所需达到的目标: string;
}

/**
 * Single analytics event with all associated data.
 */
export interface AnalyticsEvent {
  /** Event ID (string format for consistency) */
  eventId: string;

  /** Basic event information */
  基本信息: AnalyticsBasicInfo;

  /** Event description text */
  事件描述: string;

  /** List of result performances for this event */
  结果绩效列表: AnalyticsResultPerformance[];

  /** List of labeling items for this event */
  标签标注列表: AnalyticsLabelingItem[];
}

/**
 * Paginated response from the analytics endpoint.
 */
export interface PaginatedAnalyticsResponse {
  /** Total count of matching events */
  count: number;

  /** URL to next page (or null if no more pages) */
  next: string | null;

  /** URL to previous page (or null if first page) */
  previous: string | null;

  /** Array of analytics events for this page */
  results: AnalyticsEvent[];
}

// ============================================
// Filter Options (from /filter-options/ endpoint)
// ============================================

/**
 * Available filter options returned by the filter-options endpoint.
 * Used to populate filter dropdowns in the UI.
 */
export interface AnalyticsFilterOptions {
  /** Available aircraft types */
  aircraft: string[];

  /** Available airports */
  airports: string[];

  /** Available event types */
  eventTypes: string[];

  /** Available flight phases */
  flightPhases: string[];

  /** Available training topics */
  trainingTopics: string[];
}

// ============================================
// Utility Types
// ============================================

/**
 * Parameters for building query string from filters.
 */
export interface AnalyticsQueryParams {
  page?: number;
  page_size?: number;
  date_start?: string;
  date_end?: string;
  aircraft?: string;
  airport?: string;
  event_type?: string;
  flight_phase?: string;
  threat_l1?: string;
  threat_l2?: string;
  threat_l3?: string;
  error_l1?: string;
  error_l2?: string;
  error_l3?: string;
  uas_l1?: string;
  uas_l2?: string;
  uas_l3?: string;
  training_topic?: string;
  competency?: string;
}
