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

  // Mock metrics data - replace with API calls
  const metrics = {
    patients: {
      value: 2847,
      change: 12.5,
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const,
      label: 'Pacientes Ativos',
      subtitle: 'Total cadastrado',
    },
    appointments: {
      value: 342,
      change: 8.2,
      trend: 'up' as const,
      icon: Calendar,
      color: 'orange' as const,
      label: 'Agendamentos Este Mês',
      subtitle: 'Consultas agendadas',
    },
    revenue: {
      value: 245800,
      change: -3.1,
      trend: 'down' as const,
      icon: DollarSign,
      color: 'green' as const,
      label: 'Receita Mensal',
      subtitle: 'Faturamento total',
    },
    satisfaction: {
      value: 94.2,
      change: 2.3,
      trend: 'up' as const,
      icon: Heart,
      color: 'teal' as const,
      label: 'Satisfação dos Pacientes',
      subtitle: 'Avaliação média',
    },
    todayAppointments: {
      value: 48,
      change: 4,
      trend: 'up' as const,
      icon: Clock,
      color: 'orange' as const,
      label: 'Agendamentos Hoje',
      subtitle: 'Consultas agendadas',
    },
    pendingResults: {
      value: 23,
      change: -12,
      trend: 'down' as const,
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
          <Button variant="outline" size="sm">
            Últimos 30 dias
          </Button>
          <Button variant="outline" size="sm">
            Exportar
          </Button>
        </div>
      </div>

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
