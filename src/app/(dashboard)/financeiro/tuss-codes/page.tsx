"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, RefreshCw, Filter } from "lucide-react";
import { ServiceCategory } from "@/lib/types";
import { financialApi } from "@/lib/financial-api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileCode, 
  Info,
  CheckCircle,
  AlertCircle,
  Database,
  TrendingUp,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TussCode {
  id: number;
  codigo: string;
  descricao: string;
  tabela?: string;
  categoria: ServiceCategory;
  ativo: boolean;
  observacoes?: string;
}

const TUSS_TABLES = {
  "01": "Consultas",
  "02": "Procedimentos", 
  "03": "Exames",
  "04": "Medicamentos",
  "99": "Outros"
};

export default function TussCodesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tussCodes, setTussCodes] = useState<TussCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<TussCode | null>(null);
  const [deletingCode, setDeletingCode] = useState<TussCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<TussCode>>({
    codigo: "",
    descricao: "",
    tabela: "01",
    categoria: ServiceCategory.CONSULTATION,
    ativo: true,
    observacoes: ""
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadTussCodes();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadTussCodes = async () => {
    setLoading(true);
    try {
      // Load service items that have TUSS codes (code field is not empty)
      const serviceItems = await financialApi.getServiceItems();
      
      // Filter service items that have codes and map them to TUSS codes format
      const codes: TussCode[] = serviceItems
        .filter(item => item.code && item.code.trim() !== "")
        .map(item => {
          // Extract table from code if possible (first 2 digits)
          const code = item.code || "";
          const tabela = code.length >= 2 ? code.substring(0, 2) : "01";
          
          return {
            id: item.id,
            codigo: code,
            descricao: item.name,
            tabela: tabela,
            categoria: item.category,
            ativo: item.is_active,
            observacoes: item.description || undefined
          };
        });
      
      setTussCodes(codes);
    } catch (error: any) {
      console.error("Failed to load TUSS codes:", error);
      toast.error("Erro ao carregar códigos TUSS", {
        description: error.message || "Não foi possível carregar os códigos TUSS"
      });
      setTussCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.descricao) {
      toast.error("Erro de validação", {
        description: "Código e descrição são obrigatórios"
      });
      return;
    }

    try {
      if (editingCode) {
        // Update existing service item
        await financialApi.updateServiceItem(editingCode.id, {
          name: formData.descricao || "",
          code: formData.codigo || "",
          description: formData.observacoes || "",
          category: formData.categoria || ServiceCategory.CONSULTATION,
          is_active: formData.ativo ?? true,
          price: 0 // TUSS codes don't have prices, but ServiceItem requires it
        });
        toast.success("Código TUSS atualizado com sucesso!");
      } else {
        // Create new service item with TUSS code
        await financialApi.createServiceItem({
          name: formData.descricao || "",
          code: formData.codigo || "",
          description: formData.observacoes || "",
          category: formData.categoria || ServiceCategory.CONSULTATION,
          is_active: formData.ativo ?? true,
          price: 0 // TUSS codes don't have prices, but ServiceItem requires it
        });
        toast.success("Código TUSS adicionado com sucesso!");
      }
      
      setIsDialogOpen(false);
      setEditingCode(null);
      resetForm();
      await loadTussCodes();
    } catch (error: any) {
      console.error("Failed to save TUSS code:", error);
      toast.error("Erro ao salvar código TUSS", {
        description: error.message || "Não foi possível salvar o código TUSS"
      });
    }
  };

  const handleEdit = (code: TussCode) => {
    setEditingCode(code);
    setFormData({
      codigo: code.codigo,
      descricao: code.descricao,
      tabela: code.tabela || "01",
      categoria: code.categoria,
      ativo: code.ativo,
      observacoes: code.observacoes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (code: TussCode) => {
    setDeletingCode(code);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCode) return;

    try {
      setIsDeleting(true);
      await financialApi.deleteServiceItem(deletingCode.id);
      toast.success("Código TUSS excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingCode(null);
      await loadTussCodes();
    } catch (error: any) {
      console.error("Failed to delete TUSS code:", error);
      toast.error("Erro ao excluir código TUSS", {
        description: error.message || "Não foi possível excluir o código TUSS"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      descricao: "",
      tabela: "01",
      categoria: ServiceCategory.CONSULTATION,
      ativo: true,
      observacoes: ""
    });
  };

  const getCategoryBadge = (category: ServiceCategory) => {
    const configs = {
      [ServiceCategory.CONSULTATION]: {
        label: "Consulta",
        color: "text-blue-700",
        bgColor: "bg-blue-100"
      },
      [ServiceCategory.PROCEDURE]: {
        label: "Procedimento",
        color: "text-purple-700",
        bgColor: "bg-purple-100"
      },
      [ServiceCategory.EXAM]: {
        label: "Exame",
        color: "text-green-700",
        bgColor: "bg-green-100"
      },
      [ServiceCategory.MEDICATION]: {
        label: "Medicamento",
        color: "text-red-700",
        bgColor: "bg-red-100"
      },
      [ServiceCategory.OTHER]: {
        label: "Outro",
        color: "text-slate-700",
        bgColor: "bg-slate-100"
      }
    };

    const config = configs[category];
    return (
      <Badge variant="outline" className={cn("border-0", config.color, config.bgColor)}>
        {config.label}
      </Badge>
    );
  };

  const filteredCodes = useMemo(() => {
    return tussCodes.filter(code => {
      const matchesSearch = !searchTerm || 
        code.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTable = filterTable === "all" || code.tabela === filterTable;
      
      return matchesSearch && matchesTable;
    });
  }, [tussCodes, searchTerm, filterTable]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = tussCodes.length;
    const active = tussCodes.filter(code => code.ativo).length;
    const tables = new Set(tussCodes.map(code => code.tabela)).size;
    const categories = new Set(tussCodes.map(code => code.categoria)).size;
    
    return { total, active, tables, categories };
  }, [tussCodes]);

  if (isLoading || (loading && tussCodes.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando códigos TUSS...</p>
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
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <FileCode className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Códigos TUSS
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie os códigos TUSS para procedimentos e exames
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadTussCodes} 
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
            onClick={() => {
              setEditingCode(null);
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Código TUSS</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Códigos</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <FileCode className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
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
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Tabelas</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.tables}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Categorias</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.categories}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Sobre os Códigos TUSS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Os códigos TUSS (Terminologia Unificada da Saúde Suplementar) são utilizados 
            para padronizar a identificação de procedimentos, exames e medicamentos 
            no sistema de saúde suplementar brasileiro. Configure os códigos utilizados 
            pela sua clínica para garantir a compatibilidade com o padrão TISS.
          </p>
        </CardContent>
      </Card>

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
                  placeholder="Buscar por código, descrição ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Filtrar por tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tabelas</SelectItem>
                {Object.entries(TUSS_TABLES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TUSS Codes Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Códigos TUSS</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredCodes.length} {filteredCodes.length === 1 ? 'código encontrado' : 'códigos encontrados'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCodes.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <FileCode className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum código TUSS encontrado</p>
              {searchTerm || filterTable !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setEditingCode(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Código TUSS
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Código</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">Tabela</TableHead>
                    <TableHead className="min-w-[120px]">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code) => (
                    <TableRow key={code.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono font-medium text-sm sm:text-base">
                        {code.codigo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm sm:text-base">{code.descricao}</p>
                          {code.observacoes && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                              {code.observacoes}
                            </p>
                          )}
                          <div className="md:hidden mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {code.tabela} - {TUSS_TABLES[code.tabela as keyof typeof TUSS_TABLES]}
                            </Badge>
                            <Badge variant={code.ativo ? "default" : "secondary"} className="text-xs">
                              {code.ativo ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Inativo
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {code.tabela} - {TUSS_TABLES[code.tabela as keyof typeof TUSS_TABLES]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryBadge(code.categoria)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={code.ativo ? "default" : "secondary"}>
                          {code.ativo ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(code)}
                            title="Editar código"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(code)}
                            title="Excluir código"
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCode(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCode ? "Editar Código TUSS" : "Novo Código TUSS"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCode ? "Atualize as informações do código TUSS" : "Adicione um novo código TUSS"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo" className="text-sm">Código TUSS *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo || ""}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                  placeholder="Ex: 10101012"
                  maxLength={10}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="tabela" className="text-sm">Tabela</Label>
                <Select
                  value={formData.tabela || "01"}
                  onValueChange={(value) => setFormData({...formData, tabela: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TUSS_TABLES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="descricao" className="text-sm">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição do procedimento"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="categoria" className="text-sm">Categoria *</Label>
              <Select
                value={formData.categoria || ServiceCategory.CONSULTATION}
                onValueChange={(value) => setFormData({...formData, categoria: value as ServiceCategory})}
              >
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
            
            <div>
              <Label htmlFor="observacoes" className="text-sm">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ""}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked as boolean })}
              />
              <Label htmlFor="ativo" className="text-sm cursor-pointer">Código ativo</Label>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCode(null);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
            >
              {editingCode ? "Atualizar" : "Adicionar"}
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
              Tem certeza que deseja excluir o código TUSS <strong className="font-mono">{deletingCode?.codigo}</strong> - {deletingCode?.descricao}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setDeletingCode(null)}
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
