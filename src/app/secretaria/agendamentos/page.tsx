"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus, Search, Filter, Clock, User, Stethoscope, CheckCircle2, XCircle, AlertCircle, RefreshCw, Edit, Trash2, ChevronLeft, ChevronRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Calendar, momentLocalizer, View, Event } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import moment from "moment";

// Configure moment locale
moment.locale("pt-br");
const localizer = momentLocalizer(moment);

// Create the DnD Calendar component
const DnDCalendar = withDragAndDrop(Calendar);

interface Appointment {
  id: number;
  scheduled_datetime: string;
  status: string;
  appointment_type?: string;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AppointmentFormData {
  patient_id: number | null;
  doctor_id: number | null;
  scheduled_datetime: string;
  appointment_type: string;
}

interface CalendarEvent extends Event {
  id?: string | number;
  appointment: Appointment;
  resource?: {
    status: string;
    appointment_type?: string;
    patient_name: string;
    doctor_name: string;
  };
}

export default function AgendamentosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: null,
    doctor_id: null,
    scheduled_datetime: "",
    appointment_type: "consultation",
  });
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [view, setView] = useState<View>("month");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filterStatus, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAppointments(),
        loadPatients(),
        loadDoctors(),
      ]);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await api.get<Appointment[]>("/api/appointments");
      setAppointments(data);
    } catch (error: any) {
      console.error("Failed to load appointments:", error);
      toast.error("Erro ao carregar agendamentos", {
        description: error?.message || "Não foi possível carregar os agendamentos",
      });
      setAppointments([]);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.get<Patient[]>("/api/patients");
      setPatients(data);
    } catch (error: any) {
      console.error("Failed to load patients:", error);
      setPatients([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await api.get<Doctor[]>("/api/users/doctors");
      setDoctors(data);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      setDoctors([]);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name.toLowerCase().includes(searchLower) ||
          apt.doctor_name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((apt) => {
        const statusLower = apt.status.toLowerCase();
        switch (filterStatus) {
          case "Confirmado":
            return statusLower === "scheduled";
          case "Pendente":
            return statusLower === "checked_in" || statusLower === "in_consultation";
          case "Cancelado":
            return statusLower === "cancelled";
          case "Concluído":
            return statusLower === "completed";
          default:
            return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "scheduled":
        return "#10b981"; // green
      case "checked_in":
        return "#3b82f6"; // blue
      case "in_consultation":
        return "#8b5cf6"; // purple
      case "completed":
        return "#6b7280"; // gray
      case "cancelled":
        return "#ef4444"; // red
      default:
        return "#6b7280";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "scheduled":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Agendado</Badge>;
      case "checked_in":
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Check-in</Badge>;
      case "in_consultation":
        return <Badge className="bg-purple-100 text-purple-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Em Consulta</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Concluído</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Convert appointments to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredAppointments.map((appointment) => {
      const start = parseISO(appointment.scheduled_datetime);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes duration

      const event: CalendarEvent = {
        id: appointment.id,
        title: `${appointment.patient_name} - ${appointment.doctor_name}`,
        start,
        end,
        appointment,
        resource: {
          status: appointment.status,
          appointment_type: appointment.appointment_type,
          patient_name: appointment.patient_name,
          doctor_name: appointment.doctor_name,
        },
      };
      
      // Add appointment data directly to event for easier access
      (event as any).appointmentData = appointment;
      
      return event;
    });
  }, [filteredAppointments]);

  // Custom event style
  const eventStyleGetter = (event: any) => {
    const calEvent = event as CalendarEvent;
    const appointmentType = calEvent.appointment?.appointment_type?.toLowerCase() || "";
    const isReturn = appointmentType === 'return' || appointmentType === 'retorno' || appointmentType.includes('retorno') || appointmentType.includes('follow-up');
    
    // Use orange color for return appointments, otherwise use status color
    const baseColor = isReturn ? "#f97316" : getStatusColor(calEvent.appointment?.status || "scheduled");
    const isDraggable = calEvent.appointment?.status?.toLowerCase() !== "cancelled";
    return {
      style: {
        backgroundColor: baseColor,
        borderColor: baseColor,
        borderWidth: "0px",
        borderStyle: "none",
        color: "white",
        borderRadius: "4px",
        padding: "2px 4px",
        fontSize: "0.875rem",
        fontWeight: "500",
        cursor: isDraggable ? "move" : "default",
      },
    };
  };

  // Custom event component
  const EventComponent = ({ event }: { event: any }) => {
    const calEvent = event as CalendarEvent;
    return (
      <div className="flex flex-col">
        <div className="font-semibold text-xs truncate">{calEvent.appointment?.patient_name || ""}</div>
        <div className="text-xs opacity-90 truncate">{calEvent.appointment?.doctor_name || ""}</div>
        <div className="text-xs opacity-75">
          {calEvent.appointment?.scheduled_datetime 
            ? format(parseISO(calEvent.appointment.scheduled_datetime), "HH:mm", { locale: ptBR })
            : ""}
        </div>
      </div>
    );
  };

  const handleSelectEvent = (event: any) => {
    // Don't open edit modal if we're dragging
    if (isDragging) {
      return;
    }
    
    const calEvent = event as CalendarEvent;
    const appointment = calEvent.appointment || (calEvent as any).appointmentData;
    if (appointment) {
      handleEditAppointment(appointment);
    }
  };

  // Get today's appointments for queue display
  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return filteredAppointments.filter(apt => {
      const aptDate = parseISO(apt.scheduled_datetime);
      return aptDate >= today && aptDate < tomorrow;
    });
  }, [filteredAppointments]);

  // Get checked-in patients (queue)
  const queuePatients = useMemo(() => {
    return todayAppointments.filter(apt => {
      const statusLower = apt.status?.toLowerCase() || "";
      return statusLower === "checked_in" || statusLower === "in_consultation";
    }).sort((a, b) => {
      // Sort by status (in_consultation first), then by scheduled time
      const aStatus = a.status?.toLowerCase() || "";
      const bStatus = b.status?.toLowerCase() || "";
      if (aStatus === "in_consultation" && bStatus !== "in_consultation") return -1;
      if (bStatus === "in_consultation" && aStatus !== "in_consultation") return 1;
      return parseISO(a.scheduled_datetime).getTime() - parseISO(b.scheduled_datetime).getTime();
    });
  }, [todayAppointments]);

  // Get scheduled patients (can check in)
  const scheduledPatients = useMemo(() => {
    return todayAppointments.filter(apt => {
      const statusLower = apt.status?.toLowerCase() || "";
      return statusLower === "scheduled" || statusLower === "agendado" || statusLower === "confirmado";
    }).sort((a, b) => {
      return parseISO(a.scheduled_datetime).getTime() - parseISO(b.scheduled_datetime).getTime();
    });
  }, [todayAppointments]);

  const handleCreateAppointment = async () => {
    if (!formData.patient_id || !formData.doctor_id || !formData.scheduled_datetime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!user?.clinic_id) {
      toast.error("Erro ao identificar a clínica");
      return;
    }

    try {
      setSaving(true);
      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        clinic_id: user.clinic_id,
        scheduled_datetime: new Date(formData.scheduled_datetime).toISOString(),
        appointment_type: formData.appointment_type,
      };

      await api.post("/api/appointments", appointmentData);
      toast.success("Agendamento criado com sucesso!");
      setShowCreateModal(false);
      resetForm();
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to create appointment:", error);
      toast.error("Erro ao criar agendamento", {
        description: error?.message || error?.detail || "Não foi possível criar o agendamento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    const appointmentDate = parseISO(appointment.scheduled_datetime);
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      scheduled_datetime: format(appointmentDate, "yyyy-MM-dd'T'HH:mm"),
      appointment_type: appointment.appointment_type || "consultation",
    });
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !formData.patient_id || !formData.doctor_id || !formData.scheduled_datetime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        scheduled_datetime: new Date(formData.scheduled_datetime).toISOString(),
        appointment_type: formData.appointment_type,
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
      };

      await api.put(`/api/appointments/${editingAppointment.id}`, updateData);
      toast.success("Agendamento atualizado com sucesso!");
      setShowEditModal(false);
      setEditingAppointment(null);
      resetForm();
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to update appointment:", error);
      toast.error("Erro ao atualizar agendamento", {
        description: error?.message || error?.detail || "Não foi possível atualizar o agendamento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = (appointmentId: number) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelDialog(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      setCanceling(true);
      await api.patch(`/api/appointments/${appointmentToCancel}/status`, {
        status: "cancelled",
      });
      toast.success("Agendamento cancelado com sucesso!");
      await loadAppointments();
      setAppointmentToCancel(null);
    } catch (error: any) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Erro ao cancelar agendamento", {
        description: error?.message || error?.detail || "Não foi possível cancelar o agendamento",
      });
    } finally {
      setCanceling(false);
    }
  };

  const handleCheckIn = async (appointmentId: number) => {
    try {
      await api.patch(`/api/appointments/${appointmentId}/status`, {
        status: "checked_in",
      });
      toast.success("Check-in realizado com sucesso!");
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to check in appointment:", error);
      toast.error("Erro ao realizar check-in", {
        description: error?.message || error?.detail || "Não foi possível realizar o check-in",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: null,
      doctor_id: null,
      scheduled_datetime: "",
      appointment_type: "consultation",
    });
  };

  const openCreateModal = (selectedDate?: Date) => {
    resetForm();
    if (selectedDate) {
      // Format the selected date for datetime-local input (YYYY-MM-DDTHH:mm)
      const formattedDate = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
      setFormData({
        patient_id: null,
        doctor_id: null,
        scheduled_datetime: formattedDate,
        appointment_type: "consultation",
      });
    }
    setShowCreateModal(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action: "select" | "click" | "doubleClick" }) => {
    // Open create modal with the selected date/time pre-filled
    openCreateModal(slotInfo.start);
  };

  const handleEventDrop = async (data: any) => {
    setIsDragging(false);
    const { event, start } = data;
    // Convert start to Date if it's a string
    const startDate = start instanceof Date ? start : new Date(start);
    const calEvent = event as CalendarEvent;
    const appointment = calEvent.appointment || (calEvent as any).appointmentData;

    if (!appointment) {
      console.error("No appointment found in event", event);
      return;
    }

    try {
      // Update the appointment with new date/time
      const updateData = {
        scheduled_datetime: startDate.toISOString(),
        appointment_type: appointment.appointment_type || "consultation",
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
      };

      await api.put(`/api/appointments/${appointment.id}`, updateData);
      toast.success("Agendamento movido com sucesso!");
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to move appointment:", error);
      toast.error("Erro ao mover agendamento", {
        description: error?.message || error?.detail || "Não foi possível mover o agendamento",
      });
      // Reload to revert the visual change
      await loadAppointments();
    }
  };

  const handleEventResize = async (data: any) => {
    const { event, start } = data;
    // Convert start to Date if it's a string
    const startDate = start instanceof Date ? start : new Date(start);
    const calEvent = event as CalendarEvent;
    const appointment = calEvent.appointment || (calEvent as any).appointmentData;

    if (!appointment) {
      console.error("No appointment found in event", event);
      return;
    }

    try {
      // Update the appointment with new start time (duration is handled by end time)
      const updateData = {
        scheduled_datetime: startDate.toISOString(),
        appointment_type: appointment.appointment_type || "consultation",
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
      };

      await api.put(`/api/appointments/${appointment.id}`, updateData);
      toast.success("Duração do agendamento atualizada!");
      await loadAppointments();
    } catch (error: any) {
      console.error("Failed to resize appointment:", error);
      toast.error("Erro ao alterar duração", {
        description: error?.message || error?.detail || "Não foi possível alterar a duração",
      });
      // Reload to revert the visual change
      await loadAppointments();
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(direction === "next" ? addDays(currentDate, 7) : addDays(currentDate, -7));
    } else {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  const messages = {
    next: "Próximo",
    previous: "Anterior",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Nenhum agendamento neste período",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-teal-600" />
            Agendamentos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os agendamentos da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => openCreateModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente ou médico..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Confirmado">Agendado</SelectItem>
                <SelectItem value="Pendente">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Queue and Scheduled Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Queue - Checked-in Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Fila de Pacientes
            </CardTitle>
            <CardDescription>
              Pacientes que realizaram check-in e aguardam consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queuePatients.length > 0 ? (
              <div className="space-y-3">
                {queuePatients.map((appointment) => {
                  const appointmentDate = parseISO(appointment.scheduled_datetime);
                  const time = format(appointmentDate, "HH:mm", { locale: ptBR });
                  const isInConsultation = appointment.status?.toLowerCase() === "in_consultation";
                  
                  return (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isInConsultation ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isInConsultation ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <User className={`h-6 w-6 ${
                            isInConsultation ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{appointment.patient_name}</div>
                          <div className="text-sm text-gray-600">{appointment.doctor_name}</div>
                          <div className="text-xs text-gray-500">Horário: {time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum paciente na fila</p>
                <p className="text-sm mt-1">Pacientes com check-in aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Patients - Can Check In */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Agendados para Hoje
            </CardTitle>
            <CardDescription>
              Pacientes agendados que podem realizar check-in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledPatients.length > 0 ? (
              <div className="space-y-3">
                {scheduledPatients.map((appointment) => {
                  const appointmentDate = parseISO(appointment.scheduled_datetime);
                  const time = format(appointmentDate, "HH:mm", { locale: ptBR });
                  
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{appointment.patient_name}</div>
                          <div className="text-sm text-gray-600">{appointment.doctor_name}</div>
                          <div className="text-xs text-gray-500">Horário: {time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckIn(appointment.id)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <LogIn className="h-4 w-4 mr-1" />
                          Check-in
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum agendamento para hoje</p>
                <p className="text-sm mt-1">Agendamentos de hoje aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendário de Agendamentos</CardTitle>
              <CardDescription>
                Clique em um horário vago para criar um novo agendamento, clique em um agendamento existente para editá-lo, ou arraste um agendamento para movê-lo
              </CardDescription>
            </div>
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
                onClick={() => setCurrentDate(new Date())}
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
              <Select value={view} onValueChange={(v) => setView(v as View)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] [&_.rbc-event]:cursor-move [&_.rbc-event-content]:cursor-move">
            <DndProvider backend={HTML5Backend}>
              <DnDCalendar
              localizer={localizer}
              events={calendarEvents as any}
              startAccessor={"start" as any}
              endAccessor={"end" as any}
              style={{ height: "100%" }}
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectEvent={handleSelectEvent as any}
              onSelectSlot={handleSelectSlot as any}
              onEventDrop={handleEventDrop as any}
              onEventResize={handleEventResize as any}
              selectable
              resizable
              draggableAccessor={(event: any) => {
                const calEvent = event as CalendarEvent;
                const appointment = calEvent.appointment || (calEvent as any).appointmentData;
                // Only allow dragging if appointment exists and is not cancelled
                return !!(appointment && appointment.status?.toLowerCase() !== "cancelled");
              }}
              eventPropGetter={eventStyleGetter as any}
              messages={messages}
              culture="pt-BR"
              step={15}
              timeslots={4}
              components={{
                event: EventComponent as any,
              }}
              popup
              />
            </DndProvider>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm">Retorno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm">Em Consulta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Cancelado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select
                  value={formData.patient_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Médico *</Label>
                <Select
                  value={formData.doctor_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="datetime">Data e Hora *</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={formData.scheduled_datetime}
                  onChange={(e) => setFormData({ ...formData, scheduled_datetime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Consulta</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="follow-up">Retorno</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                    <SelectItem value="telemedicine">Telemedicina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAppointment} disabled={saving}>
              {saving ? "Salvando..." : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Atualize os dados do agendamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-patient">Paciente *</Label>
                <Select
                  value={formData.patient_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Médico *</Label>
                <Select
                  value={formData.doctor_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-datetime">Data e Hora *</Label>
                <Input
                  id="edit-datetime"
                  type="datetime-local"
                  value={formData.scheduled_datetime}
                  onChange={(e) => setFormData({ ...formData, scheduled_datetime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo de Consulta</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="follow-up">Retorno</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                    <SelectItem value="telemedicine">Telemedicina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingAppointment && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(editingAppointment.status)}
                </div>
                {editingAppointment.status.toLowerCase() !== "cancelled" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setShowEditModal(false);
                      handleCancelAppointment(editingAppointment.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Agendamento
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAppointment} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Confirmation Dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancelar Agendamento"
        description="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        confirmText="Cancelar Agendamento"
        cancelText="Manter Agendamento"
        variant="destructive"
        loading={canceling}
        onConfirm={confirmCancelAppointment}
      />
    </div>
  );
}
