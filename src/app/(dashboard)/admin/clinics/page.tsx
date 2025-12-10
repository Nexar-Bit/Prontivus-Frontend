"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  Plus, Search, Edit, Trash2, Eye, 
  Building2, Users, AlertTriangle,
  CheckCircle, XCircle, Clock,
  Shield, Key, Package, Activity,
  Loader2
} from "lucide-react";
import { adminApi, Clinic, ClinicCreate, ClinicUpdate, ClinicLicenseUpdate, ClinicStats } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const AVAILABLE_MODULES = [
  { id: "bi", name: "Business Intelligence", description: "Analytics and reporting", icon: "📊" },
  { id: "telemed", name: "Telemedicine", description: "Remote consultations", icon: "💻" },
  { id: "stock", name: "Stock Management", description: "Inventory management", icon: "📦" },
  { id: "financial", name: "Financial Management", description: "Billing and invoicing", icon: "💰" },
  { id: "clinical", name: "Clinical Records", description: "Patient medical records", icon: "📋" },
  { id: "appointments", name: "Appointment Management", description: "Scheduling system", icon: "📅" },
  { id: "patients", name: "Patient Management", description: "Patient registration", icon: "👥" },
  { id: "procedures", name: "Procedure Management", description: "Medical procedures", icon: "⚕️" },
  { id: "tiss", name: "TISS Integration", description: "Health insurance integration", icon: "🏥" },
  { id: "mobile", name: "Mobile App Access", description: "Mobile application access", icon: "📱" },
];

export default function AdminClinicsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<ClinicCreate>({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    max_users: 10,
    active_modules: [],
  });
  
  const [editForm, setEditForm] = useState<ClinicUpdate>({});
  const [licenseForm, setLicenseForm] = useState<ClinicLicenseUpdate>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clinicsData, statsData] = await Promise.all([
        adminApi.getClinics(),
        adminApi.getClinicStats(),
      ]);
      
      setClinics(clinicsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load clinics data:", error);
      toast.error("Falha ao carregar dados das clínicas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async () => {
    try {
      setSaving(true);
      const newClinic = await adminApi.createClinic(createForm);
      setClinics([newClinic, ...clinics]);
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: "",
        legal_name: "",
        tax_id: "",
        address: "",
        phone: "",
        email: "",
        is_active: true,
        max_users: 10,
        active_modules: [],
      });
      
      // Check if admin user was created
      if ((newClinic as any).admin_user) {
        const adminUser = (newClinic as any).admin_user;
        const recipientEmail = newClinic.email || adminUser.email;
        toast.success("Clínica cadastrada com sucesso!", {
          description: `Usuário AdminClinica criado automaticamente. As credenciais foram enviadas por e-mail para ${recipientEmail}.`,
          duration: 10000,
        });
      } else {
        toast.success("Clínica criada com sucesso");
      }
      
      await loadData();
    } catch (error: any) {
      console.error("Failed to create clinic:", error);
      toast.error(error.response?.data?.detail || "Falha ao criar clínica");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClinic = async () => {
    if (!selectedClinic) return;
    
    try {
      setSaving(true);
      const updatedClinic = await adminApi.updateClinic(selectedClinic.id, editForm);
      setClinics(clinics.map(c => c.id === selectedClinic.id ? updatedClinic : c));
      setIsEditDialogOpen(false);
      setSelectedClinic(null);
      setEditForm({});
      toast.success("Clínica atualizada com sucesso");
      await loadData();
    } catch (error: any) {
      console.error("Failed to update clinic:", error);
      toast.error(error.response?.data?.detail || "Falha ao atualizar clínica");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLicense = async () => {
    if (!selectedClinic) return;
    
    try {
      setSaving(true);
      const updatedClinic = await adminApi.updateClinicLicense(selectedClinic.id, licenseForm);
      setClinics(clinics.map(c => c.id === selectedClinic.id ? updatedClinic : c));
      setIsLicenseDialogOpen(false);
      setSelectedClinic(null);
      setLicenseForm({});
      toast.success("Licença atualizada com sucesso");
      await loadData();
    } catch (error: any) {
      console.error("Failed to update license:", error);
      toast.error(error.response?.data?.detail || "Falha ao atualizar licença");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClinic = (clinic: Clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteDialog(true);
  };

  const confirmDeleteClinic = async () => {
    if (!clinicToDelete) return;

    try {
      setDeleting(true);
      await adminApi.deleteClinic(clinicToDelete.id);
      toast.success("Clínica desativada com sucesso!");
      await loadData();
      setClinicToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete clinic:", error);
      toast.error(error.response?.data?.detail || "Falha ao desativar clínica");
    } finally {
      setDeleting(false);
    }
  };


  const openEditDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setEditForm({
      name: clinic.name,
      legal_name: clinic.legal_name,
      tax_id: clinic.tax_id,
      address: clinic.address || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      is_active: clinic.is_active,
      max_users: clinic.max_users,
      active_modules: clinic.active_modules,
    });
    setIsEditDialogOpen(true);
  };

  const openLicenseDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setLicenseForm({
      license_key: clinic.license_key || "",
      expiration_date: clinic.expiration_date || "",
      max_users: clinic.max_users,
      active_modules: clinic.active_modules,
    });
    setIsLicenseDialogOpen(true);
  };

  const toggleModule = (moduleId: string, form: any, setForm: any) => {
    const currentModules = form.active_modules || [];
    const newModules = currentModules.includes(moduleId)
      ? currentModules.filter((m: string) => m !== moduleId)
      : [...currentModules, moduleId];
    setForm({ ...form, active_modules: newModules });
  };

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = !searchTerm || 
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.tax_id.includes(searchTerm) ||
      (clinic.email && clinic.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && clinic.is_active) ||
      (statusFilter === "inactive" && !clinic.is_active);
    
    const matchesLicense = licenseFilter === "all" ||
      (licenseFilter === "expired" && clinic.expiration_date && new Date(clinic.expiration_date) < new Date()) ||
      (licenseFilter === "valid" && (!clinic.expiration_date || new Date(clinic.expiration_date) >= new Date()));
    
    return matchesSearch && matchesStatus && matchesLicense;
  });

  const getLicenseStatus = (clinic: Clinic) => {
    if (!clinic.expiration_date) return { status: "unlimited", color: "default", label: "Ilimitada" };
    
    const expirationDate = new Date(clinic.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return { status: "expired", color: "destructive", label: "Expirada" };
    if (daysUntilExpiration <= 30) return { status: "expiring", color: "destructive", label: "Expirando" };
    return { status: "valid", color: "default", label: "Válida" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
            Gestão de Clínicas
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Gerencie clínicas, licenças e acessos do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Clínica</DialogTitle>
              <DialogDescription>
                Adicione uma nova clínica ao sistema com configuração de licença e módulos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Clínica</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Digite o nome da clínica"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="legal_name">Razão Social</Label>
                  <Input
                    id="legal_name"
                    value={createForm.legal_name}
                    onChange={(e) => setCreateForm({ ...createForm, legal_name: e.target.value })}
                    placeholder="Digite a razão social"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax_id">CNPJ</Label>
                  <Input
                    id="tax_id"
                    value={createForm.tax_id}
                    onChange={(e) => setCreateForm({ ...createForm, tax_id: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="contato@clinica.com"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Digite o endereço completo"
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="max_users">Usuários Máximos</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={createForm.max_users}
                    onChange={(e) => setCreateForm({ ...createForm, max_users: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="1000"
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label>Módulos Ativos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-lg border-blue-200">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-${module.id}`}
                        checked={createForm.active_modules?.includes(module.id) || false}
                        onCheckedChange={() => toggleModule(module.id, createForm, setCreateForm)}
                      />
                      <Label htmlFor={`create-${module.id}`} className="text-sm cursor-pointer">
                        {module.icon} {module.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClinic} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Clínica"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clínicas
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_clinics}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.active_clinics} ativas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clínicas Ativas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_clinics}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_clinics - stats.active_clinics} inativas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Licenças Expiradas
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expired_licenses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requerem atenção
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Em todas as clínicas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expirando em 30 dias
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clinics_near_expiration}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requerem renovação
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar clínicas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger className="w-full md:w-48 border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Licença" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Licenças</SelectItem>
                <SelectItem value="valid">Válidas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clinics List */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Clínicas ({filteredClinics.length})
              </CardTitle>
              <CardDescription className="mt-1">
                Lista completa de clínicas cadastradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClinics.map((clinic) => {
              const licenseStatus = getLicenseStatus(clinic);
              return (
                <div 
                  key={clinic.id} 
                  className={cn(
                    "border-2 rounded-lg p-5 hover:shadow-md transition-all",
                    clinic.is_active 
                      ? "border-blue-200 bg-blue-50/30" 
                      : "border-gray-200 bg-gray-50/30"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg">{clinic.name}</h3>
                        <Badge 
                          variant={clinic.is_active ? "default" : "secondary"} 
                          className={cn(
                            clinic.is_active && "bg-green-100 text-green-800 border-green-200"
                          )}
                        >
                          {clinic.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge 
                          variant={licenseStatus.color as any}
                          className={cn(
                            licenseStatus.status === "valid" && "bg-blue-100 text-blue-800 border-blue-200",
                            licenseStatus.status === "expired" && "bg-red-100 text-red-800 border-red-200",
                            licenseStatus.status === "expiring" && "bg-orange-100 text-orange-800 border-orange-200"
                          )}
                        >
                          {licenseStatus.status === "expired" && <XCircle className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "expiring" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "valid" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "unlimited" && <Clock className="w-3 h-3 mr-1" />}
                          {licenseStatus.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{clinic.legal_name}</p>
                      <p className="text-sm text-muted-foreground">CNPJ: {clinic.tax_id}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">
                            Usuários: <span className="font-medium text-gray-900">{clinic.user_count || 0}/{clinic.max_users}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">
                            Módulos: <span className="font-medium text-gray-900">{clinic.active_modules.length}</span>
                          </span>
                        </div>
                        {clinic.expiration_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-muted-foreground">
                              Expira: <span className="font-medium text-gray-900">{new Date(clinic.expiration_date).toLocaleDateString('pt-BR')}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(clinic)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLicenseDialog(clinic)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Licença
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClinic(clinic)}
                        disabled={!clinic.is_active}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Desativar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredClinics.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma clínica encontrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
            <DialogDescription>
              Atualize as informações e configurações da clínica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome da Clínica</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-legal_name">Razão Social</Label>
                <Input
                  id="edit-legal_name"
                  value={editForm.legal_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tax_id">CNPJ</Label>
                <Input
                  id="edit-tax_id"
                  value={editForm.tax_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, tax_id: e.target.value })}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Endereço</Label>
              <Textarea
                id="edit-address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-max_users">Usuários Máximos</Label>
                <Input
                  id="edit-max_users"
                  type="number"
                  value={editForm.max_users || 10}
                  onChange={(e) => setEditForm({ ...editForm, max_users: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="1000"
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={editForm.is_active ?? true}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Clínica Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClinic} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Clínica"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atualizar Licença</DialogTitle>
            <DialogDescription>
              Atualize as informações de licenciamento e módulos ativos da clínica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license-key">Chave de Licença</Label>
                <Input
                  id="license-key"
                  value={licenseForm.license_key || ""}
                  onChange={(e) => setLicenseForm({ ...licenseForm, license_key: e.target.value })}
                  placeholder="Digite a chave de licença"
                  className="border-blue-200 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="expiration-date">Data de Expiração</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={licenseForm.expiration_date || ""}
                  onChange={(e) => setLicenseForm({ ...licenseForm, expiration_date: e.target.value })}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="license-max_users">Usuários Máximos</Label>
              <Input
                id="license-max_users"
                type="number"
                value={licenseForm.max_users || 10}
                onChange={(e) => setLicenseForm({ ...licenseForm, max_users: parseInt(e.target.value) || 10 })}
                min="1"
                max="1000"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Módulos Ativos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-lg border-blue-200">
                {AVAILABLE_MODULES.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`license-${module.id}`}
                      checked={licenseForm.active_modules?.includes(module.id) || false}
                      onCheckedChange={() => toggleModule(module.id, licenseForm, setLicenseForm)}
                    />
                    <Label htmlFor={`license-${module.id}`} className="text-sm cursor-pointer">
                      {module.icon} {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLicenseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateLicense} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Licença"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Desativar Clínica"
        description={clinicToDelete ? `Tem certeza que deseja desativar ${clinicToDelete.name}?` : ""}
        confirmText="Desativar"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteClinic}
      />
    </div>
  );
}
