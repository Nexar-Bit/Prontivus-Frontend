"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileCode, Plus, Search, Edit, Trash2, Upload, 
  RefreshCw, CheckCircle2, XCircle, Loader2, Filter,
  Database, TrendingUp, Shield, CreditCard, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { tissInsuranceApi, TUSSPlanCoverage, TUSSPlanCoverageCreate, TUSSPlanCoverageUpdate, InsurancePlan } from "@/lib/tiss-api";
import { financialApi } from "@/lib/financial-api";

interface TUSSCode {
  id: number;
  codigo: string;
  descricao: string;
}

export default function TISSCoberturaPage() {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<TUSSPlanCoverage[]>([]);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [tussCodes, setTussCodes] = useState<TUSSCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [cobertoFilter, setCobertoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingCoverage, setEditingCoverage] = useState<TUSSPlanCoverage | null>(null);
  const [deletingCoverage, setDeletingCoverage] = useState<TUSSPlanCoverage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  
  const [formData, setFormData] = useState<TUSSPlanCoverageCreate>({
    tuss_code_id: 0,
    insurance_plan_id: 0,
    coberto: true,
    cobertura_percentual: 100,
    valor_tabela: undefined,
    valor_contratual: undefined,
    valor_coparticipacao: 0,
    valor_franquia: 0,
    requer_autorizacao: false,
    prazo_autorizacao_dias: undefined,
    limite_quantidade: undefined,
    limite_periodo_dias: undefined,
    data_inicio_vigencia: new Date().toISOString().split('T')[0],
    data_fim_vigencia: undefined,
    observacoes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coverageData, plansData, serviceItems] = await Promise.all([
        tissInsuranceApi.getCoverage({ limit: 1000 }),
        tissInsuranceApi.getPlans({ limit: 1000 }),
        financialApi.getServiceItems()
      ]);
      
      setCoverage(coverageData);
      setPlans(plansData);
      
      // Map service items to TUSS codes (only those with codes)
      const codes: TUSSCode[] = serviceItems
        .filter(item => item.code && item.code.trim() !== "")
        .map(item => ({
          id: item.id,
          codigo: item.code || "",
          descricao: item.name
        }));
      setTussCodes(codes);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error.message || "Não foi possível carregar os dados"
      });
      setCoverage([]);
      setPlans([]);
      setTussCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoverage = useMemo(() => {
    return coverage.filter(cov => {
      const matchesSearch = !searchTerm || 
        cov.tuss_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cov.tuss_descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cov.plan_nome?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlan = planFilter === "all" || 
        cov.insurance_plan_id.toString() === planFilter;
      
      const matchesCoberto = cobertoFilter === "all" || 
        (cobertoFilter === "coberto" && cov.coberto) ||
        (cobertoFilter === "nao_coberto" && !cov.coberto);
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && cov.is_active) ||
        (statusFilter === "inactive" && !cov.is_active);
      
      return matchesSearch && matchesPlan && matchesCoberto && matchesStatus;
    });
  }, [coverage, searchTerm, planFilter, cobertoFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = coverage.length;
    const coberto = coverage.filter(c => c.coberto).length;
    const naoCoberto = total - coberto;
    const comAutorizacao = coverage.filter(c => c.requer_autorizacao).length;
    
    return { total, coberto, naoCoberto, comAutorizacao };
  }, [coverage]);

  const handleSave = async () => {
    if (!formData.tuss_code_id || !formData.insurance_plan_id || !formData.data_inicio_vigencia) {
      toast.error("Erro de validação", {
        description: "Código TUSS, Plano e Data de Início são obrigatórios"
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingCoverage) {
        const updateData: TUSSPlanCoverageUpdate = {
          ...formData,
        };
        await tissInsuranceApi.updateCoverage(editingCoverage.id, updateData);
        toast.success("Cobertura atualizada com sucesso!");
      } else {
        await tissInsuranceApi.createCoverage(formData);
        toast.success("Cobertura criada com sucesso!");
      }
      
      setIsDialogOpen(false);
      setEditingCoverage(null);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save coverage:", error);
      toast.error("Erro ao salvar cobertura", {
        description: error.message || "Não foi possível salvar a cobertura"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cov: TUSSPlanCoverage) => {
    setEditingCoverage(cov);
    setFormData({
      tuss_code_id: cov.tuss_code_id,
      insurance_plan_id: cov.insurance_plan_id,
      coberto: cov.coberto,
      cobertura_percentual: Number(cov.cobertura_percentual),
      valor_tabela: cov.valor_tabela ? Number(cov.valor_tabela) : undefined,
      valor_contratual: cov.valor_contratual ? Number(cov.valor_contratual) : undefined,
      valor_coparticipacao: Number(cov.valor_coparticipacao),
      valor_franquia: Number(cov.valor_franquia),
      requer_autorizacao: cov.requer_autorizacao,
      prazo_autorizacao_dias: cov.prazo_autorizacao_dias || undefined,
      limite_quantidade: cov.limite_quantidade || undefined,
      limite_periodo_dias: cov.limite_periodo_dias || undefined,
      data_inicio_vigencia: cov.data_inicio_vigencia,
      data_fim_vigencia: cov.data_fim_vigencia || undefined,
      observacoes: cov.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (cov: TUSSPlanCoverage) => {
    setDeletingCoverage(cov);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCoverage) return;

    try {
      setIsDeleting(true);
      await tissInsuranceApi.deleteCoverage(deletingCoverage.id);
      toast.success("Cobertura excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingCoverage(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete coverage:", error);
      toast.error("Erro ao excluir cobertura", {
        description: error.message || "Não foi possível excluir a cobertura"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo Excel");
      return;
    }

    const planId = planFilter !== "all" ? parseInt(planFilter) : undefined;

    try {
      setIsUploading(true);
      const result = await tissInsuranceApi.uploadCoverageExcel(uploadFile, planId);
      
      setUploadResults({
        success: result.inserted,
        failed: result.errors,
        errors: result.error_details || []
      });
      
      toast.success("Upload concluído!", {
        description: `${result.inserted} registros inseridos, ${result.updated} atualizados, ${result.errors} erros`
      });
      
      setUploadFile(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to upload:", error);
      toast.error("Erro no upload", {
        description: error.message || "Não foi possível fazer o upload do arquivo"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tuss_code_id: 0,
      insurance_plan_id: 0,
      coberto: true,
      cobertura_percentual: 100,
      valor_tabela: undefined,
      valor_contratual: undefined,
      valor_coparticipacao: 0,
      valor_franquia: 0,
      requer_autorizacao: false,
      prazo_autorizacao_dias: undefined,
      limite_quantidade: undefined,
      limite_periodo_dias: undefined,
      data_inicio_vigencia: new Date().toISOString().split('T')[0],
      data_fim_vigencia: undefined,
      observacoes: "",
    });
    setEditingCoverage(null);
  };

  if (loading && coverage.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando coberturas...</p>
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
            Cobertura TUSS vs Planos
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie a cobertura de códigos TUSS por plano de saúde
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadData} 
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
            variant="outline"
            onClick={() => setIsUploadDialogOpen(true)}
            className="bg-white"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload Excel</span>
          </Button>
          <Button 
            onClick={() => {
              setEditingCoverage(null);
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Cobertura</span>
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Coberturas</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Cobertos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.coberto}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Não Cobertos</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.naoCoberto}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Requerem Autorização</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.comAutorizacao}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
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
                  placeholder="Buscar por código TUSS, descrição ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.nome_plano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <select
              value={cobertoFilter}
              onChange={(e) => setCobertoFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-input bg-white rounded-md text-sm"
            >
              <option value="all">Todos</option>
              <option value="coberto">Cobertos</option>
              <option value="nao_coberto">Não Cobertos</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-input bg-white rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Coberturas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredCoverage.length} {filteredCoverage.length === 1 ? 'cobertura encontrada' : 'coberturas encontradas'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCoverage.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <FileCode className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhuma cobertura encontrada</p>
              {searchTerm || planFilter !== "all" || cobertoFilter !== "all" || statusFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setEditingCoverage(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Cobertura
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Código TUSS</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="min-w-[150px]">Plano</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Cobertura</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[100px]">Valor</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoverage.map((cov) => (
                    <TableRow key={cov.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-sm">{cov.tuss_code || "N/A"}</TableCell>
                      <TableCell>
                        <p className="text-sm">{cov.tuss_descricao || "N/A"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{cov.plan_nome || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={cov.coberto ? "default" : "secondary"}>
                          {cov.coberto ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {Number(cov.cobertura_percentual)}%
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Não Coberto
                            </>
                          )}
                        </Badge>
                        {cov.requer_autorizacao && (
                          <Badge variant="secondary" className="ml-2">
                            <Shield className="h-3 w-3 mr-1" />
                            Autorização
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {cov.valor_contratual ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{Number(cov.valor_contratual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={cov.is_active ? "default" : "secondary"}>
                          {cov.is_active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
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
                            onClick={() => handleEdit(cov)}
                            title="Editar cobertura"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(cov)}
                            title="Excluir cobertura"
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

      {/* Create/Edit Dialog - Similar structure to other pages but with more fields */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCoverage(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCoverage ? "Editar Cobertura" : "Nova Cobertura"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCoverage ? "Atualize as informações da cobertura" : "Configure a cobertura de um código TUSS para um plano"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tuss_code_id" className="text-sm">Código TUSS *</Label>
                <Select
                  value={formData.tuss_code_id.toString()}
                  onValueChange={(value) => setFormData({...formData, tuss_code_id: parseInt(value)})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o código TUSS" />
                  </SelectTrigger>
                  <SelectContent>
                    {tussCodes.map((code) => (
                      <SelectItem key={code.id} value={code.id.toString()}>
                        {code.codigo} - {code.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="insurance_plan_id" className="text-sm">Plano *</Label>
                <Select
                  value={formData.insurance_plan_id.toString()}
                  onValueChange={(value) => setFormData({...formData, insurance_plan_id: parseInt(value)})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nome_plano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-end">
                <div className="flex items-center space-x-2 w-full">
                  <Switch
                    id="coberto"
                    checked={formData.coberto}
                    onCheckedChange={(checked) => setFormData({...formData, coberto: checked})}
                  />
                  <Label htmlFor="coberto" className="text-sm cursor-pointer">Coberto</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="cobertura_percentual" className="text-sm">Cobertura (%)</Label>
                <Input
                  id="cobertura_percentual"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.cobertura_percentual}
                  onChange={(e) => setFormData({...formData, cobertura_percentual: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2 w-full">
                  <Switch
                    id="requer_autorizacao"
                    checked={formData.requer_autorizacao}
                    onCheckedChange={(checked) => setFormData({...formData, requer_autorizacao: checked})}
                  />
                  <Label htmlFor="requer_autorizacao" className="text-sm cursor-pointer">Requer Autorização</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_tabela" className="text-sm">Valor Tabela (R$)</Label>
                <Input
                  id="valor_tabela"
                  type="number"
                  step="0.01"
                  value={formData.valor_tabela || ""}
                  onChange={(e) => setFormData({...formData, valor_tabela: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="valor_contratual" className="text-sm">Valor Contratual (R$)</Label>
                <Input
                  id="valor_contratual"
                  type="number"
                  step="0.01"
                  value={formData.valor_contratual || ""}
                  onChange={(e) => setFormData({...formData, valor_contratual: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_coparticipacao" className="text-sm">Coparticipação (R$)</Label>
                <Input
                  id="valor_coparticipacao"
                  type="number"
                  step="0.01"
                  value={formData.valor_coparticipacao}
                  onChange={(e) => setFormData({...formData, valor_coparticipacao: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="valor_franquia" className="text-sm">Franquia (R$)</Label>
                <Input
                  id="valor_franquia"
                  type="number"
                  step="0.01"
                  value={formData.valor_franquia}
                  onChange={(e) => setFormData({...formData, valor_franquia: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prazo_autorizacao_dias" className="text-sm">Prazo Autorização (dias)</Label>
                <Input
                  id="prazo_autorizacao_dias"
                  type="number"
                  value={formData.prazo_autorizacao_dias || ""}
                  onChange={(e) => setFormData({...formData, prazo_autorizacao_dias: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="limite_quantidade" className="text-sm">Limite Quantidade</Label>
                <Input
                  id="limite_quantidade"
                  type="number"
                  value={formData.limite_quantidade || ""}
                  onChange={(e) => setFormData({...formData, limite_quantidade: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="limite_periodo_dias" className="text-sm">Limite Período (dias)</Label>
                <Input
                  id="limite_periodo_dias"
                  type="number"
                  value={formData.limite_periodo_dias || ""}
                  onChange={(e) => setFormData({...formData, limite_periodo_dias: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio_vigencia" className="text-sm">Data Início Vigência *</Label>
                <Input
                  id="data_inicio_vigencia"
                  type="date"
                  value={formData.data_inicio_vigencia}
                  onChange={(e) => setFormData({...formData, data_inicio_vigencia: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="data_fim_vigencia" className="text-sm">Data Fim Vigência</Label>
                <Input
                  id="data_fim_vigencia"
                  type="date"
                  value={formData.data_fim_vigencia || ""}
                  onChange={(e) => setFormData({...formData, data_fim_vigencia: e.target.value || undefined})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes" className="text-sm">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
                rows={3}
                className="mt-1"
              />
            </div>

            {editingCoverage && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingCoverage.is_active}
                  onCheckedChange={(checked) => {
                    setEditingCoverage({...editingCoverage, is_active: checked});
                  }}
                />
                <Label htmlFor="is_active" className="text-sm cursor-pointer">Cobertura ativa</Label>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCoverage(null);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingCoverage ? "Atualizar" : "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete and Upload dialogs - same structure as other pages */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir esta cobertura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setDeletingCoverage(null)}
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

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Upload de Coberturas via Excel</DialogTitle>
            <DialogDescription className="text-sm">
              Faça upload de um arquivo Excel com os dados das coberturas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="upload-file" className="text-sm">Arquivo Excel</Label>
              <Input
                id="upload-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            {uploadResults && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Resultado do Upload:</p>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600">✓ {uploadResults.success} inseridos/atualizados</p>
                  <p className="text-red-600">✗ {uploadResults.failed} erros</p>
                </div>
                {uploadResults.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {uploadResults.errors.map((error, idx) => (
                      <p key={idx} className="text-xs text-red-600">{error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadDialogOpen(false);
                setUploadFile(null);
                setUploadResults(null);
              }}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
