"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, RefreshCw, Phone } from "lucide-react";
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minha Agenda</h1>
          <p className="text-sm text-muted-foreground">Visualize e gerencie seus agendamentos do dia</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Waiting Patients */}
      {waitingPatients.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <User className="h-5 w-5" />
              Pacientes Aguardando ({waitingPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {waitingPatients.map((appt) => {
                const apptDate = new Date(appt.scheduled_datetime);
                return (
                  <div
                    key={appt.id}
                    className="border border-orange-300 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold">{format(apptDate, "HH:mm")}</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {appt.status === "checked_in" ? "Aguardando" : "Agendado"}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-2">{appt.patient_name || `Paciente #${appt.patient_id}`}</h4>
                    <div className="flex items-center gap-2">
                      <Link href={`/medico/atendimento/${appt.id}`}>
                        <Button size="sm" variant="outline" className="flex-1">Iniciar</Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleCallClick(appt.id)}
                        className="flex-1"
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : sortedAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento para esta data.
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
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              statusColor[status] || "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            {statusLabel[status] || status}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(apptDate, "HH:mm")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {appt.patient_name || `Paciente #${appt.patient_id}`}
                        </h3>
                        {appt.reason && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Motivo: {appt.reason}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-sm text-muted-foreground">{appt.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {canStart && (
                          <>
                            <Link href={`/medico/atendimento/${appt.id}`}>
                              <Button size="sm" className="w-full">Iniciar Atendimento</Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallClick(appt.id)}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Chamar Paciente
                            </Button>
                          </>
                        )}
                        {status === "in_consultation" && (
                          <Link href={`/medico/atendimento/${appt.id}`}>
                            <Button size="sm" variant="default" className="w-full">Continuar Atendimento</Button>
                          </Link>
                        )}
                        {status === "completed" && (
                          <Link href={`/medico/atendimento/${appt.id}`}>
                            <Button size="sm" variant="outline" className="w-full">Ver Prontuário</Button>
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
            <DialogTitle>Chamar Paciente</DialogTitle>
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
            >
              <Phone className="h-4 w-4 mr-2" />
              {isCalling ? "Chamando..." : "Confirmar Chamada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

