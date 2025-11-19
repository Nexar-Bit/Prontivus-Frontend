"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Database, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  FileText,
  Activity,
  AlertTriangle,
  ArrowLeftRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Job = {
  id: number;
  type: "patients" | "appointments" | "clinical" | "financial";
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  input_format: "csv" | "json";
  source_name?: string;
  created_at: string;
  stats?: any;
  errors?: any;
};

export default function MigrationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<Job["type"]>("patients");
  const [format, setFormat] = useState<Job["input_format"]>("csv");
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) loadJobs();
  }, [isAuthenticated, isLoading]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/migration/jobs`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Falha ao carregar jobs");
      setJobs(await res.json());
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar jobs de migração");
    } finally {
      setLoading(false);
    }
  };

  const createJob = async () => {
    if (!file) {
      toast.error("Por favor, selecione um arquivo");
      return;
    }
    
    try {
      setUploading(true);
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/migration/jobs`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: "include",
        body: JSON.stringify({ type, input_format: format, source_name: sourceName || undefined }),
      });
      if (!res.ok) throw new Error("Falha ao criar job");
      const job = await res.json();
      
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch(`${API_URL}/api/migration/jobs/${job.id}/upload`, { 
        method: "POST", 
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: fd, 
        credentials: "include" 
      });
      if (!up.ok) throw new Error("Falha no upload");
      
      await loadJobs();
      setFile(null);
      setSourceName("");
      toast.success("Job de migração criado com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar job de migração");
    } finally {
      setUploading(false);
    }
  };

  const rollback = async (id: number) => {
    // Note: Migration rollback is a critical operation - keeping confirm for now
    if (!confirm("Tem certeza que deseja fazer rollback desta migração?")) return;
    try {
      const token = getAccessToken();
      await fetch(`${API_URL}/api/migration/jobs/${id}/rollback`, { 
        method: "POST", 
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: "include" 
      });
      await loadJobs();
      toast.success("Rollback solicitado com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao fazer rollback");
    }
  };

  const summary = useMemo(() => {
    const total = jobs.length;
    const counts = {
      completed: jobs.filter(j => j.status === "completed").length,
      running: jobs.filter(j => j.status === "running").length,
      pending: jobs.filter(j => j.status === "pending").length,
      failed: jobs.filter(j => j.status === "failed").length,
      rolled_back: jobs.filter(j => j.status === "rolled_back").length,
    };
    const progress = total ? Math.round((counts.completed / total) * 100) : 0;
    return { total, ...counts, progress };
  }, [jobs]);

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rolled_back':
        return <ArrowLeftRight className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeColor = (status: Job["status"]) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rolled_back':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: Job["status"]) => {
    const labels: Record<Job["status"], string> = {
      completed: 'Concluído',
      failed: 'Falhou',
      running: 'Em Execução',
      pending: 'Pendente',
      rolled_back: 'Revertido'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: Job["type"]) => {
    const labels: Record<Job["type"], string> = {
      patients: 'Pacientes',
      appointments: 'Agendamentos',
      clinical: 'Clínico',
      financial: 'Financeiro'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
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
              <Database className="h-7 w-7 text-blue-600" />
            </div>
            Migração de Dados
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Crie, monitore e reverta jobs de migração de dados
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadJobs}
          disabled={loading}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso Geral
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.progress}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.completed} de {summary.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Migrações bem-sucedidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Execução
            </CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.running}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Processando agora
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Falhas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revertidos
            </CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{summary.rolled_back}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rollback realizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Job */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Criar Job de Migração</CardTitle>
              <CardDescription className="mt-1">
                Faça upload de dados e inicie a migração
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Dados</Label>
              <Select value={type} onValueChange={v => setType(v as Job["type"])}>
                <SelectTrigger id="type" className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patients">Pacientes</SelectItem>
                  <SelectItem value="appointments">Agendamentos</SelectItem>
                  <SelectItem value="clinical">Clínico</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="format">Formato</Label>
              <Select value={format} onValueChange={v => setFormat(v as Job["input_format"])}>
                <SelectTrigger id="format" className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sourceName">Nome da Fonte (opcional)</Label>
              <Input
                id="sourceName"
                placeholder="Ex: Sistema Antigo"
                value={sourceName}
                onChange={e => setSourceName(e.target.value)}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                accept={format === 'csv' ? '.csv' : '.json'}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
          </div>
          <Button 
            onClick={createJob} 
            disabled={uploading || !file}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Migração
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Jobs ({jobs.length})
              </CardTitle>
              <CardDescription className="mt-1">
                Jobs de migração recentes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.map(j => (
            <div 
              key={j.id} 
              className={cn(
                "border-2 rounded-lg p-4 hover:shadow-md transition-all",
                j.status === 'completed' && "border-green-200 bg-green-50/30",
                j.status === 'failed' && "border-red-200 bg-red-50/30",
                j.status === 'running' && "border-blue-200 bg-blue-50/30",
                j.status === 'pending' && "border-yellow-200 bg-yellow-50/30",
                j.status === 'rolled_back' && "border-gray-200 bg-gray-50/30"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      j.status === 'completed' && "bg-green-100",
                      j.status === 'failed' && "bg-red-100",
                      j.status === 'running' && "bg-blue-100",
                      j.status === 'pending' && "bg-yellow-100",
                      j.status === 'rolled_back' && "bg-gray-100"
                    )}>
                      {getStatusIcon(j.status)}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        #{j.id} • {getTypeLabel(j.type)} • {getStatusLabel(j.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Criado em {new Date(j.created_at).toLocaleString('pt-BR')}
                        {j.source_name && ` • Fonte: ${j.source_name}`}
                      </div>
                    </div>
                  </div>
                  {j.stats && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Estatísticas:</div>
                      <pre className="text-xs overflow-x-auto">{JSON.stringify(j.stats, null, 2)}</pre>
                    </div>
                  )}
                  {j.errors && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Erros:
                      </div>
                      <pre className="text-xs text-red-800 overflow-x-auto">{JSON.stringify(j.errors, null, 2)}</pre>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge className={cn("border", getStatusBadgeColor(j.status))}>
                    {getStatusLabel(j.status)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => rollback(j.id)} 
                    disabled={j.status === 'running' || j.status === 'rolled_back'}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-1" />
                    Rollback
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum job de migração ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
