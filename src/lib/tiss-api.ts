/**
 * TISS API client functions
 */
import { api, API_URL } from './api';

// ==================== Types ====================

export interface InsuranceCompany {
  id: number;
  clinic_id: number;
  nome: string;
  razao_social?: string;
  cnpj: string;
  registro_ans: string;
  codigo_operadora?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  is_active: boolean;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
  plans_count?: number;
}

export interface InsuranceCompanyCreate {
  nome: string;
  razao_social?: string;
  cnpj: string;
  registro_ans: string;
  codigo_operadora?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

export interface InsuranceCompanyUpdate {
  nome?: string;
  razao_social?: string;
  cnpj?: string;
  registro_ans?: string;
  codigo_operadora?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  is_active?: boolean;
  observacoes?: string;
}

export interface InsurancePlan {
  id: number;
  insurance_company_id: number;
  clinic_id: number;
  nome_plano: string;
  codigo_plano?: string;
  numero_plano_ans?: string;
  cobertura_percentual: number;
  requer_autorizacao: boolean;
  limite_anual?: number;
  limite_por_procedimento?: number;
  data_inicio_vigencia?: string;
  data_fim_vigencia?: string;
  is_active: boolean;
  observacoes?: string;
  configuracoes_extras?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  insurance_company_nome?: string;
  coverage_count?: number;
}

export interface InsurancePlanCreate {
  insurance_company_id: number;
  nome_plano: string;
  codigo_plano?: string;
  numero_plano_ans?: string;
  cobertura_percentual: number;
  requer_autorizacao: boolean;
  limite_anual?: number;
  limite_por_procedimento?: number;
  data_inicio_vigencia?: string;
  data_fim_vigencia?: string;
  observacoes?: string;
  configuracoes_extras?: Record<string, any>;
}

export interface InsurancePlanUpdate {
  nome_plano?: string;
  codigo_plano?: string;
  numero_plano_ans?: string;
  cobertura_percentual?: number;
  requer_autorizacao?: boolean;
  limite_anual?: number;
  limite_por_procedimento?: number;
  data_inicio_vigencia?: string;
  data_fim_vigencia?: string;
  is_active?: boolean;
  observacoes?: string;
  configuracoes_extras?: Record<string, any>;
}

export interface TUSSPlanCoverage {
  id: number;
  tuss_code_id: number;
  insurance_plan_id: number;
  clinic_id: number;
  coberto: boolean;
  cobertura_percentual: number;
  valor_tabela?: number;
  valor_contratual?: number;
  valor_coparticipacao: number;
  valor_franquia: number;
  requer_autorizacao: boolean;
  prazo_autorizacao_dias?: number;
  limite_quantidade?: number;
  limite_periodo_dias?: number;
  data_inicio_vigencia: string;
  data_fim_vigencia?: string;
  is_active: boolean;
  observacoes?: string;
  regras_especiais?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  tuss_code?: string;
  tuss_descricao?: string;
  plan_nome?: string;
}

export interface TUSSPlanCoverageCreate {
  tuss_code_id: number;
  insurance_plan_id: number;
  coberto: boolean;
  cobertura_percentual: number;
  valor_tabela?: number;
  valor_contratual?: number;
  valor_coparticipacao: number;
  valor_franquia: number;
  requer_autorizacao: boolean;
  prazo_autorizacao_dias?: number;
  limite_quantidade?: number;
  limite_periodo_dias?: number;
  data_inicio_vigencia: string;
  data_fim_vigencia?: string;
  observacoes?: string;
  regras_especiais?: Record<string, any>;
}

export interface TUSSPlanCoverageUpdate {
  coberto?: boolean;
  cobertura_percentual?: number;
  valor_tabela?: number;
  valor_contratual?: number;
  valor_coparticipacao?: number;
  valor_franquia?: number;
  requer_autorizacao?: boolean;
  prazo_autorizacao_dias?: number;
  limite_quantidade?: number;
  limite_periodo_dias?: number;
  data_inicio_vigencia?: string;
  data_fim_vigencia?: string;
  is_active?: boolean;
  observacoes?: string;
  regras_especiais?: Record<string, any>;
}

export interface TUSSLoadHistory {
  id: number;
  clinic_id: number;
  insurance_company_id?: number;
  tuss_plan_coverage_id?: number;
  tipo_carga: string;
  nome_arquivo: string;
  total_registros: number;
  registros_inseridos: number;
  registros_atualizados: number;
  registros_erro: number;
  versao_tuss?: string;
  data_referencia?: string;
  observacoes?: string;
  erros?: Record<string, any>;
  avisos?: Record<string, any>;
  created_by?: number;
  created_at: string;
  user_nome?: string;
  insurance_company_nome?: string;
}

export interface ExcelUploadResult {
  success: boolean;
  message: string;
  total_records: number;
  inserted: number;
  updated: number;
  errors: number;
  error_details?: string[];
  load_history_id?: number;
}

// ==================== Insurance Companies API ====================

export const tissInsuranceApi = {
  // Insurance Companies
  getCompanies: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<InsuranceCompany[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    const url = `/api/v1/tiss/insurance-structure/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<InsuranceCompany[]>(url);
  },

  getCompany: async (id: number): Promise<InsuranceCompany> => {
    return api.get<InsuranceCompany>(`/api/v1/tiss/insurance-structure/companies/${id}`);
  },

  createCompany: async (data: InsuranceCompanyCreate): Promise<InsuranceCompany> => {
    return api.post<InsuranceCompany>('/api/v1/tiss/insurance-structure/companies', data);
  },

  updateCompany: async (id: number, data: InsuranceCompanyUpdate): Promise<InsuranceCompany> => {
    return api.put<InsuranceCompany>(`/api/v1/tiss/insurance-structure/companies/${id}`, data);
  },

  deleteCompany: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/v1/tiss/insurance-structure/companies/${id}`);
  },

  uploadCompaniesExcel: async (file: File): Promise<ExcelUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use fetch directly for FormData uploads
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    const response = await fetch(`${API_URL}/api/v1/tiss/insurance-structure/companies/upload-excel`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  },

  // Insurance Plans
  getPlans: async (params?: {
    skip?: number;
    limit?: number;
    insurance_company_id?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<InsurancePlan[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.insurance_company_id) queryParams.append('insurance_company_id', params.insurance_company_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    const url = `/api/v1/tiss/insurance-structure/plans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<InsurancePlan[]>(url);
  },

  getPlan: async (id: number): Promise<InsurancePlan> => {
    return api.get<InsurancePlan>(`/api/v1/tiss/insurance-structure/plans/${id}`);
  },

  createPlan: async (data: InsurancePlanCreate): Promise<InsurancePlan> => {
    return api.post<InsurancePlan>('/api/v1/tiss/insurance-structure/plans', data);
  },

  updatePlan: async (id: number, data: InsurancePlanUpdate): Promise<InsurancePlan> => {
    return api.put<InsurancePlan>(`/api/v1/tiss/insurance-structure/plans/${id}`, data);
  },

  deletePlan: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/v1/tiss/insurance-structure/plans/${id}`);
  },

  uploadPlansExcel: async (file: File, insurance_company_id?: number): Promise<ExcelUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const queryParams = new URLSearchParams();
    if (insurance_company_id) queryParams.append('insurance_company_id', insurance_company_id.toString());
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const url = `${API_URL}/api/v1/tiss/insurance-structure/plans/upload-excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  },

  // TUSS Plan Coverage
  getCoverage: async (params?: {
    skip?: number;
    limit?: number;
    insurance_plan_id?: number;
    tuss_code_id?: number;
    coberto?: boolean;
    is_active?: boolean;
  }): Promise<TUSSPlanCoverage[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.insurance_plan_id) queryParams.append('insurance_plan_id', params.insurance_plan_id.toString());
    if (params?.tuss_code_id) queryParams.append('tuss_code_id', params.tuss_code_id.toString());
    if (params?.coberto !== undefined) queryParams.append('coberto', params.coberto.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    const url = `/api/v1/tiss/insurance-structure/coverage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<TUSSPlanCoverage[]>(url);
  },

  getCoverageById: async (id: number): Promise<TUSSPlanCoverage> => {
    return api.get<TUSSPlanCoverage>(`/api/v1/tiss/insurance-structure/coverage/${id}`);
  },

  createCoverage: async (data: TUSSPlanCoverageCreate): Promise<TUSSPlanCoverage> => {
    return api.post<TUSSPlanCoverage>('/api/v1/tiss/insurance-structure/coverage', data);
  },

  updateCoverage: async (id: number, data: TUSSPlanCoverageUpdate): Promise<TUSSPlanCoverage> => {
    return api.put<TUSSPlanCoverage>(`/api/v1/tiss/insurance-structure/coverage/${id}`, data);
  },

  deleteCoverage: async (id: number): Promise<void> => {
    return api.delete<void>(`/api/v1/tiss/insurance-structure/coverage/${id}`);
  },

  uploadCoverageExcel: async (file: File, insurance_plan_id?: number): Promise<ExcelUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const queryParams = new URLSearchParams();
    if (insurance_plan_id) queryParams.append('insurance_plan_id', insurance_plan_id.toString());
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const url = `${API_URL}/api/v1/tiss/insurance-structure/coverage/upload-excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  },

  // Load History
  getLoadHistory: async (params?: {
    skip?: number;
    limit?: number;
    tipo_carga?: string;
    insurance_company_id?: number;
  }): Promise<TUSSLoadHistory[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.tipo_carga) queryParams.append('tipo_carga', params.tipo_carga);
    if (params?.insurance_company_id) queryParams.append('insurance_company_id', params.insurance_company_id.toString());
    
    const url = `/api/v1/tiss/insurance-structure/load-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<TUSSLoadHistory[]>(url);
  },

  getLoadHistoryById: async (id: number): Promise<TUSSLoadHistory> => {
    return api.get<TUSSLoadHistory>(`/api/v1/tiss/insurance-structure/load-history/${id}`);
  },
};
