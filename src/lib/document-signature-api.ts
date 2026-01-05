/**
 * Document Signature API
 * Handles digital signature operations for medical documents with AR CFM
 */

import { api } from './api';

export type DocumentType = 'prescription' | 'certificate' | 'consultation_report' | 'exam_request' | 'other';
export type SignatureStatus = 'pending' | 'signed' | 'revoked' | 'expired';

export interface DocumentSignature {
  id: number;
  document_type: DocumentType;
  document_id: number;
  doctor_id: number;
  clinic_id: number;
  crm_number: string;
  crm_state: string;
  certificate_serial?: string;
  certificate_issuer?: string;
  certificate_valid_from?: string;
  certificate_valid_to?: string;
  document_hash: string;
  signature_algorithm: string;
  status: SignatureStatus;
  signed_at: string;
  revoked_at?: string;
  revocation_reason?: string;
  created_at: string;
  updated_at?: string;
  doctor_name?: string;
}

export interface CreateSignatureRequest {
  document_type: DocumentType;
  document_id: number;
  crm_number: string;
  crm_state: string;
  document_hash: string;
  signature_data: string;
  signature_algorithm?: string;
  certificate_serial?: string;
  certificate_issuer?: string;
  certificate_valid_from?: string;
  certificate_valid_to?: string;
}

export interface VerifySignatureRequest {
  document_type: DocumentType;
  document_id: number;
  document_hash?: string;
}

export interface VerifySignatureResponse {
  is_valid: boolean;
  signature?: DocumentSignature;
  error?: string;
  message?: string;
}

export interface RevokeSignatureRequest {
  revocation_reason: string;
}

export const documentSignatureApi = {
  /**
   * Create a digital signature for a document
   */
  create: async (data: CreateSignatureRequest): Promise<DocumentSignature> => {
    return api.post<DocumentSignature>('/api/v1/document-signatures', data);
  },

  /**
   * Get signature by ID
   */
  get: async (signatureId: number): Promise<DocumentSignature> => {
    return api.get<DocumentSignature>(`/api/v1/document-signatures/${signatureId}`);
  },

  /**
   * List signatures with optional filters
   */
  list: async (params?: {
    document_type?: DocumentType;
    document_id?: number;
    doctor_id?: number;
  }): Promise<DocumentSignature[]> => {
    const queryParams = new URLSearchParams();
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.document_id) queryParams.append('document_id', params.document_id.toString());
    if (params?.doctor_id) queryParams.append('doctor_id', params.doctor_id.toString());
    
    const query = queryParams.toString();
    return api.get<DocumentSignature[]>(`/api/v1/document-signatures${query ? `?${query}` : ''}`);
  },

  /**
   * Verify a document signature
   */
  verify: async (data: VerifySignatureRequest): Promise<VerifySignatureResponse> => {
    return api.post<VerifySignatureResponse>('/api/v1/document-signatures/verify', data);
  },

  /**
   * Revoke a signature
   */
  revoke: async (signatureId: number, reason: string): Promise<DocumentSignature> => {
    return api.post<DocumentSignature>(`/api/v1/document-signatures/${signatureId}/revoke`, {
      revocation_reason: reason,
    });
  },
};
