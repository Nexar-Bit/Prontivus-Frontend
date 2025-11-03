"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { appointmentsApi } from "@/lib/appointments-api";
import { MedicalCalendar, CalendarEvent } from "@/components/appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Download, Calendar as CalendarIcon } from "lucide-react";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await appointmentsApi.getAll();
      setAppointments(data);
    } catch (error: any) {
      toast.error("Erro ao carregar agendamentos", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert appointments to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    return appointments.map((apt) => {
      const start = new Date(apt.scheduled_datetime);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes default

      // Determine appointment type from appointment_type field
      let type: 'consultation' | 'procedure' | 'follow-up' | 'emergency' = 'consultation';
      if (apt.appointment_type?.toLowerCase().includes('procedimento')) {
        type = 'procedure';
      } else if (apt.appointment_type?.toLowerCase().includes('retorno') || apt.appointment_type?.toLowerCase().includes('follow')) {
        type = 'follow-up';
      } else if (apt.appointment_type?.toLowerCase().includes('emergência') || apt.appointment_type?.toLowerCase().includes('urgente')) {
        type = 'emergency';
      }

      return {
        id: apt.id,
        title: apt.appointment_type || 'Consulta',
        start,
        end,
        resource: apt,
        status: apt.status || 'scheduled',
        type,
        patientName: (apt as any).patient?.first_name && (apt as any).patient?.last_name
          ? `${(apt as any).patient.first_name} ${(apt as any).patient.last_name}`
          : 'Paciente',
        doctorName: (apt as any).doctor?.first_name && (apt as any).doctor?.last_name
          ? `Dr(a). ${(apt as any).doctor.first_name} ${(apt as any).doctor.last_name}`
          : 'Médico',
        urgent: type === 'emergency' || (apt as any).appointment_type === 'emergency',
      };
    });
  }, [appointments]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    setSelectedSlot(slot);
    router.push(`/secretaria/agendamentos/new?date=${slot.start.toISOString()}`);
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusMap = {
      scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      checked_in: { label: 'Check-in', className: 'bg-orange-100 text-orange-700 border-orange-300' },
      in_progress: { label: 'Em Atendimento', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-300' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie consultas e agendamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => router.push('/secretaria/agendamentos/new')}
            className="bg-[#0F4C75] hover:bg-[#0F4C75]/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <MedicalCalendar
        events={calendarEvents}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        defaultView="week"
      />

      {/* Legend */}
      <Card className="medical-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm text-gray-700">Consulta Geral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-sm text-gray-700">Procedimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-gray-700">Retorno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-gray-700">Emergência</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#0F4C75]" />
                Detalhes do Agendamento
              </DialogTitle>
              <DialogDescription>
                Informações completas da consulta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Paciente</p>
                  <p className="font-semibold">{selectedEvent.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Médico</p>
                  <p className="font-semibold">{selectedEvent.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Data e Hora</p>
                  <p className="font-semibold">
                    {format(selectedEvent.start, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedEvent.status)}
                </div>
              </div>
              {selectedEvent.resource.appointment_type && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tipo</p>
                  <p className="font-medium">{selectedEvent.resource.appointment_type}</p>
                </div>
              )}
              {selectedEvent.resource.reason && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Motivo</p>
                  <p className="text-sm text-gray-900">{selectedEvent.resource.reason}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
