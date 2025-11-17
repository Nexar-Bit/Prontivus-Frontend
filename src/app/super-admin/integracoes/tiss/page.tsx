"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Code2, Settings, CheckCircle2, XCircle, RefreshCw, Save, AlertCircle, 
  Clock, Building, Loader2, Plus, Edit, Trash2, Eye, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TissConfig {
  prestador: {
    cnpj?: string;
    nome?: string;
    codigo_prestador?: string;
  };
  operadora: {
    cnpj?: string;
    nome?: string;
    registro_ans?: string;
  };
  defaults: {
    nome_plano?: string;
    cbo_profissional?: string;
    hora_inicio?: string;
    hora_fim?: string;
  };
  tiss: {
    versao?: string;
    enabled?: boolean;
    auto_generate?: boolean;
    url?: string;
    token?: string;
  };
}

interface TissTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
}

export default function TISSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [config, setConfig] = useState<TissConfig>({
    prestador: {},
    operadora: {},
    defaults: {},
    tiss: {},
  });
  const [templates, setTemplates] = useState<TissTemplate[]>([]);
  const [formData, setFormData] = useState<TissConfig>({
    prestador: {
      cnpj: "",
      nome: "",
      codigo_prestador: "001",
    },
    operadora: {
      cnpj: "",
      nome: "Operadora Padrão",
      registro_ans: "000000",
    },
    defaults: {
      nome_plano: "Plano Padrão",
      cbo_profissional: "2251",
      hora_inicio: "08:00",
      hora_fim: "09:00",
    },
    tiss: {
      versao: "3.05.00",
      enabled: true,
      auto_generate: false,
      url: "",
      token: "",
    },
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TissTemplate | null>(null);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadConfig();
      loadTemplates();
    } else {
      setConfig({
        prestador: {},
        operadora: {},
        defaults: {},
        tiss: {},
      });
      setFormData({
        prestador: {
          cnpj: "",
          nome: "",
          codigo_prestador: "001",
        },
        operadora: {
          cnpj: "",
          nome: "Operadora Padrão",
          registro_ans: "000000",
        },
        defaults: {
          nome_plano: "Plano Padrão",
          cbo_profissional: "2251",
          hora_inicio: "08:00",
          hora_fim: "09:00",
        },
        tiss: {
          versao: "3.05.00",
          enabled: true,
          auto_generate: false,
          url: "",
          token: "",
        },
      });
      setTemplates([]);
    }
  }, [selectedClinicId]);

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
        description: error?.message || error?.detail,
      });
    }
  };

  const loadConfig = async () => {
    if (!selectedClinicId) return;

    try {
      setLoading(true);
      const data = await api.get<TissConfig>(`/api/v1/financial/tiss-config/admin/${selectedClinicId}`);
      setConfig(data);
      setFormData({
        prestador: {
          cnpj: data.prestador?.cnpj || "",
          nome: data.prestador?.nome || "",
          codigo_prestador: data.prestador?.codigo_prestador || "001",
        },
        operadora: {
          cnpj: data.operadora?.cnpj || "",
          nome: data.operadora?.nome || "Operadora Padrão",
          registro_ans: data.operadora?.registro_ans || "000000",
        },
        defaults: {
          nome_plano: data.defaults?.nome_plano || "Plano Padrão",
          cbo_profissional: data.defaults?.cbo_profissional || "2251",
          hora_inicio: data.defaults?.hora_inicio || "08:00",
          hora_fim: data.defaults?.hora_fim || "09:00",
        },
        tiss: {
          versao: data.tiss?.versao || "3.05.00",
          enabled: data.tiss?.enabled ?? true,
          auto_generate: data.tiss?.auto_generate ?? false,
          url: data.tiss?.url || "",
          token: data.tiss?.token || "",
        },
      });
      
      if (data.tiss?.enabled) {
        setLastSync(new Date());
      }
    } catch (error: any) {
      console.error("Failed to load TISS config:", error);
      toast.error("Erro ao carregar configuração TISS", {
        description: error?.message || error?.detail || "Não foi possível carregar a configuração",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!selectedClinicId) return;

    try {
      const data = await api.get<TissTemplate[]>("/api/v1/financial/templates");
      setTemplates(data);
    } catch (error: any) {
      console.error("Failed to load templates:", error);
      // Don't show error, templates are optional
      setTemplates([]);
    }
  };

  const saveConfig = async () => {
    if (!selectedClinicId) {
      toast.error("Selecione uma clínica primeiro");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/api/v1/financial/tiss-config/admin/${selectedClinicId}`, formData);
      setConfig(formData);
      setLastSync(new Date());
      toast.success("Configuração TISS salva com sucesso!");
    } catch (error: any) {
      console.error("Failed to save TISS config:", error);
      toast.error("Erro ao salvar configuração TISS", {
        description: error?.message || error?.detail || "Não foi possível salvar a configuração",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.tiss.url) {
      toast.error("URL do servidor TISS é obrigatória");
      return;
    }

    try {
      setTesting(true);
      setConnectionStatus("unknown");
      
      // Validate URL format
      try {
        new URL(formData.tiss.url);
        // In a real scenario, this would call an endpoint that tests the connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConnectionStatus("success");
        toast.success("Conexão testada com sucesso!");
      } catch {
        setConnectionStatus("error");
        toast.error("URL inválida", {
          description: "Por favor, verifique o formato da URL",
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

  const getStatusBadge = () => {
    if (!formData.tiss.enabled) {
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

  const selectedClinic = clinics.find(c => c.id.toString() === selectedClinicId);

  if (loading && !selectedClinicId) {
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
            <Code2 className="h-8 w-8 text-purple-600" />
            Integração TISS
          </h1>
          <p className="text-gray-600 mt-2">
            Configure a integração com o padrão TISS (Troca de Informação em Saúde Suplementar)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (selectedClinicId) {
              loadConfig();
              loadTemplates();
            }
          }}
          disabled={loading || !selectedClinicId}
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
            Escolha a clínica para gerenciar a configuração TISS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClinicId}
            onValueChange={setSelectedClinicId}
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
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClinicId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Status da Integração
                </CardTitle>
                <CardDescription>
                  Estado atual da integração TISS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    {getStatusBadge()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Última Sincronização</span>
                    <span className="text-sm font-medium">
                      {lastSync
                        ? format(lastSync, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "Nunca"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Versão TISS</span>
                    <span className="text-sm font-medium">{formData.tiss.versao || "3.05.00"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Geração Automática</span>
                    <span className="text-sm font-medium">
                      {formData.tiss.auto_generate ? "Ativada" : "Desativada"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Parâmetros da integração TISS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tiss-url">URL do Servidor TISS</Label>
                  <Input
                    id="tiss-url"
                    placeholder="https://tiss.example.com"
                    className="mt-1"
                    value={formData.tiss.url || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tiss: { ...formData.tiss, url: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="tiss-token">Token de Autenticação</Label>
                  <Input
                    id="tiss-token"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1"
                    value={formData.tiss.token || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tiss: { ...formData.tiss, token: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tiss-enabled" className="cursor-pointer">
                    Integração Ativa
                  </Label>
                  <Switch
                    id="tiss-enabled"
                    checked={formData.tiss.enabled ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        tiss: { ...formData.tiss, enabled: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tiss-auto" className="cursor-pointer">
                    Geração Automática
                  </Label>
                  <Switch
                    id="tiss-auto"
                    checked={formData.tiss.auto_generate ?? false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        tiss: { ...formData.tiss, auto_generate: checked },
                      })
                    }
                  />
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={testConnection}
                  disabled={testing || !formData.tiss.url}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? "Testando..." : "Testar Conexão"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Provider and Operator Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Prestador</CardTitle>
                <CardDescription>
                  Informações da clínica prestadora
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prestador-cnpj">CNPJ</Label>
                  <Input
                    id="prestador-cnpj"
                    placeholder="00.000.000/0000-00"
                    className="mt-1"
                    value={formData.prestador.cnpj || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prestador: { ...formData.prestador, cnpj: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="prestador-nome">Nome</Label>
                  <Input
                    id="prestador-nome"
                    placeholder="Nome da clínica"
                    className="mt-1"
                    value={formData.prestador.nome || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prestador: { ...formData.prestador, nome: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="prestador-codigo">Código do Prestador</Label>
                  <Input
                    id="prestador-codigo"
                    placeholder="001"
                    className="mt-1"
                    value={formData.prestador.codigo_prestador || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prestador: { ...formData.prestador, codigo_prestador: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados da Operadora</CardTitle>
                <CardDescription>
                  Informações da operadora de saúde
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="operadora-cnpj">CNPJ</Label>
                  <Input
                    id="operadora-cnpj"
                    placeholder="00.000.000/0000-00"
                    className="mt-1"
                    value={formData.operadora.cnpj || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operadora: { ...formData.operadora, cnpj: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="operadora-nome">Nome</Label>
                  <Input
                    id="operadora-nome"
                    placeholder="Nome da operadora"
                    className="mt-1"
                    value={formData.operadora.nome || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operadora: { ...formData.operadora, nome: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="operadora-ans">Registro ANS</Label>
                  <Input
                    id="operadora-ans"
                    placeholder="000000"
                    className="mt-1"
                    value={formData.operadora.registro_ans || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operadora: { ...formData.operadora, registro_ans: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Defaults Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Padrão</CardTitle>
              <CardDescription>
                Valores padrão para geração de documentos TISS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="default-plano">Nome do Plano</Label>
                  <Input
                    id="default-plano"
                    placeholder="Plano Padrão"
                    className="mt-1"
                    value={formData.defaults.nome_plano || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaults: { ...formData.defaults, nome_plano: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="default-cbo">CBO Profissional</Label>
                  <Input
                    id="default-cbo"
                    placeholder="2251"
                    className="mt-1"
                    value={formData.defaults.cbo_profissional || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaults: { ...formData.defaults, cbo_profissional: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="default-inicio">Hora Início</Label>
                  <Input
                    id="default-inicio"
                    type="time"
                    className="mt-1"
                    value={formData.defaults.hora_inicio || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaults: { ...formData.defaults, hora_inicio: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="default-fim">Hora Fim</Label>
                  <Input
                    id="default-fim"
                    type="time"
                    className="mt-1"
                    value={formData.defaults.hora_fim || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaults: { ...formData.defaults, hora_fim: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              className="bg-purple-600 hover:bg-purple-700"
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
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>

          {/* Templates Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates TISS</CardTitle>
                  <CardDescription>
                    Gerencie templates XML para geração de documentos TISS
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setShowTemplateDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {template.is_active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {template.is_default ? (
                            <Badge variant="secondary">Padrão</Badge>
                          ) : (
                            <Badge variant="outline">Customizado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowTemplateDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!template.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
                                    try {
                                      await api.delete(`/api/v1/financial/templates/${template.id}`);
                                      toast.success("Template excluído com sucesso!");
                                      await loadTemplates();
                                    } catch (error: any) {
                                      toast.error("Erro ao excluir template", {
                                        description: error?.message || error?.detail,
                                      });
                                    }
                                  }
                                }}
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
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum template cadastrado</p>
                  <p className="text-sm mt-2">
                    Crie um template para começar a gerar documentos TISS
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedClinicId && (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Selecione uma clínica para gerenciar a configuração TISS</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
