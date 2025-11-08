"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit, Trash2, DollarSign, RefreshCw, Loader2, Package, TrendingUp, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { financialApi } from "@/lib/financial-api";
import { ServiceItem, ServiceCategory, ServiceItemCreate } from "@/lib/types";

export default function ServiceItemsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ServiceItemCreate>({
    name: "",
    description: "",
    code: "",
    price: 0,
    category: ServiceCategory.CONSULTATION,
    is_active: true
  });

  // Load data
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadServiceItems();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadServiceItems = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getServiceItems();
      setServiceItems(data || []);
    } catch (error: any) {
      console.error("Failed to load service items:", error);
      toast.error("Erro ao carregar itens de serviço", {
        description: error.message || "Não foi possível carregar os itens de serviço"
      });
      setServiceItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Erro de validação", {
        description: "Nome e preço são obrigatórios. O preço deve ser maior que zero."
      });
      return;
    }

    try {
      await financialApi.createServiceItem(formData);
      toast.success("Item de serviço criado com sucesso!");
      setIsCreateDialogOpen(false);
      resetForm();
      await loadServiceItems();
    } catch (error: any) {
      console.error("Failed to create service item:", error);
      toast.error("Erro ao criar item de serviço", {
        description: error.message || "Não foi possível criar o item de serviço"
      });
    }
  };

  const handleEdit = (item: ServiceItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      code: item.code || "",
      price: item.price,
      category: item.category,
      is_active: item.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    
    if (!formData.name || formData.price <= 0) {
      toast.error("Erro de validação", {
        description: "Nome e preço são obrigatórios. O preço deve ser maior que zero."
      });
      return;
    }

    try {
      await financialApi.updateServiceItem(selectedItem.id, formData);
      toast.success("Item de serviço atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadServiceItems();
    } catch (error: any) {
      console.error("Failed to update service item:", error);
      toast.error("Erro ao atualizar item de serviço", {
        description: error.message || "Não foi possível atualizar o item de serviço"
      });
    }
  };

  const handleDeleteClick = (item: ServiceItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      setIsDeleting(true);
      await financialApi.deleteServiceItem(selectedItem.id);
      toast.success("Item de serviço excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      await loadServiceItems();
    } catch (error: any) {
      console.error("Failed to delete service item:", error);
      toast.error("Erro ao excluir item de serviço", {
        description: error.message || "Não foi possível excluir o item de serviço"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      price: 0,
      category: ServiceCategory.CONSULTATION,
      is_active: true
    });
  };

  const getCategoryBadge = (category: ServiceCategory) => {
    const configs = {
      [ServiceCategory.CONSULTATION]: {
        label: "Consulta",
        variant: "default" as const,
        color: "text-blue-700",
        bgColor: "bg-blue-100"
      },
      [ServiceCategory.PROCEDURE]: {
        label: "Procedimento",
        variant: "secondary" as const,
        color: "text-purple-700",
        bgColor: "bg-purple-100"
      },
      [ServiceCategory.EXAM]: {
        label: "Exame",
        variant: "outline" as const,
        color: "text-green-700",
        bgColor: "bg-green-100"
      },
      [ServiceCategory.MEDICATION]: {
        label: "Medicamento",
        variant: "destructive" as const,
        color: "text-red-700",
        bgColor: "bg-red-100"
      },
      [ServiceCategory.OTHER]: {
        label: "Outro",
        variant: "secondary" as const,
        color: "text-slate-700",
        bgColor: "bg-slate-100"
      }
    };

    const config = configs[category];
    return (
      <Badge variant={config.variant} className={cn("border-0", config.color, config.bgColor)}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Filter service items
  const filteredItems = useMemo(() => {
    return serviceItems.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [serviceItems, searchTerm, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = serviceItems.length;
    const active = serviceItems.filter(item => item.is_active).length;
    const categories = new Set(serviceItems.map(item => item.category)).size;
    const totalValue = serviceItems.reduce((sum, item) => sum + item.price, 0);
    
    return { total, active, categories, totalValue };
  }, [serviceItems]);

  if (isLoading || (loading && serviceItems.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando itens de serviço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Itens de Serviço
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie os itens que podem ser cobrados nas faturas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadServiceItems} 
            disabled={loading}
            className="bg-white"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Item</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Itens</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Ativos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.active}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Categorias</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.categories}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Valor Total</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-700">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, descrição ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ServiceCategory | "all")}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value={ServiceCategory.CONSULTATION}>Consulta</SelectItem>
                <SelectItem value={ServiceCategory.PROCEDURE}>Procedimento</SelectItem>
                <SelectItem value={ServiceCategory.EXAM}>Exame</SelectItem>
                <SelectItem value={ServiceCategory.MEDICATION}>Medicamento</SelectItem>
                <SelectItem value={ServiceCategory.OTHER}>Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Service Items Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Itens de Serviço</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum item de serviço encontrado</p>
              {searchTerm || categoryFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Item
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[100px]">Código</TableHead>
                    <TableHead className="min-w-[120px]">Categoria</TableHead>
                    <TableHead className="min-w-[100px]">Preço</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm sm:text-base">{item.name}</p>
                          {item.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <div className="sm:hidden mt-1">
                            {item.code && (
                              <Badge variant="outline" className="text-xs mr-2">
                                {item.code}
                              </Badge>
                            )}
                            <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                              {item.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{item.code || '-'}</TableCell>
                      <TableCell>{getCategoryBadge(item.category)}</TableCell>
                      <TableCell className="font-medium text-sm sm:text-base">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="Editar"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            title="Excluir"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Novo Item de Serviço</DialogTitle>
            <DialogDescription className="text-sm">
              Adicione um novo item que pode ser cobrado nas faturas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do serviço"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code" className="text-sm">Código TUSS</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Código TUSS"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-sm">Preço *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category" className="text-sm">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ServiceCategory.CONSULTATION}>Consulta</SelectItem>
                  <SelectItem value={ServiceCategory.PROCEDURE}>Procedimento</SelectItem>
                  <SelectItem value={ServiceCategory.EXAM}>Exame</SelectItem>
                  <SelectItem value={ServiceCategory.MEDICATION}>Medicamento</SelectItem>
                  <SelectItem value={ServiceCategory.OTHER}>Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active" className="text-sm cursor-pointer">Item ativo</Label>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Criar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Item de Serviço</DialogTitle>
            <DialogDescription className="text-sm">
              Atualize as informações do item de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do serviço"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="text-sm">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code" className="text-sm">Código TUSS</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Código TUSS"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-price" className="text-sm">Preço *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-category" className="text-sm">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ServiceCategory.CONSULTATION}>Consulta</SelectItem>
                  <SelectItem value={ServiceCategory.PROCEDURE}>Procedimento</SelectItem>
                  <SelectItem value={ServiceCategory.EXAM}>Exame</SelectItem>
                  <SelectItem value={ServiceCategory.MEDICATION}>Medicamento</SelectItem>
                  <SelectItem value={ServiceCategory.OTHER}>Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="edit-is_active" className="text-sm cursor-pointer">Item ativo</Label>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Atualizar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir o item de serviço <strong>{selectedItem?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setSelectedItem(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
