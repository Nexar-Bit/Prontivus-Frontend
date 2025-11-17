"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package2, Search, AlertCircle, CheckCircle2, RefreshCw, Download,
  Eye, Filter, TrendingUp, TrendingDown, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Tag, ShoppingCart, DollarSign,
  Calendar, User, FileText, Package, AlertTriangle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StockItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  current_stock: number;
  min_stock: number;
  unit_price?: number;
  unit_of_measure: string;
  barcode?: string;
  is_active: boolean;
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductDetail extends StockItem {
  recent_movements?: StockMovement[];
}

interface StockMovement {
  id: number;
  product_id: number;
  type: string;
  quantity: number;
  reason: string;
  description?: string;
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

interface LowStockProduct {
  id: number;
  name: string;
  current_stock: number;
  min_stock: number;
  category: string;
  days_until_out?: number;
}

export default function EstoqueConsultaPage() {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStock();
  }, [stock, searchTerm, categoryFilter, statusFilter]);

  const loadData = async () => {
    await Promise.all([
      loadStock(),
      loadSummary(),
      loadLowStock(),
    ]);
  };

  const loadStock = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("is_active", "true");
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      
      const data = await api.get<StockItem[]>(`/api/v1/products?${params.toString()}`);
      setStock(data);
    } catch (error: any) {
      console.error("Failed to load stock:", error);
      toast.error("Erro ao carregar estoque", {
        description: error?.message || error?.detail || "Não foi possível carregar o estoque",
      });
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await api.get<StockSummary>("/api/v1/stock/dashboard/summary");
      setSummary(data);
    } catch (error: any) {
      console.error("Failed to load summary:", error);
      // Don't show error toast for summary, just set null
      setSummary(null);
    }
  };

  const loadLowStock = async () => {
    try {
      const data = await api.get<LowStockProduct[]>("/api/v1/stock-movements/low-stock");
      setLowStockItems(data);
    } catch (error: any) {
      console.error("Failed to load low stock:", error);
      setLowStockItems([]);
    }
  };

  const loadProductDetails = async (product: StockItem) => {
    try {
      setLoadingDetails(true);
      const data = await api.get<ProductDetail>(`/api/v1/products/${product.id}`);
      setProductDetail(data);
      setSelectedProduct(product);
      setShowDetails(true);
    } catch (error: any) {
      console.error("Failed to load product details:", error);
      toast.error("Erro ao carregar detalhes", {
        description: error?.message || error?.detail || "Não foi possível carregar os detalhes do produto",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterStock = () => {
    let filtered = [...stock];
    
    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => {
        const status = item.stock_status || getStockStatus(item.current_stock, item.min_stock);
        if (statusFilter === "low") {
          return status === "low" || status === "out_of_stock";
        } else if (statusFilter === "normal") {
          return status === "normal";
        } else if (statusFilter === "out_of_stock") {
          return status === "out_of_stock";
        }
        return true;
      });
    }
    
    setFilteredStock(filtered);
  };

  const getStockStatus = (currentStock: number, minStock: number): string => {
    if (currentStock === 0) {
      return "out_of_stock";
    } else if (currentStock <= minStock) {
      return "low";
    } else {
      return "normal";
    }
  };

  const getStatusBadge = (status?: string, currentStock: number = 0, minStock: number = 0) => {
    const displayStatus = status || getStockStatus(currentStock, minStock);

    switch (displayStatus) {
      case "out_of_stock":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1 inline" />
            Estoque Crítico
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1 inline" />
            Estoque Baixo
          </Badge>
        );
      case "normal":
      default:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            Estoque OK
          </Badge>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      medication: "Medicamento",
      medical_supply: "Suprimento Médico",
      equipment: "Equipamento",
      consumable: "Consumível",
      instrument: "Instrumento",
      other: "Outro",
    };
    return labels[category] || category;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const exportData = () => {
    if (filteredStock.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    
    // Create CSV content
    const csvRows = [];
    csvRows.push("ID,Nome,Descrição,Categoria,Fornecedor,Estoque Atual,Estoque Mínimo,Unidade,Preço Unitário,Status");
    
    filteredStock.forEach(item => {
      const status = item.stock_status || getStockStatus(item.current_stock, item.min_stock);
      const statusLabel = status === "out_of_stock" ? "Crítico" :
                         status === "low" ? "Baixo" : "OK";
      csvRows.push([
        item.id,
        item.name,
        item.description || "",
        getCategoryLabel(item.category),
        item.supplier || "",
        item.current_stock.toString(),
        item.min_stock.toString(),
        item.unit_of_measure,
        item.unit_price?.toFixed(2) || "",
        statusLabel
      ].join(","));
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `estoque-consulta-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Dados exportados com sucesso!");
  };

  // Calculate statistics from filtered stock
  const stats = {
    total: filteredStock.length,
    lowStock: filteredStock.filter(item => {
      const status = item.stock_status || getStockStatus(item.current_stock, item.min_stock);
      return status === "low";
    }).length,
    outOfStock: filteredStock.filter(item => {
      const status = item.stock_status || getStockStatus(item.current_stock, item.min_stock);
      return status === "out_of_stock";
    }).length,
    totalValue: filteredStock.reduce((sum, item) => {
      return sum + ((item.unit_price || 0) * item.current_stock);
    }, 0),
  };

  // Get unique categories
  const categories = Array.from(new Set(stock.map(p => p.category)));

  if (loading && stock.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
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
            <Package2 className="h-8 w-8 text-green-600" />
            Consulta de Estoque
          </h1>
          <p className="text-gray-600 mt-2">
            Consulte o estoque de insumos e produtos da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={filteredStock.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
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
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {summary.total_products}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Produtos ativos no estoque
              </p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {summary.low_stock_products}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Produtos abaixo do mínimo
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Sem Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {summary.out_of_stock_products}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Produtos esgotados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(summary.total_value)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Valor do estoque atual
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque Baixo
            </CardTitle>
            <CardDescription>
              {lowStockItems.length} {lowStockItems.length === 1 ? "produto" : "produtos"} com estoque abaixo do mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-lg border border-yellow-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      Estoque: {item.current_stock} / Mínimo: {item.min_stock}
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {item.current_stock === 0 ? "Esgotado" : "Baixo"}
                  </Badge>
                </div>
              ))}
            </div>
            {lowStockItems.length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter("low")}
                >
                  Ver todos os {lowStockItems.length} produtos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, descrição ou fornecedor..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.trim()) {
                      loadStock();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="normal">Estoque OK</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estoque de Insumos</CardTitle>
              <CardDescription>
                {filteredStock.length} {filteredStock.length === 1 ? "item encontrado" : "itens encontrados"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStock.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => {
                    const status = item.stock_status || getStockStatus(item.current_stock, item.min_stock);
                    const isLow = status === "low" || status === "out_of_stock";
                    
                    return (
                      <TableRow 
                        key={item.id}
                        className={status === "out_of_stock" ? "bg-red-50" : isLow ? "bg-yellow-50" : ""}
                      >
                        <TableCell className="font-medium">#{item.id}</TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div>{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {item.description.length > 50 
                                  ? item.description.substring(0, 50) + "..." 
                                  : item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Tag className="h-3 w-3" />
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.supplier || "-"}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            status === "out_of_stock" ? "text-red-600" :
                            status === "low" ? "text-yellow-600" :
                            "text-gray-900"
                          }`}>
                            {item.current_stock.toLocaleString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>{item.min_stock.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="capitalize">{item.unit_of_measure}</TableCell>
                        <TableCell>
                          {item.unit_price ? formatCurrency(item.unit_price) : "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(status, item.current_stock, item.min_stock)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadProductDetails(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Nenhum item encontrado com os filtros aplicados"
                  : "Nenhum item de estoque encontrado"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros ou limpar a busca"
                  : "Não há produtos cadastrados no estoque"}
              </p>
              {(searchTerm || categoryFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    loadStock();
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto #${selectedProduct.id} - ${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          {productDetail && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="movements">
                  Movimentações ({productDetail.recent_movements?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">ID</div>
                    <div className="font-semibold">#{productDetail.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div>
                      {getStatusBadge(productDetail.stock_status, productDetail.current_stock, productDetail.min_stock)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Nome</div>
                    <div className="font-medium">{productDetail.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Categoria</div>
                    <div>
                      <Badge variant="outline">
                        {getCategoryLabel(productDetail.category)}
                      </Badge>
                    </div>
                  </div>
                  {productDetail.description && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Descrição</div>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {productDetail.description}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Fornecedor</div>
                    <div className="font-medium">{productDetail.supplier || "-"}</div>
                  </div>
                  {productDetail.barcode && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Código de Barras</div>
                      <div className="font-medium">{productDetail.barcode}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Estoque Atual</div>
                    <div className={`text-2xl font-bold ${
                      productDetail.current_stock === 0 ? "text-red-600" :
                      productDetail.current_stock <= productDetail.min_stock ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {productDetail.current_stock.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Estoque Mínimo</div>
                    <div className="text-2xl font-bold text-gray-700">
                      {productDetail.min_stock.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Unidade de Medida</div>
                    <div className="font-medium capitalize">{productDetail.unit_of_measure}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Preço Unitário</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(productDetail.unit_price)}
                    </div>
                  </div>
                  {productDetail.unit_price && productDetail.current_stock > 0 && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Valor Total do Estoque</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(productDetail.unit_price * productDetail.current_stock)}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="movements" className="space-y-4">
                {productDetail.recent_movements && productDetail.recent_movements.length > 0 ? (
                  <div className="space-y-3">
                    {productDetail.recent_movements.map((movement: StockMovement) => {
                      const isIn = movement.type === "in" || movement.quantity > 0;
                      
                      return (
                        <Card key={movement.id} className={`border-l-4 ${
                          isIn ? "border-l-green-500" : "border-l-red-500"
                        }`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isIn ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={`font-semibold ${
                                    isIn ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {isIn ? "+" : ""}{movement.quantity} {productDetail.unit_of_measure}
                                  </span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {movement.reason}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>
                                    <strong>Tipo:</strong> {movement.type === "in" ? "Entrada" : "Saída"}
                                  </div>
                                  {movement.description && (
                                    <div>
                                      <strong>Descrição:</strong> {movement.description}
                                    </div>
                                  )}
                                  <div>
                                    <strong>Data:</strong> {formatDateTime(movement.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma movimentação registrada</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
