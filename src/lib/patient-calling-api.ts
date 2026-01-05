import { api } from './api';

export interface PatientCall {
  id: number;
  appointment_id: number;
  patient_id: number;
  patient_name?: string;
  doctor_id: number;
  doctor_name?: string;
  secretary_name?: string;
  clinic_id: number;
  status: string;
  called_at: string;
  answered_at?: string;
  call_type?: string; // "doctor_to_patient" or "patient_to_secretary"
  room_number?: string;
}

export const patientCallingApi = {
  call: async (appointmentId: number): Promise<PatientCall> => {
    return api.post<PatientCall>('/api/patient-calling/call', {
      appointment_id: appointmentId,
    });
  },

  callSecretary: async (reason?: string): Promise<PatientCall> => {
    return api.post<PatientCall>('/api/patient-calling/call-secretary', {
      reason: reason || undefined,
    });
  },

  answer: async (appointmentId: number): Promise<{ status: string; appointment_id: number }> => {
    return api.post(`/api/patient-calling/answer/${appointmentId}`);
  },

  complete: async (appointmentId: number): Promise<{ status: string; appointment_id: number }> => {
    return api.post(`/api/patient-calling/complete/${appointmentId}`);
  },

  getActive: async (): Promise<PatientCall[]> => {
    return api.get<PatientCall[]>('/api/patient-calling/active');
  },
};

