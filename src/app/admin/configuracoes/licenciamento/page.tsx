"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Calendar, AlertCircle, CheckCircle2, Loader2, XCircle, Save, RefreshCw, Plus, Trash2, Edit, Shield, Package, Users, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LicenseInfo {
  has_license: boolean;
  license_type: string | null;
  status: string | null;
  expiration_date: string | null;
  max_users: number;
  license_key: string | null;
  start_date?: string;
  activation_key?: string;
  is_active?: boolean;
  days_until_expiry?: number;
  modules?: string[];
  license_id?: string;
}

interface Entitlement {
  module: string;
  enabled: boolean;
  limits: Record<string, any>;
}

interface LicenseFormData {
  plan: string;
  users_limit: number;
  units_limit: number | null;
  start_at: string;
  end_at: string;
  modules: string[];
  status: string;
}

// Map license types to display names
const LICENSE_TYPE_NAMES: Record<string, string> = {
  basic: "Básico",
  professional: "Profissional",
  enterprise: "Empresarial",
  custom: "Personalizado",
  Legacy: "Legado",
  Nenhuma: "Nenhuma",
};

// Map status to display names and colors
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  active: {
    label: "Ativa",
    color: "text-green-800",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expirada",
    color: "text-red-800",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  suspended: {
    label: "Suspensa",
    color: "text-yellow-800",
    bgColor: "bg-yellow-100",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-gray-800",
    bgColor: "bg-gray-100",
    icon: XCircle,
  },
  none: {
    label: "Sem Licença",
    color: "text-gray-800",
    bgColor: "bg-gray-100",
    icon: AlertCircle,
  },
};

const AVAILABLE_MODULES = [
  "patients", "appointments", "clinical", "financial", "stock",
  "procedures", "tiss", "bi", "telemed", "mobile", "api",
  "reports", "backup", "integration"
];

const LICENSE_PLANS = [
  { value: "basic", label: "Básico" },
  { value: "professional", label: "Profissional" },
  { value: "enterprise", label: "Empresarial" },
  { value: "custom", label: "Personalizado" },
];

const LICENSE_STATUSES = [
  { value: "active", label: "Ativa" },
  { value: "suspended", label: "Suspensa" },
  { value: "expired", label: "Expirada" },
  { value: "cancelled", label: "Cancelada" },
];

export default function LicenciamentoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [formData, setFormData] = useState<LicenseFormData>({
    plan: "basic",
    users_limit: 10,
    units_limit: null,
    start_at: new Date().toISOString().split('T')[0],
    end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: [],
    status: "suspended",
  });
  const [activationKey, setActivationKey] = useState("");

  // Check if user is SuperAdmin
  const isSuperAdmin = user?.role === 'admin' && (user?.role_id === 1 || user?.role_name === 'SuperAdmin');

  useEffect(() => {
    loadLicenseInfo();
    if (licenseInfo?.has_license) {
      loadEntitlements();
    }
  }, []);

  const loadLicenseInfo = async () => {
    try {
      setLoading(true);
      let data: LicenseInfo;
      try {
        data = await api.get<LicenseInfo>("/api/v1/licenses/me");
      } catch (e) {
        // Fallback to legacy endpoint
        data = await api.get<LicenseInfo>("/api/licenses/me");
      }
      setLicenseInfo(data);
    } catch (error: any) {
      console.error("Failed to load license information:", error);
      toast.error("Erro ao carregar informações da licença", {
        description: error?.message || error?.detail || "Não foi possível carregar as informações da licença",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEntitlements = async () => {
    try {
      const data = await api.get<Entitlement[]>("/api/v1/licenses/entitlements");
      setEntitlements(data);
    } catch (error: any) {
      console.error("Failed to load entitlements:", error);
      // Not critical, just log
    }
  };

  const handleCreateLicense = async () => {
    if (!user?.clinic_id) {
      toast.error("Clínica não encontrada");
      return;
    }

    setSaving(true);
    try {
      const licenseData = {
        tenant_id: user.clinic_id,
        plan: formData.plan,
        users_limit: formData.users_limit,
        units_limit: formData.units_limit,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: new Date(formData.end_at).toISOString(),
        modules: formData.modules,
      };

      await api.post("/api/v1/licenses", licenseData);
      toast.success("Licença criada com sucesso!");
      setShowCreateDialog(false);
      await loadLicenseInfo();
    } catch (error: any) {
      console.error("Failed to create license:", error);
      toast.error("Erro ao criar licença", {
        description: error?.message || error?.detail || "Não foi possível criar a licença",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLicense = async () => {
    if (!licenseInfo?.license_id) {
      toast.error("Licença não encontrada ou licença legada (não pode ser editada)");
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(licenseInfo.license_id)) {
      toast.error("ID da licença inválido. Esta é uma licença legada e não pode ser editada através desta interface.");
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {};
      if (formData.plan) updateData.plan = formData.plan;
      if (formData.users_limit) updateData.users_limit = formData.users_limit;
      if (formData.units_limit !== null) updateData.units_limit = formData.units_limit;
      if (formData.end_at) updateData.end_at = new Date(formData.end_at).toISOString();
      if (formData.modules.length > 0) updateData.modules = formData.modules;
      if (formData.status) updateData.status = formData.status;

      await api.put(`/api/v1/licenses/${licenseInfo.license_id}`, updateData);
      toast.success("Licença atualizada com sucesso!");
      setShowEditDialog(false);
      await loadLicenseInfo();
    } catch (error: any) {
      console.error("Failed to update license:", error);
      toast.error("Erro ao atualizar licença", {
        description: error?.message || error?.detail || "Não foi possível atualizar a licença",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!activationKey.trim()) {
      toast.error("Chave de ativação é obrigatória");
      return;
    }

    setSaving(true);
    try {
      const activationData = {
        activation_key: activationKey,
        instance_id: `clinic-${user?.clinic_id || 'unknown'}`,
        device_info: {
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await api.post("/api/v1/licenses/activate", activationData);
      toast.success("Licença ativada com sucesso!");
      setShowActivateDialog(false);
      setActivationKey("");
      await loadLicenseInfo();
      await loadEntitlements();
    } catch (error: any) {
      console.error("Failed to activate license:", error);
      toast.error("Erro ao ativar licença", {
        description: error?.message || error?.detail || "Não foi possível ativar a licença",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLicense = async () => {
    if (!licenseInfo?.license_id) {
      toast.error("Licença não encontrada ou licença legada (não pode ser cancelada)");
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(licenseInfo.license_id)) {
      toast.error("ID da licença inválido. Esta é uma licença legada e não pode ser cancelada através desta interface.");
      return;
    }

    if (!confirm("Tem certeza que deseja cancelar esta licença? Esta ação não pode ser desfeita.")) {
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/api/v1/licenses/${licenseInfo.license_id}`);
      toast.success("Licença cancelada com sucesso!");
      await loadLicenseInfo();
    } catch (error: any) {
      console.error("Failed to delete license:", error);
      toast.error("Erro ao cancelar licença", {
        description: error?.message || error?.detail || "Não foi possível cancelar a licença",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = () => {
    if (licenseInfo) {
      setFormData({
        plan: licenseInfo.license_type || "basic",
        users_limit: licenseInfo.max_users || 10,
        units_limit: null,
        start_at: licenseInfo.start_date ? new Date(licenseInfo.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        end_at: licenseInfo.expiration_date ? new Date(licenseInfo.expiration_date).toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        modules: licenseInfo.modules || [],
        status: licenseInfo.status || "suspended",
      });
      setShowEditDialog(true);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatLicenseKey = (key: string | null) => {
    if (!key) return "N/A";
    // Format UUID or license key for display
    if (key.length > 20) {
      return `${key.substring(0, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}-${key.substring(16, 20)}-${key.substring(20, 32)}`;
    }
    return key;
  };

  const toggleModule = (module: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!licenseInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="h-8 w-8 text-blue-600" />
            Licenciamento
          </h1>
          <p className="text-gray-600 mt-2">
            Informações sobre a licença da clínica
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Não foi possível carregar as informações da licença
            <Button onClick={loadLicenseInfo} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = licenseInfo.status || "none";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.none;
  const StatusIcon = statusConfig.icon;
  const licenseTypeName = LICENSE_TYPE_NAMES[licenseInfo.license_type || ""] || licenseInfo.license_type || "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="h-8 w-8 text-blue-600" />
            Licenciamento
          </h1>
          <p className="text-gray-600 mt-2">
            Informações sobre a licença da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLicenseInfo}
            disabled={loading || saving}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {isSuperAdmin && (
            <>
              {!licenseInfo.has_license ? (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Licença
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Licença</DialogTitle>
                      <DialogDescription>
                        Crie uma nova licença para esta clínica
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="plan">Plano *</Label>
                        <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LICENSE_PLANS.map(plan => (
                              <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="users_limit">Limite de Usuários *</Label>
                          <Input
                            id="users_limit"
                            type="number"
                            min="1"
                            max="10000"
                            value={formData.users_limit}
                            onChange={(e) => setFormData(prev => ({ ...prev, users_limit: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="units_limit">Limite de Unidades</Label>
                          <Input
                            id="units_limit"
                            type="number"
                            min="1"
                            value={formData.units_limit || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, units_limit: e.target.value ? parseInt(e.target.value) : null }))}
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_at">Data de Início *</Label>
                          <Input
                            id="start_at"
                            type="date"
                            value={formData.start_at}
                            onChange={(e) => setFormData(prev => ({ ...prev, start_at: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_at">Data de Expiração *</Label>
                          <Input
                            id="end_at"
                            type="date"
                            value={formData.end_at}
                            onChange={(e) => setFormData(prev => ({ ...prev, end_at: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Módulos Incluídos</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                          {AVAILABLE_MODULES.map(module => (
                            <div key={module} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`create-module-${module}`}
                                checked={formData.modules.includes(module)}
                                onChange={() => toggleModule(module)}
                                className="rounded"
                                aria-label={`Incluir módulo ${module}`}
                              />
                              <Label htmlFor={`create-module-${module}`} className="text-sm cursor-pointer">
                                {module}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateLicense} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Criar Licença
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <>
                  {licenseInfo.status === "suspended" && licenseInfo.license_id && (
                    <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Zap className="h-4 w-4 mr-2" />
                          Ativar Licença
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ativar Licença</DialogTitle>
                          <DialogDescription>
                            Digite a chave de ativação para ativar a licença
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="activation_key">Chave de Ativação *</Label>
                            <Input
                              id="activation_key"
                              value={activationKey}
                              onChange={(e) => setActivationKey(e.target.value)}
                              placeholder="Digite a chave de ativação"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleActivateLicense} disabled={saving || !activationKey.trim()}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                            Ativar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {licenseInfo.license_id && (
                    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={openEditDialog}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Licença</DialogTitle>
                        <DialogDescription>
                          Atualize as informações da licença
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="edit_plan">Plano</Label>
                          <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LICENSE_PLANS.map(plan => (
                                <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit_users_limit">Limite de Usuários</Label>
                            <Input
                              id="edit_users_limit"
                              type="number"
                              min="1"
                              max="10000"
                              value={formData.users_limit}
                              onChange={(e) => setFormData(prev => ({ ...prev, users_limit: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_status">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LICENSE_STATUSES.map(status => (
                                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit_end_at">Data de Expiração</Label>
                          <Input
                            id="edit_end_at"
                            type="date"
                            value={formData.end_at}
                            onChange={(e) => setFormData(prev => ({ ...prev, end_at: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Módulos Incluídos</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                            {AVAILABLE_MODULES.map(module => (
                              <div key={module} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`edit-module-${module}`}
                                  checked={formData.modules.includes(module)}
                                  onChange={() => toggleModule(module)}
                                  className="rounded"
                                  aria-label={`Incluir módulo ${module}`}
                                />
                                <Label htmlFor={`edit-module-${module}`} className="text-sm cursor-pointer">
                                  {module}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleUpdateLicense} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Salvar Alterações
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}
                  {licenseInfo.license_id && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteLicense}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancelar Licença
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status da Licença</CardTitle>
          <CardDescription>
            Detalhes da licença atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-lg border ${
            status === "active" ? "bg-green-50 border-green-200" :
            status === "expired" ? "bg-red-50 border-red-200" :
            status === "suspended" ? "bg-yellow-50 border-yellow-200" :
            "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              <div>
                <div className={`font-semibold ${statusConfig.color}`}>
                  Licença {statusConfig.label}
                </div>
                <div className={`text-sm ${statusConfig.color} opacity-80`}>
                  {status === "active" && licenseInfo.days_until_expiry !== undefined
                    ? `${licenseInfo.days_until_expiry} dias restantes`
                    : status === "expired"
                    ? "A licença expirou"
                    : status === "suspended"
                    ? "A licença está suspensa e precisa ser ativada"
                    : status === "none"
                    ? "Nenhuma licença configurada"
                    : "Status da licença"}
                </div>
              </div>
            </div>
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Tipo de Licença
              </div>
              <div className="text-lg font-semibold">{licenseTypeName}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Expiração
              </div>
              <div className="text-lg font-semibold">{formatDate(licenseInfo.expiration_date)}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários Máximos
              </div>
              <div className="text-lg font-semibold">{licenseInfo.max_users} usuários</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Chave de Licença
              </div>
              <div className="text-sm font-mono text-gray-500 break-all">
                {formatLicenseKey(licenseInfo.license_key || licenseInfo.activation_key || null)}
              </div>
            </div>
            {licenseInfo.start_date && (
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Data de Início
                </div>
                <div className="text-lg font-semibold">{formatDate(licenseInfo.start_date)}</div>
              </div>
            )}
            {licenseInfo.activation_key && (
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Chave de Ativação</div>
                <div className="text-sm font-mono text-gray-500 break-all">
                  {formatLicenseKey(licenseInfo.activation_key)}
                </div>
              </div>
            )}
          </div>

          {licenseInfo.modules && licenseInfo.modules.length > 0 && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Módulos Incluídos
              </div>
              <div className="flex flex-wrap gap-2">
                {licenseInfo.modules.map((module) => (
                  <Badge key={module} variant="secondary">
                    {module}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {entitlements.length > 0 && (
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Entitlements (Permissões Detalhadas)
              </div>
              <div className="space-y-2">
                {entitlements.map((ent, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={ent.enabled ? "default" : "secondary"}>
                        {ent.module}
                      </Badge>
                      {ent.enabled && (
                        <span className="text-xs text-gray-500">
                          {Object.keys(ent.limits || {}).length > 0 && `Limites: ${JSON.stringify(ent.limits)}`}
                        </span>
                      )}
                    </div>
                    <Badge variant={ent.enabled ? "default" : "outline"}>
                      {ent.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
