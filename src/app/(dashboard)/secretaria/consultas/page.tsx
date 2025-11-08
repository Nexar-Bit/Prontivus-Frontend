"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, addDays, subDays, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Search, 
  User, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Play,
  Stethoscope,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  AlertCircle,
  UserCheck,
  Timer,
  FileText,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Status configuration with colors and icons
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  scheduled: {
    label: "Agendado",
    color: "text-blue-700",
    bgColor: "bg-blue-100 hover:bg-blue-200",
    icon: <Calendar className="h-3 w-3" />
  },
  checked_in: {
    label: "Aguardando",
    color: "text-orange-700",
    bgColor: "bg-orange-100 hover:bg-orange-200",
    icon: <Clock className="h-3 w-3" />
  },
  in_consultation: {
    label: "Em Atendimento",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 hover:bg-yellow-200",
    icon: <Stethoscope className="h-3 w-3" />
  },
  completed: {
    label: "Concluído",
    color: "text-green-700",
    bgColor: "bg-green-100 hover:bg-green-200",
    icon: <CheckCircle className="h-3 w-3" />
  },
  cancelled: {
    label: "Cancelado",
    color: "text-red-700",
    bgColor: "bg-red-100 hover:bg-red-200",
    icon: <XCircle className="h-3 w-3" />
  },
};

export default function SecretariaConsultasPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  const load = async () => {
    try {
      setLoading(true);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const data = await appointmentsApi.getAll({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        status: status === "all" ? undefined : (status as AppointmentStatus),
      });
      setItems(data);
    } catch (e: any) {
      toast.error("Erro ao carregar consultas", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, status]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter((a) =>
      (a.patient_name || "").toLowerCase().includes(term) ||
      String(a.patient_id).includes(term) ||
      (a.reason || "").toLowerCase().includes(term) ||
      (a.doctor_name || "").toLowerCase().includes(term)
    );
  }, [items, search]);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = items.filter(a => {
      const aptDate = new Date(a.scheduled_datetime);
      return isSameDay(aptDate, date);
    });
    
    return {
      total: today.length,
      scheduled: today.filter(a => a.status === AppointmentStatus.SCHEDULED).length,
      waiting: today.filter(a => a.status === AppointmentStatus.CHECKED_IN).length,
      inConsultation: today.filter(a => a.status === AppointmentStatus.IN_CONSULTATION).length,
      completed: today.filter(a => a.status === AppointmentStatus.COMPLETED).length,
      cancelled: today.filter(a => a.status === AppointmentStatus.CANCELLED).length,
    };
  }, [items, date]);

  const sortedAppointments = useMemo(() => {
    return filtered
      .slice()
      .sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());
  }, [filtered]);

  const handleStatusUpdate = async (id: number, newStatus: AppointmentStatus, successMessage: string) => {
    try {
      await appointmentsApi.updateStatus(id, newStatus);
      toast.success(successMessage);
      load();
    } catch (e: any) {
      toast.error('Falha ao atualizar', { description: e?.message });
    }
  };

  const navigateDate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setDate(new Date());
    } else if (direction === "prev") {
      setDate(subDays(date, 1));
    } else {
      setDate(addDays(date, 1));
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <CalendarDays className="h-6 w-6" />
            </div>
            Consultas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de agendamentos e atendimentos da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
          <Link href="/secretaria/agendamentos/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold text-blue-700">{stats.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold text-orange-700">{stats.waiting}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Atendimento</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.inConsultation}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-yellow-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelados</p>
                <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Date Navigation */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Navegação
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("today")}
                className={cn(isToday(date) && "bg-blue-50 border-blue-300")}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium mb-2 block">Data da Consulta</Label>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={format(date, 'yyyy-MM-dd')}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                />
                <span className="text-sm text-muted-foreground ml-2">
                  {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
            </div>

            <div className="min-w-[180px]">
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="checked_in">Aguardando</SelectItem>
                  <SelectItem value="in_consultation">Em Atendimento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[250px]">
              <Label className="text-sm font-medium mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Paciente, médico, motivo ou ID..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-9 bg-white" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {sortedAppointments.length} {sortedAppointments.length === 1 ? 'consulta encontrada' : 'consultas encontradas'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="font-medium">Carregando consultas...</p>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Calendar className="h-12 w-12 opacity-50" />
              <p className="font-medium text-lg">Nenhuma consulta encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou selecionar outra data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appointment) => {
                const aptDate = new Date(appointment.scheduled_datetime);
                const statusInfo = statusConfig[appointment.status] || statusConfig.scheduled;
                const isPast = aptDate < new Date() && appointment.status !== AppointmentStatus.COMPLETED && appointment.status !== AppointmentStatus.CANCELLED;
                
                return (
                  <Card 
                    key={appointment.id} 
                    className={cn(
                      "border-l-4 transition-all hover:shadow-md",
                      isPast && "border-l-orange-500 bg-orange-50/30",
                      appointment.status === AppointmentStatus.IN_CONSULTATION && "border-l-yellow-500 bg-yellow-50/30",
                      appointment.status === AppointmentStatus.COMPLETED && "border-l-green-500",
                      appointment.status === AppointmentStatus.CANCELLED && "border-l-red-500 opacity-75",
                      !isPast && appointment.status === AppointmentStatus.SCHEDULED && "border-l-blue-500",
                      appointment.status === AppointmentStatus.CHECKED_IN && "border-l-orange-500"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Time and Basic Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex flex-col items-center justify-center min-w-[80px] p-3 bg-slate-100 rounded-lg">
                            <Clock className="h-4 w-4 text-slate-600 mb-1" />
                            <span className="text-lg font-bold text-slate-900">
                              {format(aptDate, 'HH:mm')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(aptDate, 'dd/MM')}
                            </span>
                          </div>

                          {/* Patient and Doctor Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-4 w-4 text-blue-700" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">
                                  {appointment.patient_name || `Paciente #${appointment.patient_id}`}
                                </p>
                                {appointment.reason && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {appointment.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-purple-100 rounded">
                                <Stethoscope className="h-3.5 w-3.5 text-purple-700" />
                              </div>
                              <p className="text-sm text-slate-700">
                                {appointment.doctor_name || `Médico #${appointment.doctor_id}`}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "flex items-center gap-1.5",
                                  statusInfo.color,
                                  statusInfo.bgColor,
                                  "border-0"
                                )}
                              >
                                {statusInfo.icon}
                                {statusInfo.label}
                              </Badge>
                              {isPast && (
                                <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-200">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Atrasado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                          {/* Quick Status Actions */}
                          {appointment.status === AppointmentStatus.SCHEDULED && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.CHECKED_IN, 'Check-in realizado')}
                              className="text-orange-700 border-orange-200 hover:bg-orange-50"
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                              Check-in
                            </Button>
                          )}
                          
                          {appointment.status === AppointmentStatus.CHECKED_IN && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.IN_CONSULTATION, 'Atendimento iniciado')}
                              className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                            >
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              Iniciar
                            </Button>
                          )}
                          
                          {(appointment.status === AppointmentStatus.IN_CONSULTATION || appointment.status === AppointmentStatus.CHECKED_IN) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.COMPLETED, 'Consulta concluída')}
                              className="text-green-700 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                              Concluir
                            </Button>
                          )}

                          {/* View/Edit Actions */}
                          <Link href={`/medico/atendimento/${appointment.id}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Abrir
                            </Button>
                          </Link>

                          {/* More Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/secretaria/agendamentos/new?id=${appointment.id}`} className="flex items-center">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Consulta
                                </Link>
                              </DropdownMenuItem>
                              {appointment.status !== AppointmentStatus.CANCELLED && appointment.status !== AppointmentStatus.COMPLETED && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(appointment.id, AppointmentStatus.CANCELLED, 'Consulta cancelada')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar Consulta
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
