"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { analyticsApi, ClinicalAnalytics, FinancialAnalytics, InventoryAnalytics } from '@/lib/analytics-api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
  { value: 'last_year', label: 'Último ano' },
];

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
};

const generateColors = (count: number) => {
  const colors = Object.values(CHART_COLORS);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  
  const [clinicalData, setClinicalData] = useState<ClinicalAnalytics | null>(null);
  const [financialData, setFinancialData] = useState<FinancialAnalytics | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('ReportsPage useEffect:', { isAuthenticated, isLoading, selectedPeriod });
    
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      console.log('User authenticated, loading analytics data');
      loadAnalyticsData();
    }
  }, [isAuthenticated, isLoading, router, selectedPeriod]);

  const loadAnalyticsData = async () => {
    // Only load data if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping analytics data load');
      return;
    }
    
    setLoading(true);
    try {
      const [clinical, financial, inventory] = await Promise.all([
        analyticsApi.getClinicalAnalytics(selectedPeriod),
        analyticsApi.getFinancialAnalytics(selectedPeriod),
        analyticsApi.getInventoryAnalytics(selectedPeriod),
      ]);
      
      setClinicalData(clinical);
      setFinancialData(financial);
      setInventoryData(inventory);
    } catch (error: any) {
      console.error('Failed to load analytics data:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e BI</h1>
          <p className="text-muted-foreground">
            Análise de dados clínicos, financeiros e de estoque
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
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
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Período Personalizado</label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Analytics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Análise Clínica
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Diagnoses */}
          <Card>
            <CardHeader>
              <CardTitle>Top Diagnósticos (CID-10)</CardTitle>
              <CardDescription>
                Principais diagnósticos no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalData?.top_diagnoses && clinicalData.top_diagnoses.length > 0 ? (
                <BarChart
                  data={{
                    labels: clinicalData.top_diagnoses.map(d => d.icd10_code),
                    datasets: [{
                      label: 'Número de Casos',
                      data: clinicalData.top_diagnoses.map(d => d.count),
                      backgroundColor: CHART_COLORS.primary,
                      borderColor: CHART_COLORS.primary,
                      borderWidth: 1,
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patients by Age Group */}
          <Card>
            <CardHeader>
              <CardTitle>Pacientes por Faixa Etária</CardTitle>
              <CardDescription>
                Distribuição de pacientes por grupos de idade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalData?.patients_by_age_group && clinicalData.patients_by_age_group.length > 0 ? (
                <PieChart
                  data={{
                    labels: clinicalData.patients_by_age_group.map(a => a.age_group),
                    datasets: [{
                      label: 'Número de Pacientes',
                      data: clinicalData.patients_by_age_group.map(a => a.count),
                      backgroundColor: generateColors(clinicalData.patients_by_age_group.length),
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Status</CardTitle>
              <CardDescription>
                Distribuição de consultas por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalData?.appointments_by_status && clinicalData.appointments_by_status.length > 0 ? (
                <BarChart
                  data={{
                    labels: clinicalData.appointments_by_status.map(s => s.status),
                    datasets: [{
                      label: 'Número de Consultas',
                      data: clinicalData.appointments_by_status.map(s => s.count),
                      backgroundColor: generateColors(clinicalData.appointments_by_status.length),
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consultations by Doctor */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Médico</CardTitle>
              <CardDescription>
                Número de consultas realizadas por médico
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalData?.consultations_by_doctor && clinicalData.consultations_by_doctor.length > 0 ? (
                <BarChart
                  data={{
                    labels: clinicalData.consultations_by_doctor.map(d => d.doctor_name),
                    datasets: [{
                      label: 'Número de Consultas',
                      data: clinicalData.consultations_by_doctor.map(d => d.count),
                      backgroundColor: CHART_COLORS.secondary,
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Analytics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Análise Financeira
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Doctor */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Médico</CardTitle>
              <CardDescription>
                Receita gerada por cada médico no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialData?.revenue_by_doctor && financialData.revenue_by_doctor.length > 0 ? (
                <BarChart
                  data={{
                    labels: financialData.revenue_by_doctor.map(d => d.doctor_name),
                    datasets: [{
                      label: 'Receita (R$)',
                      data: financialData.revenue_by_doctor.map(d => d.total_revenue),
                      backgroundColor: CHART_COLORS.accent,
                    }],
                  }}
                  height={300}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value: any) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Service */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Serviço</CardTitle>
              <CardDescription>
                Principais serviços por receita gerada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialData?.revenue_by_service && financialData.revenue_by_service.length > 0 ? (
                <PieChart
                  data={{
                    labels: financialData.revenue_by_service.map(s => s.service_name),
                    datasets: [{
                      label: 'Receita (R$)',
                      data: financialData.revenue_by_service.map(s => s.total_revenue),
                      backgroundColor: generateColors(financialData.revenue_by_service.length),
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendência de Receita Mensal</CardTitle>
              <CardDescription>
                Evolução da receita ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(financialData as any)?.monthly_revenue && (financialData as any).monthly_revenue.length > 0 ? (
                <LineChart
                  data={{
                    labels: (financialData as any).monthly_revenue.map((m: any) => m.month),
                    datasets: [{
                      label: 'Receita (R$)',
                      data: (financialData as any).monthly_revenue.map((m: any) => m.revenue),
                      borderColor: CHART_COLORS.primary,
                      backgroundColor: CHART_COLORS.primary + '20',
                      tension: 0.4,
                    }],
                  }}
                  height={300}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value: any) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary Cards */}
        {(financialData as any)?.total_stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(financialData as any).total_stats.total_revenue.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(financialData as any).total_stats.total_invoices}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(financialData as any).total_stats.avg_invoice_value.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Inventory Analytics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Análise de Estoque
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Movements by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações por Tipo</CardTitle>
              <CardDescription>
                Distribuição de movimentações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryData?.stock_movements_by_type && inventoryData.stock_movements_by_type.length > 0 ? (
                <PieChart
                  data={{
                    labels: inventoryData.stock_movements_by_type.map(m => m.type),
                    datasets: [{
                      label: 'Quantidade',
                      data: inventoryData.stock_movements_by_type.map(m => m.count),
                      backgroundColor: generateColors(inventoryData.stock_movements_by_type.length),
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products by Movement */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Mais Movimentação</CardTitle>
              <CardDescription>
                Produtos com maior número de movimentações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryData?.top_products_by_movement && inventoryData.top_products_by_movement.length > 0 ? (
                <BarChart
                  data={{
                    labels: inventoryData.top_products_by_movement.map(p => p.product_name),
                    datasets: [{
                      label: 'Quantidade Total',
                      data: inventoryData.top_products_by_movement.map(p => p.total_quantity),
                      backgroundColor: CHART_COLORS.purple,
                    }],
                  }}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Products Table */}
        {inventoryData?.low_stock_products && inventoryData.low_stock_products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
              <CardDescription>
                Produtos que precisam de reposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Produto</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-left p-2">Estoque Atual</th>
                      <th className="text-left p-2">Estoque Mínimo</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.low_stock_products.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.product_name}</td>
                        <td className="p-2">{(product as any).category || 'N/A'}</td>
                        <td className="p-2">{product.current_stock}</td>
                        <td className="p-2">{product.min_stock}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.current_stock === 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.current_stock === 0 ? 'Sem Estoque' : 'Estoque Baixo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
