"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, Settings, BarChart3, PieChart, LineChart, Loader2, 
  RefreshCw, Save, RotateCcw, AlertCircle, CheckCircle2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ReportConfig {
  financial: {
    enabled: boolean;
    detailed: boolean;
  };
  clinical: {
    enabled: boolean;
    anonymize: boolean;
  };
  operational: {
    enabled: boolean;
    automatic_scheduling: boolean;
  };
  general: {
    allow_export: boolean;
    send_by_email: boolean;
  };
}

const DEFAULT_CONFIG: ReportConfig = {
  financial: {
    enabled: true,
    detailed: true,
  },
  clinical: {
    enabled: true,
    anonymize: false,
  },
  operational: {
    enabled: true,
    automatic_scheduling: false,
  },
  general: {
    allow_export: true,
    send_by_email: false,
  },
};

export default function RelatoriosConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<ReportConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    // Check if config has changed from original
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.get<ReportConfig>("/api/v1/report-config");
      setConfig(data);
      setOriginalConfig(data);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to load report configuration:", error);
      toast.error("Erro ao carregar configurações", {
        description: error?.message || error?.detail || "Não foi possível carregar as configurações de relatórios",
      });
      // Use default values on error
      setConfig(DEFAULT_CONFIG);
      setOriginalConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put<{ message: string; config: ReportConfig }>("/api/v1/report-config", config);
      
      // Update original config to reflect saved state
      setOriginalConfig(response.config || config);
      setHasChanges(false);
      setLastSaved(new Date());
      
      toast.success("Configurações salvas com sucesso", {
        description: "As configurações de relatórios foram atualizadas",
      });
    } catch (error: any) {
      console.error("Failed to save report configuration:", error);
      toast.error("Erro ao salvar configurações", {
        description: error?.message || error?.detail || "Não foi possível salvar as configurações",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Note: This confirm is for resetting settings, not delete - keeping it for now
    if (!confirm("Tem certeza que deseja restaurar as configurações padrão? Todas as alterações não salvas serão perdidas.")) {
      return;
    }
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
    toast.info("Configurações restauradas para os valores padrão", {
      description: "Lembre-se de salvar para aplicar as alterações",
    });
  };

  const updateConfig = (section: keyof ReportConfig, field: string, value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Configurações de Relatórios
        </h1>
        <p className="text-gray-600 mt-2">
          Configure os relatórios disponíveis e suas opções para a clínica
        </p>
      </div>

      {lastSaved && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Configurações salvas com sucesso em {lastSaved.toLocaleString("pt-BR")}
          </AlertDescription>
        </Alert>
      )}

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Não esqueça de salvar antes de sair da página.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Relatórios Financeiros
            </CardTitle>
            <CardDescription>
              Configure relatórios financeiros e de receita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="financial-enabled" className="cursor-pointer">
                    Habilitar Relatórios Financeiros
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ativa a geração de relatórios financeiros (receitas, despesas, etc.)
                  </p>
                </div>
                <Switch
                  id="financial-enabled"
                  checked={config.financial.enabled}
                  onCheckedChange={(checked) => updateConfig("financial", "enabled", checked)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="financial-detailed" className="cursor-pointer">
                    Relatórios Detalhados
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inclui informações detalhadas e análises aprofundadas nos relatórios
                  </p>
                </div>
                <Switch
                  id="financial-detailed"
                  checked={config.financial.detailed}
                  onCheckedChange={(checked) => updateConfig("financial", "detailed", checked)}
                  disabled={!config.financial.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Relatórios Clínicos
            </CardTitle>
            <CardDescription>
              Configure relatórios clínicos e de pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="clinical-enabled" className="cursor-pointer">
                    Habilitar Relatórios Clínicos
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ativa a geração de relatórios clínicos (consultas, diagnósticos, etc.)
                  </p>
                </div>
                <Switch
                  id="clinical-enabled"
                  checked={config.clinical.enabled}
                  onCheckedChange={(checked) => updateConfig("clinical", "enabled", checked)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="clinical-anonymous" className="cursor-pointer">
                    Anonimizar Dados
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Remove informações pessoais identificáveis dos relatórios clínicos
                  </p>
                </div>
                <Switch
                  id="clinical-anonymous"
                  checked={config.clinical.anonymize}
                  onCheckedChange={(checked) => updateConfig("clinical", "anonymize", checked)}
                  disabled={!config.clinical.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Relatórios Operacionais
            </CardTitle>
            <CardDescription>
              Configure relatórios operacionais e de gestão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="operational-enabled" className="cursor-pointer">
                    Habilitar Relatórios Operacionais
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ativa a geração de relatórios operacionais (agendamentos, produtividade, etc.)
                  </p>
                </div>
                <Switch
                  id="operational-enabled"
                  checked={config.operational.enabled}
                  onCheckedChange={(checked) => updateConfig("operational", "enabled", checked)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="operational-schedule" className="cursor-pointer">
                    Agendamento Automático
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Gera e envia relatórios automaticamente em intervalos programados
                  </p>
                </div>
                <Switch
                  id="operational-schedule"
                  checked={config.operational.automatic_scheduling}
                  onCheckedChange={(checked) => updateConfig("operational", "automatic_scheduling", checked)}
                  disabled={!config.operational.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Configurações gerais aplicadas a todos os relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="export-enabled" className="cursor-pointer">
                    Permitir Exportação
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Permite exportar relatórios em formatos como PDF, Excel, CSV
                  </p>
                </div>
                <Switch
                  id="export-enabled"
                  checked={config.general.allow_export}
                  onCheckedChange={(checked) => updateConfig("general", "allow_export", checked)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="email-reports" className="cursor-pointer">
                    Enviar por E-mail
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Envia relatórios automaticamente por e-mail quando gerados
                  </p>
                </div>
                <Switch
                  id="email-reports"
                  checked={config.general.send_by_email}
                  onCheckedChange={(checked) => updateConfig("general", "send_by_email", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>
                {hasChanges 
                  ? "Você tem alterações não salvas" 
                  : "Todas as alterações foram salvas"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadConfig}
                disabled={loading || saving}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recarregar
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar Padrões
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
