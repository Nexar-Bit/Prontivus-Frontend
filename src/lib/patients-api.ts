/**
 * Patient API client functions
 */
import { api } from './api';
import { Patient, PatientCreate, PatientUpdate } from './types';

export const patientsApi = {
  /**
   * Get all patients for the current clinic
   */
  getAll: async (): Promise<Patient[]> => {
    return api.get<Patient[]>('/api/patients');
  },

  /**
   * Get a specific patient by ID
   */
  getById: async (id: number): Promise<Patient> => {
    return api.get<Patient>(`/api/patients/${id}`);
  },

  /**
   * Create a new patient
   */
  create: async (data: PatientCreate): Promise<Patient> => {
    return api.post<Patient>('/api/patients', data);
  },

  /**
   * Update an existing patient
   */
  update: async (id: number, data: PatientUpdate): Promise<Patient> => {
    return api.put<Patient>(`/api/patients/${id}`, data);
  },

  /**
   * Delete a patient (admin only)
   */
  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/patients/${id}`);
  },
};

