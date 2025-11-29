import { useEffect, useState } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { useAPI } from '../../../../providers/ApiProvider';
import {
  currentIncidentAtom,
  annotationDataAtom,
  loadingIncidentAtom,
  loadingAnnotationAtom,
  updateFieldsAtom,
  resetAnnotationAtom,
} from '../stores/aviation-annotation.store';
import { AviationIncident, AviationAnnotationData } from '../types/aviation.types';

interface UseAnnotationDataResult {
  incident: AviationIncident | null;
  annotation: AviationAnnotationData;
  annotationId: number | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useAnnotationData = (taskId: number | null): UseAnnotationDataResult => {
  const api = useAPI();
  const [annotationId, setAnnotationId] = useState<number | null>(null);

  const incident = useAtomValue(currentIncidentAtom);
  const annotation = useAtomValue(annotationDataAtom);
  const loadingIncident = useAtomValue(loadingIncidentAtom);
  const loadingAnnotation = useAtomValue(loadingAnnotationAtom);

  const setIncident = useSetAtom(currentIncidentAtom);
  const setLoadingIncident = useSetAtom(loadingIncidentAtom);
  const setLoadingAnnotation = useSetAtom(loadingAnnotationAtom);
  const setAnnotationData = useSetAtom(annotationDataAtom);
  const updateFields = useSetAtom(updateFieldsAtom);
  const resetAnnotation = useSetAtom(resetAnnotationAtom);

  const { data: incidentData, isLoading: isLoadingIncident, error: incidentError, refetch: refetchIncident } = useQuery({
    queryKey: ['aviation-incident', taskId],
    queryFn: async () => {
      const result = await api.callApi<{ results?: AviationIncident[]; [key: string]: any }>('aviationIncidents', {
        params: { task_id: taskId },
        suppressError: true,
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to fetch incident');
      }

      return result.results?.[0] || result;
    },
    enabled: !!taskId,
    staleTime: 30000,
  });

  const { data: annotationData, isLoading: isLoadingAnnotation, error: annotationError, refetch: refetchAnnotation } = useQuery({
    queryKey: ['aviation-annotation', taskId],
    queryFn: async () => {
      const result = await api.callApi<{ results?: AviationAnnotationData[]; [key: string]: any }>('aviationAnnotations', {
        params: { task_id: taskId },
        suppressError: true,
      });

      if (!result) {
        return null;
      }

      if (result.error) {
        if (result.$meta?.status === 404) {
          return null;
        }
        throw new Error(result.error);
      }

      return result.results?.[0] || result;
    },
    enabled: !!taskId,
    staleTime: 30000,
  });

  useEffect(() => {
    setLoadingIncident(isLoadingIncident);
  }, [isLoadingIncident, setLoadingIncident]);

  useEffect(() => {
    setLoadingAnnotation(isLoadingAnnotation);
  }, [isLoadingAnnotation, setLoadingAnnotation]);

  useEffect(() => {
    if (incidentData) {
      setIncident(incidentData as AviationIncident);
    }
  }, [incidentData, setIncident]);

  useEffect(() => {
    if (annotationData) {
      setAnnotationId(annotationData.id || null);
      setAnnotationData(annotationData);
    } else if (!isLoadingAnnotation && taskId && incidentData) {
      resetAnnotation();
      setAnnotationId(null);
      const initialFields: Partial<AviationAnnotationData> = {};
      if (incidentData.flight_phase) {
        initialFields.flight_phase = incidentData.flight_phase;
      }
      if (incidentData.event_description) {
        initialFields.notes = incidentData.event_description;
      }
      if (Object.keys(initialFields).length > 0) {
        updateFields(initialFields);
      }
    }
  }, [annotationData, isLoadingAnnotation, taskId, incidentData, setAnnotationData, resetAnnotation, updateFields]);

  const refetch = () => {
    refetchIncident();
    refetchAnnotation();
  };

  return {
    incident,
    annotation,
    annotationId,
    loading: loadingIncident || loadingAnnotation,
    error: (incidentError || annotationError) as Error | null,
    refetch,
  };
};