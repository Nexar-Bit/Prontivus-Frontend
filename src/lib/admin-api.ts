import { api } from './api';

export interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users: number;
  active_modules: string[];
  user_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ClinicCreate {
  name: string;
  legal_name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users?: number;
  active_modules?: string[];
}

export interface ClinicUpdate {
  name?: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users?: number;
  active_modules?: string[];
}

export interface ClinicLicenseUpdate {
  license_key?: string;
  expiration_date?: string;
  max_users?: number;
  active_modules?: string[];
}

export interface ClinicStats {
  total_clinics: number;
  active_clinics: number;
  expired_licenses: number;
  total_users: number;
  clinics_near_expiration: number;
}

export const adminApi = {
  // Clinic management
  getClinics: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    license_expired?: boolean;
  }): Promise<Clinic[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.license_expired !== undefined) searchParams.append('license_expired', params.license_expired.toString());
    
    const url = `/api/admin/clinics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return api.get<Clinic[]>(url);
  },

  getClinic: async (id: number): Promise<Clinic> => {
    return api.get<Clinic>(`/api/admin/clinics/${id}`);
  },

  createClinic: async (data: ClinicCreate): Promise<Clinic> => {
    return api.post<Clinic>('/api/admin/clinics', data);
  },

  updateClinic: async (id: number, data: ClinicUpdate): Promise<Clinic> => {
    return api.put<Clinic>(`/api/admin/clinics/${id}`, data);
  },

  updateClinicLicense: async (id: number, data: ClinicLicenseUpdate): Promise<Clinic> => {
    return api.patch<Clinic>(`/api/admin/clinics/${id}/license`, data);
  },

  deleteClinic: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/admin/clinics/${id}`);
  },

  getClinicStats: async (): Promise<ClinicStats> => {
    return api.get<ClinicStats>('/api/admin/clinics/stats');
  },

  getAvailableModules: async (): Promise<string[]> => {
    return api.get<string[]>('/api/admin/modules');
  },

  testDatabaseConnections: async (): Promise<{
    summary: {
      total_modules: number;
      successful: number;
      failed: number;
      average_response_time_ms: number;
    };
    modules: {
      [key: string]: {
        status: 'success' | 'error';
        message: string;
        record_count: number | null;
        response_time_ms: number;
        error: string | null;
      };
    };
  }> => {
    return api.get('/api/admin/database/test-connections');
  },
};
