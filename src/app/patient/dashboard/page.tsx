"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  HeartPulse,
  ActivitySquare,
  TrendingUp,
  NotebookPen,
  Video,
  Clock,
  MapPin,
  Calendar,
  TestTube,
  MessagesSquare,
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
      return MessagesSquare;
      case "payment":
        return CreditCard;
      default:
      return NotebookPen;
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <PatientHeader showSearch notificationCount={stats.unread_messages_count} />

      {/* Mobile Navigation */}
      <PatientMobileNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto patient-content-scroll w-full">
          <div className="px-4 lg:px-5 py-4 lg:py-6 pb-20 lg:pb-6 space-y-6">
            {/* Welcome / Hero Section */}
            <section
              aria-label="Resumo do seu painel de saúde"
              className="relative rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-teal-50/30 px-6 py-6 lg:px-8 lg:py-8 shadow-lg shadow-blue-500/5 backdrop-blur-sm overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                    <HeartPulse className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-700 to-teal-700 bg-clip-text text-transparent">
                      Seu Painel de Saúde
                    </h1>
                    <p className="text-sm lg:text-base text-gray-600 mt-2 font-medium">
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
              <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="group justify-start gap-3 h-14 border-2 border-blue-200/60 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
                  aria-label="Abrir mensagens"
                  onClick={() => window.location.href = "/patient/messages"}
                >
                  <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <MessagesSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-700">
                    Mensagens
                    {stats.unread_messages_count > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs shadow-sm">
                        {stats.unread_messages_count}
                      </Badge>
                    )}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="group justify-start gap-3 h-14 border-2 border-teal-200/60 hover:border-teal-400 hover:bg-gradient-to-br hover:from-teal-50 hover:to-teal-100/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
                  aria-label="Acessar prescrições"
                  onClick={() => window.location.href = "/patient/prescriptions"}
                >
                  <div className="p-1.5 rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-colors">
                    <Pill className="h-5 w-5 text-teal-600" />
                  </div>
                  <span className="text-sm font-semibold text-teal-700">Prescrições</span>
                </Button>
                <Button
                  variant="outline"
                  className="group justify-start gap-3 h-14 border-2 border-green-200/60 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
                  aria-label="Ver registros médicos"
                  onClick={() => window.location.href = "/patient/medical-records"}
                >
                  <div className="p-1.5 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                    <NotebookPen className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-700">Registros</span>
                </Button>
                <Button
                  variant="outline"
                  className="group justify-start gap-3 h-14 border-2 border-blue-200/60 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
                  aria-label="Telemedicina"
                  onClick={() => window.location.href = "/patient/telemedicine"}
                >
                  <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <Video className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-700">Telemedicina</span>
                </Button>
              </div>
            </section>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    Próximas Consultas
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {stats.upcoming_appointments_count}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Consultas agendadas
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/30 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-teal-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-colors">
                      <Pill className="h-4 w-4 text-teal-600" />
                    </div>
                    Prescrições Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                    {stats.active_prescriptions_count}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Medicações em uso
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-l-4 border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50/30 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                      <TestTube className="h-4 w-4 text-yellow-600" />
                    </div>
                    Exames Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                    {stats.pending_exam_results_count}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Aguardando resultados
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50/30 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                      <CreditCard className="h-4 w-4 text-red-600" />
                    </div>
                    Pagamentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                    {stats.pending_payments_count}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Faturas a pagar
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Summary Card */}
              <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-blue-50/20 to-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                          <HeartPulse className="h-5 w-5 text-white" />
                        </div>
                        Resumo de Saúde
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600 font-medium">Informações médicas recentes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 via-blue-50/50 to-teal-50 rounded-xl border-2 border-blue-100/50 shadow-sm hover:shadow-md transition-all">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Última Consulta</p>
                        <p className="text-xl font-bold text-blue-700">
                          {stats.last_appointment_date
                            ? formatDate(stats.last_appointment_date)
                            : "N/A"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 shadow-lg">
                        <ActivitySquare className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="group p-4 bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Condições Ativas</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{healthSummary.active_conditions_count}</p>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">Monitoradas</p>
                      </div>
                      <div className="group p-4 bg-gradient-to-br from-white to-teal-50/30 border-2 border-teal-100 rounded-xl hover:border-teal-300 hover:shadow-md transition-all duration-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Medicações</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">{healthSummary.active_prescriptions_count}</p>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">Em uso</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="group p-4 bg-gradient-to-br from-white to-yellow-50/30 border-2 border-yellow-100 rounded-xl hover:border-yellow-300 hover:shadow-md transition-all duration-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Exames Pendentes</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">{healthSummary.pending_exams_count}</p>
                      </div>
                      <div className="group p-4 bg-gradient-to-br from-white to-green-50/30 border-2 border-green-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Exames Concluídos</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{healthSummary.completed_exams_count}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      onClick={() => window.location.href = "/patient/health"}
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card className="group relative overflow-hidden border-l-4 border-l-teal-500 bg-gradient-to-br from-white via-teal-50/20 to-white hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-teal-700 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        Próxima Consulta
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600 font-medium">Seu próximo atendimento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                  ) : upcomingAppointment ? (
                    <div className="space-y-4">
                      <div className="relative p-6 bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 rounded-2xl text-white shadow-xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-semibold opacity-90 mb-2 uppercase tracking-wide">Data e Hora</p>
                            <p className="text-3xl font-bold mb-1">
                              {formatDate(upcomingAppointment.scheduled_datetime)}
                            </p>
                            <p className="text-xl font-semibold opacity-95">
                              {format(parseISO(upcomingAppointment.scheduled_datetime), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="p-4 bg-white/20 rounded-xl backdrop-blur-md shadow-lg">
                            <Clock className="h-9 w-9" />
                          </div>
                        </div>
                        <div className="relative border-t border-white/30 pt-4 mt-4">
                          <p className="text-xs font-semibold opacity-90 mb-2 uppercase tracking-wide">Médico</p>
                          <p className="font-bold text-xl">{upcomingAppointment.doctor_name}</p>
                          {upcomingAppointment.doctor_specialty && (
                            <p className="text-sm opacity-90 mt-1.5 font-medium">{upcomingAppointment.doctor_specialty}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-700 font-medium p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {upcomingAppointment.is_virtual ? (
                          <>
                            <div className="p-1.5 rounded-lg bg-blue-100">
                              <Video className="h-4 w-4 text-blue-600" />
                            </div>
                            <span>Consulta Virtual</span>
                          </>
                        ) : (
                          <>
                            <div className="p-1.5 rounded-lg bg-blue-100">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <span>{upcomingAppointment.location || "Local a confirmar"}</span>
                          </>
                        )}
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold h-12">
                        {upcomingAppointment.is_virtual ? (
                          <>
                            <Video className="h-5 w-5 mr-2" />
                            Entrar na Consulta
                          </>
                        ) : (
                          <>
                            <MapPin className="h-5 w-5 mr-2" />
                            Ver Localização
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-5 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl w-24 h-24 mx-auto mb-5 flex items-center justify-center shadow-lg">
                        <Calendar className="h-12 w-12 text-blue-600" />
                      </div>
                      <p className="text-gray-600 mb-5 font-semibold text-lg">Nenhuma consulta agendada</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        onClick={() => window.location.href = "/patient/appointments"}
                      >
                        <Calendar className="h-5 w-5 mr-2" />
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
              <Card className="group relative overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-br from-white via-green-50/20 to-white hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        Resumo Financeiro
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600 font-medium">Faturas e pagamentos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-r from-green-50 via-green-50/50 to-teal-50 rounded-xl border-2 border-green-100/50 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Total Pago</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                            {formatCurrency(stats.total_payments_amount)}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
                          <CheckCircle2 className="h-7 w-7 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="group p-4 bg-gradient-to-br from-white to-red-50/30 border-2 border-red-100 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Pendentes</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{stats.pending_payments_count}</p>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">Faturas</p>
                      </div>
                      <div className="group p-4 bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Total</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{invoices.length}</p>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">Faturas</p>
                      </div>
                    </div>
                    {pendingInvoices.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="p-1.5 rounded-lg bg-yellow-100">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          </div>
                          <p className="text-sm font-bold text-yellow-800">
                            {pendingInvoices.length} {pendingInvoices.length === 1 ? "fatura pendente" : "faturas pendentes"}
                          </p>
                        </div>
                        <p className="text-xs text-yellow-700 font-semibold">
                          Total: {formatCurrency(pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
                        </p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-green-300 text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
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
              <Card className="group relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-white via-purple-50/20 to-white hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-purple-700 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
                          <NotebookPen className="h-5 w-5 text-white" />
                        </div>
                        Atividades Recentes
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600 font-medium">Últimas atualizações do seu prontuário</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-purple-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <NotebookPen className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-gray-600 text-sm font-medium">Nenhuma atividade recente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.slice(0, 5).map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <div
                            key={activity.id}
                            className="group/item flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200/50 hover:shadow-md"
                          >
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-sm">
                              <Icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 mb-1">{activity.title}</p>
                              <p className="text-sm text-gray-600 mb-1.5">{activity.description}</p>
                              <p className="text-xs text-gray-500 font-medium">{formatDateTime(activity.date)}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 group-hover/item:text-blue-600 group-hover/item:translate-x-1 transition-all" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-2 border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                    onClick={() => window.location.href = "/patient/medical-records"}
                  >
                    Ver Todas as Atividades
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="group relative overflow-hidden border-l-4 border-l-indigo-500 bg-gradient-to-br from-white via-indigo-50/20 to-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-indigo-700 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
                        <ActivitySquare className="h-5 w-5 text-white" />
                      </div>
                      Ações Rápidas
                    </CardTitle>
                    <CardDescription className="mt-2 text-gray-600 font-medium">Acesso rápido a funcionalidades</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="group/btn h-auto flex-col items-center justify-center p-6 border-2 border-blue-200/60 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105"
                    onClick={() => window.location.href = "/patient/appointments"}
                  >
                    <div className="p-2 rounded-lg bg-blue-100 group-hover/btn:bg-blue-200 mb-3 transition-colors">
                      <Calendar className="h-7 w-7 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-blue-700">Agendar</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="group/btn h-auto flex-col items-center justify-center p-6 border-2 border-teal-200/60 hover:border-teal-400 hover:bg-gradient-to-br hover:from-teal-50 hover:to-teal-100/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105"
                    onClick={() => window.location.href = "/patient/messages"}
                  >
                    <div className="p-2 rounded-lg bg-teal-100 group-hover/btn:bg-teal-200 mb-3 transition-colors">
                      <MessagesSquare className="h-7 w-7 text-teal-600" />
                    </div>
                    <span className="text-sm font-bold text-teal-700">Mensagens</span>
                    {stats.unread_messages_count > 0 && (
                      <Badge className="mt-2 bg-red-500 text-white text-xs shadow-sm">
                        {stats.unread_messages_count}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="group/btn h-auto flex-col items-center justify-center p-6 border-2 border-green-200/60 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105"
                    onClick={() => window.location.href = "/patient/medical-records"}
                  >
                    <div className="p-2 rounded-lg bg-green-100 group-hover/btn:bg-green-200 mb-3 transition-colors">
                      <NotebookPen className="h-7 w-7 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-green-700">Registros</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="group/btn h-auto flex-col items-center justify-center p-6 border-2 border-blue-200/60 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105"
                    onClick={() => window.location.href = "/patient/test-results"}
                  >
                    <div className="p-2 rounded-lg bg-blue-100 group-hover/btn:bg-blue-200 mb-3 transition-colors">
                      <TestTube className="h-7 w-7 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-blue-700">Resultados</span>
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
