/**
 * Financial API client functions
 */
import { api } from './api';
import { 
  ServiceItem, ServiceItemCreate,
  Invoice, InvoiceCreate, InvoiceFromAppointmentCreate,
  InvoiceLineCreate, ServiceCategory, InvoiceStatus,
  Payment, PaymentCreate, PaymentUpdate,
  InsurancePlan, InsurancePlanCreate, InsurancePlanUpdate,
  PreAuthRequest, PreAuthRequestCreate, PreAuthRequestUpdate,
  AccountsReceivableSummary, AgingReport
} from './types';

export const financialApi = {
  /**
   * Get all service items
   */
  getServiceItems: async (filters?: {
    category?: ServiceCategory;
    is_active?: boolean;
    search?: string;
  }): Promise<ServiceItem[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const url = `/api/financial/service-items${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<ServiceItem[]>(url);
  },

  /**
   * Create a new service item
   */
  createServiceItem: async (data: ServiceItemCreate): Promise<ServiceItem> => {
    return api.post<ServiceItem>('/api/financial/service-items', data);
  },

  /**
   * Update a service item
   */
  updateServiceItem: async (id: number, data: ServiceItemCreate): Promise<ServiceItem> => {
    return api.put<ServiceItem>(`/api/financial/service-items/${id}`, data);
  },

  /**
   * Get all invoices
   */
  getInvoices: async (filters?: {
    patient_id?: number;
    status?: InvoiceStatus;
    start_date?: string;
    end_date?: string;
  }): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const url = `/api/financial/invoices${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<Invoice[]>(url);
  },

  /**
   * Get current patient's invoices
   */
  getMyInvoices: async (status?: InvoiceStatus): Promise<Invoice[]> => {
    const url = status 
      ? `/api/financial/invoices/me?status=${status}`
      : `/api/financial/invoices/me`;
    return api.get<Invoice[]>(url);
  },

  /**
   * Get a specific invoice by ID
   */
  getInvoice: async (id: number): Promise<Invoice> => {
    return api.get<Invoice>(`/api/financial/invoices/${id}`);
  },

  /**
   * Create a new invoice
   */
  createInvoice: async (data: InvoiceCreate): Promise<Invoice> => {
    return api.post<Invoice>('/api/financial/invoices', data);
  },

  /**
   * Create an invoice from a completed appointment
   */
  createInvoiceFromAppointment: async (data: InvoiceFromAppointmentCreate): Promise<Invoice> => {
    return api.post<Invoice>('/api/financial/invoices/from-appointment', data);
  },

  /**
   * Update an invoice
   */
  updateInvoice: async (id: number, data: InvoiceCreate): Promise<Invoice> => {
    return api.put<Invoice>(`/api/financial/invoices/${id}`, data);
  },

  /**
   * Mark an invoice as paid
   */
  markInvoicePaid: async (id: number): Promise<Invoice> => {
    return api.post<Invoice>(`/api/financial/invoices/${id}/mark-paid`);
  },

  /**
   * Download TISS XML for an invoice
   */
  downloadTissXml: async (id: number, skipValidation: boolean = false): Promise<Blob> => {
    const url = skipValidation 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/${id}/tiss-xml?skip_validation=true`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/${id}/tiss-xml`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download TISS XML: ${response.statusText}`);
    }
    
    return response.blob();
  },

  /**
   * Preview TISS XML for an invoice
   */
  previewTissXml: async (id: number): Promise<string> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/${id}/tiss-xml/preview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to preview TISS XML: ${response.statusText}`);
    }
    
    return response.text();
  },

  /**
   * Download batch TISS XML for multiple invoices
   */
  downloadBatchTissXml: async (invoiceIds: number[]): Promise<Blob> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/batch-tiss-xml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceIds),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download batch TISS XML: ${response.statusText}`);
    }
    
    return response.blob();
  },

  /**
   * Validate TISS XML for an invoice
   */
  validateTissXml: async (id: number): Promise<any> => {
    return api.post<any>(`/api/invoices/${id}/tiss-xml/validate`);
  },

  /**
   * Get invoice payments
   */
  getInvoicePayments: async (invoiceId: number): Promise<Payment[]> => {
    return api.get<Payment[]>(`/api/financial/invoices/${invoiceId}/payments`);
  },

  /**
   * Create a payment
   */
  createPayment: async (data: PaymentCreate): Promise<Payment> => {
    return api.post<Payment>('/api/payments', data);
  },

  /**
   * Update a payment
   */
  updatePayment: async (id: number, data: PaymentUpdate): Promise<Payment> => {
    return api.put<Payment>(`/api/payments/${id}`, data);
  },

  /**
   * Get insurance plans
   */
  getInsurancePlans: async (filters?: {
    is_active?: boolean;
    search?: string;
  }): Promise<InsurancePlan[]> => {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const url = `/api/insurance-plans${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<InsurancePlan[]>(url);
  },

  /**
   * Create an insurance plan
   */
  createInsurancePlan: async (data: InsurancePlanCreate): Promise<InsurancePlan> => {
    return api.post<InsurancePlan>('/api/insurance-plans', data);
  },

  /**
   * Update an insurance plan
   */
  updateInsurancePlan: async (id: number, data: InsurancePlanUpdate): Promise<InsurancePlan> => {
    return api.put<InsurancePlan>(`/api/insurance-plans/${id}`, data);
  },

  /**
   * Get pre-authorization requests
   */
  getPreAuthRequests: async (filters?: {
    patient_id?: number;
    status?: string;
  }): Promise<PreAuthRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const url = `/api/preauth-requests${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<PreAuthRequest[]>(url);
  },

  /**
   * Create a pre-authorization request
   */
  createPreAuthRequest: async (data: PreAuthRequestCreate): Promise<PreAuthRequest> => {
    return api.post<PreAuthRequest>('/api/preauth-requests', data);
  },

  /**
   * Update a pre-authorization request
   */
  updatePreAuthRequest: async (id: number, data: PreAuthRequestUpdate): Promise<PreAuthRequest> => {
    return api.put<PreAuthRequest>(`/api/preauth-requests/${id}`, data);
  },

  /**
   * Get accounts receivable summary
   */
  getAccountsReceivableSummary: async (): Promise<AccountsReceivableSummary> => {
    return api.get<AccountsReceivableSummary>('/api/accounts-receivable/summary');
  },

  /**
   * Get aging report
   */
  getAgingReport: async (): Promise<AgingReport> => {
    return api.get<AgingReport>('/api/accounts-receivable/aging-report');
  },
};
