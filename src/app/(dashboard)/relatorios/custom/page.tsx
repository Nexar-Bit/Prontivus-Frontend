"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Domain = 'appointments' | 'financial' | 'clinical';

export default function CustomReportsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain>('appointments');
  const [period, setPeriod] = useState('last_30_days');
  const [groupBy, setGroupBy] = useState<string[]>(['status']);
  const [result, setResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Reset groupBy when domain changes
  useEffect(() => {
    if (domain === 'appointments') {
      setGroupBy(['status']);
    } else if (domain === 'financial') {
      setGroupBy(['doctor']);
    } else {
      setGroupBy(['cid10']);
    }
    setResult(null);
    setError(null);
  }, [domain]);

  const toggleGroup = (g: string) => {
    setGroupBy(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const runReport = async () => {
    if (groupBy.length === 0) {
      toast.error('Selecione pelo menos uma opção para agrupar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await api.post<{ columns: string[]; rows: any[] }>(
        '/api/analytics/custom/run',
        { domain, period, group_by: groupBy, metrics: domain === 'financial' ? ['sum_revenue'] : ['count'] }
      );
      
      if (res && res.columns && res.rows) {
        setResult(res);
        if (res.rows.length === 0) {
          toast.info('Nenhum dado encontrado para os filtros selecionados');
        } else {
          toast.success(`Relatório gerado com ${res.rows.length} registros`);
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Erro ao gerar relatório';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!result || result.rows.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clinicore_access_token') : null;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/custom/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: `Relatório ${domain === 'appointments' ? 'Consultas' : domain === 'financial' ? 'Financeiro' : 'Clínico'}`, 
          columns: result.columns, 
          rows: result.rows 
        }),
      });

      if (!resp.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${domain}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Construtor de Relatórios</h1>
        <div className="flex gap-2">
          <Button variant="default" onClick={runReport} disabled={loading || groupBy.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              'Executar'
            )}
          </Button>
          <Button variant="outline" onClick={exportExcel} disabled={!result || result.rows.length === 0}>
            Exportar Excel
          </Button>
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
                {availableGroups.map(g => {
                  const labels: Record<string, string> = {
                    'status': 'Status',
                    'doctor': 'Médico',
                    'service': 'Serviço',
                    'cid10': 'CID-10'
                  };
                  return (
                    <Button 
                      key={g} 
                      variant={groupBy.includes(g) ? 'default' : 'outline'} 
                      onClick={() => toggleGroup(g)}
                    >
                      {labels[g] || g}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando relatório...</p>
          </div>
        </div>
      )}

      {result && result.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              Total de registros: {result.rows.length}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {result.columns.map(col => {
                      const columnLabels: Record<string, string> = {
                        'status': 'Status',
                        'doctor': 'Médico',
                        'service': 'Serviço',
                        'cid10': 'CID-10',
                        'count': 'Quantidade',
                        'sum_revenue': 'Receita Total (R$)'
                      };
                      return (
                        <th key={col} className="text-left p-3 font-semibold">
                          {columnLabels[col] || col}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30">
                      {result.columns.map(col => {
                        let value = row[col] ?? '';
                        if (col === 'sum_revenue' && typeof value === 'number') {
                          value = new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(value);
                        }
                        return (
                          <td key={col} className="p-3">
                            {String(value)}
                          </td>
                        );
                      })}
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


