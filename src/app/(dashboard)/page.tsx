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

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get<DashboardStats>("/api/analytics/dashboard/stats");
        setStats(data);
        setError(null);
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
      }
    };

    fetchStats();
  }, []);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {getWelcomeMessage()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Últimos 30 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            // Open export endpoint in new window to trigger file download
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('access_token');
            const url = `${apiUrl}/api/analytics/export/financial/excel?period=last_month`;
            // Create a temporary link to trigger download with auth header
            const link = document.createElement('a');
            link.href = url;
            link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
            // For authenticated downloads, we need to use fetch with the token
            fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
              .then(response => response.blob())
              .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                link.href = downloadUrl;
                link.click();
                window.URL.revokeObjectURL(downloadUrl);
              })
              .catch(err => {
                console.error("Failed to export:", err);
                // Fallback: open in new tab
                window.open(url, '_blank');
              });
          }}>
            Exportar
          </Button>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-4 md:grid-cols-2">
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
      <div className="grid gap-4 md:grid-cols-2">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
