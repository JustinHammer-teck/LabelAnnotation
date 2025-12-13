export interface NestedTask {
  id: number;
}

export interface AviationEvent {
  id: number;
  task: NestedTask;
  event_number: string;
  event_description: string;
  date: string;
  time: string | null;
  location: string;
  airport: string;
  departure_airport: string;
  arrival_airport: string;
  actual_landing_airport: string;
  remarks: string;
  flight_phase: string;
  aircraft_type: string;
  aircraft_registration: string;
  crew_composition: Record<string, unknown>;
  weather_conditions: string;
  file_upload: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  task_id: number;
  event_number: string;
  event_description?: string;
  date: string;
  time?: string | null;
  location?: string;
  airport?: string;
  departure_airport?: string;
  arrival_airport?: string;
  actual_landing_airport?: string;
  remarks?: string;
  flight_phase?: string;
  aircraft_type?: string;
  aircraft_registration?: string;
  crew_composition?: Record<string, unknown>;
  weather_conditions?: string;
}
