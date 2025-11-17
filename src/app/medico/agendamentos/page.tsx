"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarDays, Calendar, CalendarRange, Clock, User, Stethoscope, RefreshCw, 
  Search, Filter, CheckCircle2, XCircle, Play, Pause, Edit, Trash2, 
  ChevronLeft, ChevronRight, MoreVertical, FileText, AlertCircle, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, isToday, isPast, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Appointment {
  id: number;
  scheduled_datetime: string;
  status: string;
  appointment_type: string | null;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
  notes?: string | null;
  reason?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_consultation: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  checked_in: "Check-in",
  in_consultation: "Em Consulta",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

export default function AgendamentosPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("day");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, activeTab]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, searchTerm, activeTab, selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on active tab
      let startDate: Date;
      let endDate: Date;
      
      if (activeTab === "day") {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (activeTab === "week") {
        startDate = startOfWeek(selectedDate, { locale: ptBR });
        endDate = endOfWeek(selectedDate, { locale: ptBR });
      } else {
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
      }
      
      // Build query params
      const params = new URLSearchParams({
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      });
      
      const data = await api.get<Appointment[]>(`/api/v1/appointments/doctor/my-appointments?${params.toString()}`);
      
      // Sort by scheduled_datetime
      const sorted = [...data].sort((a, b) => {
        const dateA = parseISO(a.scheduled_datetime);
        const dateB = parseISO(b.scheduled_datetime);
        return dateA.getTime() - dateB.getTime();
      });
      
      setAppointments(sorted);
    } catch (error: any) {
      console.error("Failed to load appointments:", error);
      toast.error("Erro ao carregar agendamentos", {
        description: error?.message || error?.detail || "Não foi possível carregar os agendamentos",
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient_name.toLowerCase().includes(search) ||
        apt.appointment_type?.toLowerCase().includes(search) ||
        apt.reason?.toLowerCase().includes(search)
      );
    }
    
    // Filter by date for day view
    if (activeTab === "day") {
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(apt => {
        const aptDate = format(parseISO(apt.scheduled_datetime), "yyyy-MM-dd");
        return aptDate === selectedDateStr;
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      setActionLoading(true);
      await api.patch(`/api/v1/appointments/${appointmentId}/status`, { status });
      toast.success("Status atualizado com sucesso!");
      await loadAppointments();
      setShowStatusDialog(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Erro ao atualizar status", {
        description: error?.message || error?.detail || "Não foi possível atualizar o status",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const rescheduleAppointment = async (appointmentId: number) => {
    try {
      if (!rescheduleDate || !rescheduleTime) {
        toast.error("Por favor, preencha data e hora");
        return;
      }

      setActionLoading(true);
      const newDateTime = `${rescheduleDate}T${rescheduleTime}:00`;
      await api.post(`/api/v1/appointments/${appointmentId}/reschedule`, {
        new_datetime: newDateTime,
      });
      toast.success("Agendamento reagendado com sucesso!");
      await loadAppointments();
      setShowRescheduleDialog(false);
      setSelectedAppointment(null);
      setRescheduleDate("");
      setRescheduleTime("");
    } catch (error: any) {
      console.error("Failed to reschedule:", error);
      toast.error("Erro ao reagendar", {
        description: error?.message || error?.detail || "Não foi possível reagendar",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: number) => {
    try {
      setActionLoading(true);
      await api.post(`/api/v1/appointments/${appointmentId}/cancel`, {
        reason: cancelReason || "Cancelado pelo médico",
      });
      toast.success("Agendamento cancelado com sucesso!");
      await loadAppointments();
      setShowCancelDialog(false);
      setSelectedAppointment(null);
      setCancelReason("");
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      toast.error("Erro ao cancelar", {
        description: error?.message || error?.detail || "Não foi possível cancelar",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
    const label = STATUS_LABELS[status.toLowerCase()] || status;
    return <Badge className={colorClass}>{label}</Badge>;
  };

  const getDayAppointments = () => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return filteredAppointments.filter(apt => {
      const aptDate = format(parseISO(apt.scheduled_datetime), "yyyy-MM-dd");
      return aptDate === selectedDateStr;
    });
  };

  const getWeekAppointments = () => {
    const weekStart = startOfWeek(selectedDate, { locale: ptBR });
    const weekEnd = endOfWeek(selectedDate, { locale: ptBR });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayAppointments = filteredAppointments.filter(apt => {
        const aptDate = format(parseISO(apt.scheduled_datetime), "yyyy-MM-dd");
        return aptDate === dayStr;
      });
      
      return {
        date: format(day, "EEEE", { locale: ptBR }),
        dateObj: day,
        appointments: dayAppointments,
      };
    });
  };

  const getMonthAppointments = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const weeks = [];
    
    let currentWeekStart = startOfWeek(monthStart, { locale: ptBR });
    while (currentWeekStart <= monthEnd) {
      const weekEnd = endOfWeek(currentWeekStart, { locale: ptBR });
      const weekAppointments = filteredAppointments.filter(apt => {
        const aptDate = parseISO(apt.scheduled_datetime);
        return aptDate >= currentWeekStart && aptDate <= weekEnd;
      });
      
      weeks.push({
        weekStart: currentWeekStart,
        weekEnd,
        appointments: weekAppointments.length,
      });
      
      currentWeekStart = addDays(weekEnd, 1);
    }
    
    return weeks;
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
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

  const handleStatusAction = (appointment: Appointment, status: string) => {
    setSelectedAppointment(appointment);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const aptDate = parseISO(appointment.scheduled_datetime);
    setRescheduleDate(format(aptDate, "yyyy-MM-dd"));
    setRescheduleTime(format(aptDate, "HH:mm"));
    setShowRescheduleDialog(true);
  };

  const handleCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  const handleViewDetails = async (appointmentId: number) => {
    try {
      const appointment = await api.get<Appointment>(`/api/v1/appointments/${appointmentId}`);
      setSelectedAppointment(appointment);
      setShowDetailsDialog(true);
    } catch (error: any) {
      console.error("Failed to load appointment details:", error);
      toast.error("Erro ao carregar detalhes", {
        description: error?.message || error?.detail,
      });
    }
  };

  const canUpdateStatus = (appointment: Appointment, newStatus: string) => {
    const currentStatus = appointment.status.toLowerCase();
    const status = newStatus.toLowerCase();
    
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      scheduled: ["confirmed", "checked_in", "cancelled"],
      confirmed: ["checked_in", "cancelled"],
      checked_in: ["in_consultation", "cancelled", "no_show"],
      in_consultation: ["completed", "cancelled"],
      completed: [], // Cannot change from completed
      cancelled: [], // Cannot change from cancelled
      no_show: [], // Cannot change from no_show
    };
    
    return validTransitions[currentStatus]?.includes(status) || false;
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (activeTab === "day") {
      setSelectedDate(direction === "next" ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
    } else if (activeTab === "week") {
      setSelectedDate(direction === "next" ? addDays(selectedDate, 7) : subDays(selectedDate, 7));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      setSelectedDate(newDate);
    }
  };

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
            <CalendarDays className="h-8 w-8 text-green-600" />
            Agendamentos
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie seus agendamentos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAppointments}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente, tipo ou motivo..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="checked_in">Check-in</SelectItem>
                  <SelectItem value="in_consultation">Em Consulta</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab === "day" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value));
                    }
                  }}
                  className="w-[150px]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {isToday(selectedDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Hoje
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dia
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Mês
          </TabsTrigger>
        </TabsList>

        {/* Day View */}
        <TabsContent value="day">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agenda do Dia</CardTitle>
                  <CardDescription>
                    {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {getDayAppointments().length} {getDayAppointments().length === 1 ? 'consulta' : 'consultas'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getDayAppointments().length > 0 ? (
                <div className="space-y-3">
                  {getDayAppointments().map((appointment) => {
                    const aptDate = parseISO(appointment.scheduled_datetime);
                    const isPastAppointment = isPast(aptDate) && !isToday(aptDate);
                    
                    return (
                      <div
                        key={appointment.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                          isPastAppointment ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isPastAppointment ? 'bg-gray-200' : 'bg-green-100'
                          }`}>
                            <Clock className={`h-8 w-8 ${isPastAppointment ? 'text-gray-600' : 'text-green-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="font-semibold text-lg">{formatTime(appointment.scheduled_datetime)}</div>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="text-sm text-gray-900 font-medium flex items-center gap-2 mt-1">
                              <User className="h-4 w-4" />
                              {appointment.patient_name}
                            </div>
                            {appointment.appointment_type && (
                              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <Stethoscope className="h-4 w-4" />
                                {appointment.appointment_type}
                              </div>
                            )}
                            {appointment.reason && (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {appointment.reason}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(appointment.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canUpdateStatus(appointment, "checked_in") && (
                                <DropdownMenuItem onClick={() => handleStatusAction(appointment, "checked_in")}>
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  Fazer Check-in
                                </DropdownMenuItem>
                              )}
                              {canUpdateStatus(appointment, "in_consultation") && (
                                <DropdownMenuItem onClick={() => handleStatusAction(appointment, "in_consultation")}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Iniciar Consulta
                                </DropdownMenuItem>
                              )}
                              {canUpdateStatus(appointment, "completed") && (
                                <DropdownMenuItem onClick={() => handleStatusAction(appointment, "completed")}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Finalizar Consulta
                                </DropdownMenuItem>
                              )}
                              {canUpdateStatus(appointment, "cancelled") && (
                                <DropdownMenuItem onClick={() => handleCancel(appointment)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {!isPastAppointment && appointment.status !== "cancelled" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleReschedule(appointment)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Reagendar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/medico/atendimento/${appointment.id}`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Nenhuma consulta agendada para este dia</p>
                  <p className="text-sm mt-2">Suas consultas aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agenda da Semana</CardTitle>
                  <CardDescription>
                    Visão semanal dos agendamentos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateDate("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[200px] text-center">
                    {format(startOfWeek(selectedDate, { locale: ptBR }), "dd/MM", { locale: ptBR })} - {format(endOfWeek(selectedDate, { locale: ptBR }), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateDate("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {getWeekAppointments().map((day, index) => (
                  <Card key={index} className={`${isToday(day.dateObj) ? 'border-green-500 border-2' : ''}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm capitalize">{day.date}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(day.dateObj, "dd/MM", { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 mb-2">{day.appointments.length}</div>
                      <div className="text-xs text-gray-500 mb-3">{day.appointments.length === 1 ? 'consulta' : 'consultas'}</div>
                      {day.appointments.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {day.appointments.slice(0, 3).map((apt) => (
                            <div
                              key={apt.id}
                              className="text-xs p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100"
                              onClick={() => handleViewDetails(apt.id)}
                            >
                              <div className="font-medium">{formatTime(apt.scheduled_datetime)}</div>
                              <div className="text-gray-600 truncate">{apt.patient_name}</div>
                              {getStatusBadge(apt.status)}
                            </div>
                          ))}
                          {day.appointments.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{day.appointments.length - 3} mais
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agenda do Mês</CardTitle>
                  <CardDescription>
                    {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateDate("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateDate("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {getMonthAppointments().map((week, index) => (
                  <Card key={index} className="text-center">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Semana {index + 1}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(week.weekStart, "dd/MM", { locale: ptBR })} - {format(week.weekEnd, "dd/MM", { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{week.appointments}</div>
                      <div className="text-xs text-gray-500 mt-1">{week.appointments === 1 ? 'consulta' : 'consultas'}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
            <DialogDescription>
              Informações completas do agendamento
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Paciente</Label>
                  <div className="text-lg font-semibold">{selectedAppointment.patient_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data e Hora</Label>
                  <div className="text-lg font-semibold">{formatDateTime(selectedAppointment.scheduled_datetime)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div>{getStatusBadge(selectedAppointment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <div className="text-lg">{selectedAppointment.appointment_type || "Consulta"}</div>
                </div>
              </div>
              {selectedAppointment.reason && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Motivo</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedAppointment.reason}</div>
                </div>
              )}
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedAppointment.notes}</div>
                </div>
              )}
              {selectedAppointment.diagnosis && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Diagnóstico</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">{selectedAppointment.diagnosis}</div>
                </div>
              )}
              {selectedAppointment.treatment_plan && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Plano de Tratamento</Label>
                  <div className="mt-1 p-3 bg-green-50 rounded-lg">{selectedAppointment.treatment_plan}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
            {selectedAppointment && (
              <Link href={`/medico/atendimento/${selectedAppointment.id}`}>
                <Button>
                  Iniciar Atendimento
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>
              Confirmar alteração de status para {STATUS_LABELS[newStatus.toLowerCase()] || newStatus}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedAppointment && updateAppointmentStatus(selectedAppointment.id, newStatus)}
              disabled={actionLoading}
            >
              {actionLoading ? "Atualizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar Consulta</DialogTitle>
            <DialogDescription>
              Selecione a nova data e hora para a consulta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reschedule-date">Data</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <Label htmlFor="reschedule-time">Hora</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedAppointment && rescheduleAppointment(selectedAppointment.id)}
              disabled={actionLoading}
            >
              {actionLoading ? "Reagendando..." : "Confirmar Reagendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Motivo do Cancelamento (opcional)</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo do cancelamento..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Não Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAppointment && cancelAppointment(selectedAppointment.id)}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
