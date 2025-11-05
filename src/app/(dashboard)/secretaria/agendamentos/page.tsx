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
import { Plus, Filter, Download, Calendar as CalendarIcon, Loader2, Edit, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    start_date?: string;
    end_date?: string;
    doctor_id?: number;
    status?: AppointmentStatus;
  }>({});
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await appointmentsApi.getAll(filters);
      setAppointments(data);
    } catch (error: any) {
      toast.error("Erro ao carregar agendamentos", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.doctor_id) params.append('doctor_id', filters.doctor_id.toString());
      if (filters.status) params.append('status', filters.status);
      
      const url = `${apiUrl}/api/appointments/export?${params.toString()}`;
      
      // Try to export as Excel/CSV
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success("Agendamentos exportados com sucesso!");
      } else {
        // Fallback: export as JSON
        const data = appointments.map(apt => ({
          id: apt.id,
          paciente: apt.patient_name || 'N/A',
          medico: apt.doctor_name || 'N/A',
          data: format(new Date(apt.scheduled_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          tipo: apt.appointment_type || 'Consulta',
          status: apt.status,
          motivo: apt.reason || '',
        }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Agendamentos exportados como JSON!");
      }
    } catch (error: any) {
      toast.error("Erro ao exportar agendamentos", {
        description: error.message,
      });
    }
  };

  // Convert appointments to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    return appointments.map((apt) => {
      const start = new Date(apt.scheduled_datetime);
      const end = new Date(start.getTime() + (apt.duration_minutes || 30) * 60 * 1000);

      // Determine appointment type from appointment_type field
      let type: 'consultation' | 'procedure' | 'follow-up' | 'emergency' = 'consultation';
      if (apt.appointment_type?.toLowerCase().includes('procedimento')) {
        type = 'procedure';
      } else if (apt.appointment_type?.toLowerCase().includes('retorno') || apt.appointment_type?.toLowerCase().includes('follow')) {
        type = 'follow-up';
      } else if (apt.appointment_type?.toLowerCase().includes('emergência') || apt.appointment_type?.toLowerCase().includes('urgente')) {
        type = 'emergency';
      }

      // Use patient_name and doctor_name from API response
      const patientName = apt.patient_name || 'Paciente';
      const doctorName = apt.doctor_name ? `Dr(a). ${apt.doctor_name}` : 'Médico';

      return {
        id: apt.id,
        title: apt.appointment_type || 'Consulta',
        start,
        end,
        resource: apt,
        status: apt.status || AppointmentStatus.SCHEDULED,
        type,
        patientName,
        doctorName,
        urgent: type === 'emergency' || apt.appointment_type?.toLowerCase() === 'emergency',
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

  const getStatusBadge = (status: AppointmentStatus | string) => {
    const statusMap = {
      scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      checked_in: { label: 'Check-in', className: 'bg-orange-100 text-orange-700 border-orange-300' },
      in_consultation: { label: 'Em Atendimento', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-300' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleStatusUpdate = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, newStatus);
      toast.success("Status do agendamento atualizado com sucesso!");
      loadAppointments();
      setSelectedEvent(null);
    } catch (error: any) {
      toast.error("Erro ao atualizar status", {
        description: error.message || "Não foi possível atualizar o status do agendamento",
      });
    }
  };

  const handleDelete = async (appointmentId: number) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) {
      return;
    }
    
    try {
      await appointmentsApi.delete(appointmentId);
      toast.success("Agendamento excluído com sucesso!");
      loadAppointments();
      setSelectedEvent(null);
    } catch (error: any) {
      const errorMessage = error.message || "Não foi possível excluir o agendamento";
      if (errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("admin")) {
        toast.error("Apenas administradores podem excluir agendamentos", {
          description: "Você não tem permissão para realizar esta ação",
        });
      } else {
        toast.error("Erro ao excluir agendamento", {
          description: errorMessage,
        });
      }
    }
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={appointments.length === 0}
          >
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
      {isLoading ? (
        <Card className="medical-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando agendamentos...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <MedicalCalendar
          events={calendarEvents}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          defaultView="week"
        />
      )}

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
              {selectedEvent.resource.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Observações</p>
                  <p className="text-sm text-gray-900">{selectedEvent.resource.notes}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/secretaria/agendamentos/new?id=${selectedEvent.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {selectedEvent.status === AppointmentStatus.SCHEDULED && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedEvent.id, AppointmentStatus.CHECKED_IN)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Check-in
                </Button>
              )}
              {selectedEvent.status === AppointmentStatus.CHECKED_IN && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedEvent.id, AppointmentStatus.IN_CONSULTATION)}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Iniciar Atendimento
                </Button>
              )}
              {(selectedEvent.status === AppointmentStatus.IN_CONSULTATION || selectedEvent.status === AppointmentStatus.CHECKED_IN) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedEvent.id, AppointmentStatus.COMPLETED)}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Concluído
                </Button>
              )}
              {selectedEvent.status !== AppointmentStatus.CANCELLED && selectedEvent.status !== AppointmentStatus.COMPLETED && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedEvent.id, AppointmentStatus.CANCELLED)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedEvent.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
