import { api } from './api';
import {
  Procedure, ProcedureCreate, ProcedureUpdate,
  ProcedureProduct, ProcedureProductCreate, ProcedureProductUpdate,
  ProcedureWithProductsCreate
} from './types';

export const proceduresApi = {
  // Procedures
  getProcedures: async (filters?: {
    is_active?: boolean;
    search?: string;
  }): Promise<Procedure[]> => {
    const params = new URLSearchParams();
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    const url = `/api/procedures${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<Procedure[]>(url);
  },

  getProcedure: async (id: number): Promise<Procedure> => {
    return api.get<Procedure>(`/api/procedures/${id}`);
  },

  createProcedure: async (data: ProcedureCreate): Promise<Procedure> => {
    return api.post<Procedure>('/api/procedures', data);
  },

  updateProcedure: async (id: number, data: ProcedureUpdate): Promise<Procedure> => {
    return api.put<Procedure>(`/api/procedures/${id}`, data);
  },

  deleteProcedure: async (id: number): Promise<void> => {
    return api.delete(`/api/procedures/${id}`);
  },

  // Procedure Products
  addProductToProcedure: async (procedureId: number, data: ProcedureProductCreate): Promise<ProcedureProduct> => {
    return api.post<ProcedureProduct>(`/api/procedures/${procedureId}/products`, data);
  },

  updateProcedureProduct: async (procedureProductId: number, data: ProcedureProductUpdate): Promise<ProcedureProduct> => {
    return api.put<ProcedureProduct>(`/api/procedure-products/${procedureProductId}`, data);
  },

  removeProductFromProcedure: async (procedureProductId: number): Promise<void> => {
    return api.delete(`/api/procedure-products/${procedureProductId}`);
  },
};
