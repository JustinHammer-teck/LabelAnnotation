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

// Main annotation form data
export const annotationDataAtom = atom<AviationAnnotationData>({
  aircraft_type: '',
  event_labels: [],
  flight_phase: '',
  threat_type: { level1: null, level2: null, level3: null, fullPath: '' },
  threat_management: '',
  threat_outcome: '',
  threat_description: '',
  error_relevancy: '',
  error_type: { level1: null, level2: null, level3: null, fullPath: '' },
  error_management: '',
  error_outcome: '',
  error_description: '',
  uas_relevancy: '',
  uas_type: { level1: null, level2: null, level3: null, fullPath: '' },
  uas_management: '',
  uas_description: '',
  competency_indicators: [],
  likelihood: '',
  severity: '',
  training_benefit: '',
  crm_training_topics: [],
  training_plan_ideas: '',
  goals_to_achieve: '',
  notes: '',
});

// Dropdown options cache (loaded once on mount)
export const dropdownOptionsAtom = atom<DropdownCategory | null>(null);

// Derived atom: Auto-calculated training topics
export const calculatedTrainingAtom = atom<TrainingTopics>((get) => {
  const data = get(annotationDataAtom);

  const threatTopics = data.threat_type.level3?.training_topics || [];
  const errorTopics = data.error_type.level3?.training_topics || [];
  const uasTopics = data.uas_type.level3?.training_topics || [];

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
      flight_phase: '',
      threat_type: { level1: null, level2: null, level3: null, fullPath: '' },
      threat_management: '',
      threat_outcome: '',
      threat_description: '',
      error_relevancy: '',
      error_type: { level1: null, level2: null, level3: null, fullPath: '' },
      error_management: '',
      error_outcome: '',
      error_description: '',
      uas_relevancy: '',
      uas_type: { level1: null, level2: null, level3: null, fullPath: '' },
      uas_management: '',
      uas_description: '',
      competency_indicators: [],
      likelihood: '',
      severity: '',
      training_benefit: '',
      crm_training_topics: [],
      training_plan_ideas: '',
      goals_to_achieve: '',
      notes: '',
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