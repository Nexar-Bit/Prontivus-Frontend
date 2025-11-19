"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building, Plus, Search, Edit, Trash2, RefreshCw, Users, Calendar, 
  AlertCircle, CheckCircle2, Settings, Eye, XCircle, Loader2
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { maskCPFOrCNPJ, maskPhone, onlyDigits } from "@/lib/inputMasks";

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users: number;
  active_modules: string[];
  user_count?: number;
  created_at: string;
  updated_at?: string;
}

interface ClinicStats {
  total_clinics: number;
  active_clinics: number;
  expired_licenses: number;
  total_users: number;
  clinics_near_expiration: number;
}

interface ClinicFormData {
  name: string;
  legal_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  license_key: string;
  expiration_date: string;
  max_users: string;
  active_modules: string[];
  is_active: boolean;
}

const AVAILABLE_MODULES = [
  { value: "patients", label: "Pacientes" },
  { value: "appointments", label: "Agendamentos" },
  { value: "clinical", label: "Clínico" },
  { value: "financial", label: "Financeiro" },
  { value: "stock", label: "Estoque" },
  { value: "bi", label: "Business Intelligence" },
  { value: "procedures", label: "Procedimentos" },
  { value: "tiss", label: "TISS" },
  { value: "mobile", label: "Mobile" },
  { value: "telemed", label: "Telemedicina" },
];

export default function ClinicaPage() {
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    license_key: "",
    expiration_date: "",
    max_users: "10",
    active_modules: [],
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClinics();
  }, [clinics, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClinics(),
        loadStats(),
      ]);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClinics = async () => {
    try {
      const data = await api.get<Clinic[]>("/api/v1/admin/clinics?limit=1000");
      setClinics(data);
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      toast.error("Erro ao carregar clínicas", {
        description: error?.message || error?.detail || "Não foi possível carregar as clínicas",
      });
      setClinics([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get<ClinicStats>("/api/v1/admin/clinics/stats");
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      setStats(null);
    }
  };

  const filterClinics = () => {
    let filtered = [...clinics];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(searchLower) ||
          clinic.legal_name.toLowerCase().includes(searchLower) ||
          clinic.tax_id.includes(searchTerm) ||
          clinic.email?.toLowerCase().includes(searchLower) ||
          clinic.license_key?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter(c => c.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(c => !c.is_active);
    } else if (statusFilter === "expired") {
      filtered = filtered.filter(c => {
        if (!c.expiration_date) return false;
        return new Date(c.expiration_date) < new Date();
      });
    } else if (statusFilter === "expiring") {
      filtered = filtered.filter(c => {
        if (!c.expiration_date) return false;
        const expDate = new Date(c.expiration_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expDate >= today && expDate <= thirtyDaysFromNow;
      });
    }

    setFilteredClinics(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      legal_name: "",
      tax_id: "",
      address: "",
      phone: "",
      email: "",
      license_key: "",
      expiration_date: "",
      max_users: "10",
      active_modules: [],
      is_active: true,
    });
    setEditingClinic(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = async (clinic: Clinic) => {
    try {
      // Load full clinic details to ensure we have all fields (phone, address, etc.)
      const fullClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${clinic.id}`);
      setEditingClinic(fullClinic);
      const expirationDate = fullClinic.expiration_date ? parseISO(fullClinic.expiration_date).toISOString().split('T')[0] : "";
      // Apply masks to tax_id and phone when loading from database
      const taxIdWithMask = fullClinic.tax_id ? maskCPFOrCNPJ(fullClinic.tax_id) : "";
      const phoneWithMask = fullClinic.phone ? maskPhone(fullClinic.phone) : "";
      setFormData({
        name: fullClinic.name || "",
        legal_name: fullClinic.legal_name || "",
        tax_id: taxIdWithMask,
        address: fullClinic.address || "",
        phone: phoneWithMask,
        email: fullClinic.email || "",
        license_key: fullClinic.license_key || "",
        expiration_date: expirationDate,
        max_users: fullClinic.max_users?.toString() || "10",
        active_modules: fullClinic.active_modules || [],
        is_active: fullClinic.is_active ?? true,
      });
      setShowForm(true);
    } catch (error: any) {
      console.error("Failed to load clinic details:", error);
      toast.error("Erro ao carregar detalhes da clínica", {
        description: error?.message || error?.detail,
      });
    }
  };

  const openDetailDialog = async (clinic: Clinic) => {
    try {
      // Load full clinic details
      const fullClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${clinic.id}`);
      setSelectedClinic(fullClinic);
      setShowDetailDialog(true);
    } catch (error: any) {
      console.error("Failed to load clinic details:", error);
      toast.error("Erro ao carregar detalhes da clínica", {
        description: error?.message || error?.detail,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.legal_name || !formData.tax_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      const clinicData: any = {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim(),
        tax_id: onlyDigits(formData.tax_id.trim()), // Remove mask before sending
        address: formData.address.trim() || undefined,
        phone: onlyDigits(formData.phone.trim()) || undefined, // Remove mask before sending
        email: formData.email.trim() || undefined,
        license_key: formData.license_key.trim() || undefined,
        expiration_date: formData.expiration_date || undefined,
        max_users: parseInt(formData.max_users) || 10,
        active_modules: formData.active_modules,
        is_active: formData.is_active,
      };

      if (editingClinic) {
        const updatedClinic = await api.put<Clinic>(`/api/v1/admin/clinics/${editingClinic.id}`, clinicData);
        // Update the clinic in the local list immediately
        setClinics(prevClinics => 
          prevClinics.map(c => c.id === editingClinic.id ? updatedClinic : c)
        );
        toast.success("Clínica atualizada com sucesso!");
      } else {
        const createdClinic = await api.post<any>("/api/v1/admin/clinics", clinicData);
        
        // Check if admin user was created
        if (createdClinic?.admin_user) {
          const adminUser = createdClinic.admin_user;
          toast.success("Clínica cadastrada com sucesso!", {
            description: `Usuário AdminClinica criado automaticamente. Username: ${adminUser.username}, Email: ${adminUser.email}, Senha: ${adminUser.password}`,
            duration: 10000, // Show for 10 seconds
          });
        } else {
          toast.success("Clínica cadastrada com sucesso!");
        }
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save clinic:", error);
      
      // Extract error message from various possible locations
      let errorMessage = "Não foi possível salvar a clínica";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.detail) {
        if (typeof error.data.detail === 'string') {
          errorMessage = error.data.detail;
        } else if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail.map((err: any) => 
            `${err.loc?.join('.') || 'field'}: ${err.msg}`
          ).join(', ');
        }
      } else if (error?.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      } else if (error?.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      }
      
      toast.error(editingClinic ? "Erro ao atualizar clínica" : "Erro ao cadastrar clínica", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (clinic: Clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!clinicToDelete) return;
    
    // Show loading notification
    const loadingToast = toast.loading("Excluindo clínica...", {
      description: "Esta operação pode levar alguns segundos. Por favor, aguarde.",
      duration: Infinity, // Keep it until we dismiss it
    });
    
    try {
      setDeleting(true);
      const response = await api.delete(`/api/v1/admin/clinics/${clinicToDelete.id}`);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success - remove from local state immediately for better UX
      const updatedClinics = clinics.filter(c => c.id !== clinicToDelete.id);
      setClinics(updatedClinics);
      
      // Reload stats to get updated counts
      await loadStats();
      
      toast.success("Clínica excluída com sucesso!");
      
      // filterClinics will be called automatically by useEffect when clinics changes
      setClinicToDelete(null);
    } catch (error: any) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.error("Failed to delete clinic:", error);
      // Extract error message from various possible locations
      let errorMessage = "Não foi possível excluir a clínica";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.detail) {
        if (typeof error.data.detail === 'string') {
          errorMessage = error.data.detail;
        } else if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail.map((err: any) => 
            `${err.loc?.join('.') || 'field'}: ${err.msg}`
          ).join(', ');
        } else {
          errorMessage = JSON.stringify(error.data.detail);
        }
      } else if (error?.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      }
      toast.error("Erro ao excluir clínica", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (clinic: Clinic) => {
    try {
      await api.put(`/api/v1/admin/clinics/${clinic.id}`, {
        is_active: !clinic.is_active,
      });
      toast.success(`Clínica ${!clinic.is_active ? 'ativada' : 'desativada'} com sucesso!`);
      await loadClinics();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status da clínica", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const handleUpdateModules = async (clinic: Clinic, modules: string[]) => {
    try {
      await api.patch(`/api/v1/admin/clinics/${clinic.id}/modules`, {
        active_modules: modules,
      });
      toast.success("Módulos atualizados com sucesso!");
      await loadClinics();
      if (selectedClinic && selectedClinic.id === clinic.id) {
        const updatedClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${clinic.id}`);
        setSelectedClinic(updatedClinic);
      }
    } catch (error: any) {
      console.error("Failed to update modules:", error);
      toast.error("Erro ao atualizar módulos", {
        description: error?.message || error?.detail || "Não foi possível atualizar os módulos",
      });
    }
  };

  const toggleModule = (moduleValue: string) => {
    setFormData((prev) => {
      const modules = [...prev.active_modules];
      const index = modules.indexOf(moduleValue);
      if (index > -1) {
        modules.splice(index, 1);
      } else {
        modules.push(moduleValue);
      }
      return { ...prev, active_modules: modules };
    });
  };

  const isLicenseExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const isLicenseNearExpiration = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expDate >= today && expDate <= thirtyDaysFromNow;
  };

  if (loading && clinics.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-purple-600" />
            Gestão de Clínicas
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todas as clínicas cadastradas no sistema
          </p>
        </div>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.total_clinics}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clínicas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active_clinics}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Licenças Expiradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.expired_licenses}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expirando em 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.clinics_near_expiration}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clínicas Cadastradas</CardTitle>
              <CardDescription>
                Lista de todas as clínicas no sistema ({filteredClinics.length} {filteredClinics.length === 1 ? 'clínica' : 'clínicas'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clínica..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="expiring">Expirando</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Clínica
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClinics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClinics.map((clinic) => {
                  const expired = isLicenseExpired(clinic.expiration_date);
                  const nearExpiration = isLicenseNearExpiration(clinic.expiration_date);
                  
                  return (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>{clinic.legal_name}</TableCell>
                      <TableCell>{clinic.tax_id}</TableCell>
                      <TableCell>{clinic.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          {clinic.user_count || 0} / {clinic.max_users}
                        </div>
                      </TableCell>
                      <TableCell>
                        {clinic.expiration_date ? (
                          <div className="flex flex-col">
                            <span className={expired ? "text-red-600 font-medium" : nearExpiration ? "text-yellow-600 font-medium" : "text-gray-600"}>
                              {format(parseISO(clinic.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {expired && (
                              <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 inline" />Expirada
                              </Badge>
                            )}
                            {nearExpiration && !expired && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 inline" />Expirando
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sem data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {clinic.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1 inline" />Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openDetailDialog(clinic)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditForm(clinic)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 min-w-[80px]"
                            onClick={() => handleToggleActive(clinic)}
                            title={clinic.is_active ? "Desativar" : "Ativar"}
                          >
                            {clinic.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(clinic)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm || statusFilter !== "all" ? "Nenhuma clínica encontrada" : "Nenhuma clínica cadastrada"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Clinic Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClinic ? "Editar Clínica" : "Cadastrar Nova Clínica"}
            </DialogTitle>
            <DialogDescription>
              {editingClinic ? "Atualize os dados da clínica" : "Preencha os dados da clínica"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="license">Licenciamento</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="legal_name">Razão Social *</Label>
                    <Input
                      id="legal_name"
                      required
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_id">CNPJ/CPF *</Label>
                    <Input
                      id="tax_id"
                      required
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      value={formData.tax_id}
                      onChange={(e) => {
                        // Remove all non-digits first, then apply mask
                        const digits = onlyDigits(e.target.value);
                        const masked = maskCPFOrCNPJ(digits);
                        setFormData({ ...formData, tax_id: masked });
                      }}
                      onKeyPress={(e) => {
                        // Only allow numbers and control keys
                        if (!/[0-9]/.test(e.key) && 
                            !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const digits = onlyDigits(pastedText);
                        const masked = maskCPFOrCNPJ(digits);
                        setFormData({ ...formData, tax_id: masked });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => {
                        // Remove all non-digits first, then apply mask
                        const digits = onlyDigits(e.target.value);
                        const masked = maskPhone(digits);
                        setFormData({ ...formData, phone: masked });
                      }}
                      onKeyPress={(e) => {
                        // Only allow numbers and control keys
                        if (!/[0-9]/.test(e.key) && 
                            !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const digits = onlyDigits(pastedText);
                        const masked = maskPhone(digits);
                        setFormData({ ...formData, phone: masked });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Clínica ativa
                  </Label>
                </div>
              </TabsContent>
              
              <TabsContent value="license" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="license_key">Chave de Licença</Label>
                    <Input
                      id="license_key"
                      placeholder="Chave única da licença"
                      value={formData.license_key}
                      onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiration_date">Data de Expiração</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_users">Máximo de Usuários *</Label>
                    <Input
                      id="max_users"
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formData.max_users}
                      onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="modules" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`module-${module.value}`}
                        checked={formData.active_modules.includes(module.value)}
                        onCheckedChange={() => toggleModule(module.value)}
                      />
                      <Label
                        htmlFor={`module-${module.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingClinic ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clinic Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Clínica</DialogTitle>
            <DialogDescription>
              Informações completas da clínica {selectedClinic?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClinic && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="license">Licenciamento</TabsTrigger>
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Nome</Label>
                      <p className="font-medium">{selectedClinic.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Razão Social</Label>
                      <p className="font-medium">{selectedClinic.legal_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">CNPJ/CPF</Label>
                      <p className="font-medium">{selectedClinic.tax_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">E-mail</Label>
                      <p className="font-medium">{selectedClinic.email || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Telefone</Label>
                      <p className="font-medium">{selectedClinic.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Endereço</Label>
                      <p className="font-medium">{selectedClinic.address || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <div className="mt-1">
                        {selectedClinic.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1 inline" />Inativa
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Data de Criação</Label>
                      <p className="font-medium">
                        {selectedClinic.created_at ? format(parseISO(selectedClinic.created_at), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="license" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Chave de Licença</Label>
                      <p className="font-medium font-mono text-sm">{selectedClinic.license_key || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Data de Expiração</Label>
                      <p className="font-medium">
                        {selectedClinic.expiration_date ? format(parseISO(selectedClinic.expiration_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Máximo de Usuários</Label>
                      <p className="font-medium">{selectedClinic.max_users}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Usuários Ativos</Label>
                      <p className="font-medium">{selectedClinic.user_count || 0}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="modules" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <Label>Módulos Ativos</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(selectedClinic)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Módulos
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {AVAILABLE_MODULES.map((module) => {
                        const isActive = selectedClinic.active_modules?.includes(module.value) || false;
                        return (
                          <div
                            key={module.value}
                            className={`flex items-center space-x-2 p-2 rounded border ${
                              isActive ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <Checkbox
                              checked={isActive}
                              onCheckedChange={(checked) => {
                                const newModules = checked
                                  ? [...(selectedClinic.active_modules || []), module.value]
                                  : (selectedClinic.active_modules || []).filter(m => m !== module.value);
                                handleUpdateModules(selectedClinic, newModules);
                              }}
                            />
                            <Label className="text-sm font-normal cursor-pointer">
                              {module.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fechar
            </Button>
            {selectedClinic && (
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setShowDetailDialog(false);
                  openEditForm(selectedClinic);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Clínica
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setClinicToDelete(null);
          }
        }}
        title="Excluir Clínica"
        description={clinicToDelete ? `Tem certeza que deseja excluir a clínica "${clinicToDelete.name}"? Esta ação não pode ser desfeita.` : ""}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
