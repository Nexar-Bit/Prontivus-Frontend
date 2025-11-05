"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { tissConfigApi } from "@/lib/tiss-config-api";
import { Loader2 } from "lucide-react";
import { Save, Building2, FileCode, Settings, Info } from "lucide-react";

interface TissConfig {
  // Prestador (Clinic) Configuration
  prestador: {
    cnpj: string;
    nome: string;
    codigo_prestador: string;
  };
  
  // Operadora (Insurance) Configuration
  operadora: {
    cnpj: string;
    nome: string;
    registro_ans: string;
  };
  
  // Default Settings
  defaults: {
    nome_plano: string;
    cbo_profissional: string;
    hora_inicio: string;
    hora_fim: string;
  };
  
  // TISS Settings
  tiss: {
    versao: string;
    enabled: boolean;
    auto_generate: boolean;
  };
}

export default function TissConfigPage() {
  const [config, setConfig] = useState<TissConfig>({
    prestador: {
      cnpj: "",
      nome: "",
      codigo_prestador: "001"
    },
    operadora: {
      cnpj: "",
      nome: "Operadora Padrão",
      registro_ans: "000000"
    },
    defaults: {
      nome_plano: "Plano Padrão",
      cbo_profissional: "2251",
      hora_inicio: "08:00",
      hora_fim: "09:00"
    },
    tiss: {
      versao: "3.03.00",
      enabled: true,
      auto_generate: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await tissConfigApi.get();
        setConfig(data as any);
      } catch (err: any) {
        console.error('Erro ao carregar configurações TISS', err);
        toast.error('Falha ao carregar configurações TISS');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await tissConfigApi.update(config as any);
      toast.success("Configurações TISS salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (section: keyof TissConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando configurações TISS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações TISS</h1>
          <p className="text-muted-foreground">
            Configure as informações para geração de arquivos TISS XML
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre o TISS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            O TISS (Troca de Informação em Saúde Suplementar) é o padrão estabelecido pela ANS 
            para a troca eletrônica de informações entre operadoras de planos de saúde e 
            prestadores de serviços. Configure as informações abaixo para gerar arquivos XML 
            compatíveis com o padrão TISS 3.03.00.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prestador Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Prestador de Serviços
            </CardTitle>
            <CardDescription>
              Informações da clínica/prestador de serviços
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prestador-cnpj">CNPJ</Label>
              <Input
                id="prestador-cnpj"
                value={config.prestador.cnpj}
                onChange={(e) => updateConfig('prestador', 'cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="prestador-nome">Nome/Razão Social</Label>
              <Input
                id="prestador-nome"
                value={config.prestador.nome}
                onChange={(e) => updateConfig('prestador', 'nome', e.target.value)}
                placeholder="Nome da clínica"
              />
            </div>
            <div>
              <Label htmlFor="prestador-codigo">Código do Prestador</Label>
              <Input
                id="prestador-codigo"
                value={config.prestador.codigo_prestador}
                onChange={(e) => updateConfig('prestador', 'codigo_prestador', e.target.value)}
                placeholder="001"
                maxLength={20}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operadora Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Operadora de Saúde
            </CardTitle>
            <CardDescription>
              Informações da operadora de planos de saúde
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="operadora-cnpj">CNPJ da Operadora</Label>
              <Input
                id="operadora-cnpj"
                value={config.operadora.cnpj}
                onChange={(e) => updateConfig('operadora', 'cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="operadora-nome">Nome da Operadora</Label>
              <Input
                id="operadora-nome"
                value={config.operadora.nome}
                onChange={(e) => updateConfig('operadora', 'nome', e.target.value)}
                placeholder="Nome da operadora"
              />
            </div>
            <div>
              <Label htmlFor="operadora-ans">Registro ANS</Label>
              <Input
                id="operadora-ans"
                value={config.operadora.registro_ans}
                onChange={(e) => updateConfig('operadora', 'registro_ans', e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Padrão
          </CardTitle>
          <CardDescription>
            Valores padrão para campos não especificados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-plano">Nome do Plano Padrão</Label>
              <Input
                id="default-plano"
                value={config.defaults.nome_plano}
                onChange={(e) => updateConfig('defaults', 'nome_plano', e.target.value)}
                placeholder="Plano Padrão"
              />
            </div>
            <div>
              <Label htmlFor="default-cbo">CBO do Profissional</Label>
              <Input
                id="default-cbo"
                value={config.defaults.cbo_profissional}
                onChange={(e) => updateConfig('defaults', 'cbo_profissional', e.target.value)}
                placeholder="2251"
                maxLength={4}
              />
            </div>
            <div>
              <Label htmlFor="default-hora-inicio">Hora de Início Padrão</Label>
              <Input
                id="default-hora-inicio"
                type="time"
                value={config.defaults.hora_inicio}
                onChange={(e) => updateConfig('defaults', 'hora_inicio', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="default-hora-fim">Hora de Fim Padrão</Label>
              <Input
                id="default-hora-fim"
                type="time"
                value={config.defaults.hora_fim}
                onChange={(e) => updateConfig('defaults', 'hora_fim', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TISS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Configurações TISS
          </CardTitle>
          <CardDescription>
            Configurações específicas do padrão TISS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tiss-enabled">Habilitar Geração TISS</Label>
              <p className="text-sm text-muted-foreground">
                Permite a geração de arquivos TISS XML
              </p>
            </div>
            <Switch
              id="tiss-enabled"
              checked={config.tiss.enabled}
              onCheckedChange={(checked) => updateConfig('tiss', 'enabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tiss-auto">Geração Automática</Label>
              <p className="text-sm text-muted-foreground">
                Gera automaticamente TISS XML ao criar faturas
              </p>
            </div>
            <Switch
              id="tiss-auto"
              checked={config.tiss.auto_generate}
              onCheckedChange={(checked) => updateConfig('tiss', 'auto_generate', checked)}
            />
          </div>
          
          <div>
            <Label htmlFor="tiss-versao">Versão TISS</Label>
            <Input
              id="tiss-versao"
              value={config.tiss.versao}
              onChange={(e) => updateConfig('tiss', 'versao', e.target.value)}
              placeholder="3.03.00"
              disabled
            />
            <p className="text-sm text-muted-foreground mt-1">
              Versão atual do padrão TISS suportada
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
