"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, RefreshCw, Building, CheckCircle2, XCircle, Search, 
  AlertTriangle, Loader2, Save, Info, ArrowRight
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  active_modules: string[];
  is_active: boolean;
  user_count?: number;
  max_users?: number;
}

interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
  dependencies: string[];
  dependents: string[];
}

const MODULE_DEFINITIONS: Record<string, { name: string; description: string; required: boolean }> = {
  patients: {
    name: "Gestão de Pacientes",
    description: "Cadastro e gerenciamento de pacientes",
    required: true,
  },
  appointments: {
    name: "Agendamentos",
    description: "Sistema de agendamento de consultas",
    required: true,
  },
  clinical: {
    name: "Prontuário Clínico",
    description: "Registros clínicos e prontuários eletrônicos",
    required: true,
  },
  financial: {
    name: "Gestão Financeira",
    description: "Faturamento, pagamentos e controle financeiro",
    required: false,
  },
  stock: {
    name: "Gestão de Estoque",
    description: "Controle de estoque e inventário",
    required: false,
  },
  procedures: {
    name: "Gestão de Procedimentos",
    description: "Cadastro e gerenciamento de procedimentos",
    required: false,
  },
  tiss: {
    name: "Integração TISS",
    description: "Integração com padrão TISS para operadoras",
    required: false,
  },
  bi: {
    name: "Business Intelligence",
    description: "Relatórios e análises avançadas",
    required: false,
  },
  telemed: {
    name: "Telemedicina",
    description: "Consultas e atendimentos remotos",
    required: false,
  },
  mobile: {
    name: "Aplicativo Mobile",
    description: "Acesso mobile para pacientes",
    required: false,
  },
};

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

export default function ModulosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadClinicModules();
    } else {
      setModules([]);
      setPendingChanges({});
      setHasChanges(false);
    }
  }, [selectedClinicId]);

  useEffect(() => {
    filterModules();
  }, [modules, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClinics(),
        loadAvailableModules(),
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
      if (data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data[0].id.toString());
      }
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      toast.error("Erro ao carregar clínicas", {
        description: error?.message || error?.detail || "Não foi possível carregar as clínicas",
      });
      setClinics([]);
    }
  };

  const loadAvailableModules = async () => {
    try {
      const data = await api.get<string[]>("/api/v1/admin/modules");
      setAvailableModules(data);
    } catch (error: any) {
      console.error("Failed to load available modules:", error);
      setAvailableModules(Object.keys(MODULE_DEFINITIONS));
    }
  };

  const loadClinicModules = async () => {
    if (!selectedClinicId) return;

    try {
      const clinic = clinics.find(c => c.id.toString() === selectedClinicId);
      if (!clinic) {
        const fullClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${selectedClinicId}`);
        const activeModules = fullClinic.active_modules || [];
        
        const modulesList: Module[] = availableModules.map(moduleId => {
          const definition = MODULE_DEFINITIONS[moduleId] || {
            name: moduleId,
            description: `Módulo ${moduleId}`,
            required: false,
          };
          
          const dependencies = MODULE_DEPENDENCIES[moduleId] || [];
          const dependents = Object.keys(MODULE_DEPENDENCIES).filter(
            key => MODULE_DEPENDENCIES[key].includes(moduleId)
          );
          
          return {
            id: moduleId,
            name: definition.name,
            description: definition.description,
            enabled: activeModules.includes(moduleId),
            required: definition.required,
            dependencies,
            dependents,
          };
        });

        setModules(modulesList);
        setPendingChanges({});
        setHasChanges(false);
      } else {
        const activeModules = clinic.active_modules || [];
        
        const modulesList: Module[] = availableModules.map(moduleId => {
          const definition = MODULE_DEFINITIONS[moduleId] || {
            name: moduleId,
            description: `Módulo ${moduleId}`,
            required: false,
          };
          
          const dependencies = MODULE_DEPENDENCIES[moduleId] || [];
          const dependents = Object.keys(MODULE_DEPENDENCIES).filter(
            key => MODULE_DEPENDENCIES[key].includes(moduleId)
          );
          
          return {
            id: moduleId,
            name: definition.name,
            description: definition.description,
            enabled: activeModules.includes(moduleId),
            required: definition.required,
            dependencies,
            dependents,
          };
        });

        setModules(modulesList);
        setPendingChanges({});
        setHasChanges(false);
      }
    } catch (error: any) {
      console.error("Failed to load clinic modules:", error);
      toast.error("Erro ao carregar módulos da clínica", {
        description: error?.message || error?.detail || "Não foi possível carregar os módulos",
      });
      setModules([]);
    }
  };

  const filterModules = () => {
    // Filtering is handled in the render
  };

  const toggleModule = (moduleId: string) => {
    if (!selectedClinicId) {
      toast.error("Selecione uma clínica primeiro");
      return;
    }

    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    if (module.required) {
      toast.error("Este módulo é obrigatório e não pode ser desativado");
      return;
    }

    const newEnabled = !module.enabled;
    
    // Check dependencies
    if (newEnabled && module.dependencies.length > 0) {
      const missingDeps = module.dependencies.filter(
        dep => !modules.find(m => m.id === dep)?.enabled
      );
      if (missingDeps.length > 0) {
        const depNames = missingDeps.map(dep => MODULE_DEFINITIONS[dep]?.name || dep).join(", ");
        toast.error(`Este módulo requer: ${depNames}`, {
          description: "Ative os módulos dependentes primeiro",
        });
        return;
      }
    }

    // Check dependents
    if (!newEnabled && module.dependents.length > 0) {
      const activeDependents = module.dependents.filter(
        dep => modules.find(m => m.id === dep)?.enabled
      );
      if (activeDependents.length > 0) {
        const depNames = activeDependents.map(dep => MODULE_DEFINITIONS[dep]?.name || dep).join(", ");
        toast.warning(`Desativar este módulo também desativará: ${depNames}`, {
          description: "Deseja continuar?",
          action: {
            label: "Continuar",
            onClick: () => {
              // Disable dependents and the module
              const updates: Record<string, boolean> = { [moduleId]: false };
              activeDependents.forEach(dep => {
                updates[dep] = false;
              });
              applyModuleChanges(updates);
            }
          },
        });
        return;
      }
    }

    // Update local state
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, enabled: newEnabled }
          : m
      )
    );

    // Track changes
    setPendingChanges(prev => ({
      ...prev,
      [moduleId]: newEnabled,
    }));
    setHasChanges(true);
  };

  const applyModuleChanges = (updates: Record<string, boolean>) => {
    setModules(prev =>
      prev.map(m => {
        if (updates[m.id] !== undefined) {
          return { ...m, enabled: updates[m.id] };
        }
        return m;
      })
    );

    const newPendingChanges = { ...pendingChanges, ...updates };
    setPendingChanges(newPendingChanges);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!selectedClinicId || !hasChanges) return;

    try {
      setSaving(true);

      const finalModules = modules
        .filter(m => m.enabled)
        .map(m => m.id);

      // Ensure required modules are always included
      const requiredModules = availableModules.filter(m => MODULE_DEFINITIONS[m]?.required);
      const allModules = [...new Set([...requiredModules, ...finalModules])];

      await api.patch(`/api/v1/admin/clinics/${selectedClinicId}/modules`, {
        active_modules: allModules,
      });

      // Update clinics list
      setClinics(prev =>
        prev.map(c =>
          c.id.toString() === selectedClinicId
            ? { ...c, active_modules: allModules }
            : c
        )
      );

      setPendingChanges({});
      setHasChanges(false);
      toast.success("Módulos atualizados com sucesso!");
    } catch (error: any) {
      console.error("Failed to save modules:", error);
      toast.error("Erro ao salvar módulos", {
        description: error?.message || error?.detail || "Não foi possível salvar as alterações",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedClinic = () => {
    return clinics.find(c => c.id.toString() === selectedClinicId);
  };

  const filteredModules = modules.filter(module =>
    searchTerm === "" ||
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = modules.filter(m => m.enabled).length;
  const disabledCount = modules.filter(m => !m.enabled && !m.required).length;
  const requiredCount = modules.filter(m => m.required).length;

  if (loading && clinics.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const selectedClinic = getSelectedClinic();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Gestão de Módulos
          </h1>
          <p className="text-gray-600 mt-2">
            Ative ou desative módulos do sistema para cada clínica
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

      {/* Clinic Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Clínica</CardTitle>
          <CardDescription>
            Escolha a clínica para gerenciar seus módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedClinicId}
                onValueChange={(value) => {
                  if (hasChanges) {
                    // Note: This confirm is for unsaved changes warning, not delete - keeping it for now
                    if (confirm("Há alterações não salvas. Deseja descartá-las?")) {
                      setSelectedClinicId(value);
                    }
                  } else {
                    setSelectedClinicId(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma clínica" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{clinic.name}</span>
                        {!clinic.is_active && (
                          <Badge variant="secondary" className="ml-2">Inativa</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClinic && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedClinic.active_modules?.length || 0}</span> módulos ativos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClinicId && (
        <>
          {/* Changes Alert */}
          {hasChanges && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>Há alterações não salvas</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadClinicModules();
                      toast.info("Alterações descartadas");
                    }}
                  >
                    Descartar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={saveChanges}
                    disabled={saving}
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
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar módulo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => {
                const hasPendingChange = pendingChanges[module.id] !== undefined;
                const isDependencyMissing = module.dependencies.some(
                  dep => !modules.find(m => m.id === dep)?.enabled
                );
                
                return (
                  <Card
                    key={module.id}
                    className={`${
                      module.enabled 
                        ? "border-blue-200 bg-blue-50/30" 
                        : ""
                    } ${
                      hasPendingChange 
                        ? "ring-2 ring-yellow-400" 
                        : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {module.name}
                            {module.required && (
                              <Badge variant="secondary" className="text-xs">
                                Obrigatório
                              </Badge>
                            )}
                            {hasPendingChange && (
                              <Badge variant="outline" className="text-xs bg-yellow-100">
                                Pendente
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {module.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={module.id} className="flex items-center gap-2">
                            {module.enabled ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <span className={module.enabled ? "text-gray-900" : "text-gray-500"}>
                              {module.enabled ? "Ativo" : "Inativo"}
                            </span>
                          </Label>
                          <Switch
                            id={module.id}
                            checked={module.enabled}
                            onCheckedChange={() => toggleModule(module.id)}
                            disabled={module.required || saving || isDependencyMissing}
                          />
                        </div>
                        
                        {module.dependencies.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-gray-500 mb-1">Dependências:</div>
                            <div className="flex flex-wrap gap-1">
                              {module.dependencies.map(dep => {
                                const depModule = modules.find(m => m.id === dep);
                                return (
                                  <Badge
                                    key={dep}
                                    variant="outline"
                                    className={`text-xs ${
                                      depModule?.enabled 
                                        ? "bg-green-50 border-green-200" 
                                        : "bg-red-50 border-red-200"
                                    }`}
                                  >
                                    {MODULE_DEFINITIONS[dep]?.name || dep}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {module.dependents.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-gray-500 mb-1">Usado por:</div>
                            <div className="flex flex-wrap gap-1">
                              {module.dependents.map(dep => {
                                const depModule = modules.find(m => m.id === dep);
                                return (
                                  <Badge
                                    key={dep}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {MODULE_DEFINITIONS[dep]?.name || dep}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {searchTerm
                    ? "Nenhum módulo encontrado"
                    : "Nenhum módulo disponível"}
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedClinic && (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {enabledCount}
                    </div>
                    <div className="text-sm text-gray-600">Módulos Ativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {disabledCount}
                    </div>
                    <div className="text-sm text-gray-600">Módulos Inativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {requiredCount}
                    </div>
                    <div className="text-sm text-gray-600">Módulos Obrigatórios</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedClinicId && clinics.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma clínica cadastrada</p>
            <p className="text-sm mt-2">Cadastre uma clínica primeiro para gerenciar módulos</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
