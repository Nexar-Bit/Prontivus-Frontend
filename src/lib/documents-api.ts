/**
 * Documents API - PDF Generation
 */
import { API_URL } from './api';
import { api } from './api';

export interface CertificateGenerateRequest {
  patient_id: number;
  justification: string;
  validity_days: number;
}

/**
 * Generate consultation PDF
 */
export async function generateConsultationPDF(appointmentId: number): Promise<Blob> {
  return api.download(`/api/v1/documents/consultations/${appointmentId}/generate-pdf`, {
    method: 'POST',
  });
}

/**
 * Generate prescription PDF
 */
export async function generatePrescriptionPDF(prescriptionId: number): Promise<Blob> {
  return api.download(`/api/v1/documents/prescriptions/${prescriptionId}/pdf`);
}

/**
 * Generate medical certificate PDF
 */
export async function generateCertificatePDF(data: CertificateGenerateRequest): Promise<Blob> {
  return api.download('/api/v1/documents/certificates/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Download PDF blob as file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

