"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Heart,
  Activity,
  TrendingUp,
  FileText,
  Video,
  Clock,
  MapPin,
  Calendar,
  TestTube,
  MessageCircle,
  Pill,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  DollarSign,
  RefreshCw,
  Bell,
  Eye,
  Download,
  Receipt,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PatientSidebar, PatientMobileNav, PatientHeader } from "@/components/patient/Navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardStats {
  upcoming_appointments_count: number;
  active_prescriptions_count: number;
  pending_exam_results_count: number;
  unread_messages_count: number;
  pending_payments_count: number;
  total_payments_amount: number;
  last_appointment_date: string | null;
  active_conditions_count: number;
}

interface UpcomingAppointment {
  id: number;
  scheduled_datetime: string;
  doctor_name: string;
  doctor_specialty?: string;
  appointment_type?: string;
  status: string;
  location?: string;
  is_virtual: boolean;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  date: string;
  icon?: string;
}

interface HealthSummary {
  active_prescriptions_count: number;
  active_conditions_count: number;
  last_measurement_date: string | null;
  pending_exams_count: number;
  completed_exams_count: number;
}

interface DashboardData {
  stats: DashboardStats;
  upcoming_appointment: UpcomingAppointment | null;
  recent_activities: RecentActivity[];
  health_summary: HealthSummary;
}

interface Invoice {
  id: number;
  invoice_number?: string;
  total_amount: number;
  status: string;
  issue_date?: string;
  due_date?: string;
  created_at: string;
}

export default function PatientDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadInvoices();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.get<DashboardData>(`/api/v1/patient/dashboard`);
      setDashboardData(data);
    } catch (error: any) {
      console.error("Failed to load dashboard:", error);
      toast.error("Erro ao carregar dashboard", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados do dashboard",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const data = await api.get<Invoice[]>(`/api/v1/financial/invoices/me`);
      setInvoices(data);
    } catch (error: any) {
      console.error("Failed to load invoices:", error);
      // Don't show error toast for invoices, just set empty array
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return Calendar;
      case "prescription":
        return Pill;
      case "exam_result":
        return TestTube;
      case "message":
        return MessageCircle;
      case "payment":
        return CreditCard;
      default:
        return FileText;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
      case "scheduled":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = dashboardData?.stats || {
    upcoming_appointments_count: 0,
    active_prescriptions_count: 0,
    pending_exam_results_count: 0,
    unread_messages_count: 0,
    pending_payments_count: 0,
    total_payments_amount: 0,
    last_appointment_date: null,
    active_conditions_count: 0,
  };

  const upcomingAppointment = dashboardData?.upcoming_appointment;
  const recentActivities = dashboardData?.recent_activities || [];
  const healthSummary = dashboardData?.health_summary || {
    active_prescriptions_count: 0,
    active_conditions_count: 0,
    last_measurement_date: null,
    pending_exams_count: 0,
    completed_exams_count: 0,
  };

  const pendingInvoices = invoices.filter(inv => 
    inv.status.toLowerCase() === "pending" || inv.status.toLowerCase() === "issued"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
      {/* Header */}
      <PatientHeader showSearch notificationCount={stats.unread_messages_count} />

      {/* Mobile Navigation */}
      <PatientMobileNav />

      <div className="flex">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          <div className="space-y-6">
            {/* Welcome / Hero Section */}
            <section
              aria-label="Resumo do seu painel de saúde"
              className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-teal-50 px-5 py-5 lg:px-6 lg:py-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Heart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Seu Painel de Saúde
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Acompanhe consultas, resultados e registros com segurança.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDashboard}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    aria-label="Agendar nova consulta"
                    onClick={() => window.location.href = "/patient/appointments"}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </Button>
                  <Button
                    variant="outline"
                    className="border-teal-300 text-teal-700 hover:bg-teal-50"
                    aria-label="Ver resultados de exames"
                    onClick={() => window.location.href = "/patient/test-results"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Ver Exames
                  </Button>
                </div>
              </div>
              {/* Quick links */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  aria-label="Abrir mensagens"
                  onClick={() => window.location.href = "/patient/messages"}
                >
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Mensagens
                    {stats.unread_messages_count > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">
                        {stats.unread_messages_count}
                      </Badge>
                    )}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50"
                  aria-label="Acessar prescrições"
                  onClick={() => window.location.href = "/patient/prescriptions"}
                >
                  <Pill className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">Prescrições</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                  aria-label="Ver registros médicos"
                  onClick={() => window.location.href = "/patient/medical-records"}
                >
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Registros</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  aria-label="Telemedicina"
                  onClick={() => window.location.href = "/patient/telemedicine"}
                >
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Telemedicina</span>
                </Button>
              </div>
            </section>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Próximas Consultas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.upcoming_appointments_count}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Consultas agendadas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-teal-600" />
                    Prescrições Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600">
                    {stats.active_prescriptions_count}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Medicações em uso
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-yellow-600" />
                    Exames Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats.pending_exam_results_count}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Aguardando resultados
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    Pagamentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {stats.pending_payments_count}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Faturas a pagar
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Summary Card */}
              <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Heart className="h-5 w-5" />
                        </div>
                        Resumo de Saúde
                      </CardTitle>
                      <CardDescription className="mt-1">Informações médicas recentes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Última Consulta</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {stats.last_appointment_date
                            ? formatDate(stats.last_appointment_date)
                            : "N/A"}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-teal-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white border-2 border-blue-100 rounded-lg hover:border-blue-300 transition-colors">
                        <p className="text-xs text-gray-500 mb-1">Condições Ativas</p>
                        <p className="text-2xl font-bold text-blue-600">{healthSummary.active_conditions_count}</p>
                        <p className="text-xs text-gray-500 mt-1">Monitoradas</p>
                      </div>
                      <div className="p-4 bg-white border-2 border-teal-100 rounded-lg hover:border-teal-300 transition-colors">
                        <p className="text-xs text-gray-500 mb-1">Medicações</p>
                        <p className="text-2xl font-bold text-teal-600">{healthSummary.active_prescriptions_count}</p>
                        <p className="text-xs text-gray-500 mt-1">Em uso</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white border-2 border-yellow-100 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Exames Pendentes</p>
                        <p className="text-2xl font-bold text-yellow-600">{healthSummary.pending_exams_count}</p>
                      </div>
                      <div className="p-4 bg-white border-2 border-green-100 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Exames Concluídos</p>
                        <p className="text-2xl font-bold text-green-600">{healthSummary.completed_exams_count}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => window.location.href = "/patient/health"}
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Calendar className="h-5 w-5" />
                        </div>
                        Próxima Consulta
                      </CardTitle>
                      <CardDescription className="mt-1">Seu próximo atendimento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : upcomingAppointment ? (
                    <div className="space-y-4">
                      <div className="p-5 bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 rounded-lg text-white shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm opacity-90 mb-1">Data e Hora</p>
                            <p className="text-2xl font-bold">
                              {formatDate(upcomingAppointment.scheduled_datetime)}
                            </p>
                            <p className="text-lg mt-1">
                              {format(parseISO(upcomingAppointment.scheduled_datetime), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Clock className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="border-t border-white/20 pt-3 mt-3">
                          <p className="text-sm opacity-90 mb-1">Médico</p>
                          <p className="font-semibold text-lg">{upcomingAppointment.doctor_name}</p>
                          {upcomingAppointment.doctor_specialty && (
                            <p className="text-sm opacity-80 mt-1">{upcomingAppointment.doctor_specialty}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {upcomingAppointment.is_virtual ? (
                          <>
                            <Video className="h-4 w-4 text-blue-600" />
                            <span>Consulta Virtual</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{upcomingAppointment.location || "Local a confirmar"}</span>
                          </>
                        )}
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        {upcomingAppointment.is_virtual ? (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Entrar na Consulta
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver Localização
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-gray-500 mb-4 font-medium">Nenhuma consulta agendada</p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.location.href = "/patient/appointments"}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Consulta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        Resumo Financeiro
                      </CardTitle>
                      <CardDescription className="mt-1">Faturas e pagamentos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Pago</p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(stats.total_payments_amount)}
                          </p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white border-2 border-red-100 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Pendentes</p>
                        <p className="text-2xl font-bold text-red-600">{stats.pending_payments_count}</p>
                        <p className="text-xs text-gray-500 mt-1">Faturas</p>
                      </div>
                      <div className="p-4 bg-white border-2 border-blue-100 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="text-2xl font-bold text-blue-600">{invoices.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Faturas</p>
                      </div>
                    </div>
                    {pendingInvoices.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm font-semibold text-yellow-800">
                            {pendingInvoices.length} {pendingInvoices.length === 1 ? "fatura pendente" : "faturas pendentes"}
                          </p>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Total: {formatCurrency(pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
                        </p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => setShowInvoices(true)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Ver Todas as Faturas
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        Atividades Recentes
                      </CardTitle>
                      <CardDescription className="mt-1">Últimas atualizações do seu prontuário</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Nenhuma atividade recente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.slice(0, 5).map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.date)}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-teal-300 text-teal-700 hover:bg-teal-50"
                    onClick={() => window.location.href = "/patient/medical-records"}
                  >
                    Ver Todas as Atividades
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Activity className="h-5 w-5" />
                      </div>
                      Ações Rápidas
                    </CardTitle>
                    <CardDescription className="mt-1">Acesso rápido a funcionalidades</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-center justify-center p-5 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    onClick={() => window.location.href = "/patient/appointments"}
                  >
                    <Calendar className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Agendar</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-center justify-center p-5 border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transition-all"
                    onClick={() => window.location.href = "/patient/messages"}
                  >
                    <MessageCircle className="h-6 w-6 mb-2 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">Mensagens</span>
                    {stats.unread_messages_count > 0 && (
                      <Badge className="mt-1 bg-red-500 text-white text-xs">
                        {stats.unread_messages_count}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-center justify-center p-5 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all"
                    onClick={() => window.location.href = "/patient/medical-records"}
                  >
                    <FileText className="h-6 w-6 mb-2 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Registros</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-center justify-center p-5 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    onClick={() => window.location.href = "/patient/test-results"}
                  >
                    <TestTube className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Resultados</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Invoices Dialog */}
      <Dialog open={showInvoices} onOpenChange={setShowInvoices}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Minhas Faturas</DialogTitle>
            <DialogDescription>
              Visualize e gerencie todas as suas faturas
            </DialogDescription>
          </DialogHeader>
          {loadingInvoices ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        #{invoice.invoice_number || invoice.id}
                      </TableCell>
                      <TableCell>{formatDate(invoice.issue_date || invoice.created_at)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.total_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/patient/invoices/${invoice.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
