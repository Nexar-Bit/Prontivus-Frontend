"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, PieChart } from '@/components/charts';
import { ClinicalAnalytics } from '@/lib/analytics-api';
import { useClinicalAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Loader2, Download, RefreshCw, FileText, UserCheck, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
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

  if (authLoading || swrLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados clínicos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios Clínicos</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Erro ao carregar dados: {error.message || 'Erro desconhecido'}</p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPatients = data?.patients_by_age_group?.reduce((sum, group) => sum + group.count, 0) || 0;
  const totalConsultations = data?.consultations_by_doctor?.reduce((sum, doc) => sum + doc.count, 0) || 0;
  const totalDiagnoses = data?.top_diagnoses?.reduce((sum, diag) => sum + diag.count, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios Clínicos</h1>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={swrLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${swrLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportPdf} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Pacientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  {totalPatients}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Consultas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  {totalConsultations}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Diagnósticos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <FileText className="h-5 w-5 text-purple-600" />
                  {totalDiagnoses}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Médicos Atendendo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.consultations_by_doctor?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Diagnósticos (CID-10)</CardTitle>
                <CardDescription>Principais diagnósticos no período</CardDescription>
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
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacientes por Faixa Etária</CardTitle>
                <CardDescription>Distribuição por idade</CardDescription>
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
                        backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'],
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultas por Status</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
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
                        backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'],
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultas por Médico</CardTitle>
                <CardDescription>Distribuição por profissional</CardDescription>
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
                      }],
                    }}
                    height={300}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Diagnósticos</CardTitle>
                <CardDescription>Lista detalhada</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.top_diagnoses && data.top_diagnoses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">CID-10</th>
                          <th className="text-left p-3 font-semibold">Descrição</th>
                          <th className="text-right p-3 font-semibold">Casos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.top_diagnoses.map((diag, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-mono">{diag.icd10_code}</td>
                            <td className="p-3">{diag.description || '-'}</td>
                            <td className="p-3 text-right">{diag.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultas por Médico</CardTitle>
                <CardDescription>Detalhamento por profissional</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.consultations_by_doctor && data.consultations_by_doctor.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Médico</th>
                          <th className="text-right p-3 font-semibold">Consultas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.consultations_by_doctor.map((doc, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/30">
                            <td className="p-3">{doc.doctor_name || 'Desconhecido'}</td>
                            <td className="p-3 text-right">{doc.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Sem dados disponíveis
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


