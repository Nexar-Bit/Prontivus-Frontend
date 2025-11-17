"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package2, Plus, Search, Edit, Trash2, AlertCircle, CheckCircle2, RefreshCw,
  TrendingUp, TrendingDown, History, Filter, X, ArrowUp, ArrowDown, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  stock_status?: string;
  created_at: string;
  updated_at?: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  type: "in" | "out" | "adjustment" | "transfer" | "expired" | "damaged";
  quantity: number;
  reason: string;
  description?: string;
  reference_number?: string;
  timestamp: string;
  product_name?: string;
  creator_name?: string;
}

interface StockSummary {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_value: number;
  recent_movements: number;
  pending_alerts: number;
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
}

interface StockMovementFormData {
  product_id: number;
  type: "in" | "out";
  quantity: string;
  reason: string;
  description: string;
  unit_cost: string;
  reference_number: string;
}

interface StockAdjustmentFormData {
  product_id: number;
  new_quantity: string;
  reason: string;
  description: string;
  reference_number: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  medication: "Medicamento",
  medical_supply: "Insumo Médico",
  equipment: "Equipamento",
  consumable: "Consumível",
  instrument: "Instrumento",
  other: "Outro",
};

const REASON_LABELS: Record<string, string> = {
  purchase: "Compra",
  sale: "Venda",
  usage: "Uso",
  return: "Devolução",
  adjustment: "Ajuste",
  transfer: "Transferência",
  expired: "Vencido",
  damaged: "Danificado",
  theft: "Roubo",
  donation: "Doação",
  other: "Outro",
};

export default function InsumosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [showForm, setShowForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "medical_supply",
    supplier: "",
    min_stock: "0",
    current_stock: "0",
    unit_price: "",
    unit_of_measure: "unidade",
    barcode: "",
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

  const [adjustmentFormData, setAdjustmentFormData] = useState<StockAdjustmentFormData>({
    product_id: 0,
    new_quantity: "",
    reason: "adjustment",
    description: "",
    reference_number: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const loadData = async () => {
    await Promise.all([loadProducts(), loadStockSummary()]);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Product[]>("/api/v1/products");
      setProducts(data);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error("Erro ao carregar insumos", {
        description: error?.message || error?.detail || "Não foi possível carregar os insumos",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStockSummary = async () => {
    try {
      const data = await api.get<StockSummary>("/api/v1/stock/dashboard/summary");
      setStockSummary(data);
    } catch (error: any) {
      console.error("Failed to load stock summary:", error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(product => {
        const status = product.stock_status || getStockStatus(product);
        return status === statusFilter;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.barcode?.includes(searchTerm) ||
          product.supplier?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (product: Product): string => {
    if (product.current_stock === 0) return "out_of_stock";
    if (product.current_stock <= product.min_stock) return "low";
    return "normal";
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "medical_supply",
      supplier: "",
      min_stock: "0",
      current_stock: "0",
      unit_price: "",
      unit_of_measure: "unidade",
      barcode: "",
    });
    setEditingProduct(null);
  };

  const resetMovementForm = () => {
    setMovementFormData({
      product_id: 0,
      type: "in",
      quantity: "",
      reason: "purchase",
      description: "",
      unit_cost: "",
      reference_number: "",
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentFormData({
      product_id: 0,
      new_quantity: "",
      reason: "adjustment",
      description: "",
      reference_number: "",
    });
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "medical_supply",
      supplier: product.supplier || "",
      min_stock: product.min_stock?.toString() || "0",
      current_stock: product.current_stock?.toString() || "0",
      unit_price: product.unit_price?.toString() || "",
      unit_of_measure: product.unit_of_measure || "unidade",
      barcode: product.barcode || "",
    });
    setShowForm(true);
  };

  const openMovementForm = (product: Product, type: "in" | "out" = "in") => {
    setSelectedProduct(product);
    setMovementFormData({
      product_id: product.id,
      type,
      quantity: "",
      reason: type === "in" ? "purchase" : "usage",
      description: "",
      unit_cost: product.unit_price?.toString() || "",
      reference_number: "",
    });
    setShowMovementForm(true);
  };

  const openAdjustmentForm = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentFormData({
      product_id: product.id,
      new_quantity: product.current_stock.toString(),
      reason: "adjustment",
      description: "",
      reference_number: "",
    });
    setShowAdjustmentForm(true);
  };

  const openHistoryDialog = async (product: Product) => {
    setSelectedProduct(product);
    try {
      const movements = await api.get<StockMovement[]>(
        `/api/v1/stock-movements?product_id=${product.id}&limit=50`
      );
      setProductMovements(movements);
      setShowHistoryDialog(true);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico", {
        description: error?.message || error?.detail,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        supplier: formData.supplier.trim() || undefined,
        min_stock: parseInt(formData.min_stock) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        unit_of_measure: formData.unit_of_measure.trim() || "unidade",
        barcode: formData.barcode.trim() || undefined,
        is_active: true,
      };

      if (formData.unit_price) {
        productData.unit_price = parseFloat(formData.unit_price);
      }

      if (editingProduct) {
        await api.put(`/api/v1/products/${editingProduct.id}`, productData);
        toast.success("Insumo atualizado com sucesso!");
      } else {
        await api.post("/api/v1/products", productData);
        toast.success("Insumo cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error(editingProduct ? "Erro ao atualizar insumo" : "Erro ao cadastrar insumo", {
        description: error?.message || error?.detail || "Não foi possível salvar o insumo",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!movementFormData.quantity || parseInt(movementFormData.quantity) <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    if (movementFormData.type === "out" && selectedProduct) {
      if (selectedProduct.current_stock < parseInt(movementFormData.quantity)) {
        toast.error("Estoque insuficiente");
        return;
      }
    }

    try {
      setSaving(true);

      const movementData: any = {
        product_id: movementFormData.product_id,
        type: movementFormData.type,
        quantity: parseInt(movementFormData.quantity),
        reason: movementFormData.reason,
        description: movementFormData.description.trim() || undefined,
        reference_number: movementFormData.reference_number.trim() || undefined,
      };

      if (movementFormData.unit_cost) {
        const unitCost = parseFloat(movementFormData.unit_cost);
        movementData.unit_cost = unitCost;
        movementData.total_cost = unitCost * parseInt(movementFormData.quantity);
      }

      await api.post("/api/v1/stock-movements", movementData);
      toast.success(
        movementFormData.type === "in" 
          ? "Entrada de estoque registrada com sucesso!" 
          : "Saída de estoque registrada com sucesso!"
      );

      setShowMovementForm(false);
      resetMovementForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to create movement:", error);
      toast.error("Erro ao registrar movimento", {
        description: error?.message || error?.detail,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjustmentFormData.new_quantity) {
      toast.error("Informe a nova quantidade");
      return;
    }

    try {
      setSaving(true);

      const adjustmentData = {
        product_id: adjustmentFormData.product_id,
        new_quantity: parseInt(adjustmentFormData.new_quantity),
        reason: adjustmentFormData.reason,
        description: adjustmentFormData.description.trim() || undefined,
        reference_number: adjustmentFormData.reference_number.trim() || undefined,
      };

      await api.post("/api/v1/stock-movements/adjustment", adjustmentData);
      toast.success("Estoque ajustado com sucesso!");

      setShowAdjustmentForm(false);
      resetAdjustmentForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to adjust stock:", error);
      toast.error("Erro ao ajustar estoque", {
        description: error?.message || error?.detail,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o insumo ${product.name}?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/products/${product.id}`);
      toast.success("Insumo excluído com sucesso!");
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error("Erro ao excluir insumo", {
        description: error?.message || error?.detail || "Não foi possível excluir o insumo",
      });
    }
  };

  const getStatusBadge = (product: Product) => {
    const status = product.stock_status || getStockStatus(product);
    
    if (status === "out_of_stock" || product.current_stock === 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1 inline" />
          Sem Estoque
        </Badge>
      );
    } else if (status === "low" || product.current_stock <= product.min_stock) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1 inline" />
          Estoque Baixo
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1 inline" />
          OK
        </Badge>
      );
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package2 className="h-8 w-8 text-teal-600" />
            Cadastro de Insumos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie o estoque de insumos da clínica
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      {stockSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Insumos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockSummary.total_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stockSummary.low_stock_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Sem Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stockSummary.out_of_stock_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(stockSummary.total_value)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Insumos Cadastrados</CardTitle>
              <CardDescription>
                Controle de estoque de insumos ({filteredProducts.length} {filteredProducts.length === 1 ? 'insumo' : 'insumos'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar insumo..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
              {(categoryFilter !== "all" || statusFilter !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Insumo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Quantidade Mínima</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{CATEGORY_LABELS[product.category] || product.category}</TableCell>
                      <TableCell className="font-semibold">{product.current_stock}</TableCell>
                      <TableCell>{product.min_stock}</TableCell>
                      <TableCell>{product.unit_of_measure}</TableCell>
                      <TableCell>{formatPrice(product.unit_price)}</TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMovementForm(product, "in")}
                            title="Entrada de estoque"
                          >
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMovementForm(product, "out")}
                            title="Saída de estoque"
                          >
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjustmentForm(product)}
                            title="Ajustar estoque"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openHistoryDialog(product)}
                            title="Histórico"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(product)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm || categoryFilter !== "all" || statusFilter !== "all" ? "Nenhum insumo encontrado" : "Nenhum insumo cadastrado"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Insumo" : "Cadastrar Novo Insumo"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Atualize os dados do insumo" : "Preencha os dados do insumo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Insumo *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição detalhada do insumo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  placeholder="Nome do fornecedor"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  placeholder="Código de barras (opcional)"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current_stock">Quantidade Atual *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  required
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Quantidade Mínima *</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  required
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_of_measure">Unidade de Medida *</Label>
                <Input
                  id="unit_of_measure"
                  required
                  placeholder="Ex: un, litro, kg"
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="unit_price">Preço Unitário (R$)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
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
              {movementFormData.type === "in" ? "Entrada de Estoque" : "Saída de Estoque"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.name}`}
              {movementFormData.type === "out" && selectedProduct && (
                <span className="block mt-1 text-sm">
                  Estoque atual: {selectedProduct.current_stock} {selectedProduct.unit_of_measure}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="movement_type">Tipo de Movimento *</Label>
                <Select
                  value={movementFormData.type}
                  onValueChange={(value: "in" | "out") => setMovementFormData({ ...movementFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
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
                  value={movementFormData.quantity}
                  onChange={(e) => setMovementFormData({ ...movementFormData, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="movement_reason">Motivo *</Label>
                <Select
                  value={movementFormData.reason}
                  onValueChange={(value) => setMovementFormData({ ...movementFormData, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="movement_unit_cost">Custo Unitário (R$)</Label>
                <Input
                  id="movement_unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={movementFormData.unit_cost}
                  onChange={(e) => setMovementFormData({ ...movementFormData, unit_cost: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="movement_reference">Número de Referência</Label>
              <Input
                id="movement_reference"
                placeholder="Ex: NF-123, PO-456"
                value={movementFormData.reference_number}
                onChange={(e) => setMovementFormData({ ...movementFormData, reference_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="movement_description">Descrição</Label>
              <Textarea
                id="movement_description"
                placeholder="Descrição adicional do movimento..."
                value={movementFormData.description}
                onChange={(e) => setMovementFormData({ ...movementFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMovementForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                {saving ? "Salvando..." : "Registrar Movimento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentForm} onOpenChange={setShowAdjustmentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <>
                  Produto: {selectedProduct.name}
                  <span className="block mt-1 text-sm">
                    Estoque atual: {selectedProduct.current_stock} {selectedProduct.unit_of_measure}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="adjustment_quantity">Nova Quantidade *</Label>
              <Input
                id="adjustment_quantity"
                type="number"
                min="0"
                required
                value={adjustmentFormData.new_quantity}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, new_quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adjustment_reason">Motivo *</Label>
              <Select
                value={adjustmentFormData.reason}
                onValueChange={(value) => setAdjustmentFormData({ ...adjustmentFormData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjustment_reference">Número de Referência</Label>
              <Input
                id="adjustment_reference"
                placeholder="Ex: Inventário, Ajuste manual"
                value={adjustmentFormData.reference_number}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, reference_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adjustment_description">Descrição</Label>
              <Textarea
                id="adjustment_description"
                placeholder="Descrição do ajuste..."
                value={adjustmentFormData.description}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdjustmentForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                {saving ? "Ajustando..." : "Ajustar Estoque"}
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
          <div className="space-y-4">
            {productMovements.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{formatDate(movement.timestamp)}</TableCell>
                        <TableCell>
                          {movement.type === "in" ? (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1 inline" />
                              Entrada
                            </Badge>
                          ) : movement.type === "out" ? (
                            <Badge className="bg-red-100 text-red-800">
                              <TrendingDown className="h-3 w-3 mr-1 inline" />
                              Saída
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Settings className="h-3 w-3 mr-1 inline" />
                              Ajuste
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {movement.type === "in" ? "+" : movement.type === "out" ? "-" : ""}
                          {Math.abs(movement.quantity)}
                        </TableCell>
                        <TableCell>{REASON_LABELS[movement.reason] || movement.reason}</TableCell>
                        <TableCell>{movement.reference_number || "-"}</TableCell>
                        <TableCell>{movement.creator_name || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum movimento registrado</p>
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
    </div>
  );
}
