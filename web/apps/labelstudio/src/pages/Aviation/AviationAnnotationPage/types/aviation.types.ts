export interface AviationIncident {
  id: number;
  task_id: number;
  event_number: string;
  event_description: string;
  date: string;
  time: string;
  location: string;
  airport: string;
  flight_phase: string;
  aircraft_type: string;
  event_labels: string;
}

export interface HierarchicalSelection {
  level1: string;
  level2: string;
  level3: string;
}

export interface AviationAnnotationData {
  id?: number;
  annotation_id?: number;

  // Basic Info
  aircraft_type: string;
  event_labels: string[];
  notes: string;

  // Threat
  threat_type: HierarchicalSelection;
  threat_management: string;
  threat_outcome: string;
  threat_description: string;

  // Error
  error_relevancy: string;
  error_type: HierarchicalSelection;
  error_management: string;
  error_outcome: string;
  error_description: string;

  // UAS
  uas_relevancy: string;
  uas_type: HierarchicalSelection;
  uas_management: string;
  uas_description: string;

  // Capability (per section)
  threat_capability: string[];
  error_capability: string[];
  uas_capability: string[];

  // Results
  competency_indicators: string[];
  likelihood: string;
  severity: string;
  training_benefit: string;

  // Training
  competency_selections: Record<string, string[]>;
  threat_training_topics: string[];
  error_training_topics: string[];
  uas_training_topics: string[];

  // Additional
  training_plan_ideas: string;
  goals_to_achieve: string;
}

export interface SaveStatus {
  state: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

export interface DropdownOption {
  id: number;
  code: string;
  label: string;
  level: 1 | 2 | 3;
  parent_id: number | null;
  training_topics?: string[] | null;
  children?: DropdownOption[];
}

export interface DropdownCategory {
  aircraft: DropdownOption[];
  threat: DropdownOption[];
  error_type: DropdownOption[];
  uas: DropdownOption[];
  event_labels: DropdownOption[];
  competency: DropdownOption[];
  crm_topics: DropdownOption[];
  flight_phases: DropdownOption[];
  threat_management: DropdownOption[];
  threat_outcome: DropdownOption[];
  error_relevancy: DropdownOption[];
  error_management: DropdownOption[];
  error_outcome: DropdownOption[];
  uas_relevancy: DropdownOption[];
  uas_management: DropdownOption[];
  likelihood: DropdownOption[];
  severity: DropdownOption[];
  training_benefit: DropdownOption[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface TrainingTopics {
  threat_training_topics: string[];
  error_training_topics: string[];
  uas_training_topics: string[];
  combined: string[];
}

export type CategoryType = 'threat' | 'error' | 'uas';
export type SaveStatusType = 'saved' | 'saving' | 'unsaved' | 'error';