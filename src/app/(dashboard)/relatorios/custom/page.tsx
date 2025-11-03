"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type Domain = 'appointments' | 'financial' | 'clinical';

export default function CustomReportsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain>('appointments');
  const [period, setPeriod] = useState('last_30_days');
  const [groupBy, setGroupBy] = useState<string[]>(['status']);
  const [result, setResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading]);

  const availableGroups = useMemo(() => {
    if (domain === 'appointments') return ['status', 'doctor'];
    if (domain === 'financial') return ['doctor', 'service'];
    return ['cid10'];
  }, [domain]);

  const toggleGroup = (g: string) => {
    setGroupBy(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ columns: string[]; rows: any[] }>(
        '/api/analytics/custom/run',
        { domain, period, group_by: groupBy, metrics: ['count'] }
      );
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!result) return;
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/custom/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
      },
      body: JSON.stringify({ title: 'Custom Report', columns: result.columns, rows: result.rows }),
    });
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom_report.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Construtor de Relatórios</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runReport} disabled={loading}>Executar</Button>
          <Button variant="outline" onClick={exportExcel} disabled={!result}>Exportar Excel</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-sm mb-2">Domínio</div>
              <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointments">Consultas</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="clinical">Clínico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-2">Período</div>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                  <SelectItem value="last_month">Mês passado</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                  <SelectItem value="last_year">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-2">Agrupar por</div>
              <div className="flex gap-2 flex-wrap">
                {availableGroups.map(g => (
                  <Button key={g} variant={groupBy.includes(g) ? 'default' : 'outline'} onClick={() => toggleGroup(g)}>
                    {g}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {result.columns.map(col => (
                      <th key={col} className="text-left p-2 capitalize">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {result.columns.map(col => (
                        <td key={col} className="p-2">{String(row[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


