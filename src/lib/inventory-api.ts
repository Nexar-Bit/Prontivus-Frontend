/**
 * Inventory/Stock Management API client functions
 */
import { api } from './api';
import { 
  Product, ProductCreate, ProductUpdate,
  StockMovement, StockMovementCreate, StockAdjustmentCreate, StockAdjustmentResponse,
  LowStockProduct, StockSummary, ProductCategory, StockMovementType
} from './types';

export const inventoryApi = {
  // ==================== Products ====================
  
  /**
   * Get all products
   */
  getProducts: async (filters?: {
    category?: ProductCategory;
    is_active?: boolean;
    low_stock?: boolean;
    search?: string;
  }): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.low_stock !== undefined) params.append('low_stock', filters.low_stock.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<Product[]>(url);
  },

  /**
   * Get a specific product with movements
   */
  getProduct: async (id: number): Promise<Product> => {
    return api.get<Product>(`/api/products/${id}`);
  },

  /**
   * Create a new product
   */
  createProduct: async (data: ProductCreate): Promise<Product> => {
    return api.post<Product>('/api/products', data);
  },

  /**
   * Update a product
   */
  updateProduct: async (id: number, data: ProductUpdate): Promise<Product> => {
    return api.put<Product>(`/api/products/${id}`, data);
  },

  /**
   * Delete a product (soft delete)
   */
  deleteProduct: async (id: number): Promise<void> => {
    return api.delete(`/api/products/${id}`);
  },

  // ==================== Stock Movements ====================

  /**
   * Get stock movements
   */
  getStockMovements: async (filters?: {
    product_id?: number;
    movement_type?: StockMovementType;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<StockMovement[]> => {
    const params = new URLSearchParams();
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.movement_type) params.append('movement_type', filters.movement_type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `/api/stock-movements${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<StockMovement[]>(url);
  },

  /**
   * Create a stock movement
   */
  createStockMovement: async (data: StockMovementCreate): Promise<StockMovement> => {
    return api.post<StockMovement>('/api/stock-movements', data);
  },

  /**
   * Adjust stock for a product
   */
  adjustStock: async (data: StockAdjustmentCreate): Promise<StockAdjustmentResponse> => {
    return api.post<StockAdjustmentResponse>('/api/stock-movements/adjustment', data);
  },

  /**
   * Get low stock products
   */
  getLowStockProducts: async (): Promise<LowStockProduct[]> => {
    return api.get<LowStockProduct[]>('/api/stock-movements/low-stock');
  },

  // ==================== Dashboard/Summary ====================

  /**
   * Get stock summary for dashboard
   */
  getStockSummary: async (): Promise<StockSummary> => {
    return api.get<StockSummary>('/api/dashboard/summary');
  },
};
