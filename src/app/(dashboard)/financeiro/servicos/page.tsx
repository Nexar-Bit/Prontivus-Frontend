"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

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
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);

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
    const variants = {
      [ServiceCategory.CONSULTATION]: "default",
      [ServiceCategory.PROCEDURE]: "secondary",
      [ServiceCategory.EXAM]: "outline",
      [ServiceCategory.MEDICATION]: "destructive",
      [ServiceCategory.OTHER]: "secondary"
    } as const;

    const labels = {
      [ServiceCategory.CONSULTATION]: "Consulta",
      [ServiceCategory.PROCEDURE]: "Procedimento",
      [ServiceCategory.EXAM]: "Exame",
      [ServiceCategory.MEDICATION]: "Medicamento",
      [ServiceCategory.OTHER]: "Outro"
    };

    return (
      <Badge variant={variants[category]}>
        {labels[category]}
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
  const filteredItems = serviceItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading || (loading && serviceItems.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando itens de serviço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Itens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie os itens que podem ser cobrados nas faturas
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Itens</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceItems.filter(item => item.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(serviceItems.map(item => item.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, descrição ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ServiceCategory | "all")}>
              <SelectTrigger className="w-full sm:w-48">
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
      <Card>
        <CardHeader>
          <CardTitle>Itens de Serviço</CardTitle>
          <CardDescription>
            Lista de todos os itens que podem ser cobrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.code || '-'}</TableCell>
                  <TableCell>{getCategoryBadge(item.category)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item de serviço encontrado</p>
              {searchTerm || categoryFilter !== "all" ? (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Item
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Item de Serviço</DialogTitle>
            <DialogDescription>
              Adicione um novo item que pode ser cobrado nas faturas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do serviço"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código TUSS</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Código TUSS"
                />
              </div>
              
              <div>
                <Label htmlFor="price">Preço *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}>
                <SelectTrigger>
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
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                aria-label="Item ativo"
                title="Item ativo"
              />
              <Label htmlFor="is_active">Item ativo</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Criar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item de Serviço</DialogTitle>
            <DialogDescription>
              Atualize as informações do item de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do serviço"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">Código TUSS</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Código TUSS"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-price">Preço *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}>
                <SelectTrigger>
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
              <input
                type="checkbox"
                id="edit-is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                aria-label="Item ativo"
                title="Item ativo"
              />
              <Label htmlFor="edit-is_active">Item ativo</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              Atualizar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
