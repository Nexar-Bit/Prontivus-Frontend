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
  // Users management
  getUsers: async (params?: { role?: string; clinic_id?: number }): Promise<{
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin'|'secretary'|'doctor'|'patient';
    clinic_id?: number;
    clinic_name?: string;
    is_active?: boolean;
    is_verified?: boolean;
  }[]> => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.clinic_id) searchParams.append('clinic_id', params.clinic_id.toString());
    const url = `/api/v1/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return api.get(url);
  },

  createUser: async (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: 'admin'|'secretary'|'doctor'|'patient';
    clinic_id?: number;  // Allow SuperAdmin to specify clinic_id
  }) => {
    return api.post('/api/v1/users', data);
  },

  updateUser: async (id: number, data: Partial<{
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin'|'secretary'|'doctor'|'patient';
    is_active: boolean;
    is_verified: boolean;
  }>) => {
    return api.patch(`/api/v1/users/${id}`, data);
  },

  deleteUser: async (id: number) => {
    return api.delete(`/api/v1/users/${id}`);
  },

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
    
    const url = `/api/v1/admin/clinics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return api.get<Clinic[]>(url);
  },

  getClinic: async (id: number): Promise<Clinic> => {
    return api.get<Clinic>(`/api/v1/admin/clinics/${id}`);
  },

  createClinic: async (data: ClinicCreate): Promise<Clinic> => {
    return api.post<Clinic>('/api/v1/admin/clinics', data);
  },

  updateClinic: async (id: number, data: ClinicUpdate): Promise<Clinic> => {
    return api.put<Clinic>(`/api/v1/admin/clinics/${id}`, data);
  },

  updateClinicLicense: async (id: number, data: ClinicLicenseUpdate): Promise<Clinic> => {
    return api.patch<Clinic>(`/api/v1/admin/clinics/${id}/license`, data);
  },

  deleteClinic: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/v1/admin/clinics/${id}`);
  },

  getClinicStats: async (): Promise<ClinicStats> => {
    return api.get<ClinicStats>('/api/v1/admin/clinics/stats');
  },

  getAvailableModules: async (): Promise<string[]> => {
    return api.get<string[]>('/api/v1/admin/modules');
  },

  // Logs management
  getLogs: async (params?: { level?: string; source?: string; search?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.level && params.level !== 'all') sp.append('level', params.level);
    if (params?.source && params.source !== 'all') sp.append('source', params.source);
    if (params?.search) sp.append('search', params.search);
    if (params?.limit) sp.append('limit', String(params.limit));
    return api.get(`/api/v1/admin/logs${sp.toString() ? `?${sp.toString()}` : ''}`);
  },
  createLog: async (data: { level: string; message: string; source: string; details?: string }) => {
    return api.post('/api/v1/admin/logs', data);
  },
  updateLog: async (id: number, data: Partial<{ level: string; message: string; source: string; details: string }>) => {
    return api.put(`/api/v1/admin/logs/${id}`, data);
  },
  deleteLog: async (id: number) => {
    return api.delete(`/api/v1/admin/logs/${id}`);
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
    return api.get('/api/v1/admin/database/test-connections');
  },
};
