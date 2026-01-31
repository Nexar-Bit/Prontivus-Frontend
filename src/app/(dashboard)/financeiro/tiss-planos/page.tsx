"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, Plus, Search, Edit, Trash2, Upload, 
  RefreshCw, CheckCircle2, XCircle, Loader2, Filter,
  Database, TrendingUp, Shield, Building2
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
import { tissInsuranceApi, InsurancePlan, InsurancePlanCreate, InsurancePlanUpdate, InsuranceCompany } from "@/lib/tiss-api";

export default function TISSPlanosPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<InsurancePlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  
  const [formData, setFormData] = useState<InsurancePlanCreate>({
    insurance_company_id: 0,
    nome_plano: "",
    codigo_plano: "",
    numero_plano_ans: "",
    cobertura_percentual: 100,
    requer_autorizacao: false,
    limite_anual: undefined,
    limite_por_procedimento: undefined,
    data_inicio_vigencia: undefined,
    data_fim_vigencia: undefined,
    observacoes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, companiesData] = await Promise.all([
        tissInsuranceApi.getPlans({ limit: 1000 }),
        tissInsuranceApi.getCompanies({ limit: 1000 })
      ]);
      setPlans(plansData);
      setCompanies(companiesData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error.message || "Não foi possível carregar os dados"
      });
      setPlans([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = !searchTerm || 
        plan.nome_plano.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.codigo_plano?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = companyFilter === "all" || 
        plan.insurance_company_id.toString() === companyFilter;
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && plan.is_active) ||
        (statusFilter === "inactive" && !plan.is_active);
      
      return matchesSearch && matchesCompany && matchesStatus;
    });
  }, [plans, searchTerm, companyFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter(p => p.is_active).length;
    const inactive = total - active;
    const withAuth = plans.filter(p => p.requer_autorizacao).length;
    
    return { total, active, inactive, withAuth };
  }, [plans]);

  const handleSave = async () => {
    if (!formData.nome_plano || !formData.insurance_company_id) {
      toast.error("Erro de validação", {
        description: "Nome do plano e convênio são obrigatórios"
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingPlan) {
        const updateData: InsurancePlanUpdate = {
          ...formData,
        };
        await tissInsuranceApi.updatePlan(editingPlan.id, updateData);
        toast.success("Plano atualizado com sucesso!");
      } else {
        await tissInsuranceApi.createPlan(formData);
        toast.success("Plano criado com sucesso!");
      }
      
      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save plan:", error);
      toast.error("Erro ao salvar plano", {
        description: error.message || "Não foi possível salvar o plano"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (plan: InsurancePlan) => {
    setEditingPlan(plan);
    setFormData({
      insurance_company_id: plan.insurance_company_id,
      nome_plano: plan.nome_plano,
      codigo_plano: plan.codigo_plano || "",
      numero_plano_ans: plan.numero_plano_ans || "",
      cobertura_percentual: Number(plan.cobertura_percentual),
      requer_autorizacao: plan.requer_autorizacao,
      limite_anual: plan.limite_anual ? Number(plan.limite_anual) : undefined,
      limite_por_procedimento: plan.limite_por_procedimento ? Number(plan.limite_por_procedimento) : undefined,
      data_inicio_vigencia: plan.data_inicio_vigencia || undefined,
      data_fim_vigencia: plan.data_fim_vigencia || undefined,
      observacoes: plan.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (plan: InsurancePlan) => {
    setDeletingPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;

    try {
      setIsDeleting(true);
      await tissInsuranceApi.deletePlan(deletingPlan.id);
      toast.success("Plano excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingPlan(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete plan:", error);
      toast.error("Erro ao excluir plano", {
        description: error.message || "Não foi possível excluir o plano"
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

    const companyId = companyFilter !== "all" ? parseInt(companyFilter) : undefined;

    try {
      setIsUploading(true);
      const result = await tissInsuranceApi.uploadPlansExcel(uploadFile, companyId);
      
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
      insurance_company_id: 0,
      nome_plano: "",
      codigo_plano: "",
      numero_plano_ans: "",
      cobertura_percentual: 100,
      requer_autorizacao: false,
      limite_anual: undefined,
      limite_por_procedimento: undefined,
      data_inicio_vigencia: undefined,
      data_fim_vigencia: undefined,
      observacoes: "",
    });
    setEditingPlan(null);
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando planos...</p>
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
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Planos TISS
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie os planos de saúde dos convênios
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
              setEditingPlan(null);
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Plano</span>
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Planos</p>
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Ativos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.active}</p>
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Inativos</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.inactive}</p>
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
                <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.withAuth}</p>
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
                  placeholder="Buscar por nome ou código do plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Filtrar por convênio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os convênios</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Plans Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Planos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredPlans.length} {filteredPlans.length === 1 ? 'plano encontrado' : 'planos encontrados'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum plano encontrado</p>
              {searchTerm || companyFilter !== "all" || statusFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setEditingPlan(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Plano
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome do Plano</TableHead>
                    <TableHead className="min-w-[150px]">Convênio</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Cobertura</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm sm:text-base">{plan.nome_plano}</p>
                          {plan.codigo_plano && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Código: {plan.codigo_plano}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{plan.insurance_company_nome || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{Number(plan.cobertura_percentual)}%</Badge>
                        {plan.requer_autorizacao && (
                          <Badge variant="secondary" className="ml-2">
                            <Shield className="h-3 w-3 mr-1" />
                            Autorização
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? (
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
                            onClick={() => handleEdit(plan)}
                            title="Editar plano"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(plan)}
                            title="Excluir plano"
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
          setEditingPlan(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingPlan ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingPlan ? "Atualize as informações do plano" : "Adicione um novo plano"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="insurance_company_id" className="text-sm">Convênio *</Label>
              <Select
                value={formData.insurance_company_id.toString()}
                onValueChange={(value) => setFormData({...formData, insurance_company_id: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o convênio" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_plano" className="text-sm">Nome do Plano *</Label>
                <Input
                  id="nome_plano"
                  value={formData.nome_plano}
                  onChange={(e) => setFormData({...formData, nome_plano: e.target.value})}
                  placeholder="Nome do plano"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="codigo_plano" className="text-sm">Código do Plano</Label>
                <Input
                  id="codigo_plano"
                  value={formData.codigo_plano}
                  onChange={(e) => setFormData({...formData, codigo_plano: e.target.value})}
                  placeholder="Código interno"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="numero_plano_ans" className="text-sm">Número ANS</Label>
                <Input
                  id="numero_plano_ans"
                  value={formData.numero_plano_ans}
                  onChange={(e) => setFormData({...formData, numero_plano_ans: e.target.value})}
                  placeholder="Número ANS"
                  className="mt-1"
                />
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
                <Label htmlFor="limite_anual" className="text-sm">Limite Anual (R$)</Label>
                <Input
                  id="limite_anual"
                  type="number"
                  step="0.01"
                  value={formData.limite_anual || ""}
                  onChange={(e) => setFormData({...formData, limite_anual: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="limite_por_procedimento" className="text-sm">Limite por Procedimento (R$)</Label>
                <Input
                  id="limite_por_procedimento"
                  type="number"
                  step="0.01"
                  value={formData.limite_por_procedimento || ""}
                  onChange={(e) => setFormData({...formData, limite_por_procedimento: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio_vigencia" className="text-sm">Data Início Vigência</Label>
                <Input
                  id="data_inicio_vigencia"
                  type="date"
                  value={formData.data_inicio_vigencia || ""}
                  onChange={(e) => setFormData({...formData, data_inicio_vigencia: e.target.value || undefined})}
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

            {editingPlan && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) => {
                    setEditingPlan({...editingPlan, is_active: checked});
                  }}
                />
                <Label htmlFor="is_active" className="text-sm cursor-pointer">Plano ativo</Label>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPlan(null);
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
                editingPlan ? "Atualizar" : "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir o plano <strong>{deletingPlan?.nome_plano}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setDeletingPlan(null)}
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

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Upload de Planos via Excel</DialogTitle>
            <DialogDescription className="text-sm">
              Faça upload de um arquivo Excel com os dados dos planos
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
