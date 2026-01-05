/**
 * Online Payment API
 * Handles online payment processing for consultations and invoices
 */

import { api } from './api';

export interface PIXPaymentCreate {
  amount?: number;
  description: string;
  invoice_id?: number;
  appointment_id?: number;
  payer_name?: string;
  payer_document?: string;
  payer_email?: string;
  metadata?: Record<string, any>;
}

export interface CardPaymentCreate {
  amount?: number;
  description: string;
  card_token: string;
  installments?: number;
  invoice_id?: number;
  appointment_id?: number;
  payer_name?: string;
  payer_document?: string;
  payer_email?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  payment_id: string;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  qr_code?: string;
  qr_code_image?: string;
  expiration_time?: number;
  installments?: number;
  card_last_4?: string;
  card_brand?: string;
  paid_at?: string;
  created_at: string;
}

export interface PaymentStatusResponse {
  transaction_id: string;
  status: string;
  paid_at?: string;
  amount: number;
  currency: string;
}

export interface PaymentCancelRequest {
  reason?: string;
}

export interface PaymentRefundRequest {
  amount?: number;
  reason?: string;
}

export interface PaymentRefundResponse {
  transaction_id: string;
  refund_id: string;
  status: string;
  refunded_amount: number;
  refunded_at: string;
  reason?: string;
}

export const onlinePaymentApi = {
  /**
   * Create a PIX payment
   */
  createPIXPayment: async (data: PIXPaymentCreate): Promise<PaymentResponse> => {
    return api.post<PaymentResponse>('/api/v1/online-payments/pix', data);
  },

  /**
   * Create a card payment
   */
  createCardPayment: async (data: CardPaymentCreate): Promise<PaymentResponse> => {
    return api.post<PaymentResponse>('/api/v1/online-payments/card', data);
  },

  /**
   * Check payment status
   */
  getPaymentStatus: async (transactionId: string): Promise<PaymentStatusResponse> => {
    return api.get<PaymentStatusResponse>(`/api/v1/online-payments/status/${transactionId}`);
  },

  /**
   * Cancel a pending payment
   */
  cancelPayment: async (transactionId: string, reason?: string): Promise<any> => {
    return api.post(`/api/v1/online-payments/cancel/${transactionId}`, { reason });
  },

  /**
   * Refund a payment (staff only)
   */
  refundPayment: async (transactionId: string, data: PaymentRefundRequest): Promise<PaymentRefundResponse> => {
    return api.post<PaymentRefundResponse>(`/api/v1/online-payments/refund/${transactionId}`, data);
  },
};
