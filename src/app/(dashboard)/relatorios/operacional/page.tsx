"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart } from '@/components/charts';
import { useOperationalAnalytics } from '@/lib/analytics-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock } from 'lucide-react';

type OperationalData = {
  utilization: { label: string; value: number }[];
  avg_wait_time_minutes: number;
  no_shows: number;
};

const COLORS = { primary: '#3b82f6' };

export default function OperationalReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading: swrLoading } = useOperationalAnalytics('last_30_days');

  useEffect(() => {
    if (!swrLoading && !isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }
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
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Relatórios Operacionais</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Utilização de Agenda</CardTitle>
            <CardDescription>Por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            {(data as any)?.utilization?.length ? (
              <BarChart
                data={{
                  labels: (data as any).utilization.map((x: any) => x.label),
                  datasets: [{
                    label: 'Consultas',
                    data: (data as any).utilization.map((x: any) => x.value),
                    backgroundColor: COLORS.primary,
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
            <CardTitle>Tempo Médio de Espera</CardTitle>
            <CardDescription>Por semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {Math.round((data as any)?.avg_wait_time_minutes || 0)} min
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


