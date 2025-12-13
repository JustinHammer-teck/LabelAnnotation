export interface DropdownOption {
  id: number;
  category: string;
  level: number;
  parent_id: number | null;
  code: string;
  label: string;
  label_zh: string;
  training_topics: string[];
  is_active: boolean;
  children: DropdownOption[];
}

export type DropdownCategory =
  | 'threat'
  | 'error'
  | 'uas'
  | 'flight_phase'
  | 'management'
  | 'impact'
  | 'coping'
  | 'severity'
  | 'event_type'
  | 'likelihood'
  | 'training_effect'
  | 'aircraft_type'
  | 'airport'
  | 'training_topics';

export interface DropdownOptionsState {
  [key: string]: DropdownOption[];
}

export interface HierarchicalSelection {
  level1: string | null;
  level2: string | null;
  level3: string | null;
}
