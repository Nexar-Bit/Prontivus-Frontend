/**
 * Appointments API client functions
 */
import { api } from './api';
import { Appointment, AppointmentCreate, AppointmentUpdate, AppointmentStatus, Doctor } from './types';

export const appointmentsApi = {
  /**
   * Get all appointments with optional filters
   */
  getAll: async (filters?: {
    start_date?: string;
    end_date?: string;
    doctor_id?: number;
    patient_id?: number;
    status?: AppointmentStatus;
  }): Promise<Appointment[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.doctor_id) params.append('doctor_id', filters.doctor_id.toString());
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<Appointment[]>(url);
  },

  /**
   * Get a specific appointment by ID
   */
  getById: async (id: number): Promise<Appointment> => {
    return api.get<Appointment>(`/api/appointments/${id}`);
  },

  /**
   * Create a new appointment
   */
  create: async (data: AppointmentCreate): Promise<Appointment> => {
    return api.post<Appointment>('/api/appointments', data);
  },

  /**
   * Update an existing appointment
   */
  update: async (id: number, data: AppointmentUpdate): Promise<Appointment> => {
    return api.put<Appointment>(`/api/appointments/${id}`, data);
  },

  /**
   * Update appointment status (check-in, cancel, etc.)
   */
  updateStatus: async (id: number, status: string): Promise<Appointment> => {
    console.log('Sending status update:', { id, status, statusType: typeof status });
    return api.patch<Appointment>(`/api/appointments/${id}/status`, { status });
  },

  /**
   * Delete an appointment (admin only)
   */
  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/appointments/${id}`);
  },

  /**
   * Get list of doctors for the clinic
   */
  getDoctors: async (): Promise<Doctor[]> => {
    // This will use the users endpoint filtered by doctor role
    // For now, we'll create a simple implementation
    return api.get<Doctor[]>('/api/users?role=doctor');
  },
};

