"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, Plus, Search, Edit, Trash2, Upload, FileText, 
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2, Filter,
  Database, TrendingUp, Shield
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { tissInsuranceApi, InsuranceCompany, InsuranceCompanyCreate, InsuranceCompanyUpdate } from "@/lib/tiss-api";
import { cn } from "@/lib/utils";

export default function TISSConveniosPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<InsuranceCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  
  const [formData, setFormData] = useState<InsuranceCompanyCreate>({
    nome: "",
    razao_social: "",
    cnpj: "",
    registro_ans: "",
    codigo_operadora: "",
    telefone: "",
    email: "",
    endereco: "",
    observacoes: "",
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await tissInsuranceApi.getCompanies({ limit: 1000 });
      setCompanies(data);
    } catch (error: any) {
      console.error("Failed to load companies:", error);
      toast.error("Erro ao carregar convênios", {
        description: error.message || "Não foi possível carregar os convênios"
      });
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !searchTerm || 
        company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj.includes(searchTerm) ||
        company.registro_ans.includes(searchTerm) ||
        company.razao_social?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && company.is_active) ||
        (statusFilter === "inactive" && !company.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [companies, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(c => c.is_active).length;
    const inactive = total - active;
    const totalPlans = companies.reduce((sum, c) => sum + (c.plans_count || 0), 0);
    
    return { total, active, inactive, totalPlans };
  }, [companies]);

  const handleSave = async () => {
    if (!formData.nome || !formData.cnpj || !formData.registro_ans) {
      toast.error("Erro de validação", {
        description: "Nome, CNPJ e Registro ANS são obrigatórios"
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingCompany) {
        const updateData: InsuranceCompanyUpdate = {
          ...formData,
        };
        await tissInsuranceApi.updateCompany(editingCompany.id, updateData);
        toast.success("Convênio atualizado com sucesso!");
      } else {
        await tissInsuranceApi.createCompany(formData);
        toast.success("Convênio criado com sucesso!");
      }
      
      setIsDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      await loadCompanies();
    } catch (error: any) {
      console.error("Failed to save company:", error);
      toast.error("Erro ao salvar convênio", {
        description: error.message || "Não foi possível salvar o convênio"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company);
    setFormData({
      nome: company.nome,
      razao_social: company.razao_social || "",
      cnpj: company.cnpj,
      registro_ans: company.registro_ans,
      codigo_operadora: company.codigo_operadora || "",
      telefone: company.telefone || "",
      email: company.email || "",
      endereco: company.endereco || "",
      observacoes: company.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (company: InsuranceCompany) => {
    setDeletingCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;

    try {
      setIsDeleting(true);
      await tissInsuranceApi.deleteCompany(deletingCompany.id);
      toast.success("Convênio excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingCompany(null);
      await loadCompanies();
    } catch (error: any) {
      console.error("Failed to delete company:", error);
      toast.error("Erro ao excluir convênio", {
        description: error.message || "Não foi possível excluir o convênio"
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

    try {
      setIsUploading(true);
      const result = await tissInsuranceApi.uploadCompaniesExcel(uploadFile);
      
      setUploadResults({
        success: result.inserted,
        failed: result.errors,
        errors: result.error_details || []
      });
      
      toast.success("Upload concluído!", {
        description: `${result.inserted} registros inseridos, ${result.updated} atualizados, ${result.errors} erros`
      });
      
      setUploadFile(null);
      await loadCompanies();
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
      nome: "",
      razao_social: "",
      cnpj: "",
      registro_ans: "",
      codigo_operadora: "",
      telefone: "",
      email: "",
      endereco: "",
      observacoes: "",
    });
    setEditingCompany(null);
  };

  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando convênios...</p>
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
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Convênios TISS
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie os convênios de saúde para integração TISS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadCompanies} 
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
              setEditingCompany(null);
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Convênio</span>
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Convênios</p>
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Planos</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.totalPlans}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
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
                  placeholder="Buscar por nome, CNPJ, registro ANS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
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

      {/* Companies Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Convênios</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'convênio encontrado' : 'convênios encontrados'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Building2 className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum convênio encontrado</p>
              {searchTerm || statusFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setEditingCompany(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Convênio
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead className="min-w-[150px]">CNPJ</TableHead>
                    <TableHead className="min-w-[120px]">Registro ANS</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Planos</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm sm:text-base">{company.nome}</p>
                          {company.razao_social && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {company.razao_social}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{company.cnpj}</TableCell>
                      <TableCell className="font-mono text-sm">{company.registro_ans}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{company.plans_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={company.is_active ? "default" : "secondary"}>
                          {company.is_active ? (
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
                            onClick={() => handleEdit(company)}
                            title="Editar convênio"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(company)}
                            title="Excluir convênio"
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
          setEditingCompany(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCompany ? "Editar Convênio" : "Novo Convênio"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCompany ? "Atualize as informações do convênio" : "Adicione um novo convênio"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-sm">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome do convênio"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="razao_social" className="text-sm">Razão Social</Label>
                <Input
                  id="razao_social"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                  placeholder="Razão social"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj" className="text-sm">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  placeholder="00.000.000/0000-00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="registro_ans" className="text-sm">Registro ANS *</Label>
                <Input
                  id="registro_ans"
                  value={formData.registro_ans}
                  onChange={(e) => setFormData({...formData, registro_ans: e.target.value})}
                  placeholder="000000"
                  maxLength={6}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo_operadora" className="text-sm">Código Operadora</Label>
                <Input
                  id="codigo_operadora"
                  value={formData.codigo_operadora}
                  onChange={(e) => setFormData({...formData, codigo_operadora: e.target.value})}
                  placeholder="Código da operadora"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="telefone" className="text-sm">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@convenio.com.br"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endereco" className="text-sm">Endereço</Label>
              <Textarea
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                placeholder="Endereço completo"
                rows={2}
                className="mt-1"
              />
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

            {editingCompany && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingCompany.is_active}
                  onCheckedChange={(checked) => {
                    setEditingCompany({...editingCompany, is_active: checked});
                  }}
                />
                <Label htmlFor="is_active" className="text-sm cursor-pointer">Convênio ativo</Label>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCompany(null);
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
                editingCompany ? "Atualizar" : "Adicionar"
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
              Tem certeza que deseja excluir o convênio <strong>{deletingCompany?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setDeletingCompany(null)}
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
            <DialogTitle className="text-lg sm:text-xl">Upload de Convênios via Excel</DialogTitle>
            <DialogDescription className="text-sm">
              Faça upload de um arquivo Excel com os dados dos convênios
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
