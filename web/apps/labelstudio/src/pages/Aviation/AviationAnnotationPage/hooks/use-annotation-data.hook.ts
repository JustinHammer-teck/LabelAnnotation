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

  const { data: taskData, isLoading: isLoadingTask } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const result = await api.callApi<{ data?: Record<string, any>; [key: string]: any }>('task', {
        params: { pk: taskId },
        suppressError: true,
      });

      if (!result || result.error) {
        return null;
      }

      return result;
    },
    enabled: !!taskId,
    staleTime: 30000,
  });

  const { data: incidentData, isLoading: isLoadingIncident, error: incidentError, refetch: refetchIncident } = useQuery({
    queryKey: ['aviation-incident', taskId],
    queryFn: async () => {
      const result = await api.callApi<{ results?: AviationIncident[]; [key: string]: any }>('aviationIncidents', {
        params: { task_id: taskId },
        suppressError: true,
      });

      if (!result || result.error) {
        return null;
      }

      return result.results?.[0] || null;
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
    } else if (!isLoadingIncident && !isLoadingTask && taskData?.data) {
      const data = taskData.data;
      setIncident({
        id: 0,
        task_id: taskId || 0,
        event_number: data.event_number || '',
        event_description: data.event_description || '',
        date: data.event_date || '',
        time: '',
        location: data.event_location || '',
        airport: data.airport_name || '',
        flight_phase: data.flight_phase || '',
        aircraft_type: data.aircraft_type || '',
        event_labels: data.event_labels || '',
      } as AviationIncident);
    }
  }, [incidentData, isLoadingIncident, isLoadingTask, taskData, taskId, setIncident]);

  useEffect(() => {
    if (annotationData) {
      setAnnotationId(annotationData.id || null);
      setAnnotationData(annotationData);
    } else if (!isLoadingAnnotation && !isLoadingTask && taskId) {
      resetAnnotation();
      setAnnotationId(null);
      const initialFields: Partial<AviationAnnotationData> = {};
      const sourceData = incidentData || (taskData?.data ? {
        flight_phase: taskData.data.flight_phase,
        event_description: taskData.data.event_description,
      } : null);
      if (sourceData?.flight_phase) {
        initialFields.flight_phase = sourceData.flight_phase;
      }
      if (sourceData?.event_description) {
        initialFields.notes = sourceData.event_description;
      }
      if (Object.keys(initialFields).length > 0) {
        updateFields(initialFields);
      }
    }
  }, [annotationData, isLoadingAnnotation, isLoadingTask, taskId, incidentData, taskData, setAnnotationData, resetAnnotation, updateFields]);

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