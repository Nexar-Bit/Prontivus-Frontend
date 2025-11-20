"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, Settings, Brain, Zap, BarChart3, RefreshCw, Save, 
  CheckCircle2, XCircle, AlertCircle, Loader2, Info, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AIConfig {
  enabled: boolean;
  provider: string;
  api_key: string;
  model: string;
  base_url: string;
  max_tokens: number;
  temperature: number;
  features: {
    clinical_analysis: {
      enabled: boolean;
      description: string;
    };
    diagnosis_suggestions: {
      enabled: boolean;
      description: string;
    };
    predictive_analysis: {
      enabled: boolean;
      description: string;
    };
    virtual_assistant: {
      enabled: boolean;
      description: string;
    };
  };
  usage_stats: {
    documents_processed: number;
    suggestions_generated: number;
    approval_rate: number;
    total_tokens?: number;
    tokens_this_month?: number;
  };
  token_limit?: number | null;
  token_limit_type?: "limited" | "unlimited" | "disabled" | "no_license";
  tokens_remaining?: number | null;
  ai_module_enabled?: boolean;
  warning?: string;
}

interface AIStats {
  documents_processed: number;
  suggestions_generated: number;
  approval_rate: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time_ms: number;
}

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI", description: "GPT-4, GPT-3.5 Turbo" },
  { value: "google", label: "Google (Gemini)", description: "Gemini Pro, Gemini Pro Vision" },
  { value: "anthropic", label: "Anthropic (Claude)", description: "Claude 3 Opus, Sonnet, Haiku" },
  { value: "azure", label: "Azure OpenAI", description: "Azure-hosted GPT models" },
];

const AI_MODELS: Record<string, string[]> = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  google: ["gemini-pro", "gemini-pro-vision"],
  anthropic: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  azure: ["gpt-4", "gpt-35-turbo"],
};

interface Clinic {
  id: number;
  name: string;
}

export default function IAPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [formData, setFormData] = useState<AIConfig>({
    enabled: false,
    provider: "openai",
    api_key: "",
    model: "gpt-4",
    base_url: "",
    max_tokens: 2000,
    temperature: 0.7,
    features: {
      clinical_analysis: {
        enabled: false,
        description: "Análise automática de prontuários médicos",
      },
      diagnosis_suggestions: {
        enabled: false,
        description: "Sugestões baseadas em sintomas e histórico",
      },
      predictive_analysis: {
        enabled: false,
        description: "Previsões baseadas em dados históricos",
      },
      virtual_assistant: {
        enabled: false,
        description: "Assistente inteligente para médicos",
      },
    },
    usage_stats: {
      documents_processed: 0,
      suggestions_generated: 0,
      approval_rate: 0.0,
    },
  });
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadConfig();
      loadStats();
    }
  }, [selectedClinicId]);

  useEffect(() => {
    // Check if formData has changed from config
    if (config) {
      const changed = JSON.stringify(formData) !== JSON.stringify(config);
      setHasChanges(changed);
    }
  }, [formData, config]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadClinics();
      if (selectedClinicId) {
        await Promise.all([
          loadConfig(),
          loadStats(),
        ]);
      }
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
        setSelectedClinicId(data[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
    }
  };

  const loadConfig = async () => {
    if (!selectedClinicId) return;
    
    try {
      const data = await api.get<AIConfig>(`/api/v1/ai-config?clinic_id=${selectedClinicId}`);
      setConfig(data);
      setFormData(data);
      setConnectionStatus("unknown");
    } catch (error: any) {
      console.error("Failed to load AI config:", error);
      // Check if it's a 404 - might mean endpoint doesn't exist or server needs restart
      if (error?.status === 404 || error?.message?.includes("Not Found")) {
        toast.error("Endpoint não encontrado", {
          description: "O servidor pode precisar ser reiniciado. Verifique se o backend está rodando.",
        });
      } else if (error?.status === 403) {
        const errorMsg = error?.detail || error?.message || "";
        if (errorMsg.includes("AI module is not enabled")) {
          toast.error("Módulo de IA não habilitado", {
            description: "Habilite o módulo 'Inteligência Artificial' na licença da clínica primeiro.",
          });
        } else if (errorMsg.includes("does not have a license")) {
          toast.warning("Clínica sem licença", {
            description: "A clínica selecionada não possui uma licença. Crie uma licença primeiro.",
          });
          // Still set config to show warning in UI
          setConfig({
            enabled: false,
            provider: "openai",
            api_key: "",
            model: "gpt-4",
            base_url: "",
            max_tokens: 2000,
            temperature: 0.7,
            features: {
              clinical_analysis: { enabled: false, description: "" },
              diagnosis_suggestions: { enabled: false, description: "" },
              predictive_analysis: { enabled: false, description: "" },
              virtual_assistant: { enabled: false, description: "" },
            },
            usage_stats: {
              documents_processed: 0,
              suggestions_generated: 0,
              approval_rate: 0,
            },
            token_limit: null,
            token_limit_type: "no_license",
            tokens_remaining: null,
            ai_module_enabled: false,
            warning: "Clínica não possui licença",
          });
        } else {
          toast.error("Acesso negado", {
            description: errorMsg || "Você precisa de permissões de SuperAdmin para acessar esta página.",
          });
        }
      } else {
        toast.error("Erro ao carregar configuração de IA", {
          description: error?.message || error?.detail || "Não foi possível carregar a configuração",
        });
      }
    }
  };

  const loadStats = async () => {
    if (!selectedClinicId) return;
    
    try {
      const data = await api.get<AIStats>(`/api/v1/ai-config/stats?clinic_id=${selectedClinicId}`);
      setStats(data);
      
      // Update formData with stats
      setFormData(prev => ({
        ...prev,
        usage_stats: {
          documents_processed: data.documents_processed,
          suggestions_generated: data.suggestions_generated,
          approval_rate: data.approval_rate,
        },
      }));
    } catch (error: any) {
      console.error("Failed to load AI stats:", error);
      // Set default stats if error (but don't show toast for stats - it's optional)
      setStats({
        documents_processed: 0,
        suggestions_generated: 0,
        approval_rate: 0,
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        average_response_time_ms: 0,
      });
    }
  };

  const saveConfig = async () => {
    if (!formData.enabled && formData.features.clinical_analysis.enabled) {
      toast.error("Habilite a IA primeiro para ativar recursos");
      return;
    }

    if (!selectedClinicId) {
      toast.error("Selecione uma clínica");
      return;
    }

    try {
      setSaving(true);
      const result = await api.put<{ message: string; config: AIConfig }>(
        `/api/v1/ai-config?clinic_id=${selectedClinicId}`,
        formData
      );
      setConfig(result.config || formData);
      setHasChanges(false);
      toast.success("Configuração de IA salva com sucesso!");
    } catch (error: any) {
      console.error("Failed to save AI config:", error);
      toast.error("Erro ao salvar configuração de IA", {
        description: error?.message || error?.detail || "Não foi possível salvar a configuração",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.api_key) {
      toast.error("Chave da API é obrigatória para testar a conexão");
      return;
    }

    if (!formData.provider) {
      toast.error("Selecione um provedor de IA");
      return;
    }

    try {
      setTesting(true);
      setConnectionStatus("unknown");
      
      if (!selectedClinicId) {
        toast.error("Selecione uma clínica");
        return;
      }

      const result = await api.post<{ 
        success: boolean; 
        message: string; 
        provider: string; 
        model: string; 
        response_time_ms: number 
      }>(`/api/v1/ai-config/test-connection?clinic_id=${selectedClinicId}`, {
        provider: formData.provider,
        model: formData.model,
        api_key: formData.api_key,
        base_url: formData.base_url,
      });
      
      if (result.success) {
        setConnectionStatus("success");
        toast.success("Conexão testada com sucesso!", {
          description: `Resposta em ${result.response_time_ms}ms usando ${result.provider}/${result.model}`,
        });
      } else {
        setConnectionStatus("error");
        toast.error("Falha ao testar conexão", {
          description: result.message || "Não foi possível conectar ao provedor de IA",
        });
      }
    } catch (error: any) {
      console.error("Failed to test connection:", error);
      setConnectionStatus("error");
      toast.error("Erro ao testar conexão", {
        description: error?.message || error?.detail || "Não foi possível testar a conexão",
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleFeature = (featureKey: keyof typeof formData.features) => {
    if (!formData.enabled) {
      toast.error("Habilite a IA primeiro para ativar recursos");
      return;
    }

    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: {
          ...prev.features[featureKey],
          enabled: !prev.features[featureKey].enabled,
        },
      },
    }));
  };

  const getStatusBadge = () => {
    if (!formData.enabled) {
      return <Badge className="bg-gray-100 text-gray-800">Desativado</Badge>;
    }
    if (connectionStatus === "success") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativo</Badge>;
    }
    if (connectionStatus === "error") {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Erro</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Não Testado</Badge>;
  };

  const getAvailableModels = () => {
    return AI_MODELS[formData.provider] || AI_MODELS.openai;
  };

  if (loading && !config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            Integração de Inteligência Artificial
          </h1>
          <p className="text-gray-600 mt-2">
            Configure e gerencie recursos de IA do sistema
          </p>
        </div>
        {clinics.length > 0 && (
          <div className="flex items-center gap-4">
            <Label htmlFor="clinic-select">Clínica:</Label>
            <Select value={selectedClinicId?.toString()} onValueChange={(value) => setSelectedClinicId(parseInt(value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma clínica" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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

      {/* Changes Alert */}
      {hasChanges && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>Há alterações não salvas</span>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={saveConfig}
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
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Processamento de Texto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {(stats.documents_processed || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Documentos processados</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Sugestões Geradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {(stats.suggestions_generated || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total de sugestões</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Taxa de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {((stats.approval_rate || 0) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Sugestões aceitas</p>
            </CardContent>
          </Card>
          {config && config.token_limit !== undefined && config.token_limit !== null && config.token_limit_type !== "no_license" && (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tokens (Mensal)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {config.tokens_remaining === -1 ? "∞" : (config.tokens_remaining ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {config.token_limit_type === "unlimited" 
                    ? "Ilimitado" 
                    : `${(config.usage_stats?.tokens_this_month || 0).toLocaleString()} / ${(config.token_limit || 0).toLocaleString()} usados`}
                </p>
              </CardContent>
            </Card>
          )}
          {config && (config.token_limit_type === "no_license" || !config.ai_module_enabled) && (
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {config.token_limit_type === "no_license" ? "Licença Necessária" : "Módulo IA Desabilitado"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">
                  {config.warning || (config.token_limit_type === "no_license" 
                    ? "A clínica não possui uma licença. Crie uma licença e habilite o módulo de IA primeiro."
                    : "O módulo de IA não está habilitado na licença desta clínica. Habilite o módulo 'Inteligência Artificial' na licença.")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {/* AI Configuration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configurações de IA</CardTitle>
                  <CardDescription>
                    Gerencie as configurações de inteligência artificial
                  </CardDescription>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-enabled">Habilitar IA</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Ativa recursos de inteligência artificial no sistema
                  </p>
                </div>
                <Switch
                  id="ai-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {formData.enabled && (
                <>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ai-provider">Provedor de IA *</Label>
                        <Select
                          value={formData.provider}
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              provider: value,
                              model: AI_MODELS[value]?.[0] || "gpt-4",
                            }));
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {AI_PROVIDERS.map((provider) => (
                              <SelectItem key={provider.value} value={provider.value}>
                                <div>
                                  <div className="font-medium">{provider.label}</div>
                                  <div className="text-xs text-gray-500">{provider.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ai-model">Modelo *</Label>
                        <Select
                          value={formData.model}
                          onValueChange={(value) =>
                            setFormData(prev => ({ ...prev, model: value }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableModels().map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ai-api-key">Chave da API *</Label>
                      <Input
                        id="ai-api-key"
                        type="password"
                        placeholder="sk-..."
                        className="mt-1"
                        value={formData.api_key}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, api_key: e.target.value }))
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mantenha sua chave de API segura e não a compartilhe
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="ai-base-url">URL Base (Opcional)</Label>
                      <Input
                        id="ai-base-url"
                        placeholder="https://api.openai.com/v1"
                        className="mt-1"
                        value={formData.base_url}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, base_url: e.target.value }))
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe em branco para usar a URL padrão do provedor
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ai-max-tokens">Máximo de Tokens</Label>
                        <Input
                          id="ai-max-tokens"
                          type="number"
                          min="1"
                          max="8000"
                          className="mt-1"
                          value={formData.max_tokens}
                          onChange={(e) =>
                            setFormData(prev => ({
                              ...prev,
                              max_tokens: parseInt(e.target.value) || 2000,
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">1-8000 tokens</p>
                      </div>
                      <div>
                        <Label htmlFor="ai-temperature">Temperatura (0-1)</Label>
                        <Input
                          id="ai-temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          className="mt-1"
                          value={formData.temperature}
                          onChange={(e) =>
                            setFormData(prev => ({
                              ...prev,
                              temperature: parseFloat(e.target.value) || 0.7,
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">0 = determinístico, 1 = criativo</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={testConnection}
                      disabled={testing || !formData.api_key || !formData.provider}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                      {testing ? "Testando..." : "Testar Conexão"}
                    </Button>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={saveConfig}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          {/* AI Features */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos de IA Disponíveis</CardTitle>
              <CardDescription>
                Funcionalidades de inteligência artificial ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!formData.enabled && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Habilite a IA nas configurações para ativar os recursos abaixo
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.features).map(([key, feature]) => (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg ${
                      feature.enabled ? "border-purple-200 bg-purple-50/30" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {key === "clinical_analysis" && (
                        <Brain className="h-5 w-5 text-blue-600" />
                      )}
                      {key === "diagnosis_suggestions" && (
                        <Zap className="h-5 w-5 text-blue-600" />
                      )}
                      {key === "predictive_analysis" && (
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      )}
                      {key === "virtual_assistant" && (
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      )}
                      <h3 className="font-semibold flex-1">
                        {key === "clinical_analysis" && "Análise de Prontuários"}
                        {key === "diagnosis_suggestions" && "Sugestões de Diagnóstico"}
                        {key === "predictive_analysis" && "Análise Preditiva"}
                        {key === "virtual_assistant" && "Assistente Virtual"}
                      </h3>
                      <Badge
                        className={
                          feature.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {feature.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`feature-${key}`} className="cursor-pointer">
                        {feature.enabled ? "Desativar" : "Ativar"}
                      </Label>
                      <Switch
                        id={`feature-${key}`}
                        checked={feature.enabled}
                        onCheckedChange={() => toggleFeature(key as keyof typeof formData.features)}
                        disabled={!formData.enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Additional Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Detalhadas</CardTitle>
                <CardDescription>
                  Métricas de uso da IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(stats.total_requests || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total de Requisições</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(stats.successful_requests || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Requisições Bem-sucedidas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {(stats.failed_requests || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Requisições Falhadas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {(stats.average_response_time_ms || 0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Tempo Médio de Resposta</div>
                  </div>
                </div>
                {(stats.total_requests || 0) > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Taxa de Sucesso</span>
                      <span className="text-sm font-bold text-green-600">
                        {stats.total_requests ? ((stats.successful_requests / stats.total_requests) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${stats.total_requests ? (stats.successful_requests / stats.total_requests) * 100 : 0}%`,
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
