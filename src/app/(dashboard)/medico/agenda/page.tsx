"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Phone,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { patientCallingApi } from "@/lib/patient-calling-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const statusColor: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-500",
  checked_in: "bg-orange-500",
  in_consultation: "bg-yellow-500",
  completed: "bg-green-600",
  cancelled: "bg-gray-400",
};

const statusLabel: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  checked_in: "Aguardando",
  in_consultation: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusBadgeColor: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  checked_in: "bg-orange-100 text-orange-800 border-orange-200",
  in_consultation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function MedicoAgendaPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [callingAppointmentId, setCallingAppointmentId] = useState<number | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const fetchAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const data = await appointmentsApi.getAll({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        doctor_id: user.id,
      });

      setAppointments(data);
    } catch (error: any) {
      toast.error("Erro ao carregar agenda", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, user?.id]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleCallPatient = async (appointmentId: number) => {
    try {
      setIsCalling(true);
      await patientCallingApi.call(appointmentId);
      toast.success("Paciente chamado com sucesso");
      setShowCallDialog(false);
      setCallingAppointmentId(null);
    } catch (error: any) {
      toast.error("Erro ao chamar paciente", {
        description: error.message,
      });
    } finally {
      setIsCalling(false);
    }
  };

  const handleCallClick = (appointmentId: number) => {
    setCallingAppointmentId(appointmentId);
    setShowCallDialog(true);
  };

  const waitingPatients = appointments.filter(
    (a) => a.status === "checked_in" || a.status === "scheduled"
  );

  const sortedAppointments = [...appointments].sort((a, b) => {
    return new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime();
  });

  // Calculate statistics
  const stats = {
    total: appointments.length,
    waiting: waitingPatients.length,
    inProgress: appointments.filter(a => a.status === "in_consultation").length,
    completed: appointments.filter(a => a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-7 w-7 text-blue-600" />
            </div>
            Minha Agenda
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Visualize e gerencie seus agendamentos do dia
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAppointments} 
          disabled={loading}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Agendamentos
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Para hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pacientes na fila
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Atendimento
            </CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultas em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Atendimentos finalizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Waiting Patients */}
      {waitingPatients.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  Pacientes Aguardando ({waitingPatients.length})
                </CardTitle>
                <CardDescription className="mt-1">
                  Pacientes que estão aguardando atendimento
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {waitingPatients.map((appt) => {
                const apptDate = new Date(appt.scheduled_datetime);
                const status = appt.status as AppointmentStatus;
                return (
                  <div
                    key={appt.id}
                    className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50/30 hover:shadow-md transition-all hover:border-orange-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-semibold text-lg">{format(apptDate, "HH:mm")}</span>
                      </div>
                      <Badge className={cn("border", statusBadgeColor[status])}>
                        {statusLabel[status]}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      {appt.patient_name || `Paciente #${appt.patient_id}`}
                    </h4>
                    {appt.reason && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {appt.reason}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Link href={`/medico/atendimento/${appt.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          Iniciar
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCallClick(appt.id)}
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Chamar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar and Appointments */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <CardDescription className="mt-1">
                Todos os agendamentos do dia selecionado
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => changeDate(-1)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToToday}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => changeDate(1)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento para esta data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appt) => {
                const apptDate = new Date(appt.scheduled_datetime);
                const status = appt.status as AppointmentStatus;
                const canStart = status === "scheduled" || status === "checked_in";

                return (
                  <div
                    key={appt.id}
                    className={cn(
                      "border-2 rounded-lg p-5 hover:shadow-md transition-all",
                      status === "completed" && "border-green-200 bg-green-50/30",
                      status === "in_consultation" && "border-yellow-200 bg-yellow-50/30",
                      status === "checked_in" && "border-orange-200 bg-orange-50/30",
                      status === "scheduled" && "border-blue-200 bg-blue-50/30",
                      status === "cancelled" && "border-gray-200 bg-gray-50/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            status === "completed" && "bg-green-100",
                            status === "in_consultation" && "bg-yellow-100",
                            status === "checked_in" && "bg-orange-100",
                            status === "scheduled" && "bg-blue-100",
                            status === "cancelled" && "bg-gray-100"
                          )}>
                            <Clock className={cn(
                              "h-4 w-4",
                              status === "completed" && "text-green-600",
                              status === "in_consultation" && "text-yellow-600",
                              status === "checked_in" && "text-orange-600",
                              status === "scheduled" && "text-blue-600",
                              status === "cancelled" && "text-gray-600"
                            )} />
                          </div>
                          <span className="font-semibold text-lg">{format(apptDate, "HH:mm")}</span>
                          <Badge className={cn("border", statusBadgeColor[status])}>
                            {statusLabel[status]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          {appt.patient_name || `Paciente #${appt.patient_id}`}
                        </h3>
                        {appt.reason && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Motivo:</span> {appt.reason}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-sm text-muted-foreground">{appt.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {canStart && (
                          <>
                            <Link href={`/medico/atendimento/${appt.id}`}>
                              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Iniciar Atendimento
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallClick(appt.id)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Chamar Paciente
                            </Button>
                          </>
                        )}
                        {status === "in_consultation" && (
                          <Link href={`/medico/atendimento/${appt.id}`}>
                            <Button size="sm" variant="default" className="w-full bg-yellow-600 hover:bg-yellow-700">
                              <Activity className="h-3 w-3 mr-1" />
                              Continuar Atendimento
                            </Button>
                          </Link>
                        )}
                        {status === "completed" && (
                          <Link href={`/medico/atendimento/${appt.id}`}>
                            <Button size="sm" variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ver Prontuário
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Patient Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Chamar Paciente
            </DialogTitle>
            <DialogDescription>
              {callingAppointmentId && (() => {
                const appt = appointments.find((a) => a.id === callingAppointmentId);
                return appt ? (
                  <>Deseja chamar o paciente <strong>{appt.patient_name || `Paciente #${appt.patient_id}`}</strong> para a consulta? Esta ação enviará uma notificação visual e sonora na recepção.</>
                ) : null;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => callingAppointmentId && handleCallPatient(callingAppointmentId)}
              disabled={isCalling || !callingAppointmentId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCalling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chamando...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Confirmar Chamada
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
