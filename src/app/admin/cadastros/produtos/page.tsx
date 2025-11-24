"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, Plus, Search, Edit, Trash2, Package, 
  RefreshCw, TrendingUp, TrendingDown, Settings, 
  History, AlertTriangle, CheckCircle, XCircle,
  ArrowUp, ArrowDown, Minus, Upload, FileText, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/contexts/AuthContext";

// Product categories matching backend enum
const PRODUCT_CATEGORIES = [
  { value: "medication", label: "Medicamento" },
  { value: "medical_supply", label: "Material Médico" },
  { value: "equipment", label: "Equipamento" },
  { value: "consumable", label: "Consumível" },
  { value: "instrument", label: "Instrumento" },
  { value: "other", label: "Outro" },
];

// Stock movement types
const MOVEMENT_TYPES = [
  { value: "in", label: "Entrada", icon: ArrowUp },
  { value: "out", label: "Saída", icon: ArrowDown },
  { value: "adjustment", label: "Ajuste", icon: Settings },
];

// Stock movement reasons
const MOVEMENT_REASONS = [
  { value: "purchase", label: "Compra" },
  { value: "sale", label: "Venda" },
  { value: "usage", label: "Uso" },
  { value: "return", label: "Devolução" },
  { value: "adjustment", label: "Ajuste" },
  { value: "transfer", label: "Transferência" },
  { value: "expired", label: "Vencido" },
  { value: "damaged", label: "Danificado" },
  { value: "theft", label: "Roubo" },
  { value: "donation", label: "Doação" },
  { value: "other", label: "Outro" },
];

interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  min_stock: number;
  current_stock: number;
  unit_price?: number;
  unit_of_measure: string;
  barcode?: string;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
  stock_status?: "low" | "normal" | "out_of_stock";
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  supplier: string;
  min_stock: string;
  current_stock: string;
  unit_price: string;
  unit_of_measure: string;
  barcode: string;
  is_active: boolean;
}

interface StockMovement {
  id: number;
  product_id: number;
  type: string;
  quantity: number;
  reason: string;
  description?: string;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
  timestamp: string;
  product_name?: string;
  creator_name?: string;
}

interface StockMovementFormData {
  product_id: number;
  type: string;
  quantity: string;
  reason: string;
  description: string;
  unit_cost: string;
  reference_number: string;
}

export default function ProdutosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "",
    supplier: "",
    min_stock: "0",
    current_stock: "0",
    unit_price: "",
    unit_of_measure: "unidade",
    barcode: "",
    is_active: true,
  });

  const [movementFormData, setMovementFormData] = useState<StockMovementFormData>({
    product_id: 0,
    type: "in",
    quantity: "",
    reason: "purchase",
    description: "",
    unit_cost: "",
    reference_number: "",
  });

  const [adjustmentData, setAdjustmentData] = useState({
    product_id: 0,
    new_quantity: "",
    reason: "adjustment",
    description: "",
    reference_number: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (statusFilter === "low") {
        params.append("low_stock", "true");
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      const queryString = params.toString();
      const url = `/api/v1/stock/products${queryString ? `?${queryString}` : ""}`;
      const data = await api.get<Product[]>(url);
      setProducts(data);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error("Erro ao carregar produtos", {
        description: error?.message || error?.detail || "Não foi possível carregar os produtos",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter === "low") {
      filtered = filtered.filter(p => p.stock_status === "low" || p.stock_status === "out_of_stock");
    } else if (statusFilter === "active") {
      filtered = filtered.filter(p => p.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(p => !p.is_active);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.supplier?.toLowerCase().includes(searchLower) ||
          p.barcode?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(filtered);
  };

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      description: "",
      category: "",
      supplier: "",
      min_stock: "0",
      current_stock: "0",
      unit_price: "",
      unit_of_measure: "unidade",
      barcode: "",
      is_active: true,
    });
    setEditingProduct(null);
  };

  const openCreateProductForm = () => {
    resetProductForm();
    setShowProductForm(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      supplier: product.supplier || "",
      min_stock: product.min_stock?.toString() || "0",
      current_stock: product.current_stock?.toString() || "0",
      unit_price: product.unit_price?.toString() || "",
      unit_of_measure: product.unit_of_measure || "unidade",
      barcode: product.barcode || "",
      is_active: product.is_active ?? true,
    });
    setShowProductForm(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productFormData.name || !productFormData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const minStock = parseInt(productFormData.min_stock) || 0;
    const currentStock = parseInt(productFormData.current_stock) || 0;
    const unitPrice = productFormData.unit_price ? parseFloat(productFormData.unit_price.replace(/[^\d,.-]/g, "").replace(",", ".")) : undefined;

    if (minStock < 0 || currentStock < 0) {
      toast.error("Valores de estoque não podem ser negativos");
      return;
    }

    if (unitPrice !== undefined && unitPrice < 0) {
      toast.error("Preço não pode ser negativo");
      return;
    }

    try {
      setSaving(true);

      const productData: any = {
        name: productFormData.name.trim(),
        description: productFormData.description.trim() || undefined,
        category: productFormData.category,
        supplier: productFormData.supplier.trim() || undefined,
        min_stock: minStock,
        current_stock: currentStock,
        unit_price: unitPrice,
        unit_of_measure: productFormData.unit_of_measure.trim() || "unidade",
        barcode: productFormData.barcode.trim() || undefined,
        is_active: productFormData.is_active,
      };

      if (editingProduct) {
        await api.put(`/api/v1/stock/products/${editingProduct.id}`, productData);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await api.post("/api/v1/stock/products", productData);
        toast.success("Produto cadastrado com sucesso!");
      }

      setShowProductForm(false);
      resetProductForm();
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error(editingProduct ? "Erro ao atualizar produto" : "Erro ao cadastrar produto", {
        description: error?.message || error?.detail || "Não foi possível salvar o produto",
      });
    } finally {
      setSaving(false);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/api/v1/stock/products/${productToDelete.id}`);
      toast.success("Produto excluído com sucesso!");
      await loadProducts();
      setProductToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error("Erro ao excluir produto", {
        description: error?.message || error?.detail || "Não foi possível excluir o produto",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.put(`/api/v1/stock/products/${product.id}`, {
        is_active: !product.is_active,
      });
      toast.success(`Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status do produto", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const openMovementForm = (product: Product, type: string = "in") => {
    setSelectedProduct(product);
    setMovementFormData({
      product_id: product.id,
      type: type,
      quantity: "",
      reason: type === "in" ? "purchase" : "usage",
      description: "",
      unit_cost: product.unit_price?.toString() || "",
      reference_number: "",
    });
    setShowMovementForm(true);
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!movementFormData.quantity) {
      toast.error("Informe a quantidade");
      return;
    }

    const quantity = parseInt(movementFormData.quantity);
    if (quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (movementFormData.type === "out" && selectedProduct && quantity > selectedProduct.current_stock) {
      toast.error("Quantidade insuficiente em estoque");
      return;
    }

    try {
      setSaving(true);

      const movementData: any = {
        product_id: movementFormData.product_id,
        type: movementFormData.type,
        quantity: movementFormData.type === "out" ? -quantity : quantity,
        reason: movementFormData.reason,
        description: movementFormData.description.trim() || undefined,
        reference_number: movementFormData.reference_number.trim() || undefined,
      };

      if (movementFormData.unit_cost) {
        const unitCost = parseFloat(movementFormData.unit_cost.replace(/[^\d,.-]/g, "").replace(",", "."));
        if (!isNaN(unitCost) && unitCost >= 0) {
          movementData.unit_cost = unitCost;
          movementData.total_cost = unitCost * quantity;
        }
      }

      await api.post("/api/v1/stock/stock-movements", movementData);
      toast.success("Movimentação registrada com sucesso!");
      setShowMovementForm(false);
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to create movement:", error);
      toast.error("Erro ao registrar movimentação", {
        description: error?.message || error?.detail || "Não foi possível registrar a movimentação",
      });
    } finally {
      setSaving(false);
    }
  };

  const openAdjustmentDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      product_id: product.id,
      new_quantity: product.current_stock.toString(),
      reason: "adjustment",
      description: "",
      reference_number: "",
    });
    setShowAdjustmentDialog(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newQuantity = parseInt(adjustmentData.new_quantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error("Quantidade inválida");
      return;
    }

    try {
      setSaving(true);

      const adjustmentPayload = {
        product_id: adjustmentData.product_id,
        new_quantity: newQuantity,
        reason: adjustmentData.reason,
        description: adjustmentData.description.trim() || undefined,
        reference_number: adjustmentData.reference_number.trim() || undefined,
      };

      await api.post("/api/v1/stock/stock-movements/adjustment", adjustmentPayload);
      toast.success("Ajuste de estoque realizado com sucesso!");
      setShowAdjustmentDialog(false);
      await loadProducts();
    } catch (error: any) {
      console.error("Failed to adjust stock:", error);
      toast.error("Erro ao ajustar estoque", {
        description: error?.message || error?.detail || "Não foi possível ajustar o estoque",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadStockHistory = async (product: Product) => {
    try {
      setSelectedProduct(product);
      const data = await api.get<StockMovement[]>(`/api/v1/stock/stock-movements?product_id=${product.id}&limit=50`);
      setStockMovements(data);
      setShowHistoryDialog(true);
    } catch (error: any) {
      console.error("Failed to load stock history:", error);
      toast.error("Erro ao carregar histórico", {
        description: error?.message || error?.detail || "Não foi possível carregar o histórico",
      });
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStockStatusBadge = (product: Product) => {
    const status = product.stock_status || "normal";
    if (status === "out_of_stock") {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Sem Estoque</Badge>;
    } else if (status === "low") {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Estoque Baixo</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Normal</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    return PRODUCT_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setUploadFile(file);
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Improved CSV parser that handles quoted values
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add last field
      result.push(current.trim());
      return result;
    };

    // Parse header
    const headerLine = parseCSVLine(lines[0]);
    const headers = headerLine.map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      // Handle cases where row has fewer or more columns than headers
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Remove surrounding quotes if present
        row[header] = value.replace(/^"|"$/g, '').trim();
      });
      
      // Only add row if it has at least one non-empty value
      if (Object.values(row).some(v => v && v.toString().trim())) {
        rows.push(row);
      }
    }
    
    return rows;
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const fileText = await uploadFile.text();
      const csvData = parseCSV(fileText);
      
      if (csvData.length === 0) {
        toast.error("O arquivo CSV está vazio ou em formato inválido");
        setIsUploading(false);
        return;
      }

      // Debug: Log first row to help diagnose issues
      if (csvData.length > 0) {
        console.log("CSV Headers:", Object.keys(csvData[0]));
        console.log("First row data:", csvData[0]);
      }

      if (csvData.length > 1000) {
        toast.error("O arquivo contém mais de 1000 linhas. Por favor, divida o arquivo.");
        setIsUploading(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process products in batches
      const batchSize = 10;
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const row = batch[batchIdx];
          const rowIndex = i + batchIdx + 2; // +2 because: +1 for header row, +1 for 0-based index
          
          try {
            // Map CSV columns to product data
            const name = (row.nome || row.name || row['nome produto'] || "").toString().trim();
            const description = (row.descricao || row.description || row['descrição'] || "").toString().trim();
            const category = (row.categoria || row.category || "").toString().trim().toLowerCase();
            const supplier = (row.fornecedor || row.supplier || "").toString().trim();
            const minStock = (row.estoque_minimo || row.min_stock || row['estoque mínimo'] || "0").toString().trim();
            const currentStock = (row.estoque_atual || row.current_stock || row['estoque atual'] || "0").toString().trim();
            const unitPrice = (row.preco || row.unit_price || row.preco_unitario || row['preço unitário'] || "").toString().trim();
            const unitOfMeasure = (row.unidade || row.unit_of_measure || row.unidade_medida || row['unidade de medida'] || "unidade").toString().trim();
            const barcode = (row.codigo_barras || row.barcode || row['código de barras'] || "").toString().trim();

            // Validate required fields
            if (!name || !category) {
              failed++;
              const missingFields = [];
              if (!name) missingFields.push('nome');
              if (!category) missingFields.push('categoria');
              errors.push(`Linha ${rowIndex}: Campos obrigatórios faltando: ${missingFields.join(', ')}`);
              continue;
            }

            // Validate category
            const validCategory = PRODUCT_CATEGORIES.find(c => 
              c.value === category || 
              c.label.toLowerCase() === category.toLowerCase() ||
              c.value.replace('_', ' ') === category.replace('_', ' ')
            );
            
            if (!validCategory) {
              failed++;
              errors.push(`Linha ${rowIndex}: Categoria inválida: "${category}". Categorias válidas: ${PRODUCT_CATEGORIES.map(c => c.value).join(', ')}`);
              continue;
            }

            // Parse numeric values
            const minStockNum = parseInt(minStock) || 0;
            const currentStockNum = parseInt(currentStock) || 0;
            let unitPriceNum: number | undefined = undefined;
            
            if (unitPrice) {
              const cleanedPrice = unitPrice.replace(/[^\d,.-]/g, "").replace(",", ".");
              unitPriceNum = parseFloat(cleanedPrice);
              if (isNaN(unitPriceNum)) {
                unitPriceNum = undefined;
              }
            }

            // Validate numeric values
            if (minStockNum < 0 || currentStockNum < 0) {
              failed++;
              errors.push(`Linha ${rowIndex}: Valores de estoque não podem ser negativos`);
              continue;
            }

            if (unitPriceNum !== undefined && unitPriceNum < 0) {
              failed++;
              errors.push(`Linha ${rowIndex}: Preço não pode ser negativo`);
              continue;
            }

            // Create product data
            const productData: any = {
              name: name,
              description: description || undefined,
              category: validCategory.value,
              supplier: supplier || undefined,
              min_stock: minStockNum,
              current_stock: currentStockNum,
              unit_price: unitPriceNum,
              unit_of_measure: unitOfMeasure || "unidade",
              barcode: barcode || undefined,
              is_active: true,
            };

            await api.post("/api/v1/stock/products", productData);
            console.log(`Product created successfully at row ${rowIndex}`);
            success++;
          } catch (error: any) {
            failed++;
            console.error(`Error creating product at row ${rowIndex}:`, error);
            
            // Safely extract error message
            const errorDetail = error?.response?.data?.detail;
            let errorMsgStr = "Erro desconhecido";
            
            if (typeof errorDetail === 'string') {
              errorMsgStr = errorDetail;
            } else if (Array.isArray(errorDetail)) {
              errorMsgStr = errorDetail.map((e: any) => {
                if (typeof e === 'string') return e;
                if (e?.msg) {
                  const field = e?.loc && Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : '';
                  return field ? `${field}: ${e.msg}` : e.msg;
                }
                return JSON.stringify(e);
              }).join(', ');
            } else if (errorDetail && typeof errorDetail === 'object') {
              errorMsgStr = errorDetail.msg || errorDetail.message || JSON.stringify(errorDetail);
            } else {
              errorMsgStr = error?.response?.data?.message || error?.message || error?.detail || "Erro desconhecido";
            }
            
            errors.push(`Linha ${rowIndex}: ${errorMsgStr}`);
          }
        }

        // Update progress
        const progress = Math.min(90, ((i + batch.length) / csvData.length) * 90);
        setUploadProgress(progress);
      }

      setUploadProgress(100);
      setUploadResults({ success, failed, errors: errors.slice(0, 20) }); // Limit to 20 errors

      if (success > 0) {
        toast.success(`${success} produto(s) importado(s) com sucesso!`);
        
        // Wait a bit to ensure backend has processed all requests
        console.log("Waiting 1 second before reloading products...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reload products list with retry logic
        let retries = 3;
        let loaded = false;
        while (retries > 0 && !loaded) {
          try {
            console.log(`Attempting to reload products (${4 - retries}/3)...`);
            await loadProducts();
            loaded = true;
            console.log("Products reloaded successfully!");
          } catch (error) {
            console.error(`Failed to reload products (attempt ${4 - retries}/3):`, error);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.error("Failed to reload products after upload:", error);
              toast.warning("Produtos importados, mas a lista não foi atualizada. Clique em 'Atualizar Lista' para ver os novos produtos.");
            }
          }
        }
        
        // Switch to list tab to show the imported products
        if (loaded) {
          console.log("Switching to list tab...");
          setActiveTab("list");
        }
      }
      
      if (failed > 0) {
        toast.error(`${failed} produto(s) falharam ao importar`);
      }
    } catch (error: any) {
      console.error("Failed to upload CSV:", error);
      toast.error("Erro ao processar arquivo CSV", {
        description: error?.message || error?.detail || "Não foi possível processar o arquivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = "nome,categoria,descricao,fornecedor,estoque_minimo,estoque_atual,preco,unidade,codigo_barras\nParacetamol 500mg,medication,Analgésico e antitérmico,Fornecedor ABC,10,50,15.50,unidade,7891234567890\nSeringa 5ml,medical_supply,Seringa descartável 5ml,Fornecedor XYZ,20,100,2.30,unidade,7891234567891";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_produtos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template baixado com sucesso");
  };

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          Cadastro de Produtos
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie o estoque de produtos, medicamentos e materiais da clínica
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Produtos</TabsTrigger>
          <TabsTrigger value="bulk">Upload em Massa</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos Cadastrados</CardTitle>
              <CardDescription>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'} encontrado{filteredProducts.length === 1 ? '' : 's'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produto..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateProductForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryLabel(product.category)}</TableCell>
                    <TableCell>{product.supplier || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.current_stock}</span>
                        <span className="text-gray-500 text-sm">{product.unit_of_measure}</span>
                        </div>
                      </TableCell>
                    <TableCell>{product.min_stock}</TableCell>
                    <TableCell>{formatPrice(product.unit_price)}</TableCell>
                      <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStockStatusBadge(product)}
                        <Badge className={product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={() => loadStockHistory(product)}
                          title="Ver histórico"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMovementForm(product, "in")}
                          title="Entrada de estoque"
                        >
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMovementForm(product, "out")}
                          title="Saída de estoque"
                          disabled={product.current_stock === 0}
                        >
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAdjustmentDialog(product)}
                          title="Ajustar estoque"
                        >
                          <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={() => openEditProductForm(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          onClick={() => handleToggleActive(product)}
                          title={product.is_active ? "Desativar" : "Ativar"}
                        >
                          {product.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm || categoryFilter !== "all" || statusFilter !== "all" ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload em Massa de Produtos</CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV para cadastrar múltiplos produtos de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="mb-4">
                  <Label htmlFor="csv-upload-products" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Clique para selecionar um arquivo CSV
                    </span>
                    <Input
                      id="csv-upload-products"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </Label>
                </div>
                {uploadFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(uploadFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(0)}% concluído</p>
                  </div>
                )}
                {uploadResults && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">{uploadResults.success} importado(s)</span>
                        </div>
                        {uploadResults.failed > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span className="font-semibold">{uploadResults.failed} falhou(ram)</span>
                          </div>
                        )}
                      </div>
                      {uploadResults.success > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await loadProducts();
                            toast.success("Lista atualizada!");
                          }}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Atualizar Lista
                        </Button>
                      )}
                    </div>
                    {uploadResults.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold mb-2">Erros encontrados:</p>
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {uploadResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                        {uploadResults.errors.length >= 20 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Mostrando apenas os primeiros 20 erros...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template CSV
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!uploadFile || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Fazendo Upload..." : "Fazer Upload"}
                </Button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Instruções:</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>O arquivo CSV deve conter as colunas: nome, categoria, descricao, fornecedor, estoque_minimo, estoque_atual, preco, unidade, codigo_barras</li>
                  <li>Campos obrigatórios: nome, categoria</li>
                  <li>Categorias válidas: medication, medical_supply, equipment, consumable, instrument, other</li>
                  <li>O arquivo deve estar codificado em UTF-8</li>
                  <li>Máximo de 1000 linhas por arquivo</li>
                  <li>Baixe o template para ver o formato correto</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Create/Edit Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Atualize os dados do produto" : "Preencha os dados do produto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                  required
                  placeholder="Ex: Paracetamol 500mg"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={productFormData.category}
                  onValueChange={(value) => setProductFormData({ ...productFormData, category: value })}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  placeholder="Nome do fornecedor"
                  value={productFormData.supplier}
                  onChange={(e) => setProductFormData({ ...productFormData, supplier: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  placeholder="Código de barras (opcional)"
                  value={productFormData.barcode}
                  onChange={(e) => setProductFormData({ ...productFormData, barcode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_of_measure">Unidade de Medida</Label>
                <Input
                  id="unit_of_measure"
                  placeholder="Ex: unidade, caixa, frasco"
                  value={productFormData.unit_of_measure}
                  onChange={(e) => setProductFormData({ ...productFormData, unit_of_measure: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={productFormData.min_stock}
                  onChange={(e) => setProductFormData({ ...productFormData, min_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="current_stock">Estoque Atual</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={productFormData.current_stock}
                  onChange={(e) => setProductFormData({ ...productFormData, current_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_price">Preço Unitário</Label>
                <Input
                  id="unit_price"
                  type="text"
                  placeholder="R$ 0,00"
                  value={productFormData.unit_price}
                  onChange={(e) => setProductFormData({ ...productFormData, unit_price: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Digite o valor (ex: 15.50 ou 15,50)</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do produto (opcional)"
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={productFormData.is_active}
                  onCheckedChange={(checked) => setProductFormData({ ...productFormData, is_active: checked })}
                />
                <Label htmlFor="is_active">Produto ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowProductForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingProduct ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={showMovementForm} onOpenChange={setShowMovementForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {movementFormData.type === "in" ? "Entrada de Estoque" : movementFormData.type === "out" ? "Saída de Estoque" : "Ajuste de Estoque"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.name} (Estoque atual: ${selectedProduct.current_stock} ${selectedProduct.unit_of_measure})`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="movement_type">Tipo de Movimentação</Label>
                <Select
                  value={movementFormData.type}
                  onValueChange={(value) => setMovementFormData({ ...movementFormData, type: value })}
                >
                  <SelectTrigger id="movement_type">
                    <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                    {MOVEMENT_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
              <div>
                <Label htmlFor="movement_quantity">Quantidade *</Label>
                <Input
                  id="movement_quantity"
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  value={movementFormData.quantity}
                  onChange={(e) => setMovementFormData({ ...movementFormData, quantity: e.target.value })}
                />
                </div>
                  <div>
                <Label htmlFor="movement_reason">Motivo *</Label>
                <Select
                  value={movementFormData.reason}
                  onValueChange={(value) => setMovementFormData({ ...movementFormData, reason: value })}
                  required
                >
                  <SelectTrigger id="movement_reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="movement_unit_cost">Custo Unitário</Label>
                <Input
                  id="movement_unit_cost"
                  type="text"
                  placeholder="R$ 0,00"
                  value={movementFormData.unit_cost}
                  onChange={(e) => setMovementFormData({ ...movementFormData, unit_cost: e.target.value })}
                    />
                  </div>
              <div className="md:col-span-2">
                <Label htmlFor="movement_reference">Número de Referência</Label>
                    <Input
                  id="movement_reference"
                  placeholder="Ex: NF-12345, PED-789"
                  value={movementFormData.reference_number}
                  onChange={(e) => setMovementFormData({ ...movementFormData, reference_number: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="movement_description">Descrição</Label>
                <Textarea
                  id="movement_description"
                  placeholder="Descrição adicional (opcional)"
                  value={movementFormData.description}
                  onChange={(e) => setMovementFormData({ ...movementFormData, description: e.target.value })}
                  rows={3}
                    />
                  </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMovementForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.name} (Estoque atual: ${selectedProduct.current_stock} ${selectedProduct.unit_of_measure})`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adjustment_quantity">Nova Quantidade *</Label>
                <Input
                  id="adjustment_quantity"
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={adjustmentData.new_quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, new_quantity: e.target.value })}
                />
                </div>
            <div>
                <Label htmlFor="adjustment_reason">Motivo *</Label>
                <Select
                  value={adjustmentData.reason}
                  onValueChange={(value) => setAdjustmentData({ ...adjustmentData, reason: value })}
                  required
                >
                  <SelectTrigger id="adjustment_reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adjustment_reference">Número de Referência</Label>
                <Input
                  id="adjustment_reference"
                  placeholder="Ex: INV-12345"
                  value={adjustmentData.reference_number}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reference_number: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="adjustment_description">Descrição</Label>
              <Textarea
                  id="adjustment_description"
                  placeholder="Descrição do ajuste (opcional)"
                  value={adjustmentData.description}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, description: e.target.value })}
                rows={3}
              />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
                    Cancelar
                  </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : "Ajustar"}
                  </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {stockMovements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Custo Unit.</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((movement) => {
                    const MovementIcon = MOVEMENT_TYPES.find(t => t.value === movement.type)?.icon || ArrowUp;
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.timestamp).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MovementIcon className={`h-4 w-4 ${movement.type === "in" ? "text-green-600" : movement.type === "out" ? "text-red-600" : "text-blue-600"}`} />
                            {MOVEMENT_TYPES.find(t => t.value === movement.type)?.label || movement.type}
                          </div>
                        </TableCell>
                        <TableCell className={movement.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                        </TableCell>
                        <TableCell>
                          {MOVEMENT_REASONS.find(r => r.value === movement.reason)?.label || movement.reason}
                        </TableCell>
                        <TableCell>{formatPrice(movement.unit_cost)}</TableCell>
                        <TableCell>{formatPrice(movement.total_cost)}</TableCell>
                        <TableCell>{movement.reference_number || "-"}</TableCell>
                        <TableCell>{movement.description || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma movimentação registrada</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Produto"
        description={productToDelete ? `Tem certeza que deseja excluir o produto "${productToDelete.name}"? Esta ação não pode ser desfeita.` : ""}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
}
