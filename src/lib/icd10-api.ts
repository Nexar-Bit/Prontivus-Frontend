/**
 * ICD-10 API Client
 * Handles ICD-10 code search and retrieval
 */

import { api } from './api';

export interface ICD10SearchResult {
  id: number;
  code: string;
  description: string;
  level: 'chapter' | 'group' | 'category' | 'subcategory';
  parent_code?: string;
}

export interface ICD10Code {
  id: number;
  code: string;
  description: string;
  description_short?: string;
  level: 'chapter' | 'group' | 'category' | 'subcategory';
  parent_code?: string;
  reference?: string;
  exclusions?: string;
  sex_restriction?: string;
  cause_of_death?: boolean;
}

/**
 * ICD-10 API functions
 */
export const icd10Api = {
  /**
   * Search ICD-10 codes by query
   */
  search: async (query: string): Promise<ICD10SearchResult[]> => {
    return api.get(`/api/icd10/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * Get specific ICD-10 code by code
   */
  getCode: async (code: string): Promise<ICD10Code> => {
    return api.get(`/api/icd10/code/${encodeURIComponent(code)}`);
  },

  /**
   * Get all chapters
   */
  getChapters: async (): Promise<ICD10Code[]> => {
    return api.get('/api/icd10/chapters');
  },

  /**
   * Get groups by chapter
   */
  getGroupsByChapter: async (chapterCode: string): Promise<ICD10Code[]> => {
    return api.get(`/api/icd10/chapters/${encodeURIComponent(chapterCode)}/groups`);
  },

  /**
   * Get categories by group
   */
  getCategoriesByGroup: async (groupCode: string): Promise<ICD10Code[]> => {
    return api.get(`/api/icd10/groups/${encodeURIComponent(groupCode)}/categories`);
  },

  /**
   * Get subcategories by category
   */
  getSubcategoriesByCategory: async (categoryCode: string): Promise<ICD10Code[]> => {
    return api.get(`/api/icd10/categories/${encodeURIComponent(categoryCode)}/subcategories`);
  }
};
