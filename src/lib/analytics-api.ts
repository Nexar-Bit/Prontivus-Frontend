import { api } from './api';

export interface ClinicalAnalytics {
  period: string;
  start_date: string;
  end_date: string;
  top_diagnoses: Array<{
    icd10_code: string;
    description: string;
    count: number;
  }>;
  patients_by_age_group: Array<{
    age_group: string;
    count: number;
  }>;
  appointments_by_status: Array<{
    status: string;
    count: number;
  }>;
  consultations_by_doctor: Array<{
    doctor_name: string;
    count: number;
  }>;
}

export interface FinancialAnalytics {
  period: string;
  start_date: string;
  end_date: string;
  revenue_by_doctor: Array<{
    doctor_name: string;
    total_revenue: number;
  }>;
  revenue_by_service: Array<{
    service_name: string;
    total_revenue: number;
  }>;
  monthly_revenue_trend: Array<{
    month: string;
    total_revenue: number;
  }>;
  total_revenue: number;
  average_invoice_value: number;
}

export interface InventoryAnalytics {
  period: string;
  start_date: string;
  end_date: string;
  stock_movements_by_type: Array<{
    type: string;
    count: number;
  }>;
  top_products_by_movement: Array<{
    product_name: string;
    total_quantity: number;
  }>;
  low_stock_products: Array<{
    product_name: string;
    current_stock: number;
    min_stock: number;
  }>;
}

export const analyticsApi = {
  getClinicalAnalytics: async (period: string = 'last_30_days'): Promise<ClinicalAnalytics> => {
    return api.get<ClinicalAnalytics>(`/api/analytics/clinical?period=${period}`);
  },

  getFinancialAnalytics: async (period: string = 'last_month'): Promise<FinancialAnalytics> => {
    return api.get<FinancialAnalytics>(`/api/analytics/financial?period=${period}`);
  },

  getInventoryAnalytics: async (period: string = 'last_30_days'): Promise<InventoryAnalytics> => {
    return api.get<InventoryAnalytics>(`/api/analytics/inventory?period=${period}`);
  },
};
