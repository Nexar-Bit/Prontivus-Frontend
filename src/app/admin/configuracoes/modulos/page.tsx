"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle2, XCircle, Loader2, Save, RefreshCw, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
  dependencies?: string[];
  dependents?: string[];
}

// Map module IDs to display names
const MODULE_DISPLAY_NAMES: Record<string, { name: string; description: string }> = {
  patients: {
    name: "Gestão de Pacientes",
    description: "Cadastro e gerenciamento de pacientes",
  },
  appointments: {
    name: "Agendamentos",
    description: "Sistema de agendamento de consultas",
  },
  clinical: {
    name: "Prontuário Clínico",
    description: "Registros clínicos e prontuários eletrônicos",
  },
  financial: {
    name: "Gestão Financeira",
    description: "Faturamento, pagamentos e controle financeiro",
  },
  tiss: {
    name: "Integração TISS",
    description: "Integração com padrão TISS para operadoras",
  },
  stock: {
    name: "Gestão de Estoque",
    description: "Controle de estoque e inventário",
  },
  procedures: {
    name: "Gestão de Procedimentos",
    description: "Cadastro e gerenciamento de procedimentos",
  },
  bi: {
    name: "Business Intelligence",
    description: "Relatórios e análises avançadas",
  },
  telemed: {
    name: "Telemedicina",
    description: "Consultas e atendimentos remotos",
  },
  mobile: {
    name: "Aplicativo Mobile",
    description: "Acesso via aplicativo móvel",
  },
};

// Module dependencies (from backend)
const MODULE_DEPENDENCIES: Record<string, string[]> = {
  bi: ["financial", "clinical", "appointments"],
  telemed: ["appointments", "clinical"],
  stock: ["financial"],
  financial: ["appointments"],
  clinical: ["appointments"],
  procedures: ["financial", "stock"],
  tiss: ["financial", "clinical"],
  mobile: ["appointments", "clinical", "patients"],
};

// Required modules that cannot be disabled
const REQUIRED_MODULES = ["patients", "appointments", "clinical"];

export default function ModulosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [originalActiveModules, setOriginalActiveModules] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dependencyWarnings, setDependencyWarnings] = useState<string[]>([]);

  // Check if user is SuperAdmin
  const isSuperAdmin = user?.role === 'admin' && (user?.role_id === 1 || user?.role_name === 'SuperAdmin');

  // Redirect AdminClínica users - this page is only for SuperAdmin
  useEffect(() => {
    if (user && !isSuperAdmin) {
      toast.error("Acesso negado. Apenas Super Administradores podem acessar esta página.");
      router.push("/admin/configuracoes/clinica");
    }
  }, [user, isSuperAdmin, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadData();
  }, [isSuperAdmin]);

  useEffect(() => {
    // Check for changes whenever modules state changes
    const currentEnabled = modules.filter((m) => m.enabled).map((m) => m.id);
    const changed = JSON.stringify(currentEnabled.sort()) !== JSON.stringify(originalActiveModules.sort());
    setHasChanges(changed);
    
    // Check for dependency warnings
    checkDependencyWarnings(currentEnabled);
  }, [modules, originalActiveModules]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load available modules and current clinic's active modules in parallel
      const [available, clinic] = await Promise.all([
        api.get<string[]>("/api/v1/admin/modules").catch(() => 
          api.get<string[]>("/api/admin/modules")
        ),
        api.get<{ active_modules?: string[] }>("/api/v1/admin/clinics/me").catch(() => 
          api.get<{ active_modules?: string[] }>("/api/admin/clinics/me")
        ),
      ]);

      setAvailableModules(available);
      const active = clinic.active_modules || [];
      setActiveModules(active);
      setOriginalActiveModules([...active]);

      // Build modules list with dependency information
      const modulesList: Module[] = available.map((moduleId) => {
        const dependencies = MODULE_DEPENDENCIES[moduleId] || [];
        // Find modules that depend on this one
        const dependents = Object.entries(MODULE_DEPENDENCIES)
          .filter(([_, deps]) => deps.includes(moduleId))
          .map(([mod]) => mod);

        return {
          id: moduleId,
          name: MODULE_DISPLAY_NAMES[moduleId]?.name || moduleId,
          description: MODULE_DISPLAY_NAMES[moduleId]?.description || "",
          enabled: active.includes(moduleId),
          required: REQUIRED_MODULES.includes(moduleId),
          dependencies,
          dependents,
        };
      });

      setModules(modulesList);
    } catch (error: any) {
      console.error("Failed to load modules:", error);
      toast.error("Erro ao carregar módulos", {
        description: error?.message || error?.detail || "Não foi possível carregar os módulos",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDependencyWarnings = (enabledModules: string[]) => {
    const warnings: string[] = [];
    
    enabledModules.forEach(moduleId => {
      const deps = MODULE_DEPENDENCIES[moduleId] || [];
      const missingDeps = deps.filter(dep => !enabledModules.includes(dep));
      
      if (missingDeps.length > 0) {
        const depNames = missingDeps.map(dep => MODULE_DISPLAY_NAMES[dep]?.name || dep).join(", ");
        warnings.push(`${MODULE_DISPLAY_NAMES[moduleId]?.name || moduleId} requer: ${depNames}`);
      }
    });
    
    setDependencyWarnings(warnings);
  };

  const toggleModule = (moduleId: string, checked: boolean) => {
    setModules((prev) => {
      const updated = prev.map((module) => {
        if (module.id === moduleId) {
          return { ...module, enabled: checked };
        }
        return module;
      });

      // If enabling, automatically enable dependencies
      if (checked) {
        const module = updated.find(m => m.id === moduleId);
        if (module?.dependencies) {
          module.dependencies.forEach(depId => {
            const depModule = updated.find(m => m.id === depId);
            if (depModule && !depModule.enabled && !depModule.required) {
              const depIndex = updated.findIndex(m => m.id === depId);
              if (depIndex !== -1) {
                updated[depIndex] = { ...updated[depIndex], enabled: true };
              }
            }
          });
        }
      } else {
        // If disabling, automatically disable dependents
        const module = updated.find(m => m.id === moduleId);
        if (module?.dependents) {
          module.dependents.forEach(depId => {
            const depModule = updated.find(m => m.id === depId);
            if (depModule && depModule.enabled) {
              const depIndex = updated.findIndex(m => m.id === depId);
              if (depIndex !== -1) {
                updated[depIndex] = { ...updated[depIndex], enabled: false };
              }
            }
          });
        }
      }

      return updated;
    });
  };

  const validateModules = (enabledModules: string[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check if required modules are enabled
    const missingRequired = REQUIRED_MODULES.filter(req => !enabledModules.includes(req));
    if (missingRequired.length > 0) {
      errors.push(`Módulos obrigatórios não podem ser desativados: ${missingRequired.map(m => MODULE_DISPLAY_NAMES[m]?.name || m).join(", ")}`);
    }
    
    // Check dependencies
    enabledModules.forEach(moduleId => {
      const deps = MODULE_DEPENDENCIES[moduleId] || [];
      const missingDeps = deps.filter(dep => !enabledModules.includes(dep));
      
      if (missingDeps.length > 0) {
        const depNames = missingDeps.map(dep => MODULE_DISPLAY_NAMES[dep]?.name || dep).join(", ");
        errors.push(`${MODULE_DISPLAY_NAMES[moduleId]?.name || moduleId} requer os seguintes módulos: ${depNames}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get enabled modules
      const enabledModules = modules
        .filter((m) => m.enabled)
        .map((m) => m.id);

      // Validate before saving
      const validation = validateModules(enabledModules);
      if (!validation.valid) {
        toast.error("Erro de validação", {
          description: validation.errors.join("; "),
        });
        return;
      }

      // Try both API versions
      try {
        await api.patch("/api/v1/admin/clinics/me/modules", {
          active_modules: enabledModules,
        });
      } catch (e) {
        // Fallback to legacy endpoint
        await api.patch("/api/admin/clinics/me/modules", {
          active_modules: enabledModules,
        });
      }

      setActiveModules(enabledModules);
      setOriginalActiveModules([...enabledModules]);
      setHasChanges(false);
      setDependencyWarnings([]);
      
      toast.success("Módulos atualizados com sucesso", {
        description: "As configurações dos módulos foram salvas",
      });
    } catch (error: any) {
      console.error("Failed to save modules:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || error?.detail || "Não foi possível salvar as configurações";
      toast.error("Erro ao salvar módulos", {
        description: errorMessage,
      });
      // Reload to restore previous state
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state
    setModules((prev) =>
      prev.map((module) => ({
        ...module,
        enabled: originalActiveModules.includes(module.id),
      }))
    );
    setHasChanges(false);
    setDependencyWarnings([]);
    toast.info("Alterações canceladas");
  };

  const getModuleStatus = (module: Module) => {
    if (module.enabled) {
      return { text: "Ativo", color: "text-green-600", icon: CheckCircle2 };
    }
    return { text: "Inativo", color: "text-gray-500", icon: XCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Gestão de Módulos
          </h1>
          <p className="text-gray-600 mt-2">
            Ative ou desative módulos do sistema para sua clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading || saving}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {hasChanges && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {dependencyWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso de Dependências</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {dependencyWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              As dependências serão automaticamente adicionadas ao salvar.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Alterações não salvas</AlertTitle>
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicar as mudanças.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const status = getModuleStatus(module);
          const StatusIcon = status.icon;
          
          return (
            <Card
              key={module.id}
              className={`transition-all ${
                module.enabled 
                  ? "border-blue-200 bg-blue-50/30 shadow-sm" 
                  : "border-gray-200"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      {module.name}
                      {module.required && (
                        <Badge variant="secondary" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                      {module.enabled && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Ativo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={module.id} className="flex items-center gap-2 cursor-pointer">
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    <span className={status.color}>
                      {status.text}
                    </span>
                  </Label>
                  <Switch
                    id={module.id}
                    checked={module.enabled}
                    onCheckedChange={(checked) => toggleModule(module.id, checked)}
                    disabled={module.required || saving}
                  />
                </div>

                {module.dependencies && module.dependencies.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Requer:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {module.dependencies.map((depId) => {
                        const depModule = modules.find(m => m.id === depId);
                        const isEnabled = depModule?.enabled || false;
                        return (
                          <Badge
                            key={depId}
                            variant={isEnabled ? "default" : "outline"}
                            className="text-xs"
                          >
                            {MODULE_DISPLAY_NAMES[depId]?.name || depId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {module.dependents && module.dependents.length > 0 && module.enabled && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Necessário para:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {module.dependents.map((depId) => {
                        const depModule = modules.find(m => m.id === depId);
                        const isEnabled = depModule?.enabled || false;
                        return (
                          <Badge
                            key={depId}
                            variant={isEnabled ? "default" : "outline"}
                            className="text-xs"
                          >
                            {MODULE_DISPLAY_NAMES[depId]?.name || depId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhum módulo disponível</p>
        </div>
      )}

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              • Módulos obrigatórios não podem ser desativados
            </p>
            <p>
              • Ao ativar um módulo, suas dependências serão automaticamente ativadas
            </p>
            <p>
              • Ao desativar um módulo, os módulos que dependem dele serão automaticamente desativados
            </p>
            <p>
              • As alterações só serão aplicadas após clicar em "Salvar Alterações"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
