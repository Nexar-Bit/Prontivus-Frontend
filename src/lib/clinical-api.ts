/**
 * Clinical Records API Client
 * Handles SOAP notes, prescriptions, and exam requests
 */

import { api } from './api';
import {
	ClinicalRecord,
	ClinicalRecordCreate,
	ClinicalRecordUpdate,
	Prescription,
	PrescriptionCreate,
	PrescriptionUpdate,
	ExamRequest,
	ExamRequestCreate,
	ExamRequestUpdate,
} from './types';

/**
 * Clinical Records (SOAP Notes) API
 */
export const clinicalRecordsApi = {
	// Create or update clinical record for an appointment
	createOrUpdate: async (
		appointmentId: number,
		data: ClinicalRecordCreate | ClinicalRecordUpdate
	): Promise<ClinicalRecord> => {
		return api.post(`/api/appointments/${appointmentId}/clinical-record`, data);
	},

	// Autosave snapshot for an appointment's clinical record
	autosave: async (
		appointmentId: number,
		data: Partial<ClinicalRecordUpdate>
	): Promise<{ success: boolean; version_id: number }> => {
		return api.post(`/api/appointments/${appointmentId}/clinical-record/autosave`, data);
	},

	// Get clinical record for an appointment
	getByAppointment: async (appointmentId: number): Promise<ClinicalRecord> => {
		return api.get(`/api/appointments/${appointmentId}/clinical-record`);
	},

	// Get patient's clinical history (staff access)
	getPatientHistoryById: async (patientId: number): Promise<ClinicalRecord[]> => {
		return api.get(`/api/patients/${patientId}/clinical-records`);
	},

	// Get current patient's own clinical history
	getPatientHistory: async (): Promise<any[]> => {
		return api.get(`/api/clinical/me/history`);
	},

	// Get version history for a record
	getVersions: async (recordId: number) => {
		return api.get(`/api/clinical-records/${recordId}/versions`);
	},
};

/**
 * Prescriptions API
 */
export const prescriptionsApi = {
	// Add prescription to clinical record
	create: async (
		clinicalRecordId: number,
		data: Omit<PrescriptionCreate, 'clinical_record_id'>
	): Promise<Prescription> => {
		return api.post(`/api/clinical-records/${clinicalRecordId}/prescriptions`, data);
	},

	// Update prescription
	update: async (
		prescriptionId: number,
		data: PrescriptionUpdate
	): Promise<Prescription> => {
		return api.put(`/api/prescriptions/${prescriptionId}`, data);
	},

	// Delete prescription
	delete: async (prescriptionId: number): Promise<void> => {
		return api.delete(`/api/prescriptions/${prescriptionId}`);
	},

	// Get prescriptions for a clinical record
	getByClinicalRecord: async (
		clinicalRecordId: number
	): Promise<Prescription[]> => {
		return api.get(`/api/clinical-records/${clinicalRecordId}/prescriptions`);
	},
};

/**
 * Exam Requests API
 */
export const examRequestsApi = {
	// Create exam request
	create: async (
		clinicalRecordId: number,
		data: Omit<ExamRequestCreate, 'clinical_record_id'>
	): Promise<ExamRequest> => {
		return api.post(`/api/clinical-records/${clinicalRecordId}/exam-requests`, data);
	},

	// Update exam request
	update: async (
		examRequestId: number,
		data: ExamRequestUpdate
	): Promise<ExamRequest> => {
		return api.put(`/api/exam-requests/${examRequestId}`, data);
	},

	// Delete exam request
	delete: async (examRequestId: number): Promise<void> => {
		return api.delete(`/api/exam-requests/${examRequestId}`);
	},

	// Get exam requests for a clinical record
	getByClinicalRecord: async (
		clinicalRecordId: number
	): Promise<ExamRequest[]> => {
		return api.get(`/api/clinical-records/${clinicalRecordId}/exam-requests`);
	},
};

// Diagnoses API
export const diagnosesApi = {
	create: async (recordId: number, data: { cid_code: string; description?: string; type?: 'primary' | 'secondary' }) => {
		return api.post(`/api/clinical-records/${recordId}/diagnoses`, data);
	},
	list: async (recordId: number) => {
		return api.get(`/api/clinical-records/${recordId}/diagnoses`);
	},
	update: async (diagnosisId: number, data: { cid_code?: string; description?: string; type?: 'primary' | 'secondary' }) => {
		return api.put(`/api/diagnoses/${diagnosisId}`, data);
	},
	delete: async (diagnosisId: number) => {
		return api.delete(`/api/diagnoses/${diagnosisId}`);
	},
};

