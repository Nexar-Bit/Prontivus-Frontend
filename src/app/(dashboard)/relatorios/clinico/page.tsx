"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, PieChart } from '@/components/charts';
import { ClinicalAnalytics } from '@/lib/analytics-api';
import { useClinicalAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
};

export default function ClinicalReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data, isLoading: swrLoading } = useClinicalAnalytics('last_30_days');

  const exportPdf = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${base}/api/analytics/export/clinical/pdf?period=last_30_days`;
    const token = localStorage.getItem('clinicore_access_token') || '';
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return;
    const blob = await resp.blob();
    const dlUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'relatorio_clinico.pdf';
    a.click();
    window.URL.revokeObjectURL(dlUrl);
  };

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
    // SWR handles fetching when authenticated
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
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Relatórios Clínicos</h1>
        <div className="ml-auto">
          <Button variant="outline" onClick={exportPdf}>
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Diagnósticos</CardTitle>
            <CardDescription>Principais CID-10</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.top_diagnoses?.length ? (
              <BarChart
                data={{
                  labels: data.top_diagnoses.map(d => d.icd10_code),
                  datasets: [{
                    label: 'Casos',
                    data: data.top_diagnoses.map(d => d.count),
                    backgroundColor: CHART_COLORS.primary,
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
            <CardTitle>Pacientes por Idade</CardTitle>
            <CardDescription>Distribuição por faixa etária</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.patients_by_age_group?.length ? (
              <PieChart
                data={{
                  labels: data.patients_by_age_group.map(a => a.age_group),
                  datasets: [{
                    label: 'Pacientes',
                    data: data.patients_by_age_group.map(a => a.count),
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
      </div>
    </div>
  );
}


