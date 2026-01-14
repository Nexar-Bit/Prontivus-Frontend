"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Stethoscope, CalendarDays, Users, Clock, TrendingUp, Activity, RefreshCw,
  FileText, DollarSign, AlertCircle, CheckCircle2, XCircle, ArrowUpRight,
  ArrowDownRight, BarChart3, PieChart, Zap, Bell, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnApprovalRequests } from "@/components/appointments/ReturnApprovalRequests";

interface PeriodStats {
  day: number;
  week: number;
  month: number;
}

interface DoctorDashboardStats {
  appointments: PeriodStats;
  queue_patients: PeriodStats;
  pending_records: PeriodStats;
  revenue_day: number;
  revenue_week: number;
  revenue_month: number;
}

interface UpcomingAppointment {
  id: number;
  patient_name: string;
  scheduled_datetime: string;
  appointment_type: string | null;
  status: string;
}

interface WeeklySummary {
  procedures_count: number;
  new_consultations_count: number;
  returns_count: number;
}

interface DoctorDashboardData {
  stats: DoctorDashboardStats;
  upcoming_appointments: UpcomingAppointment[];
  weekly_summary?: WeeklySummary;
}

interface FinancialStats {
  monthly_revenue: number;
  monthly_expenses: number;
  current_balance: number;
  pending_amount: number;
  monthly_revenue_change: number;
  monthly_expenses_change: number;
  balance_change: number;
  pending_change: number;
}

interface MonthlyFinancialData {
  month: string;
  revenue: number;
  expenses: number;
}

interface FinancialDashboardData {
  stats: FinancialStats;
  monthly_data: MonthlyFinancialData[];
}

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DoctorDashboardStats>({
    appointments: { day: 0, week: 0, month: 0 },
    queue_patients: { day: 0, week: 0, month: 0 },
    pending_records: { day: 0, week: 0, month: 0 },
    revenue_day: 0,
    revenue_week: 0,
    revenue_month: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [financialData, setFinancialData] = useState<FinancialDashboardData | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Load dashboard data
      const [dashboardData, financialDashboardData] = await Promise.all([
        api.get<DoctorDashboardData>("/api/v1/doctor/dashboard"),
        api.get<FinancialDashboardData>("/api/v1/doctor/financial/dashboard").catch(() => null),
      ]);
      
      // Validate and set stats
      if (dashboardData.stats) {
        setStats(dashboardData.stats);
      }
      
      // Set upcoming appointments
      if (dashboardData.upcoming_appointments) {
        setUpcomingAppointments(dashboardData.upcoming_appointments || []);
      }
      
      // Set weekly summary
      if (dashboardData.weekly_summary) {
        setWeeklySummary(dashboardData.weekly_summary);
      }

      // Set financial data
      if (financialDashboardData) {
        setFinancialData(financialDashboardData);
      }

      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Failed to load dashboard:", error);
      if (!silent) {
        toast.error("Erro ao carregar dashboard", {
          description: error?.message || error?.detail || "Não foi possível carregar os dados do dashboard",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("confirm") || statusLower.includes("agendad")) {
      return <Badge className="bg-blue-100 text-blue-800">Agendada</Badge>;
    } else if (statusLower.includes("check") || statusLower.includes("fila")) {
      return <Badge className="bg-yellow-100 text-yellow-800">Na Fila</Badge>;
    } else if (statusLower.includes("consult") || statusLower.includes("atend")) {
      return <Badge className="bg-green-100 text-green-800">Em Atendimento</Badge>;
    } else if (statusLower.includes("complete") || statusLower.includes("conclu")) {
      return <Badge className="bg-gray-100 text-gray-800">Concluída</Badge>;
    } else if (statusLower.includes("cancel") || statusLower.includes("cancel")) {
      return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <ArrowDownRight className="h-4 w-4" />
          <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
        </div>
      );
    }
    return <span className="text-sm text-gray-500">0%</span>;
  };

  // Calculate max revenue for chart scaling
  const maxRevenue = financialData?.monthly_data.reduce((max, item) => 
    Math.max(max, item.revenue), 0
  ) || 0;

  const statsConfig = [
    {
      title: "Consultas",
      stats: stats?.appointments || { day: 0, week: 0, month: 0 },
      icon: CalendarDays,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      link: "/medico/agendamentos",
      description: "Agendamentos",
      formatValue: (value: number) => value.toString(),
    },
    {
      title: "Pacientes",
      stats: stats?.queue_patients || { day: 0, week: 0, month: 0 },
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      link: "/medico/atendimento/fila",
      description: "Na fila de atendimento",
      formatValue: (value: number) => value.toString(),
    },
    {
      title: "Prontuários Pendentes",
      stats: stats?.pending_records || { day: 0, week: 0, month: 0 },
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      link: "/medico/prontuarios",
      description: "Aguardando finalização",
      formatValue: (value: number) => value.toString(),
    },
    {
      title: "Receita",
      stats: { 
        day: stats?.revenue_day || 0, 
        week: stats?.revenue_week || 0, 
        month: stats?.revenue_month || 0 
      },
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-200",
      link: "/medico/financeiro/dashboard",
      description: "Total recebido",
      formatValue: (value: number) => formatCurrency(value),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-green-600" />
            Dashboard Médico
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas atividades médicas
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                • Atualizado {format(lastUpdated, "HH:mm", { locale: ptBR })}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => loadData()}
          disabled={refreshing || loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((statConfig, index) => {
          const Icon = statConfig.icon;
          const content = (
            <Card className={`hover:shadow-lg transition-all cursor-pointer border-2 ${statConfig.borderColor}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {statConfig.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${statConfig.bgColor}`}>
                    <Icon className={`h-5 w-5 ${statConfig.color}`} />
                  </div>
                </div>
                <CardDescription className="text-xs mt-1">
                  {statConfig.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Hoje:</span>
                    <span className={`text-lg font-semibold ${statConfig.color}`}>
                      {statConfig.formatValue(statConfig.stats?.day || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Semanal:</span>
                    <span className={`text-lg font-semibold ${statConfig.color}`}>
                      {statConfig.formatValue(statConfig.stats?.week || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Mensal:</span>
                    <span className={`text-lg font-semibold ${statConfig.color}`}>
                      {statConfig.formatValue(statConfig.stats?.month || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (statConfig.link) {
            return (
              <Link key={index} href={statConfig.link}>
                {content}
              </Link>
            );
          }
          return <React.Fragment key={index}>{content}</React.Fragment>;
        })}
      </div>

      {/* Weekly Summary Box */}
      {weeklySummary && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Resumo Semanal
                </CardTitle>
                <CardDescription>
                  Estatísticas dos últimos 7 dias
                </CardDescription>
              </div>
              <Link href="/medico/agendamentos">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  Ver Agenda
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <p className="text-sm font-medium text-purple-600">Procedimentos</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {weeklySummary.procedures_count}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-600">Novas Consultas</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {weeklySummary.new_consultations_count}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CalendarDays className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm font-medium text-blue-600">Retornos</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {weeklySummary.returns_count}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-green-600" />
                    Próximas Consultas
                  </CardTitle>
                  <CardDescription>
                    Consultas agendadas para hoje
                  </CardDescription>
                </div>
                <Link href="/medico/agendamentos">
                  <Button variant="ghost" size="sm">
                    Ver todas →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 5).map((appointment) => (
                      <Link
                        key={appointment.id}
                        href={`/medico/atendimento/${appointment.id}`}
                      >
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Clock className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {appointment.patient_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {appointment.appointment_type || "Consulta"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDateTime(appointment.scheduled_datetime)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(appointment.status)}
                            <div className="text-right">
                              <div className="font-semibold text-green-600 text-lg">
                                {formatTime(appointment.scheduled_datetime)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {upcomingAppointments.length > 5 && (
                    <Link href="/medico/agendamentos">
                      <Button variant="outline" className="w-full mt-4">
                        Ver mais {upcomingAppointments.length - 5} consultas
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Nenhuma consulta agendada para hoje</p>
                  <p className="text-sm mt-2">Suas consultas aparecerão aqui</p>
                  <Link href="/medico/agendamentos">
                    <Button variant="outline" className="mt-4">
                      Ver agendamentos
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Overview */}
          {financialData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Visão Financeira
                    </CardTitle>
                    <CardDescription>
                      Receitas e despesas do mês atual
                    </CardDescription>
                  </div>
                  <Link href="/medico/financeiro/dashboard">
                    <Button variant="ghost" size="sm">
                      Detalhes →
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Receita do Mês</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialData.stats.monthly_revenue)}
                    </div>
                    {getChangeIndicator(financialData.stats.monthly_revenue_change)}
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Saldo Atual</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialData.stats.current_balance)}
                    </div>
                    {getChangeIndicator(financialData.stats.balance_change)}
                  </div>
                </div>

                {/* Simple Revenue Chart */}
                {financialData.monthly_data.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Receita dos Últimos 6 Meses
                    </div>
                    <div className="flex items-end gap-2 h-32">
                      {financialData.monthly_data.map((item, index) => {
                        const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '100%' }}>
                              <div
                                className="absolute bottom-0 w-full bg-green-500 rounded-t transition-all"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600 font-medium">{item.month}</div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(item.revenue)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Return Approval Requests */}
          <ReturnApprovalRequests onApprovalChange={loadData} />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesso rápido às principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Link href="/medico/atendimento/fila">
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Fila de Atendimento</div>
                      <div className="text-xs text-gray-500">Ver pacientes aguardando</div>
                    </div>
                  </div>
                </Link>
                <Link href="/medico/prontuarios">
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Prontuários</div>
                      <div className="text-xs text-gray-500">Gerenciar prontuários</div>
                    </div>
                  </div>
                </Link>
                <Link href="/medico/financeiro/dashboard">
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Financeiro</div>
                      <div className="text-xs text-gray-500">Ver relatórios financeiros</div>
                    </div>
                  </div>
                </Link>
                <Link href="/medico/estoque/consulta">
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Activity className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Estoque</div>
                      <div className="text-xs text-gray-500">Consultar estoque</div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(stats?.queue_patients?.day || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-yellow-900">
                      Pacientes na Fila
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      {stats.queue_patients.day} {(stats.queue_patients.day || 0) === 1 ? 'paciente aguardando' : 'pacientes aguardando'} atendimento
                    </div>
                  </div>
                </div>
              )}
              {(stats?.pending_records?.day || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-purple-900">
                      Prontuários Pendentes
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      {stats.pending_records.day} {(stats.pending_records.day || 0) === 1 ? 'prontuário' : 'prontuários'} aguardando finalização
                    </div>
                  </div>
                </div>
              )}
              {(stats?.queue_patients?.day || 0) === 0 && (stats?.pending_records?.day || 0) === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-sm font-medium">Tudo em dia!</p>
                  <p className="text-xs mt-1">Não há alertas no momento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consultas Hoje</span>
                <span className="font-semibold">{stats?.appointments?.day || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pacientes Atendidos</span>
                <span className="font-semibold text-green-600">
                  {Math.max(0, (stats?.appointments?.day || 0) - (stats?.queue_patients?.day || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                <span className="font-semibold">
                  {(stats?.appointments?.day || 0) > 0
                    ? Math.round(((Math.max(0, (stats?.appointments?.day || 0) - (stats?.pending_records?.day || 0))) / (stats?.appointments?.day || 1)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Receita do Mês</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(stats?.revenue_month || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
