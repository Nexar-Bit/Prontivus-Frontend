"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Key, Plus, Search, Edit, Trash2, RefreshCw, Building, Users, Calendar, 
  AlertCircle, CheckCircle2, Copy, Eye, Loader2, XCircle, PlayCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface License {
  id: string;
  tenant_id: number;
  plan: string;
  modules: string[];
  users_limit: number;
  units_limit?: number;
  start_at: string;
  end_at: string;
  status: string;
  activation_key: string;
  is_active: boolean;
  is_expired: boolean;
  days_until_expiry: number;
  created_at: string;
  updated_at?: string;
  clinic_name?: string;
}

interface LicenseFormData {
  tenant_id: string;
  plan: string;
  modules: string[];
  users_limit: string;
  units_limit: string;
  start_at: string;
  end_at: string;
}

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
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
  { value: "api", label: "API" },
  { value: "reports", label: "Relatórios" },
  { value: "backup", label: "Backup" },
  { value: "integration", label: "Integração" },
];

const LICENSE_PLANS = [
  { value: "basic", label: "Básico" },
  { value: "professional", label: "Profissional" },
  { value: "enterprise", label: "Enterprise" },
  { value: "custom", label: "Customizado" },
];

const LICENSE_STATUSES = [
  { value: "active", label: "Ativa" },
  { value: "suspended", label: "Suspensa" },
  { value: "cancelled", label: "Cancelada" },
  { value: "expired", label: "Expirada" },
];

export default function LicenciamentoPage() {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  });
  const [formData, setFormData] = useState<LicenseFormData>({
    tenant_id: "",
    plan: "basic",
    modules: [],
    users_limit: "10",
    units_limit: "",
    start_at: new Date().toISOString().split('T')[0],
    end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLicenses();
    calculateStats();
  }, [licenses, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLicenses(),
        loadClinics(),
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

  const loadLicenses = async () => {
    try {
      const data = await api.get<License[]>("/api/v1/licenses");
      setLicenses(data);
    } catch (error: any) {
      console.error("Failed to load licenses:", error);
      toast.error("Erro ao carregar licenças", {
        description: error?.message || error?.detail || "Não foi possível carregar as licenças",
      });
      setLicenses([]);
    }
  };

  const loadClinics = async () => {
    try {
      const data = await api.get<Clinic[]>("/api/v1/admin/clinics?limit=1000");
      setClinics(data);
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      setClinics([]);
    }
  };

  const filterLicenses = () => {
    let filtered = [...licenses];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (license) =>
          license.activation_key.toLowerCase().includes(searchLower) ||
          license.plan.toLowerCase().includes(searchLower) ||
          license.clinic_name?.toLowerCase().includes(searchLower) ||
          license.status.toLowerCase().includes(searchLower) ||
          license.id.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter(l => l.is_active && !l.is_expired);
    } else if (statusFilter === "expired") {
      filtered = filtered.filter(l => l.is_expired);
    } else if (statusFilter === "suspended") {
      filtered = filtered.filter(l => l.status === "suspended");
    } else if (statusFilter === "cancelled") {
      filtered = filtered.filter(l => l.status === "cancelled");
    } else if (statusFilter === "expiring") {
      filtered = filtered.filter(l => !l.is_expired && l.days_until_expiry <= 30);
    }

    setFilteredLicenses(filtered);
  };

  const calculateStats = () => {
    const total = licenses.length;
    const active = licenses.filter(l => l.is_active && !l.is_expired).length;
    const expiring = licenses.filter(l => !l.is_expired && l.days_until_expiry <= 30).length;
    const expired = licenses.filter(l => l.is_expired).length;
    
    setStats({ total, active, expiring, expired });
  };

  const resetForm = () => {
    setFormData({
      tenant_id: "",
      plan: "basic",
      modules: [],
      users_limit: "10",
      units_limit: "",
      start_at: new Date().toISOString().split('T')[0],
      end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingLicense(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (license: License) => {
    setEditingLicense(license);
    const startDate = license.start_at ? parseISO(license.start_at).toISOString().split('T')[0] : "";
    const endDate = license.end_at ? parseISO(license.end_at).toISOString().split('T')[0] : "";
    setFormData({
      tenant_id: license.tenant_id.toString(),
      plan: license.plan || "basic",
      modules: license.modules || [],
      users_limit: license.users_limit?.toString() || "10",
      units_limit: license.units_limit?.toString() || "",
      start_at: startDate,
      end_at: endDate,
    });
    setShowForm(true);
  };

  const openDetailDialog = async (license: License) => {
    try {
      const fullLicense = await api.get<License>(`/api/v1/licenses/${license.id}`);
      setSelectedLicense(fullLicense);
      setShowDetailDialog(true);
    } catch (error: any) {
      console.error("Failed to load license details:", error);
      toast.error("Erro ao carregar detalhes da licença", {
        description: error?.message || error?.detail,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenant_id || !formData.plan || !formData.start_at || !formData.end_at) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (new Date(formData.end_at) <= new Date(formData.start_at)) {
      toast.error("Data de término deve ser posterior à data de início");
      return;
    }

    try {
      setSaving(true);

      const licenseData: any = {
        tenant_id: parseInt(formData.tenant_id),
        plan: formData.plan,
        modules: formData.modules,
        users_limit: parseInt(formData.users_limit) || 10,
        units_limit: formData.units_limit ? parseInt(formData.units_limit) : undefined,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: new Date(formData.end_at).toISOString(),
      };

      if (editingLicense) {
        await api.put(`/api/v1/licenses/${editingLicense.id}`, licenseData);
        toast.success("Licença atualizada com sucesso!");
      } else {
        await api.post("/api/v1/licenses", licenseData);
        toast.success("Licença criada com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadLicenses();
    } catch (error: any) {
      console.error("Failed to save license:", error);
      toast.error(editingLicense ? "Erro ao atualizar licença" : "Erro ao criar licença", {
        description: error?.message || error?.detail || "Não foi possível salvar a licença",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (license: License) => {
    setLicenseToDelete(license);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!licenseToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/api/v1/licenses/${licenseToDelete.id}`);
      toast.success("Licença cancelada com sucesso!");
      await loadLicenses();
      setLicenseToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete license:", error);
      toast.error("Erro ao cancelar licença", {
        description: error?.message || error?.detail || "Não foi possível cancelar a licença",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (license: License, newStatus: string) => {
    try {
      await api.put(`/api/v1/licenses/${license.id}`, {
        status: newStatus,
      });
      toast.success("Status da licença atualizado com sucesso!");
      await loadLicenses();
      if (selectedLicense && selectedLicense.id === license.id) {
        const updatedLicense = await api.get<License>(`/api/v1/licenses/${license.id}`);
        setSelectedLicense(updatedLicense);
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Erro ao atualizar status", {
        description: error?.message || error?.detail || "Não foi possível atualizar o status",
      });
    }
  };

  const toggleModule = (moduleValue: string) => {
    setFormData((prev) => {
      const modules = [...prev.modules];
      const index = modules.indexOf(moduleValue);
      if (index > -1) {
        modules.splice(index, 1);
      } else {
        modules.push(moduleValue);
      }
      return { ...prev, modules };
    });
  };

  const copyActivationKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Chave de ativação copiada para a área de transferência!");
  };

  const getStatusBadge = (license: License) => {
    if (license.is_expired) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Expirada</Badge>;
    } else if (license.status === "suspended") {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Suspensa</Badge>;
    } else if (license.status === "cancelled") {
      return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1 inline" />Cancelada</Badge>;
    } else if (license.days_until_expiry <= 30) {
      return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Expirando</Badge>;
    } else if (license.is_active) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
    }
  };

  const getPlanLabel = (plan: string) => {
    const planObj = LICENSE_PLANS.find(p => p.value === plan);
    return planObj?.label || plan;
  };

  const getClinicName = (tenantId: number) => {
    const clinic = clinics.find(c => c.id === tenantId);
    return clinic?.name || `Clínica #${tenantId}`;
  };

  if (loading && licenses.length === 0) {
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
            <Key className="h-8 w-8 text-purple-600" />
            Gestão de Licenciamento
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie licenças e chaves de ativação das clínicas
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Licenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Clínicas licenciadas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Licenças Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">Em uso</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expirando em 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.expiring}</div>
            <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Licenças Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-gray-500 mt-1">Vencidas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Licenças</CardTitle>
              <CardDescription>
                Gerencie todas as licenças do sistema ({filteredLicenses.length} {filteredLicenses.length === 1 ? 'licença' : 'licenças'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar licença..."
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
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="expiring">Expirando</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Licença
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLicenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Chave de Ativação</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        {getClinicName(license.tenant_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPlanLabel(license.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {license.activation_key.substring(0, 12)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyActivationKey(license.activation_key)}
                          className="h-6 w-6 p-0"
                          title="Copiar chave completa"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {license.modules.slice(0, 3).map((module) => (
                          <Badge key={module} variant="outline" className="text-xs">
                            {AVAILABLE_MODULES.find(m => m.value === module)?.label || module}
                          </Badge>
                        ))}
                        {license.modules.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{license.modules.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {license.users_limit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-600">
                          {format(parseISO(license.start_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-gray-400">até</span>
                        <span className={license.is_expired ? "text-red-600 font-medium" : license.days_until_expiry <= 30 ? "text-orange-600 font-medium" : "text-gray-600"}>
                          {format(parseISO(license.end_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {!license.is_expired && (
                          <span className="text-xs text-gray-500 mt-1">
                            {license.days_until_expiry} {license.days_until_expiry === 1 ? 'dia' : 'dias'} restantes
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(license)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDialog(license)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(license)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {license.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(license)}
                            title="Cancelar"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{searchTerm || statusFilter !== "all" ? "Nenhuma licença encontrada" : "Nenhuma licença cadastrada"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit License Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? "Editar Licença" : "Criar Nova Licença"}
            </DialogTitle>
            <DialogDescription>
              {editingLicense ? "Atualize os dados da licença" : "Preencha os dados da licença"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="limits">Limites</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenant_id">Clínica *</Label>
                    <Select
                      value={formData.tenant_id}
                      onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                      disabled={!!editingLicense}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id.toString()}>
                            {clinic.name} ({clinic.tax_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingLicense && (
                      <p className="text-xs text-gray-500 mt-1">A clínica não pode ser alterada</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="plan">Plano *</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) => setFormData({ ...formData, plan: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_PLANS.map((plan) => (
                          <SelectItem key={plan.value} value={plan.value}>
                            {plan.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_at">Data de Início *</Label>
                    <Input
                      id="start_at"
                      type="date"
                      required
                      value={formData.start_at}
                      onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_at">Data de Término *</Label>
                    <Input
                      id="end_at"
                      type="date"
                      required
                      value={formData.end_at}
                      onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="limits" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="users_limit">Limite de Usuários *</Label>
                    <Input
                      id="users_limit"
                      type="number"
                      min="1"
                      max="10000"
                      required
                      value={formData.users_limit}
                      onChange={(e) => setFormData({ ...formData, users_limit: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Número máximo de usuários permitidos</p>
                  </div>
                  <div>
                    <Label htmlFor="units_limit">Limite de Unidades</Label>
                    <Input
                      id="units_limit"
                      type="number"
                      min="1"
                      value={formData.units_limit}
                      onChange={(e) => setFormData({ ...formData, units_limit: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Número máximo de unidades/clínicas (opcional)</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="modules" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`module-${module.value}`}
                        checked={formData.modules.includes(module.value)}
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
                ) : editingLicense ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* License Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Licença</DialogTitle>
            <DialogDescription>
              Informações completas da licença {selectedLicense?.activation_key.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                  <TabsTrigger value="actions">Ações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Clínica</Label>
                      <p className="font-medium">{getClinicName(selectedLicense.tenant_id)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Plano</Label>
                      <p className="font-medium">{getPlanLabel(selectedLicense.plan)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Chave de Ativação</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {selectedLicense.activation_key}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyActivationKey(selectedLicense.activation_key)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedLicense)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Limite de Usuários</Label>
                      <p className="font-medium">{selectedLicense.users_limit}</p>
                    </div>
                    {selectedLicense.units_limit && (
                      <div>
                        <Label className="text-sm text-gray-500">Limite de Unidades</Label>
                        <p className="font-medium">{selectedLicense.units_limit}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-gray-500">Data de Início</Label>
                      <p className="font-medium">
                        {format(parseISO(selectedLicense.start_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Data de Término</Label>
                      <p className="font-medium">
                        {format(parseISO(selectedLicense.end_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    {!selectedLicense.is_expired && (
                      <div>
                        <Label className="text-sm text-gray-500">Dias Restantes</Label>
                        <p className="font-medium">{selectedLicense.days_until_expiry} dias</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-gray-500">Data de Criação</Label>
                      <p className="font-medium">
                        {format(parseISO(selectedLicense.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="modules" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_MODULES.map((module) => {
                      const isActive = selectedLicense.modules?.includes(module.value) || false;
                      return (
                        <div
                          key={module.value}
                          className={`flex items-center space-x-2 p-2 rounded border ${
                            isActive ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <Checkbox
                            checked={isActive}
                            disabled
                          />
                          <Label className="text-sm font-normal">
                            {module.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Alterar Status</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LICENSE_STATUSES.map((status) => (
                          <Button
                            key={status.value}
                            variant={selectedLicense.status === status.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateStatus(selectedLicense, status.value)}
                            disabled={selectedLicense.status === status.value || selectedLicense.status === "cancelled"}
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Alterar o status da licença pode afetar o acesso da clínica ao sistema.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fechar
            </Button>
            {selectedLicense && (
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setShowDetailDialog(false);
                  openEditForm(selectedLicense);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Licença
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Cancelar Licença"
        description={licenseToDelete ? `Tem certeza que deseja cancelar a licença ${licenseToDelete.activation_key}? Esta ação não pode ser desfeita.` : ""}
        confirmText="Cancelar Licença"
        cancelText="Manter Licença"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
