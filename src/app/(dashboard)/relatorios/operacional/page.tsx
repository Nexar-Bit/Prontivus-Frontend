"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart } from '@/components/charts';
import { useOperationalAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Loader2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = { primary: '#3b82f6' };

export default function OperationalReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState('last_30_days');
  const { data, isLoading: swrLoading, error, refresh } = useOperationalAnalytics(period);

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, swrLoading]);

  const handleRefresh = () => {
    refresh();
    toast.success('Dados atualizados');
  };

  const handleExport = async () => {
    if (!data) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/operational/excel?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_operacional_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Relatório exportado com sucesso');
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar relatório');
    }
  };

  if (authLoading || swrLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados operacionais...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios Operacionais</h1>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios Operacionais</h1>
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
          <Button variant="outline" onClick={handleExport} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Consultas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total_appointments || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Consultas Concluídas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.completed_appointments || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.completion_rate || 0}% de conclusão
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tempo Médio de Espera</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  {Math.round(data.avg_wait_time_minutes || 0)} min
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Faltas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data.no_shows || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Utilização de Agenda</CardTitle>
                <CardDescription>Por dia da semana</CardDescription>
              </CardHeader>
              <CardContent>
                {data.utilization && data.utilization.length > 0 ? (
                  <BarChart
                    data={{
                      labels: data.utilization.map((x) => x.label),
                      datasets: [{
                        label: 'Consultas',
                        data: data.utilization.map((x) => x.value),
                        backgroundColor: COLORS.primary,
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
                <CardTitle>Resumo Operacional</CardTitle>
                <CardDescription>Período: {data.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Período:</span>
                    <span className="font-medium">
                      {new Date(data.start_date).toLocaleDateString('pt-BR')} - {new Date(data.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Consultas:</span>
                    <span className="font-medium">{data.total_appointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consultas Concluídas:</span>
                    <span className="font-medium">{data.completed_appointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Conclusão:</span>
                    <span className="font-medium">{data.completion_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tempo Médio de Espera:</span>
                    <span className="font-medium">{Math.round(data.avg_wait_time_minutes || 0)} minutos</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Faltas:</span>
                    <span className="font-medium text-red-600">{data.no_shows || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


