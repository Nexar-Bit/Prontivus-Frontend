"use client";

import * as React from "react";
import FeatureGate from "@/components/flags/FeatureGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Heart,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import dynamic from "next/dynamic";
const AppointmentChart = dynamic(() => import("@/components/dashboard/appointment-chart").then(m=>m.AppointmentChart), { ssr: false, loading: () => <div className="h-40" /> });
const RevenueChart = dynamic(() => import("@/components/dashboard/revenue-chart").then(m=>m.RevenueChart), { ssr: false, loading: () => <div className="h-40" /> });
import { PatientVitalsChart } from "@/components/dashboard/patient-vitals-chart";
import { AppointmentHeatmap } from "@/components/dashboard/appointment-heatmap";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DashboardStats {
  patients: { value: number; change: number };
  appointments: { value: number; change: number };
  revenue: { value: number; change: number };
  satisfaction: { value: number; change: number };
  today_appointments: { value: number; change: number };
  pending_results: { value: number; change: number };
}

export default function Dashboard() {
  const { 
    user, 
    isAdmin, 
    isSecretary, 
    isDoctor, 
    isPatient, 
    getRoleDisplayName,
    canAccessFinancial,
  } = usePermissions();

  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<DashboardStats>("/api/analytics/dashboard/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      // Set default values on error
      setStats({
        patients: { value: 0, change: 0 },
        appointments: { value: 0, change: 0 },
        revenue: { value: 0, change: 0 },
        satisfaction: { value: 0, change: 0 },
        today_appointments: { value: 0, change: 0 },
        pending_results: { value: 0, change: 0 },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    toast.success('Dados atualizados', {
      description: 'Dashboard atualizado com sucesso.',
    });
  }, [fetchStats]);

  const handleExport = async (type: 'dashboard' | 'financial' | 'clinical' | 'operational', period: string, format: 'Excel' | 'PDF') => {
    try {
      setExporting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('clinicore_access_token');
      
      let endpoint = '';
      let filename = '';
      let mimeType = '';
      
      switch (type) {
        case 'dashboard':
          endpoint = `/api/analytics/export/dashboard/excel?period=${period}`;
          filename = `dashboard_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'financial':
          endpoint = `/api/analytics/export/financial/excel?period=${period}`;
          filename = `relatorio_financeiro_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'clinical':
          endpoint = `/api/analytics/export/clinical/pdf?period=${period}`;
          filename = `relatorio_clinico_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'operational':
          endpoint = `/api/analytics/export/operational/excel?period=${period}`;
          filename = `relatorio_operacional_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
      }
      
      const url = `${apiUrl}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to export: ${response.status} ${errorText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Relatório exportado com sucesso!', {
        description: `O arquivo ${filename} foi baixado.`,
      });
    } catch (err: any) {
      console.error("Failed to export:", err);
      toast.error('Erro ao exportar relatório', {
        description: err?.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setExporting(false);
    }
  };

  const getWelcomeMessage = () => {
    if (isPatient()) {
      return `Bem-vindo(a), ${user?.first_name || user?.username}! Acompanhe sua saúde.`;
    } else if (isDoctor()) {
      return `Bem-vindo(a), Dr(a). ${user?.first_name || user?.username}!`;
    } else if (isSecretary()) {
      return `Bem-vindo(a), ${user?.first_name || user?.username}!`;
    } else if (isAdmin()) {
      return `Bem-vindo(a), ${user?.first_name || user?.username}!`;
    }
    return "Bem-vindo(a) ao Prontivus!";
  };

  // Use real data from API or fallback to defaults
  const metrics = {
    patients: {
      value: stats?.patients.value ?? 0,
      change: stats?.patients.change ?? 0,
      trend: (stats?.patients.change ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Users,
      color: 'blue' as const,
      label: 'Pacientes Ativos',
      subtitle: 'Total cadastrado',
    },
    appointments: {
      value: stats?.appointments.value ?? 0,
      change: stats?.appointments.change ?? 0,
      trend: (stats?.appointments.change ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Calendar,
      color: 'orange' as const,
      label: 'Agendamentos Este Mês',
      subtitle: 'Consultas agendadas',
    },
    revenue: {
      value: stats?.revenue.value ?? 0,
      change: stats?.revenue.change ?? 0,
      trend: (stats?.revenue.change ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
      color: 'green' as const,
      label: 'Receita Mensal',
      subtitle: 'Faturamento total',
    },
    satisfaction: {
      value: stats?.satisfaction.value ?? 0,
      change: stats?.satisfaction.change ?? 0,
      trend: (stats?.satisfaction.change ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Heart,
      color: 'teal' as const,
      label: 'Satisfação dos Pacientes',
      subtitle: 'Avaliação média',
    },
    todayAppointments: {
      value: stats?.today_appointments.value ?? 0,
      change: stats?.today_appointments.change ?? 0,
      trend: (stats?.today_appointments.change ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Clock,
      color: 'orange' as const,
      label: 'Agendamentos Hoje',
      subtitle: 'Consultas agendadas',
    },
    pendingResults: {
      value: stats?.pending_results.value ?? 0,
      change: stats?.pending_results.change ?? 0,
      trend: (stats?.pending_results.change ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Activity,
      color: 'blue' as const,
      label: 'Resultados Pendentes',
      subtitle: 'Exames aguardando',
    },
  };

  const legacy = (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {getWelcomeMessage()}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex-1 sm:flex-initial"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Últimos 30 dias
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={exporting || loading}
                className="flex-1 sm:flex-initial"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Exportar Relatórios</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async (e) => {
                  e.preventDefault();
                  await handleExport('dashboard', 'last_30_days', 'Excel');
                }}
                disabled={exporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Dashboard Completo (Excel)
              </DropdownMenuItem>
              {canAccessFinancial() && (
                <DropdownMenuItem
                  onSelect={async (e) => {
                    e.preventDefault();
                    await handleExport('financial', 'last_month', 'Excel');
                  }}
                  disabled={exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Relatório Financeiro (Excel)
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={async (e) => {
                  e.preventDefault();
                  await handleExport('clinical', 'last_30_days', 'PDF');
                }}
                disabled={exporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatório Clínico (PDF)
              </DropdownMenuItem>
              {(isSecretary() || isAdmin()) && (
                <DropdownMenuItem
                  onSelect={async (e) => {
                    e.preventDefault();
                    await handleExport('operational', 'last_30_days', 'Excel');
                  }}
                  disabled={exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Relatório Operacional (Excel)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando dados...</span>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Key Metrics - Top Section */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={metrics.patients.icon}
          value={metrics.patients.value}
          change={metrics.patients.change}
          trend={metrics.patients.trend}
          color={metrics.patients.color}
          label={metrics.patients.label}
          subtitle={metrics.patients.subtitle}
        />
        <MetricCard
          icon={metrics.appointments.icon}
          value={metrics.appointments.value}
          change={metrics.appointments.change}
          trend={metrics.appointments.trend}
          color={metrics.appointments.color}
          label={metrics.appointments.label}
          subtitle={metrics.appointments.subtitle}
        />
        {canAccessFinancial() && (
          <MetricCard
            icon={metrics.revenue.icon}
            value={metrics.revenue.value}
            change={metrics.revenue.change}
            trend={metrics.revenue.trend}
            color={metrics.revenue.color}
            label={metrics.revenue.label}
            subtitle={metrics.revenue.subtitle}
            format="currency"
          />
        )}
        <MetricCard
          icon={metrics.satisfaction.icon}
          value={metrics.satisfaction.value}
          change={metrics.satisfaction.change}
          trend={metrics.satisfaction.trend}
          color={metrics.satisfaction.color}
          label={metrics.satisfaction.label}
          subtitle={metrics.satisfaction.subtitle}
          format="percentage"
        />
      </div>

      {/* Secondary Metrics */}
      {(isSecretary() || isAdmin()) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={metrics.todayAppointments.icon}
            value={metrics.todayAppointments.value}
            change={metrics.todayAppointments.change}
            trend={metrics.todayAppointments.trend}
            color={metrics.todayAppointments.color}
            label={metrics.todayAppointments.label}
            subtitle={metrics.todayAppointments.subtitle}
          />
          <MetricCard
            icon={metrics.pendingResults.icon}
            value={metrics.pendingResults.value}
            change={metrics.pendingResults.change}
            trend={metrics.pendingResults.trend}
            color={metrics.pendingResults.color}
            label={metrics.pendingResults.label}
            subtitle={metrics.pendingResults.subtitle}
          />
        </div>
      )}

      {/* Charts Section - Middle */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#0F4C75]" />
              Agendamentos - Últimos 30 Dias
            </CardTitle>
            <CardDescription>
              Tendência de agendamentos e consultas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentChart />
          </CardContent>
        </Card>

        {canAccessFinancial() && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#0F4C75]" />
                Receita - Últimos 6 Meses
              </CardTitle>
              <CardDescription>
                Comparação entre receitas de convênio e particular
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Medical Data Visualization */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {isDoctor() && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0F4C75]" />
                Sinais Vitais - Tendência
              </CardTitle>
              <CardDescription>
                Média de sinais vitais dos pacientes com indicadores de normalidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientVitalsChart />
            </CardContent>
          </Card>
        )}

        {(isSecretary() || isAdmin()) && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0F4C75]" />
                Utilização de Horários
              </CardTitle>
              <CardDescription>
                Heatmap de agendamentos por dia da semana e horário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentHeatmap />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Section - Recent Activity & Quick Actions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 medical-card">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas interações e atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Operações frequentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions role={user?.role} />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const modern = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard (New)</h1>
          <p className="text-muted-foreground mt-1">Modular layout with improved performance</p>
        </div>
      </div>
      {/* For now reuse legacy sections; swap gradually per card */}
      {legacy}
    </div>
  );

  return (
    <FeatureGate name="newPortalDashboard" fallback={legacy}>
      {modern}
    </FeatureGate>
  );
}
