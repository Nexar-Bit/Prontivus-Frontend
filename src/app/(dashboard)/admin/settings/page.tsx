"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Settings,
  Save,
  RefreshCw,
  Lock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Key,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Activity,
  AlertCircle
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

interface SystemSettings {
  clinicName: string;
  clinicEmail: string;
  clinicPhone: string;
  clinicAddress: string;
  licenseKey: string;
  maxUsers: number;
  activeModules: string[];
}

const AVAILABLE_MODULES = [
  { 
    id: "patients", 
    name: "Gestão de Pacientes", 
    description: "Cadastro e gestão de pacientes",
    icon: "👥",
    category: "core"
  },
  { 
    id: "appointments", 
    name: "Agendamentos", 
    description: "Sistema de agendamento e consultas",
    icon: "📅",
    category: "core"
  },
  { 
    id: "clinical", 
    name: "Prontuários Clínicos", 
    description: "Registros médicos e anotações SOAP",
    icon: "📋",
    category: "clinical"
  },
  { 
    id: "financial", 
    name: "Gestão Financeira", 
    description: "Faturamento e cobrança",
    icon: "💰",
    category: "financial"
  },
  { 
    id: "stock", 
    name: "Gestão de Estoque", 
    description: "Controle de inventário",
    icon: "📦",
    category: "operational"
  },
  { 
    id: "bi", 
    name: "Business Intelligence", 
    description: "Analytics e relatórios",
    icon: "📊",
    category: "analytics"
  },
  { 
    id: "procedures", 
    name: "Gestão de Procedimentos", 
    description: "Procedimentos médicos",
    icon: "⚕️",
    category: "clinical"
  },
  { 
    id: "tiss", 
    name: "Integração TISS", 
    description: "Integração com planos de saúde",
    icon: "🏥",
    category: "integration"
  },
  { 
    id: "mobile", 
    name: "Acesso Mobile", 
    description: "Acesso via aplicativo móvel",
    icon: "📱",
    category: "access"
  },
  { 
    id: "telemed", 
    name: "Telemedicina", 
    description: "Consultas remotas",
    icon: "💻",
    category: "clinical"
  },
];

const MODULE_CATEGORIES = {
  core: "Núcleo",
  clinical: "Clínico",
  financial: "Financeiro",
  operational: "Operacional",
  analytics: "Analytics",
  integration: "Integração",
  access: "Acesso"
};

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings>({
    clinicName: "",
    clinicEmail: "",
    clinicPhone: "",
    clinicAddress: "",
    licenseKey: "",
    maxUsers: 10,
    activeModules: ["patients", "appointments", "clinical", "financial"],
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    // Check if user is SuperAdmin (role_id === 1 or role_name === 'SuperAdmin')
    const isSuperAdmin = user?.role_id === 1 || user?.role_name?.toLowerCase() === 'superadmin';
    if (isSuperAdmin) {
      // SuperAdmins should use /super-admin/configuracoes/clinica instead
      router.push("/super-admin/configuracoes/clinica");
      return;
    }
    
    if (isAuthenticated && user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const clinicId = user?.clinic_id;
      if (!clinicId) throw new Error("Missing clinic id");
      const clinic = await adminApi.getClinic(clinicId);
      setSettings(prev => ({
        ...prev,
        clinicName: clinic.name || "",
        clinicEmail: clinic.email || "",
        clinicPhone: clinic.phone || "",
        clinicAddress: clinic.address || "",
        licenseKey: clinic.license_key || "",
        maxUsers: clinic.max_users || 10,
        activeModules: clinic.active_modules || [],
      }));
      setHasChanges(false);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Falha ao carregar configurações");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const clinicId = user?.clinic_id;
      if (!clinicId) throw new Error("Missing clinic id");
      await adminApi.updateClinic(clinicId, {
        name: settings.clinicName,
        email: settings.clinicEmail,
        phone: settings.clinicPhone,
        address: settings.clinicAddress,
        license_key: settings.licenseKey,
        max_users: settings.maxUsers,
        active_modules: settings.activeModules,
      });
      setHasChanges(false);
      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Falha ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleModule = (moduleId: string) => {
    const currentModules = settings.activeModules;
    const newModules = currentModules.includes(moduleId)
      ? currentModules.filter(m => m !== moduleId)
      : [...currentModules, moduleId];
    handleSettingChange("activeModules", newModules);
  };

  // Group modules by category
  const modulesByCategory = AVAILABLE_MODULES.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_MODULES>);

  // Calculate statistics
  const stats = {
    totalModules: AVAILABLE_MODULES.length,
    activeModules: settings.activeModules.length,
    inactiveModules: AVAILABLE_MODULES.length - settings.activeModules.length,
    utilizationRate: Math.round((settings.activeModules.length / AVAILABLE_MODULES.length) * 100),
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
              <Settings className="h-7 w-7 text-blue-600" />
            </div>
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Gerencie as configurações gerais da clínica e módulos ativos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={loading}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
            <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Módulos Ativos
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeModules}</div>
            <p className="text-xs text-gray-600 mt-1">
              de {stats.totalModules} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Utilização
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.utilizationRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              módulos em uso
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Usuários Máximos
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{settings.maxUsers}</div>
            <p className="text-xs text-gray-600 mt-1">
              limite de usuários
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Módulos Inativos
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <XCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.inactiveModules}</div>
            <p className="text-xs text-gray-600 mt-1">
              disponíveis para ativação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Organization */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 h-auto p-1.5 bg-gray-100/80 rounded-lg border border-gray-200">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center gap-2 rounded-md transition-all"
          >
            <Building2 className="h-4 w-4" />
            <span>Informações Gerais</span>
          </TabsTrigger>
          <TabsTrigger 
            value="license" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center gap-2 rounded-md transition-all"
          >
            <Shield className="h-4 w-4" />
            <span>Licença e Módulos</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      Informações da Clínica
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      Configure as informações básicas da clínica
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                  <Building2 className="h-3 w-3 mr-1" />
                  Geral
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Nome da Clínica
                  </Label>
              <Input
                id="clinicName"
                value={settings.clinicName}
                onChange={(e) => handleSettingChange("clinicName", e.target.value)}
                    placeholder="Digite o nome da clínica"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    E-mail
                  </Label>
              <Input
                id="clinicEmail"
                type="email"
                value={settings.clinicEmail}
                onChange={(e) => handleSettingChange("clinicEmail", e.target.value)}
                    placeholder="contato@clinica.com"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Telefone
                  </Label>
              <Input
                id="clinicPhone"
                value={settings.clinicPhone}
                onChange={(e) => handleSettingChange("clinicPhone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsers" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Limite de Usuários
                  </Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={settings.maxUsers}
                    onChange={(e) => handleSettingChange("maxUsers", parseInt(e.target.value) || 1)}
                    min="1"
                    max="1000"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Número máximo de usuários permitidos no sistema
                  </p>
                </div>
          </div>
              <div className="space-y-2">
                <Label htmlFor="clinicAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Endereço
                </Label>
            <Textarea
              id="clinicAddress"
              value={settings.clinicAddress}
              onChange={(e) => handleSettingChange("clinicAddress", e.target.value)}
                  placeholder="Digite o endereço completo da clínica"
              rows={3}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* License and Modules Tab */}
        <TabsContent value="license" className="space-y-6">
          {/* License Settings */}
          <Card className="border-l-4 border-l-blue-700 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm">
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      Configurações de Licença
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      Gerencie informações de licenciamento do sistema
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                  <Key className="h-3 w-3 mr-1" />
                  Licença
                </Badge>
              </div>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="licenseKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    Chave de Licença
                  </Label>
              <Input
                id="licenseKey"
                value={settings.licenseKey}
                onChange={(e) => handleSettingChange("licenseKey", e.target.value)}
                    placeholder="Digite a chave de licença"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 font-mono"
              />
                  <p className="text-xs text-muted-foreground">
                    Chave única de licenciamento do sistema
                  </p>
            </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsersLicense" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Limite de Usuários (Licença)
                  </Label>
              <Input
                    id="maxUsersLicense"
                type="number"
                value={settings.maxUsers}
                    onChange={(e) => handleSettingChange("maxUsers", parseInt(e.target.value) || 1)}
                min="1"
                max="1000"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Definido pela licença
                  </p>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Active Modules */}
          <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                    Módulos do Sistema
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Ative ou desative módulos do sistema conforme necessário
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Package className="h-3 w-3 mr-1" />
                  {stats.activeModules} Ativos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(modulesByCategory).map(([category, modules]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {MODULE_CATEGORIES[category as keyof typeof MODULE_CATEGORIES] || category}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => {
                      const isActive = settings.activeModules.includes(module.id);
                      return (
                        <div
                          key={module.id}
                          className={cn(
                            "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                            isActive
                              ? "border-blue-500 bg-blue-50/50 hover:bg-blue-50 hover:shadow-md"
                              : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                          )}
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "text-2xl p-2 rounded-lg",
                                isActive ? "bg-blue-100" : "bg-gray-100"
                              )}>
                                {module.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900">
                                  {module.name}
                                </h4>
                              </div>
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => toggleModule(module.id)}
                              className="ml-2"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {module.description}
                          </p>
                          {isActive && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
