export interface TypeHierarchyMinimal {
  id: number;
  code: string;
  label: string;
}

export interface LabelingItem {
  id: number;
  event: number;
  created_by: number | null;
  sequence_number: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';

  threat_type_l1: number | null;
  threat_type_l1_detail: TypeHierarchyMinimal | null;
  threat_type_l2: number | null;
  threat_type_l2_detail: TypeHierarchyMinimal | null;
  threat_type_l3: number | null;
  threat_type_l3_detail: TypeHierarchyMinimal | null;
  threat_management: Record<string, unknown>;
  threat_impact: Record<string, unknown>;
  threat_coping_abilities: Record<string, unknown>;
  threat_description: string;

  error_type_l1: number | null;
  error_type_l1_detail: TypeHierarchyMinimal | null;
  error_type_l2: number | null;
  error_type_l2_detail: TypeHierarchyMinimal | null;
  error_type_l3: number | null;
  error_type_l3_detail: TypeHierarchyMinimal | null;
  error_relevance: string;
  error_management: Record<string, unknown>;
  error_impact: Record<string, unknown>;
  error_coping_abilities: Record<string, unknown>;
  error_description: string;

  uas_applicable: boolean;
  uas_relevance: string;
  uas_type_l1: number | null;
  uas_type_l1_detail: TypeHierarchyMinimal | null;
  uas_type_l2: number | null;
  uas_type_l2_detail: TypeHierarchyMinimal | null;
  uas_type_l3: number | null;
  uas_type_l3_detail: TypeHierarchyMinimal | null;
  uas_management: Record<string, unknown>;
  uas_impact: Record<string, unknown>;
  uas_coping_abilities: Record<string, unknown>;
  uas_description: string;

  calculated_threat_topics: string[];
  calculated_error_topics: string[];
  calculated_uas_topics: string[];

  notes: string;
  linked_result_id: number | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLabelingItemData {
  sequence_number: number;
  status?: 'draft' | 'submitted' | 'reviewed' | 'approved';

  threat_type_l1?: number | null;
  threat_type_l2?: number | null;
  threat_type_l3?: number | null;
  threat_management?: Record<string, unknown>;
  threat_impact?: Record<string, unknown>;
  threat_coping_abilities?: Record<string, unknown>;
  threat_description?: string;

  error_type_l1?: number | null;
  error_type_l2?: number | null;
  error_type_l3?: number | null;
  error_relevance?: string;
  error_management?: Record<string, unknown>;
  error_impact?: Record<string, unknown>;
  error_coping_abilities?: Record<string, unknown>;
  error_description?: string;

  uas_applicable?: boolean;
  uas_relevance?: string;
  uas_type_l1?: number | null;
  uas_type_l2?: number | null;
  uas_type_l3?: number | null;
  uas_management?: Record<string, unknown>;
  uas_impact?: Record<string, unknown>;
  uas_coping_abilities?: Record<string, unknown>;
  uas_description?: string;

  notes?: string;
  linked_result_id?: number | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
}

export interface ResultPerformance {
  id: number;
  aviation_project: number;
  event: number;
  event_type: string;
  severity: string;
  flight_phase: string;
  likelihood: string;
  training_effect: string;
  training_plan: string;
  objectives: string;
  training_topics: string[];
  training_goals: string;
  recommendations: string;
  created_by: number | null;
  reviewed_by: number | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  linked_items: number[];
  threat_summary: string;
  error_summary: string;
  competency_summary: string;
  created_at: string;
  updated_at: string;
}

export interface CreateResultPerformanceData {
  event_type?: string;
  severity?: string;
  flight_phase?: string;
  likelihood?: string;
  training_effect?: string;
  training_plan?: string;
  objectives?: string;
  training_topics?: string[];
  training_goals?: string;
  recommendations?: string;
  reviewed_by?: number | null;
  status?: 'draft' | 'submitted' | 'reviewed' | 'approved';
}

export interface LinkItemsData {
  item_ids: number[];
  contribution_weight?: number;
  notes?: string;
}
