"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  History,
  Settings,
  BarChart3,
  ShoppingCart,
  Activity
} from "lucide-react";
import { inventoryApi } from "@/lib/inventory-api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Product, ProductCreate, ProductUpdate, ProductCategory, 
  StockMovement, StockAdjustmentCreate, StockSummary, LowStockProduct 
} from "@/lib/types";

const PRODUCT_CATEGORIES = {
  [ProductCategory.MEDICATION]: "Medicamento",
  [ProductCategory.MEDICAL_SUPPLY]: "Material Médico",
  [ProductCategory.EQUIPMENT]: "Equipamento",
  [ProductCategory.CONSUMABLE]: "Consumível",
  [ProductCategory.INSTRUMENT]: "Instrumento",
  [ProductCategory.OTHER]: "Outro"
};

const STOCK_STATUS_COLORS = {
  normal: "bg-green-100 text-green-800",
  low: "bg-yellow-100 text-yellow-800",
  out_of_stock: "bg-red-100 text-red-800"
};

const STOCK_STATUS_LABELS = {
  normal: "Normal",
  low: "Estoque Baixo",
  out_of_stock: "Sem Estoque"
};

export default function InventoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  
  // Form states
  const [productForm, setProductForm] = useState<ProductCreate>({
    name: "",
    description: "",
    category: ProductCategory.MEDICATION,
    supplier: "",
    min_stock: 0,
    current_stock: 0,
    unit_price: 0,
    unit_of_measure: "unidade",
    barcode: "",
    is_active: true
  });
  
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustmentCreate>({
    product_id: 0,
    new_quantity: 0,
    reason: "adjustment" as any,
    description: "",
    reference_number: ""
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, lowStockData, summaryData] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getLowStockProducts(),
        inventoryApi.getStockSummary()
      ]);
      
      setProducts(productsData);
      setLowStockProducts(lowStockData);
      setStockSummary(summaryData);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do estoque", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      await inventoryApi.createProduct(productForm);
      toast.success("Produto criado com sucesso!");
      setIsProductDialogOpen(false);
      resetProductForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao criar produto", {
        description: error.message
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      await inventoryApi.updateProduct(editingProduct.id, productForm);
      toast.success("Produto atualizado com sucesso!");
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao atualizar produto", {
        description: error.message
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await inventoryApi.deleteProduct(id);
        toast.success("Produto excluído com sucesso!");
        loadData();
      } catch (error: any) {
        toast.error("Erro ao excluir produto", {
          description: error.message
        });
      }
    }
  };

  const handleAdjustStock = async () => {
    try {
      await inventoryApi.adjustStock(adjustmentForm);
      toast.success("Estoque ajustado com sucesso!");
      setIsAdjustmentDialogOpen(false);
      resetAdjustmentForm();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao ajustar estoque", {
        description: error.message
      });
    }
  };

  const handleViewHistory = async (product: Product) => {
    setSelectedProduct(product);
    try {
      const movements = await inventoryApi.getStockMovements({ 
        product_id: product.id, 
        limit: 20 
      });
      setProductMovements(movements);
      setIsHistoryDialogOpen(true);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico", {
        description: error.message
      });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      category: ProductCategory.MEDICATION,
      supplier: "",
      min_stock: 0,
      current_stock: 0,
      unit_price: 0,
      unit_of_measure: "unidade",
      barcode: "",
      is_active: true
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      product_id: 0,
      new_quantity: 0,
      reason: "adjustment" as any,
      description: "",
      reference_number: ""
    });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      supplier: product.supplier || "",
      min_stock: product.min_stock,
      current_stock: product.current_stock,
      unit_price: product.unit_price || 0,
      unit_of_measure: product.unit_of_measure,
      barcode: product.barcode || "",
      is_active: product.is_active
    });
    setIsProductDialogOpen(true);
  };

  const openAdjustmentDialog = (product: Product) => {
    setAdjustmentForm({
      product_id: product.id,
      new_quantity: product.current_stock,
      reason: "adjustment" as any,
      description: "",
      reference_number: ""
    });
    setIsAdjustmentDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.stock_status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie produtos, estoque e movimentações
          </p>
        </div>
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetProductForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Atualize as informações do produto" : "Adicione um novo produto ao estoque"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="Ex: Paracetamol 500mg"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={productForm.category}
                    onValueChange={(value) => setProductForm({...productForm, category: value as ProductCategory})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_CATEGORIES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Descrição do produto"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    value={productForm.supplier}
                    onChange={(e) => setProductForm({...productForm, supplier: e.target.value})}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({...productForm, barcode: e.target.value})}
                    placeholder="Código de barras"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="min_stock">Estoque Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    value={productForm.min_stock}
                    onChange={(e) => setProductForm({...productForm, min_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="current_stock">Estoque Atual</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    value={productForm.current_stock}
                    onChange={(e) => setProductForm({...productForm, current_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Preço Unitário</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={productForm.unit_price}
                    onChange={(e) => setProductForm({...productForm, unit_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="unit_of_measure">Unidade de Medida</Label>
                <Input
                  id="unit_of_measure"
                  value={productForm.unit_of_measure}
                  onChange={(e) => setProductForm({...productForm, unit_of_measure: e.target.value})}
                  placeholder="Ex: unidade, caixa, frasco"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                {editingProduct ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {stockSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockSummary.total_products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stockSummary.low_stock_products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stockSummary.out_of_stock_products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stockSummary.total_value.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {Object.entries(PRODUCT_CATEGORIES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(STOCK_STATUS_LABELS).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Lista de todos os produtos no estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {PRODUCT_CATEGORIES[product.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.supplier || "-"}</TableCell>
                  <TableCell className="font-medium">
                    {product.current_stock} {product.unit_of_measure}
                  </TableCell>
                  <TableCell>{product.min_stock} {product.unit_of_measure}</TableCell>
                  <TableCell>
                    <Badge className={STOCK_STATUS_COLORS[product.stock_status as keyof typeof STOCK_STATUS_COLORS]}>
                      {STOCK_STATUS_LABELS[product.stock_status as keyof typeof STOCK_STATUS_LABELS]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.unit_price ? `R$ ${product.unit_price.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistory(product)}
                        title="Ver histórico"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAdjustmentDialog(product)}
                        title="Ajustar estoque"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                        title="Editar produto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Excluir produto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste manual do estoque do produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_quantity">Nova Quantidade</Label>
              <Input
                id="new_quantity"
                type="number"
                value={adjustmentForm.new_quantity}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, new_quantity: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Select
                value={adjustmentForm.reason}
                onValueChange={(value) => setAdjustmentForm({...adjustmentForm, reason: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Ajuste Manual</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                  <SelectItem value="damaged">Produto Danificado</SelectItem>
                  <SelectItem value="expired">Produto Vencido</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={adjustmentForm.description}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, description: e.target.value})}
                placeholder="Descrição do ajuste"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="reference_number">Número de Referência</Label>
              <Input
                id="reference_number"
                value={adjustmentForm.reference_number}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, reference_number: e.target.value})}
                placeholder="Ex: NF-123456"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjustStock}>
              Ajustar Estoque
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
            <DialogDescription>
              Histórico de movimentações para {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {productMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                          {movement.type === 'in' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>{movement.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
