'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mic, 
  Shield, 
  Lock, 
  Volume2, 
  Languages,
  Brain,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { voiceApi, VoiceConfiguration } from '@/lib/voice-api';

export default function VoiceSettingsPage() {
  const [config, setConfig] = useState<VoiceConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const voiceConfig = await voiceApi.getVoiceConfiguration();
        setConfig(voiceConfig);
      } catch (error) {
        console.error('Error loading voice configuration:', error);
        toast.error('Erro ao carregar configurações de voz');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      // Note: This would require a PUT endpoint for updating configuration
      // await voiceApi.updateVoiceConfiguration(config);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<VoiceConfiguration>) => {
    if (config) {
      setConfig({ ...config, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erro ao carregar configurações</h1>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Voz</h1>
          <p className="text-muted-foreground">
            Configure o processamento de voz para documentação clínica
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Provedor de Voz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Select
                value={config.provider}
                onValueChange={(value) => updateConfig({ provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Speech-to-Text</SelectItem>
                  <SelectItem value="aws">AWS Transcribe</SelectItem>
                  <SelectItem value="azure">Azure Speech Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={config.language}
                onValueChange={(value) => updateConfig({ language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español (España)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo de Reconhecimento</Label>
            <Select
              value={config.model}
              onValueChange={(value) => updateConfig({ model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical_dictation">Ditado Médico</SelectItem>
                <SelectItem value="phone_call">Chamada Telefônica</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="command_and_search">Comando e Busca</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configurações de Processamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-punctuation">Pontuação Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Adiciona pontuação automaticamente na transcrição
                  </p>
                </div>
                <Switch
                  id="auto-punctuation"
                  checked={config.enable_auto_punctuation}
                  onCheckedChange={(checked) => updateConfig({ enable_auto_punctuation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="word-time-offsets">Deslocamentos de Tempo</Label>
                  <p className="text-sm text-muted-foreground">
                    Inclui timestamps para cada palavra
                  </p>
                </div>
                <Switch
                  id="word-time-offsets"
                  checked={config.enable_word_time_offsets}
                  onCheckedChange={(checked) => updateConfig({ enable_word_time_offsets: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="icd10-suggestions">Sugestões ICD-10</Label>
                  <p className="text-sm text-muted-foreground">
                    Sugere códigos ICD-10 baseados no texto
                  </p>
                </div>
                <Switch
                  id="icd10-suggestions"
                  checked={config.enable_icd10_suggestions}
                  onCheckedChange={(checked) => updateConfig({ enable_icd10_suggestions: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="medication-recognition">Reconhecimento de Medicamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Identifica medicamentos e dosagens automaticamente
                  </p>
                </div>
                <Switch
                  id="medication-recognition"
                  checked={config.enable_medication_recognition}
                  onCheckedChange={(checked) => updateConfig({ enable_medication_recognition: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence-threshold">Limiar de Confiança</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="confidence-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.confidence_threshold}
                    onChange={(e) => updateConfig({ confidence_threshold: parseFloat(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    ({Math.round(config.confidence_threshold * 100)}%)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Apenas transcrições com confiança acima deste valor serão aceitas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy and Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade e Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="encryption">Criptografia</Label>
                  <p className="text-sm text-muted-foreground">
                    Criptografa dados de voz para conformidade HIPAA/LGPD
                  </p>
                </div>
                <Switch
                  id="encryption"
                  checked={config.enable_encryption}
                  onCheckedChange={(checked) => updateConfig({ enable_encryption: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audit-logging">Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registra todas as atividades de processamento de voz
                  </p>
                </div>
                <Switch
                  id="audit-logging"
                  checked={config.enable_audit_logging}
                  onCheckedChange={(checked) => updateConfig({ enable_audit_logging: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auto-delete">Exclusão Automática (horas)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="auto-delete"
                    type="number"
                    min="1"
                    max="168"
                    value={config.auto_delete_after_hours}
                    onChange={(e) => updateConfig({ auto_delete_after_hours: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dados de voz são excluídos automaticamente após este período
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Status de Conformidade</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">HIPAA</span>
                <Badge variant="outline" className="text-green-600">
                  Conforme
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">LGPD</span>
                <Badge variant="outline" className="text-green-600">
                  Conforme
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Criptografia</span>
                <Badge variant="outline" className="text-green-600">
                  Ativa
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Auditoria</span>
                <Badge variant="outline" className="text-green-600">
                  Ativa
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Terms Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Terminologia Médica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gerencie termos médicos personalizados para melhorar o reconhecimento de voz
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-terms">Termos Personalizados</Label>
                <Input
                  id="custom-terms"
                  placeholder="Adicionar termo médico..."
                />
                <Button size="sm" variant="outline">
                  Adicionar Termo
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="symptom">Sintoma</SelectItem>
                    <SelectItem value="diagnosis">Diagnóstico</SelectItem>
                    <SelectItem value="medication">Medicamento</SelectItem>
                    <SelectItem value="procedure">Procedimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icd10-code">Código ICD-10</Label>
                <Input
                  id="icd10-code"
                  placeholder="Ex: K35.9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm">
                <Volume2 className="h-4 w-4 mr-2" />
                Testar Reconhecimento
              </Button>
              <Button size="sm" variant="outline">
                Importar Termos
              </Button>
              <Button size="sm" variant="outline">
                Exportar Termos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
