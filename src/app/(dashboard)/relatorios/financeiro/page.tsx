"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { FinancialAnalytics } from '@/lib/analytics-api';
import { useFinancialAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  accent: '#f59e0b',
};

export default function FinancialReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading: swrLoading } = useFinancialAnalytics('last_month');

  const exportExcel = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${base}/api/analytics/export/financial/excel?period=last_month`;
    const token = localStorage.getItem('clinicore_access_token') || '';
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return;
    const blob = await resp.blob();
    const dlUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'relatorio_financeiro.xlsx';
    a.click();
    window.URL.revokeObjectURL(dlUrl);
  };

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
    // SWR handles fetching
  }, [isAuthenticated, authLoading, swrLoading]);

  if (authLoading || swrLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 justify-between">
        <DollarSign className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportExcel}>
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Médico</CardTitle>
            <CardDescription>Período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_doctor?.length ? (
              <BarChart
                data={{
                  labels: data.revenue_by_doctor.map(d => d.doctor_name),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.revenue_by_doctor.map(d => d.total_revenue),
                    backgroundColor: COLORS.accent,
                  }],
                }}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Serviço</CardTitle>
            <CardDescription>Participação por serviço</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_service?.length ? (
              <PieChart
                data={{
                  labels: data.revenue_by_service.map(s => s.service_name),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.revenue_by_service.map(s => s.total_revenue),
                    backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'],
                  }],
                }}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Mensal de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthly_revenue_trend?.length ? (
              <LineChart
                data={{
                  labels: data.monthly_revenue_trend.map(m => m.month),
                  datasets: [{
                    label: 'Receita (R$)',
                    data: data.monthly_revenue_trend.map(m => m.total_revenue),
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.primary + '20',
                    tension: 0.4,
                  }],
                }}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Sem dados</div>
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
            {data ? (
              <BarChart
                data={{
                  labels: ['current', '1-30', '31-60', '61-90', '>90'],
                  datasets: [{
                    label: 'Valor (R$)',
                    data: [(data as any).ar_aging?.["current"]||0, (data as any).ar_aging?.["1-30"]||0, (data as any).ar_aging?.["31-60"]||0, (data as any).ar_aging?.["61-90"]||0, (data as any).ar_aging?.[">90"]||0],
                    backgroundColor: COLORS.primary,
                  }],
                }}
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custo Médio por Procedimento</CardTitle>
            <CardDescription>Ticket médio por serviço</CardDescription>
          </CardHeader>
          <CardContent>
            {(data as any)?.cost_per_procedure?.length ? (
              <BarChart
                data={{
                  labels: (data as any).cost_per_procedure.map((x: any) => x.service_name),
                  datasets: [{
                    label: 'Custo Médio (R$)',
                    data: (data as any).cost_per_procedure.map((x: any) => x.avg_cost),
                    backgroundColor: COLORS.accent,
                  }],
                }}
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


