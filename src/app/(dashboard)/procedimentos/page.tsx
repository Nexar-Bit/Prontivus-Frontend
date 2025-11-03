"use client";

import React, { useState, useEffect } from "react";
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

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | "all">("all");

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

  const handleDeleteProcedure = async (id: number) => {
    if (window.confirm("Tem certeza que deseja desativar este procedimento?")) {
      try {
        await proceduresApi.deleteProcedure(id);
        toast.success("Procedimento desativado com sucesso!");
        loadData();
      } catch (err: any) {
        toast.error("Erro ao desativar procedimento", {
          description: err.message || "Ocorreu um erro desconhecido.",
        });
        console.error("Failed to delete procedure:", err);
      }
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

  const filteredProcedures = procedures.filter((procedure) =>
    procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    procedure.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Procedimentos</h1>
          <p className="text-muted-foreground">
            Defina procedimentos médicos e suas fichas técnicas
          </p>
        </div>
        <Button onClick={() => setIsProcedureFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Procedimento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Procedimentos</CardTitle>
          <CardDescription>
            Gerencie todos os procedimentos médicos da clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar procedimentos por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={activeFilter}
              onValueChange={(value: string | "all") => setActiveFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProcedures.length === 0 ? (
            <p>Nenhum procedimento encontrado.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcedures.map((procedure) => (
                    <TableRow key={procedure.id}>
                      <TableCell className="font-medium">{procedure.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {procedure.duration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          R$ {procedure.cost.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {procedure.procedure_products?.length || 0} produtos
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={procedure.is_active ? "default" : "secondary"}>
                          {procedure.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTechnicalSheet(procedure)}
                            title="Ficha Técnica"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProcedure(procedure)}
                            title="Editar Procedimento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProcedure(procedure.id)}
                            title="Desativar Procedimento"
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
          )}
        </CardContent>
      </Card>

      {/* Procedure Form Dialog */}
      <Dialog open={isProcedureFormOpen} onOpenChange={setIsProcedureFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProcedure ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do procedimento médico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcedureFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={procedureFormData.name}
                onChange={handleProcedureInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={procedureFormData.description}
                onChange={handleProcedureInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duração (min)
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                value={procedureFormData.duration}
                onChange={handleProcedureInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Custo (R$)
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={procedureFormData.cost}
                onChange={handleProcedureInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativo
              </Label>
              <Checkbox
                id="is_active"
                checked={procedureFormData.is_active}
                onCheckedChange={(checked) => setProcedureFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingProcedure ? "Atualizar Procedimento" : "Criar Procedimento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Technical Sheet Dialog */}
      <Dialog open={isTechnicalSheetOpen} onOpenChange={setIsTechnicalSheetOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Ficha Técnica: {selectedProcedure?.name}</DialogTitle>
            <DialogDescription>
              Gerencie os produtos necessários para este procedimento.
            </DialogDescription>
          </DialogHeader>
          
          {/* Add Product Form */}
          <form onSubmit={handleAddProductToProcedure} className="grid gap-4 py-4 border-b">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product_id" className="text-right">
                Produto
              </Label>
              <Select
                value={newProductForm.product_id.toString()}
                onValueChange={(value) => setNewProductForm(prev => ({ ...prev, product_id: Number(value) }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.unit_of_measure})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity_required" className="text-right">
                Quantidade
              </Label>
              <Input
                id="quantity_required"
                type="number"
                step="0.01"
                min="0.01"
                value={newProductForm.quantity_required}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, quantity_required: Number(e.target.value) }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={newProductForm.notes}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                placeholder="Observações sobre o uso do produto..."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!newProductForm.product_id}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
              </Button>
            </div>
          </form>

          {/* Products List */}
          <div className="max-h-[400px] overflow-y-auto">
            {technicalSheetProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto adicionado à ficha técnica.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicalSheetProducts.map((pp) => (
                    <TableRow key={pp.id}>
                      <TableCell className="font-medium">
                        {pp.product_name} ({pp.product_unit_of_measure})
                      </TableCell>
                      <TableCell>{pp.quantity_required}</TableCell>
                      <TableCell>{pp.notes || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveProductFromProcedure(pp.id)}
                          title="Remover Produto"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsTechnicalSheetOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
