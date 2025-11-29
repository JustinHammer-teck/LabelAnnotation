import { atom } from 'jotai';
import {
  AviationIncident,
  AviationAnnotationData,
  SaveStatus,
  HierarchicalSelection,
  DropdownCategory,
  ValidationErrors,
  TrainingTopics
} from '../types/aviation.types';

// Current incident (read-only from API)
export const currentIncidentAtom = atom<AviationIncident | null>(null);

const DEFAULT_HIERARCHICAL: HierarchicalSelection = { level1: '', level2: '', level3: '' };

// Main annotation form data
export const annotationDataAtom = atom<AviationAnnotationData>({
  aircraft_type: '',
  event_labels: [],
  notes: '',
  threat_type: { ...DEFAULT_HIERARCHICAL },
  threat_management: '',
  threat_outcome: '',
  threat_description: '',
  error_relevancy: '',
  error_type: { ...DEFAULT_HIERARCHICAL },
  error_management: '',
  error_outcome: '',
  error_description: '',
  uas_relevancy: '',
  uas_type: { ...DEFAULT_HIERARCHICAL },
  uas_management: '',
  uas_description: '',
  competency_indicators: [],
  likelihood: '',
  severity: '',
  training_benefit: '',
  crm_training_topics: {},
  threat_training_topics: [],
  error_training_topics: [],
  uas_training_topics: [],
  training_plan_ideas: '',
  goals_to_achieve: '',
});

// Dropdown options cache (loaded once on mount)
export const dropdownOptionsAtom = atom<DropdownCategory | null>(null);

// Derived atom: Training topics (read from backend, auto-calculated server-side)
export const calculatedTrainingAtom = atom<TrainingTopics>((get) => {
  const data = get(annotationDataAtom);

  const threatTopics = data.threat_training_topics ?? [];
  const errorTopics = data.error_training_topics ?? [];
  const uasTopics = data.uas_training_topics ?? [];

  const combined = Array.from(new Set([...threatTopics, ...errorTopics, ...uasTopics]));

  return {
    threat_training_topics: threatTopics,
    error_training_topics: errorTopics,
    uas_training_topics: uasTopics,
    combined,
  };
});

// Form state tracking
export const annotationDirtyAtom = atom(false);
export const lastSavedAtom = atom<Date | null>(null);
export const saveStatusAtom = atom<SaveStatus>({
  state: 'saved',
  lastSaved: null,
  error: null,
});

export const updateFieldAtom = atom(
  null,
  <K extends keyof AviationAnnotationData>(
    get,
    set,
    update: { field: K; value: AviationAnnotationData[K] }
  ) => {
    const current = get(annotationDataAtom);
    set(annotationDataAtom, { ...current, [update.field]: update.value });
    set(annotationDirtyAtom, true);
    set(saveStatusAtom, { state: 'unsaved', lastSaved: get(lastSavedAtom), error: null });
  }
);

// Batch update atom for multiple fields
export const updateFieldsAtom = atom(
  null,
  (get, set, updates: Partial<AviationAnnotationData>) => {
    const current = get(annotationDataAtom);
    set(annotationDataAtom, { ...current, ...updates });
    set(annotationDirtyAtom, true);
    set(saveStatusAtom, { state: 'unsaved', lastSaved: get(lastSavedAtom), error: null });
  }
);

// Loading states
export const loadingIncidentAtom = atom(false);
export const loadingAnnotationAtom = atom(false);
export const loadingDropdownsAtom = atom(false);

// Validation errors
export const validationErrorsAtom = atom<ValidationErrors>({});

// Clear validation error for a field
export const clearFieldErrorAtom = atom(
  null,
  (get, set, field: string) => {
    const errors = get(validationErrorsAtom);
    const { [field]: _, ...rest } = errors;
    set(validationErrorsAtom, rest);
  }
);

// Reset annotation data
export const resetAnnotationAtom = atom(
  null,
  (get, set) => {
    set(annotationDataAtom, {
      aircraft_type: '',
      event_labels: [],
      notes: '',
      threat_type: { ...DEFAULT_HIERARCHICAL },
      threat_management: '',
      threat_outcome: '',
      threat_description: '',
      error_relevancy: '',
      error_type: { ...DEFAULT_HIERARCHICAL },
      error_management: '',
      error_outcome: '',
      error_description: '',
      uas_relevancy: '',
      uas_type: { ...DEFAULT_HIERARCHICAL },
      uas_management: '',
      uas_description: '',
      competency_indicators: [],
      likelihood: '',
      severity: '',
      training_benefit: '',
      crm_training_topics: {},
      threat_training_topics: [],
      error_training_topics: [],
      uas_training_topics: [],
      training_plan_ideas: '',
      goals_to_achieve: '',
    });
    set(annotationDirtyAtom, false);
    set(validationErrorsAtom, {});
    set(saveStatusAtom, { state: 'saved', lastSaved: null, error: null });
  }
);

// Navigation lock when there are unsaved changes
export const hasUnsavedChangesAtom = atom((get) => {
  return get(annotationDirtyAtom) && get(saveStatusAtom).state !== 'saving';
});