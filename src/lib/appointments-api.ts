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
    // Use the dedicated doctors endpoint
    return api.get<Doctor[]>('/api/users/doctors');
  },

  /**
   * Get patient appointment history for appointment creation suggestions
   */
  getPatientHistory: async (patientId: number, doctorId?: number): Promise<{
    last_appointment_date?: string;
    last_appointment_type?: string;
    returns_count_this_month: number;
    returns_count_total: number;
    last_consultation_date?: string;
    suggested_date?: string;
    message?: string;
  }> => {
    const params = new URLSearchParams();
    if (doctorId) params.append('doctor_id', doctorId.toString());
    const url = `/api/appointments/patient/${patientId}/history${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get(url);
  },

  /**
   * Get procedures available for a specific doctor
   */
  getDoctorProcedures: async (doctorId: number): Promise<Array<{
    id: number;
    name: string;
    description?: string;
    code?: string;
    price: number;
    category: string;
    type: string;
  }>> => {
    return api.get(`/api/appointments/doctor/${doctorId}/procedures`);
  },

  /**
   * Get return approval requests
   */
  getReturnApprovalRequests: async (status?: string): Promise<Array<{
    id: number;
    patient_id: number;
    doctor_id: number;
    clinic_id: number;
    requested_appointment_date: string;
    appointment_type: string;
    notes?: string;
    returns_count_this_month: number;
    status: string;
    requested_by: number;
    approved_by?: number;
    approval_notes?: string;
    resulting_appointment_id?: number;
    requested_at: string;
    reviewed_at?: string;
    expires_at?: string;
    patient_name?: string;
    doctor_name?: string;
    requester_name?: string;
    approver_name?: string;
  }>> => {
    const params = new URLSearchParams();
    if (status) {
      // Ensure status is lowercase to match backend enum
      params.append('status_filter', status.toLowerCase());
    }
    const url = `/api/appointments/return-approval-requests${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get(url);
  },

  /**
   * Create a return approval request
   */
  createReturnApprovalRequest: async (data: {
    patient_id: number;
    doctor_id: number;
    requested_appointment_date: string;
    appointment_type?: string;
    notes?: string;
    returns_count_this_month: number;
  }): Promise<any> => {
    return api.post('/api/appointments/return-approval-requests', data);
  },

  /**
   * Update a return approval request (approve/reject)
   */
  updateReturnApprovalRequest: async (requestId: number, data: {
    status: string;
    approval_notes?: string;
  }): Promise<any> => {
    return api.patch(`/api/appointments/return-approval-requests/${requestId}`, data);
  },
};

