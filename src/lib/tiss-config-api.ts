import { api } from './api';

export interface TissConfigDTO {
  prestador: { cnpj: string; nome: string; codigo_prestador: string };
  operadora: { cnpj: string; nome: string; registro_ans: string };
  defaults: { nome_plano: string; cbo_profissional: string; hora_inicio: string; hora_fim: string };
  tiss: { versao: string; enabled: boolean; auto_generate: boolean };
}

export const tissConfigApi = {
  get: async (): Promise<TissConfigDTO> => {
    return api.get<TissConfigDTO>('/api/financial/tiss-config');
  },
  update: async (data: TissConfigDTO): Promise<void> => {
    return api.put<void>('/api/financial/tiss-config', data);
  }
};


