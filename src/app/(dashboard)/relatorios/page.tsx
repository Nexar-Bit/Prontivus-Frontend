"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { analyticsApi, ClinicalAnalytics, FinancialAnalytics, InventoryAnalytics } from '@/lib/analytics-api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Package,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  FileText,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Sparkles,
  Eye,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
  { value: 'last_year', label: 'Último ano' },
];

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
  purple: '#a78bfa',      // Soft purple for variety
  danger: '#ef4444',      // Keep red for errors/warnings
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
    try {
      // Prepare export data
      const exportData = {
        period: selectedPeriod,
        dateRange: dateRange ? {
          from: dateRange.from?.toISOString(),
          to: dateRange.to?.toISOString(),
        } : null,
        summary: summaryStats,
        clinical: {
          patientsByAge: clinicalData?.patients_by_age_group || [],
          appointmentsByStatus: clinicalData?.appointments_by_status || [],
          diagnoses: clinicalData?.top_diagnoses || [],
        },
        financial: {
          revenue: financialData ? {
            total: (financialData as any)?.total_stats?.total_revenue || 0,
            byMonth: (financialData as any)?.revenue_by_month || [],
          } : null,
          invoices: (financialData as any)?.total_stats?.total_invoices || 0,
        },
        inventory: {
          lowStock: inventoryData?.low_stock_products || [],
          movements: inventoryData?.stock_movements_by_type || [],
        },
        exportedAt: new Date().toISOString(),
      };

      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorios-prontivus-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatórios exportados com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar relatórios');
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPatients = clinicalData?.patients_by_age_group?.reduce((sum, g) => sum + g.count, 0) || 0;
    const totalAppointments = clinicalData?.appointments_by_status?.reduce((sum, s) => sum + s.count, 0) || 0;
    const totalRevenue = (financialData as any)?.total_stats?.total_revenue || 0;
    const totalInvoices = (financialData as any)?.total_stats?.total_invoices || 0;
    const lowStockCount = inventoryData?.low_stock_products?.length || 0;
    const totalMovements = inventoryData?.stock_movements_by_type?.reduce((sum, m) => sum + m.count, 0) || 0;

    return {
      totalPatients,
      totalAppointments,
      totalRevenue,
      totalInvoices,
      lowStockCount,
      totalMovements,
    };
  }, [clinicalData, financialData, inventoryData]);

  if (isLoading) {
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

  if (loading) {
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
              <BarChart3 className="h-6 w-6" />
            </div>
            Relatórios e Business Intelligence
          </h1>
          <p className="text-muted-foreground">
            Análise completa de dados clínicos, financeiros e de estoque
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
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
            <div className="text-2xl font-bold">{summaryStats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultas realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {summaryStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.totalInvoices} faturas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Baixo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos precisando reposição
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Período
          </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || 'Período'}
            </Badge>
          </div>
          <CardDescription>
            Selecione o período para análise dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Período Rápido</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-10">
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
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[280px]">
              <label className="text-sm font-medium">Período Personalizado</label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          Análise Clínica
        </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
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
                  {clinicalData?.top_diagnoses?.length || 0}
                </Badge>
              </div>
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
                  {clinicalData?.patients_by_age_group?.length || 0}
                </Badge>
              </div>
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
                  {clinicalData?.appointments_by_status?.length || 0}
                </Badge>
              </div>
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
                  {clinicalData?.consultations_by_doctor?.length || 0}
                </Badge>
              </div>
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
      </div>

      {/* Financial Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          Análise Financeira
        </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Doctor */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                    Receita por Médico
                  </CardTitle>
                  <CardDescription className="mt-1">
                Receita gerada por cada médico no período
              </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  {financialData?.revenue_by_doctor?.length || 0}
                </Badge>
              </div>
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
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground">
                    Não há receita registrada no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Service */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    Receita por Serviço
                  </CardTitle>
                  <CardDescription className="mt-1">
                Principais serviços por receita gerada
              </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {financialData?.revenue_by_service?.length || 0}
                </Badge>
              </div>
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
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground">
                    Não há serviços com receita no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Tendência de Receita Mensal
                  </CardTitle>
                  <CardDescription className="mt-1">
                Evolução da receita ao longo do tempo
              </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {(financialData as any)?.monthly_revenue?.length || 0} meses
                </Badge>
              </div>
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
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground">
                    Não há dados de receita mensal no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary Cards */}
        {(financialData as any)?.total_stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(financialData as any).total_stats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No período selecionado
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Faturas</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(financialData as any).total_stats.total_invoices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Faturas emitidas
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(financialData as any).total_stats.avg_invoice_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor médio por fatura
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Inventory Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          Análise de Estoque
        </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Movements by Type */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Movimentações por Tipo
                  </CardTitle>
                  <CardDescription className="mt-1">
                Distribuição de movimentações de estoque
              </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  {inventoryData?.stock_movements_by_type?.length || 0}
                </Badge>
              </div>
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
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground">
                    Não há movimentações de estoque no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products by Movement */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    Produtos com Mais Movimentação
                  </CardTitle>
                  <CardDescription className="mt-1">
                Produtos com maior número de movimentações
              </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {inventoryData?.top_products_by_movement?.length || 0}
                </Badge>
              </div>
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
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground">
                    Não há produtos com movimentação no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Products Table */}
        {inventoryData?.low_stock_products && inventoryData.low_stock_products.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Produtos com Estoque Baixo
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Produtos que precisam de reposição urgente
              </CardDescription>
                </div>
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {inventoryData.low_stock_products.length} {inventoryData.low_stock_products.length === 1 ? 'produto' : 'produtos'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 font-semibold">Produto</th>
                        <th className="text-left p-3 font-semibold">Categoria</th>
                        <th className="text-left p-3 font-semibold">Estoque Atual</th>
                        <th className="text-left p-3 font-semibold">Estoque Mínimo</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.low_stock_products.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{product.product_name}</td>
                          <td className="p-3 text-muted-foreground">{(product as any).category || 'N/A'}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-medium">
                              {product.current_stock}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{product.min_stock}</td>
                          <td className="p-3">
                            <Badge 
                              variant={product.current_stock === 0 ? "destructive" : "secondary"}
                              className={cn(
                            product.current_stock === 0 
                                  ? "bg-red-100 text-red-800 hover:bg-red-100 border-red-200" 
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                              )}
                            >
                              {product.current_stock === 0 ? (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Sem Estoque
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Estoque Baixo
                                </>
                              )}
                            </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
