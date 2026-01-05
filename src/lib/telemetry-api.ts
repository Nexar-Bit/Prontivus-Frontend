/**
 * Telemetry API
 * Handles patient health metrics and vital signs tracking
 */

import { api } from './api';

export interface TelemetryRecord {
  id: number;
  patient_id: number;
  clinic_id: number;
  measured_at: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  steps?: number;
  calories_burned?: number;
  activity_minutes?: number;
  sleep_hours?: number;
  sleep_quality?: string;
  blood_glucose?: number;
  additional_metrics?: Record<string, any>;
  notes?: string;
  source?: string;
  device_id?: string;
  is_verified: boolean;
  recorded_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface TelemetryCreate {
  measured_at: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  steps?: number;
  calories_burned?: number;
  activity_minutes?: number;
  sleep_hours?: number;
  sleep_quality?: string;
  blood_glucose?: number;
  additional_metrics?: Record<string, any>;
  notes?: string;
  source?: string;
  device_id?: string;
}

export interface TelemetryUpdate {
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  steps?: number;
  calories_burned?: number;
  activity_minutes?: number;
  sleep_hours?: number;
  sleep_quality?: string;
  blood_glucose?: number;
  additional_metrics?: Record<string, any>;
  notes?: string;
  is_verified?: boolean;
}

export interface TelemetryStats {
  period: string;
  patient_id: number;
  average_systolic_bp?: number;
  average_diastolic_bp?: number;
  average_heart_rate?: number;
  average_temperature?: number;
  average_oxygen_saturation?: number;
  average_weight?: number;
  average_bmi?: number;
  total_steps?: number;
  average_calories?: number;
  average_sleep_hours?: number;
  record_count: number;
}

export const telemetryApi = {
  /**
   * Create a new telemetry record
   */
  create: async (data: TelemetryCreate): Promise<TelemetryRecord> => {
    return api.post<TelemetryRecord>('/api/v1/telemetry', data);
  },

  /**
   * Get telemetry records for current patient
   */
  getMyRecords: async (params?: {
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<TelemetryRecord[]> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const query = queryParams.toString();
    return api.get<TelemetryRecord[]>(`/api/v1/telemetry/me${query ? `?${query}` : ''}`);
  },

  /**
   * Get telemetry statistics for current patient
   */
  getMyStats: async (period: 'last_7_days' | 'last_30_days' | 'last_3_months' = 'last_7_days'): Promise<TelemetryStats> => {
    return api.get<TelemetryStats>(`/api/v1/telemetry/me/stats?period=${period}`);
  },

  /**
   * Get a specific telemetry record
   */
  getRecord: async (recordId: number): Promise<TelemetryRecord> => {
    return api.get<TelemetryRecord>(`/api/v1/telemetry/${recordId}`);
  },

  /**
   * Update a telemetry record
   */
  updateRecord: async (recordId: number, data: TelemetryUpdate): Promise<TelemetryRecord> => {
    return api.put<TelemetryRecord>(`/api/v1/telemetry/${recordId}`, data);
  },

  /**
   * Delete a telemetry record
   */
  deleteRecord: async (recordId: number): Promise<void> => {
    return api.delete<void>(`/api/v1/telemetry/${recordId}`);
  },
};
