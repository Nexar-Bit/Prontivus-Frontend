"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Stethoscope,
  Package,
  Clock,
  DollarSign,
  Settings,
  Plus,
  Minus,
  Activity,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  MoreVertical,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { proceduresApi } from "@/lib/procedures-api";
import { inventoryApi } from "@/lib/inventory-api";
import {
  Procedure,
  ProcedureCreate,
  ProcedureUpdate,
  ProcedureProduct,
  ProcedureProductCreate,
  Product,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);

  const [isProcedureFormOpen, setIsProcedureFormOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [procedureFormData, setProcedureFormData] = useState<ProcedureCreate>({
    name: "",
    description: "",
    duration: 30,
    cost: 0,
    is_active: true,
  });

  const [isTechnicalSheetOpen, setIsTechnicalSheetOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [technicalSheetProducts, setTechnicalSheetProducts] = useState<ProcedureProduct[]>([]);
  const [newProductForm, setNewProductForm] = useState<ProcedureProductCreate>({
    product_id: 0,
    quantity_required: 1,
    notes: "",
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = procedures.length;
    const active = procedures.filter(p => p.is_active).length;
    const inactive = total - active;
    const totalCost = procedures.reduce((sum, p) => sum + p.cost, 0);
    const avgDuration = procedures.length > 0
      ? Math.round(procedures.reduce((sum, p) => sum + p.duration, 0) / procedures.length)
      : 0;
    const totalProducts = procedures.reduce((sum, p) => sum + (p.procedure_products?.length || 0), 0);

    return { total, active, inactive, totalCost, avgDuration, totalProducts };
  }, [procedures]);

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const procedureFilters: {
        is_active?: boolean;
      } = {};
      if (activeFilter !== "all") {
        procedureFilters.is_active = activeFilter === "active";
      }

      const [fetchedProcedures, fetchedProducts] = await Promise.all([
        proceduresApi.getProcedures(procedureFilters),
        inventoryApi.getProducts({ is_active: true }),
      ]);
      
      setProcedures(fetchedProcedures);
      setProducts(fetchedProducts);
    } catch (err: any) {
      toast.error("Erro ao carregar dados dos procedimentos", {
        description: err.message || "Ocorreu um erro desconhecido.",
      });
      console.error("Failed to load procedures data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcedureInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setProcedureFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleProcedureFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProcedure) {
        await proceduresApi.updateProcedure(
          editingProcedure.id,
          procedureFormData as ProcedureUpdate
        );
        toast.success("Procedimento atualizado com sucesso!");
      } else {
        await proceduresApi.createProcedure(procedureFormData);
        toast.success("Procedimento criado com sucesso!");
      }
      setIsProcedureFormOpen(false);
      setEditingProcedure(null);
      setProcedureFormData({
        name: "",
        description: "",
        duration: 30,
        cost: 0,
        is_active: true,
      });
      loadData();
    } catch (err: any) {
      toast.error("Erro ao salvar procedimento", {
        description: err.message || "Ocorreu um erro desconhecido.",
      });
      console.error("Failed to save procedure:", err);
    }
  };

  const handleEditProcedure = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setProcedureFormData({
      name: procedure.name,
      description: procedure.description || "",
      duration: procedure.duration,
      cost: procedure.cost,
      is_active: procedure.is_active,
    });
    setIsProcedureFormOpen(true);
  };

  const handleDeleteProcedure = (procedure: Procedure) => {
    setProcedureToDelete(procedure);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProcedure = async () => {
    if (!procedureToDelete) return;
    
    try {
      await proceduresApi.deleteProcedure(procedureToDelete.id);
        toast.success("Procedimento desativado com sucesso!");
      setDeleteDialogOpen(false);
      setProcedureToDelete(null);
        loadData();
      } catch (err: any) {
        toast.error("Erro ao desativar procedimento", {
          description: err.message || "Ocorreu um erro desconhecido.",
        });
        console.error("Failed to delete procedure:", err);
    }
  };

  const handleOpenTechnicalSheet = async (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setTechnicalSheetProducts(procedure.procedure_products || []);
    setIsTechnicalSheetOpen(true);
  };

  const handleAddProductToProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcedure || !newProductForm.product_id) return;

    try {
      await proceduresApi.addProductToProcedure(selectedProcedure.id, newProductForm);
      toast.success("Produto adicionado à ficha técnica!");
      
      // Reload the procedure to get updated data
      const updatedProcedure = await proceduresApi.getProcedure(selectedProcedure.id);
      setSelectedProcedure(updatedProcedure);
      setTechnicalSheetProducts(updatedProcedure.procedure_products || []);
      
      setNewProductForm({
        product_id: 0,
        quantity_required: 1,
        notes: "",
      });
    } catch (err: any) {
      toast.error("Erro ao adicionar produto", {
        description: err.message || "Ocorreu um erro desconhecido.",
      });
      console.error("Failed to add product to procedure:", err);
    }
  };

  const handleRemoveProductFromProcedure = async (procedureProductId: number) => {
    // Note: This is for removing a product from a procedure, not deleting the procedure itself
    // We'll keep window.confirm for now as it's a less critical action
    if (window.confirm("Tem certeza que deseja remover este produto da ficha técnica?")) {
      try {
        await proceduresApi.removeProductFromProcedure(procedureProductId);
        toast.success("Produto removido da ficha técnica!");
        
        // Reload the procedure to get updated data
        if (selectedProcedure) {
          const updatedProcedure = await proceduresApi.getProcedure(selectedProcedure.id);
          setSelectedProcedure(updatedProcedure);
          setTechnicalSheetProducts(updatedProcedure.procedure_products || []);
        }
      } catch (err: any) {
        toast.error("Erro ao remover produto", {
          description: err.message || "Ocorreu um erro desconhecido.",
        });
        console.error("Failed to remove product from procedure:", err);
      }
    }
  };

  const filteredProcedures = useMemo(() => {
    return procedures.filter((procedure) => {
      const matchesSearch = procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        procedure.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeFilter === "all") return matchesSearch;
      if (activeFilter === "active") return matchesSearch && procedure.is_active;
      if (activeFilter === "inactive") return matchesSearch && !procedure.is_active;
      
      return matchesSearch;
    });
  }, [procedures, searchTerm, activeFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            Gestão de Procedimentos
          </h1>
          <p className="text-muted-foreground">
            Defina e gerencie procedimentos médicos e suas fichas técnicas
          </p>
        </div>
        <Button onClick={() => setIsProcedureFormOpen(true)} size="lg" className="shrink-0">
          <PlusCircle className="mr-2 h-5 w-5" /> Novo Procedimento
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Procedimentos
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.active} ativos • {stats.inactive} inativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Procedimentos Ativos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duração Média
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} min</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio por procedimento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todos os custos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Procedures List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Lista de Procedimentos</CardTitle>
              <CardDescription className="mt-1">
                Gerencie todos os procedimentos médicos da clínica
          </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredProcedures.length} {filteredProcedures.length === 1 ? "procedimento" : "procedimentos"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar procedimentos por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select
              value={activeFilter}
              onValueChange={(value: string | "all") => setActiveFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Todos
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    Ativos
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Inativos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Empty State */}
          {filteredProcedures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Stethoscope className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || activeFilter !== "all" 
                  ? "Nenhum procedimento encontrado" 
                  : "Nenhum procedimento cadastrado"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {searchTerm || activeFilter !== "all"
                  ? "Tente ajustar os filtros de busca ou adicione um novo procedimento."
                  : "Comece criando seu primeiro procedimento médico para gerenciar as fichas técnicas."}
              </p>
              {!searchTerm && activeFilter === "all" && (
                <Button onClick={() => setIsProcedureFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Criar Primeiro Procedimento
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Procedimento</TableHead>
                      <TableHead className="font-semibold">Duração</TableHead>
                      <TableHead className="font-semibold">Custo</TableHead>
                      <TableHead className="font-semibold">Produtos</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcedures.map((procedure) => (
                      <TableRow 
                        key={procedure.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{procedure.name}</div>
                            {procedure.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {procedure.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{procedure.duration} min</span>
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              R$ {procedure.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="font-normal">
                              {procedure.procedure_products?.length || 0} {procedure.procedure_products?.length === 1 ? "produto" : "produtos"}
                            </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                          <Badge 
                            variant={procedure.is_active ? "default" : "secondary"}
                            className={cn(
                              procedure.is_active 
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200" 
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                            )}
                          >
                            {procedure.is_active ? (
                              <>
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                Inativo
                              </>
                            )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                          </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenTechnicalSheet(procedure)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Ficha Técnica
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProcedure(procedure)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProcedure(procedure)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Procedure Form Dialog */}
      <Dialog open={isProcedureFormOpen} onOpenChange={(open) => {
        setIsProcedureFormOpen(open);
        if (!open) {
          setEditingProcedure(null);
          setProcedureFormData({
            name: "",
            description: "",
            duration: 30,
            cost: 0,
            is_active: true,
          });
        }
      }}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {editingProcedure ? (
                <>
                  <Edit className="h-5 w-5" />
                  Editar Procedimento
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" />
                  Novo Procedimento
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingProcedure 
                ? "Atualize os detalhes do procedimento médico."
                : "Preencha os detalhes do procedimento médico."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcedureFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do Procedimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={procedureFormData.name}
                onChange={handleProcedureInputChange}
                placeholder="Ex: Consulta médica, Exame de sangue..."
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={procedureFormData.description}
                onChange={handleProcedureInputChange}
                placeholder="Descreva o procedimento médico..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duração (minutos) <span className="text-red-500">*</span>
              </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                value={procedureFormData.duration}
                onChange={handleProcedureInputChange}
                    className="pl-9 h-10"
                required
              />
            </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Custo (R$) <span className="text-red-500">*</span>
              </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={procedureFormData.cost}
                onChange={handleProcedureInputChange}
                    placeholder="0.00"
                    className="pl-9 h-10"
                required
              />
            </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Checkbox
                id="is_active"
                checked={procedureFormData.is_active}
                onCheckedChange={(checked) => setProcedureFormData(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer flex-1">
                Procedimento ativo
              </Label>
              {procedureFormData.is_active ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProcedureFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[140px]">
                {editingProcedure ? "Atualizar" : "Criar Procedimento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Desativar Procedimento
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Tem certeza que deseja desativar o procedimento <strong>"{procedureToDelete?.name}"</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. O procedimento será marcado como inativo e não aparecerá nas listas de procedimentos ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProcedure}
              className="bg-red-600 hover:bg-red-700"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Technical Sheet Dialog */}
      <Dialog open={isTechnicalSheetOpen} onOpenChange={setIsTechnicalSheetOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ficha Técnica: {selectedProcedure?.name}
            </DialogTitle>
            <DialogDescription className="pt-1">
              Gerencie os produtos e materiais necessários para este procedimento médico.
            </DialogDescription>
          </DialogHeader>
          
          <Separator />
          
          {/* Add Product Form */}
          <div className="space-y-4">
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Produto à Ficha Técnica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProductToProcedure} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_id" className="text-sm font-medium">
                      Produto <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newProductForm.product_id.toString()}
                onValueChange={(value) => setNewProductForm(prev => ({ ...prev, product_id: Number(value) }))}
              >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione um produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                        {products.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhum produto disponível
                          </div>
                        ) : (
                          products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {product.name} <span className="text-muted-foreground">({product.unit_of_measure})</span>
                              </div>
                    </SelectItem>
                          ))
                        )}
                </SelectContent>
              </Select>
            </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity_required" className="text-sm font-medium">
                        Quantidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity_required"
                type="number"
                step="0.01"
                min="0.01"
                value={newProductForm.quantity_required}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, quantity_required: Number(e.target.value) }))}
                        className="h-10"
                required
              />
            </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={newProductForm.notes}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações sobre o uso do produto neste procedimento..."
                      rows={2}
                      className="resize-none"
              />
            </div>

                  <Button 
                    type="submit" 
                    disabled={!newProductForm.product_id || products.length === 0}
                    className="w-full"
                  >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
              </Button>
          </form>
              </CardContent>
            </Card>

            <Separator />

          {/* Products List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos na Ficha Técnica
                </h3>
                <Badge variant="outline" className="text-sm">
                  {technicalSheetProducts.length} {technicalSheetProducts.length === 1 ? "produto" : "produtos"}
                </Badge>
              </div>

            {technicalSheetProducts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-sm font-semibold mb-1">Nenhum produto adicionado</h4>
                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      Adicione produtos do estoque para criar a ficha técnica deste procedimento.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Produto</TableHead>
                          <TableHead className="font-semibold">Quantidade</TableHead>
                          <TableHead className="font-semibold">Observações</TableHead>
                          <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicalSheetProducts.map((pp) => (
                          <TableRow key={pp.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div>{pp.product_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {pp.product_unit_of_measure}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-medium">
                                {pp.quantity_required}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {pp.notes || <span className="italic">Sem observações</span>}
                              </span>
                      </TableCell>
                      <TableCell>
                              <div className="flex items-center justify-end">
                        <Button
                                  variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProductFromProcedure(pp.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                                  <Trash2 className="h-4 w-4" />
                        </Button>
                              </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                  </div>
                </div>
            )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTechnicalSheetOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
