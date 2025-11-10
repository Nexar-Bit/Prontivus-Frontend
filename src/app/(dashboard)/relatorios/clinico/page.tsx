"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { BarChart, PieChart } from '@/components/charts';
import { ClinicalAnalytics } from '@/lib/analytics-api';
import { useClinicalAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Loader2, 
  Download, 
  RefreshCw, 
  FileText, 
  UserCheck, 
  Stethoscope,
  Activity,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Printer,
  FileSpreadsheet,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Healthcare color palette - Softer blue tones (preferred by both genders)
const CHART_COLORS = {
  primary: '#5b9eff',      // Primary soft blue
  secondary: '#7db5ff',   // Light soft blue
  accent: '#a5d0ff',      // Very soft blue
  info: '#3d7ee8',        // Medium soft blue
  blue: '#5b9eff',        // Primary soft blue
  blueLight: '#a5d0ff',   // Light soft blue
  blueMedium: '#7db5ff',  // Medium soft blue
  blueDeep: '#3d7ee8',    // Deeper soft blue
  softBlue1: '#c7e2ff',   // Very light soft blue
  softBlue2: '#e0efff',  // Extremely light soft blue
  green: '#4ade80',       // Soft green for success
  danger: '#ef4444',      // Keep red for errors/warnings
};

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
  { value: 'last_year', label: 'Último ano' },
];

const generateColors = (count: number) => {
  const colors = Object.values(CHART_COLORS);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export default function ClinicalReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState('last_30_days');
  const { data, isLoading: swrLoading, error, refresh } = useClinicalAnalytics(period);

  const handleRefresh = () => {
    refresh();
    toast.success('Dados atualizados');
  };

  const exportPdf = async () => {
    if (!data) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${base}/api/analytics/export/clinical/pdf?period=${period}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }
      
      const blob = await resp.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `relatorio_clinico_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(dlUrl);
      toast.success('Relatório exportado com sucesso');
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar relatório');
    }
  };

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, swrLoading]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data) return null;
    
    const totalPatients = data.patients_by_age_group?.reduce((sum, group) => sum + group.count, 0) || 0;
    const totalConsultations = data.consultations_by_doctor?.reduce((sum, doc) => sum + doc.count, 0) || 0;
    const totalDiagnoses = data.top_diagnoses?.reduce((sum, diag) => sum + diag.count, 0) || 0;
    const totalDoctors = data.consultations_by_doctor?.length || 0;
    const totalAppointments = data.appointments_by_status?.reduce((sum, s) => sum + s.count, 0) || 0;

    return {
      totalPatients,
      totalConsultations,
      totalDiagnoses,
      totalDoctors,
      totalAppointments,
    };
  }, [data]);

  if (authLoading || swrLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
        </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Clínicos</h1>
        </div>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Erro desconhecido ao carregar os dados clínicos'}
            </p>
            <Button onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg">
              <Stethoscope className="h-6 w-6" />
            </div>
            Relatórios Clínicos
          </h1>
          <p className="text-muted-foreground">
            Análise completa de dados clínicos e diagnósticos
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={swrLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", swrLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportPdf} disabled={!data} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {PERIOD_OPTIONS.find(p => p.value === period)?.label || 'Período'}
            </Badge>
          </div>
          <CardDescription>
            Selecione o período para análise dos dados clínicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-10 w-full sm:w-[250px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {data && summaryStats && (
        <>
          {/* Summary Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Pacientes
                </CardTitle>
                <UserCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalPatients}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No período selecionado
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Consultas
                </CardTitle>
                <Stethoscope className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalConsultations}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consultas realizadas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Diagnósticos
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalDiagnoses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diagnósticos registrados
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Médicos Atendendo
                </CardTitle>
                <Users className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalDoctors}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Profissionais ativos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Diagnoses */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Top Diagnósticos (CID-10)
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Principais diagnósticos no período selecionado
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3" />
                    {data.top_diagnoses?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data?.top_diagnoses && data.top_diagnoses.length > 0 ? (
                  <BarChart
                    data={{
                      labels: data.top_diagnoses.map(d => `${d.icd10_code}${d.description ? ` - ${d.description.substring(0, 20)}` : ''}`),
                      datasets: [{
                        label: 'Casos',
                        data: data.top_diagnoses.map(d => d.count),
                        backgroundColor: CHART_COLORS.primary,
                        borderColor: CHART_COLORS.primary,
                        borderWidth: 1,
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há diagnósticos registrados no período selecionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patients by Age Group */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600" />
                      Pacientes por Faixa Etária
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Distribuição de pacientes por grupos de idade
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {data.patients_by_age_group?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data?.patients_by_age_group && data.patients_by_age_group.length > 0 ? (
                  <PieChart
                    data={{
                      labels: data.patients_by_age_group.map(a => {
                        const labels: Record<string, string> = {
                          '0-17': '0-17 anos',
                          '18-35': '18-35 anos',
                          '36-55': '36-55 anos',
                          '56+': '56+ anos'
                        };
                        return labels[a.age_group] || a.age_group;
                      }),
                      datasets: [{
                        label: 'Pacientes',
                        data: data.patients_by_age_group.map(a => a.count),
                        backgroundColor: generateColors(data.patients_by_age_group.length),
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há pacientes registrados no período selecionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointments by Status */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      Consultas por Status
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Distribuição de consultas por status
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {data.appointments_by_status?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data?.appointments_by_status && data.appointments_by_status.length > 0 ? (
                  <PieChart
                    data={{
                      labels: data.appointments_by_status.map(s => {
                        const statusLabels: Record<string, string> = {
                          'scheduled': 'Agendada',
                          'checked_in': 'Check-in',
                          'in_consultation': 'Em Consulta',
                          'completed': 'Concluída',
                          'cancelled': 'Cancelada'
                        };
                        return statusLabels[s.status] || s.status;
                      }),
                      datasets: [{
                        label: 'Consultas',
                        data: data.appointments_by_status.map(s => s.count),
                        backgroundColor: generateColors(data.appointments_by_status.length),
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há consultas registradas no período selecionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultations by Doctor */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-indigo-600" />
                      Consultas por Médico
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Número de consultas realizadas por médico
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Stethoscope className="h-3 w-3" />
                    {data.consultations_by_doctor?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data?.consultations_by_doctor && data.consultations_by_doctor.length > 0 ? (
                  <BarChart
                    data={{
                      labels: data.consultations_by_doctor.map(d => d.doctor_name || 'Desconhecido'),
                      datasets: [{
                        label: 'Consultas',
                        data: data.consultations_by_doctor.map(d => d.count),
                        backgroundColor: CHART_COLORS.secondary,
                        borderColor: CHART_COLORS.secondary,
                        borderWidth: 1,
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Stethoscope className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há consultas por médico no período selecionado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Diagnoses Table */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Top Diagnósticos
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Lista detalhada dos principais diagnósticos
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {data.top_diagnoses?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data?.top_diagnoses && data.top_diagnoses.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                          <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 font-semibold">CID-10</th>
                          <th className="text-left p-3 font-semibold">Descrição</th>
                          <th className="text-right p-3 font-semibold">Casos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.top_diagnoses.map((diag, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3 font-mono font-medium text-blue-600">{diag.icd10_code}</td>
                              <td className="p-3">{diag.description || <span className="text-muted-foreground italic">Sem descrição</span>}</td>
                              <td className="p-3 text-right">
                                <Badge variant="outline" className="font-medium">
                                  {diag.count}
                                </Badge>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há diagnósticos registrados no período
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultations by Doctor Table */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-emerald-600" />
                      Consultas por Médico
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Detalhamento por profissional
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {data.consultations_by_doctor?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data?.consultations_by_doctor && data.consultations_by_doctor.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                          <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 font-semibold">Médico</th>
                          <th className="text-right p-3 font-semibold">Consultas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.consultations_by_doctor.map((doc, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3 font-medium">{doc.doctor_name || <span className="text-muted-foreground italic">Desconhecido</span>}</td>
                              <td className="p-3 text-right">
                                <Badge variant="outline" className="font-medium">
                                  {doc.count}
                                </Badge>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Stethoscope className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Não há consultas por médico no período
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


