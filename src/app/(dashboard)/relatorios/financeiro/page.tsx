"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { FinancialAnalytics } from '@/lib/analytics-api';
import { useFinancialAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Loader2, Download, RefreshCw, TrendingUp, FileText, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = {
  primary: '#3b82f6',
  accent: '#f59e0b',
};

export default function FinancialReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState('last_month');
  const { data, isLoading: swrLoading, error, refresh } = useFinancialAnalytics(period);

  const handleRefresh = () => {
    refresh();
    toast.success('Dados atualizados');
  };

  const exportExcel = async () => {
    if (!data) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${base}/api/analytics/export/financial/excel?period=${period}`;
      const resp = await fetch(url, { 
        headers: { 
          'Authorization': `Bearer ${token}` 
        } 
      });
      
      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }
      
      const blob = await resp.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `relatorio_financeiro_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
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
          <Button variant="outline" onClick={exportExcel} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Receita Total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  {formatCurrency(data.total_revenue || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Faturas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <FileText className="h-5 w-5" />
                  {data.total_invoices || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ticket Médio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.average_invoice_value || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recebíveis em Aberto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  {data.ar_aging ? formatCurrency(
                    (data.ar_aging.current || 0) +
                    (data.ar_aging["1-30"] || 0) +
                    (data.ar_aging["31-60"] || 0) +
                    (data.ar_aging["61-90"] || 0) +
                    (data.ar_aging[">90"] || 0)
                  ) : formatCurrency(0)}
                </div>
              </CardContent>
            </Card>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Médico</CardTitle>
            <CardDescription>Período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_doctor && data.revenue_by_doctor.length > 0 ? (
              <BarChart
                data={{
                  labels: data.revenue_by_doctor.map(d => d.doctor_name || 'Desconhecido'),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.revenue_by_doctor.map(d => d.total_revenue),
                    backgroundColor: COLORS.accent,
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
            <CardTitle>Receita por Serviço</CardTitle>
            <CardDescription>Participação por serviço</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_service && data.revenue_by_service.length > 0 ? (
              <PieChart
                data={{
                  labels: data.revenue_by_service.map(s => s.service_name || 'Desconhecido'),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.revenue_by_service.map(s => s.total_revenue),
                    backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16'],
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Mensal de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthly_revenue_trend && data.monthly_revenue_trend.length > 0 ? (
              <LineChart
                data={{
                  labels: data.monthly_revenue_trend.map(m => {
                    // Format month string to readable format
                    try {
                      const [year, month] = m.month.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                    } catch {
                      return m.month;
                    }
                  }),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.monthly_revenue_trend.map(m => m.total_revenue),
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.primary + '20',
                    tension: 0.4,
                    fill: true,
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

      {/* AR Aging and Cost per Procedure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aging de Recebíveis</CardTitle>
            <CardDescription>Saldo em aberto por faixa</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.ar_aging ? (
              <>
                <BarChart
                  data={{
                    labels: ['Atual', '1-30 dias', '31-60 dias', '61-90 dias', '>90 dias'],
                    datasets: [{
                      label: 'Valor (R$)',
                      data: [
                        data.ar_aging.current || 0,
                        data.ar_aging["1-30"] || 0,
                        data.ar_aging["31-60"] || 0,
                        data.ar_aging["61-90"] || 0,
                        data.ar_aging[">90"] || 0
                      ],
                      backgroundColor: [
                        '#10b981', // green for current
                        '#3b82f6', // blue for 1-30
                        '#f59e0b', // orange for 31-60
                        '#ef4444', // red for 61-90
                        '#dc2626'  // dark red for >90
                      ],
                    }],
                  }}
                  height={280}
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Total em aberto: {formatCurrency(
                    (data.ar_aging.current || 0) +
                    (data.ar_aging["1-30"] || 0) +
                    (data.ar_aging["31-60"] || 0) +
                    (data.ar_aging["61-90"] || 0) +
                    (data.ar_aging[">90"] || 0)
                  )}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custo Médio por Procedimento</CardTitle>
            <CardDescription>Ticket médio por serviço</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.cost_per_procedure && data.cost_per_procedure.length > 0 ? (
              <BarChart
                data={{
                  labels: data.cost_per_procedure.map(x => x.service_name || 'Desconhecido'),
                  datasets: [{
                    label: 'Ticket Médio (R$)',
                    data: data.cost_per_procedure.map(x => x.avg_cost || 0),
                    backgroundColor: COLORS.accent,
                  }],
                }}
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
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


