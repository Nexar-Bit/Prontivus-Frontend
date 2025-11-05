"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Video,
  Phone,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Star,
  AlertCircle,
  FileText,
  Navigation,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  ArrowRight,
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";

// Types
interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialty?: string;
  rating?: number;
  photo?: string;
  available?: boolean;
  nextAvailable?: string;
}

interface Appointment {
  id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  appointment_type: 'consultation' | 'telemedicine' | 'procedure' | 'follow-up';
  reason?: string;
  notes?: string;
  doctor: Doctor;
  location?: string;
  preparation_checklist?: string[];
  visit_summary?: string;
}

interface BookingStep {
  step: number;
  label: string;
  description: string;
}

// Data
const mockDoctors: Doctor[] = [];

const bookingSteps: BookingStep[] = [
  { step: 1, label: 'Médico', description: 'Escolha o médico' },
  { step: 2, label: 'Horário', description: 'Selecione data e hora' },
  { step: 3, label: 'Motivo', description: 'Informe o motivo da consulta' },
  { step: 4, label: 'Confirmação', description: 'Revise e confirme' },
];

const commonSymptoms = [
  'Dor de cabeça',
  'Febre',
  'Tosse',
  'Dor no peito',
  'Dor abdominal',
  'Dor nas costas',
  'Dificuldade para respirar',
  'Náusea',
  'Tontura',
  'Fadiga',
  'Outro motivo',
];

const specialtyIcons: Record<string, string> = {
  'Cardiologia': '❤️',
  'Clínico Geral': '🩺',
  'Pediatria': '👶',
  'Dermatologia': '🧴',
  'Ortopedia': '🦴',
  'Neurologia': '🧠',
  'Oftalmologia': '👁️',
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [appts, doctors] = await Promise.all([
          api.get<any[]>(`/api/appointments/patient-appointments`),
          api.get<any[]>(`/api/users/doctors`),
        ]);
        // Map doctors by name for display enrichment
        const docById = new Map<number, Partial<Doctor>>();
        doctors.forEach((d: any) => {
          docById.set(d.id, {
            id: d.id,
            first_name: (d.first_name || (d.username || '')).toString(),
            last_name: (d.last_name || '').toString(),
            specialty: d.specialty || undefined,
          });
        });
        const mapped: Appointment[] = appts.map((a: any) => ({
          id: a.id,
          scheduled_datetime: a.scheduled_datetime,
          duration_minutes: a.duration_minutes,
          status: (a.status || 'scheduled').toLowerCase(),
          appointment_type: (a.appointment_type || 'consultation'),
          reason: a.reason || undefined,
          notes: a.notes || undefined,
          doctor: {
            id: a.doctor_id,
            first_name: (docById.get(a.doctor_id)?.first_name as string) || (a.doctor_name?.split(' ')[0] || 'Médico'),
            last_name: (docById.get(a.doctor_id)?.last_name as string) || (a.doctor_name?.split(' ').slice(1).join(' ') || ''),
          } as Doctor,
          location: undefined,
          preparation_checklist: undefined,
          visit_summary: undefined,
        }));
        setAppointments(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'telemedicine'>('consultation');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [expandedPast, setExpandedPast] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Separate upcoming and past appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(apt => {
        const aptDate = parseISO(apt.scheduled_datetime);
        return isAfter(aptDate, now) && apt.status !== 'cancelled' && apt.status !== 'completed';
      })
      .sort((a, b) => parseISO(a.scheduled_datetime).getTime() - parseISO(b.scheduled_datetime).getTime());
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(apt => {
        const aptDate = parseISO(apt.scheduled_datetime);
        return isBefore(aptDate, now) || apt.status === 'completed' || apt.status === 'cancelled';
      })
      .sort((a, b) => parseISO(b.scheduled_datetime).getTime() - parseISO(a.scheduled_datetime).getTime());
  }, [appointments]);

  // Available time slots
  const timeSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: Math.random() > 0.3, // Mock availability
        });
      }
    }
    return slots;
  }, [selectedDoctor]);

  const togglePastExpand = (id: number) => {
    const newExpanded = new Set(expandedPast);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPast(newExpanded);
  };

  const toggleSymptom = (symptom: string) => {
    const newSymptoms = [...selectedSymptoms];
    const index = newSymptoms.indexOf(symptom);
    if (index > -1) {
      newSymptoms.splice(index, 1);
    } else {
      newSymptoms.push(symptom);
    }
    setSelectedSymptoms(newSymptoms);
  };

  const handleBookingNext = () => {
    if (bookingStep < 4) {
      setBookingStep(bookingStep + 1);
    }
  };

  const handleBookingBack = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    }
  };

  const handleBookAppointment = async () => {
    setIsBooking(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsBooking(false);
    setShowBookingModal(false);
    setBookingStep(1);
    setSelectedDoctor(null);
    setSelectedDate(new Date());
    setSelectedTime('');
    setSelectedSymptoms([]);
    setReason('');
    // Show success message
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Agendado
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getAppointmentTypeBadge = (type: string) => {
    if (type === 'telemedicine') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
          <Video className="h-3 w-3 mr-1" />
          Telemedicina
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
        <Stethoscope className="h-3 w-3 mr-1" />
        Presencial
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Agendamentos</h1>
              <p className="text-[#5D737E]">
                Gerencie seus agendamentos e consulte com seus médicos
              </p>
            </div>
            <Button
              size="lg"
              className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
              onClick={() => setShowBookingModal(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Agendar Consulta
            </Button>
          </div>

          {/* Upcoming Appointments */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#0F4C75] mb-4">
              Próximos Agendamentos ({upcomingAppointments.length})
            </h2>
            {upcomingAppointments.length === 0 ? (
              <Card className="medical-card">
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum agendamento próximo</p>
                  <Button onClick={() => setShowBookingModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="medical-card hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16 border-2 border-[#0F4C75]/20">
                            <AvatarImage src={appointment.doctor.photo} />
                            <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75]">
                              {appointment.doctor.first_name[0]}{appointment.doctor.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg text-[#0F4C75] mb-1">
                              Dr(a). {appointment.doctor.first_name} {appointment.doctor.last_name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {specialtyIcons[appointment.doctor.specialty || ''] || '🩺'} {appointment.doctor.specialty || 'Clínico Geral'}
                              </Badge>
                              {appointment.doctor.rating && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {appointment.doctor.rating}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {format(parseISO(appointment.scheduled_datetime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(parseISO(appointment.scheduled_datetime), "HH:mm")}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(appointment.status)}
                          {getAppointmentTypeBadge(appointment.appointment_type)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {appointment.reason && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Motivo da Consulta</div>
                          <div className="text-sm text-gray-900">{appointment.reason}</div>
                        </div>
                      )}
                      {appointment.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Local</div>
                            <div className="text-sm text-gray-900">{appointment.location}</div>
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-[#1B9AAA]">
                              <Navigation className="h-3 w-3 mr-1" />
                              Ver no mapa
                            </Button>
                          </div>
                        </div>
                      )}
                      {appointment.preparation_checklist && appointment.preparation_checklist.length > 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="text-xs font-semibold text-blue-900 mb-2">Checklist de Preparação</div>
                          <ul className="space-y-1">
                            {appointment.preparation_checklist.map((item, idx) => (
                              <li key={idx} className="text-xs text-blue-800 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                        {appointment.appointment_type === 'telemedicine' && (
                          <Button variant="default" size="sm" className="flex-1">
                            <Video className="h-4 w-4 mr-2" />
                            Entrar na Consulta
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Simple reschedule to +7 days same time
                            const current = parseISO(appointment.scheduled_datetime);
                            const newDate = addDays(current, 7);
                            await api.post(`/api/appointments/${appointment.id}/reschedule`, {
                              scheduled_datetime: newDate.toISOString(),
                            });
                            // reload
                            const appts = await api.get<any[]>(`/api/appointments/patient-appointments`);
                            setAppointments(appts.map((a:any)=>({
                              id:a.id, scheduled_datetime:a.scheduled_datetime, duration_minutes:a.duration_minutes, status:(a.status||'scheduled').toLowerCase(), appointment_type:(a.appointment_type||'consultation'), reason:a.reason, notes:a.notes, doctor:{ id:a.doctor_id, first_name:a.doctor_name?.split(' ')[0]||'Médico', last_name:a.doctor_name?.split(' ').slice(1).join(' ')||''} as Doctor
                            })) as any);
                          }}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Reagendar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            await api.post(`/api/appointments/${appointment.id}/cancel`, {});
                            const appts = await api.get<any[]>(`/api/appointments/patient-appointments`);
                            setAppointments(appts.map((a:any)=>({
                              id:a.id, scheduled_datetime:a.scheduled_datetime, duration_minutes:a.duration_minutes, status:(a.status||'scheduled').toLowerCase(), appointment_type:(a.appointment_type||'consultation'), reason:a.reason, notes:a.notes, doctor:{ id:a.doctor_id, first_name:a.doctor_name?.split(' ')[0]||'Médico', last_name:a.doctor_name?.split(' ').slice(1).join(' ')||''} as Doctor
                            })) as any);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#0F4C75]">
                Histórico de Consultas ({pastAppointments.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allExpanded = new Set(pastAppointments.map(apt => apt.id));
                  setExpandedPast(expandedPast.size === pastAppointments.length ? new Set() : allExpanded);
                }}
              >
                {expandedPast.size === pastAppointments.length ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Recolher Todos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Expandir Todos
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-3">
              {pastAppointments.map((appointment) => {
                const isExpanded = expandedPast.has(appointment.id);
                return (
                  <Card key={appointment.id} className="medical-card">
                    <CardHeader
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => togglePastExpand(appointment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={appointment.doctor.photo} />
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {appointment.doctor.first_name[0]}{appointment.doctor.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base text-gray-900">
                                Dr(a). {appointment.doctor.first_name} {appointment.doctor.last_name}
                              </CardTitle>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(parseISO(appointment.scheduled_datetime), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(appointment.scheduled_datetime), "HH:mm")}
                              </div>
                              {getAppointmentTypeBadge(appointment.appointment_type)}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        {appointment.visit_summary && (
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200 mb-3">
                            <div className="text-xs font-semibold text-green-900 mb-1">Resumo da Consulta</div>
                            <p className="text-sm text-green-800">{appointment.visit_summary}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Receita
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Booking Modal */}
          <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl text-[#0F4C75]">Agendar Consulta</DialogTitle>
                <DialogDescription>
                  Preencha as informações para agendar sua consulta
                </DialogDescription>
              </DialogHeader>

              {/* Step Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {bookingSteps.map((step, idx) => (
                    <React.Fragment key={step.step}>
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                            bookingStep >= step.step
                              ? "bg-[#0F4C75] border-[#0F4C75] text-white"
                              : "bg-white border-gray-300 text-gray-400"
                          )}
                        >
                          {bookingStep > step.step ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span>{step.step}</span>
                          )}
                        </div>
                        <div className="ml-3 hidden sm:block">
                          <div className={cn(
                            "text-sm font-medium",
                            bookingStep >= step.step ? "text-[#0F4C75]" : "text-gray-400"
                          )}>
                            {step.label}
                          </div>
                          <div className="text-xs text-gray-500">{step.description}</div>
                        </div>
                      </div>
                      {idx < bookingSteps.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 mx-4 transition-all",
                            bookingStep > step.step ? "bg-[#0F4C75]" : "bg-gray-300"
                          )}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Step 1: Doctor Selection */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecione o Médico</h3>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar médico ou especialidade..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                      {mockDoctors
                        .filter(doctor =>
                          !searchQuery ||
                          `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doctor.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((doctor) => (
                          <Card
                            key={doctor.id}
                            className={cn(
                              "medical-card cursor-pointer transition-all hover:shadow-lg border-2",
                              selectedDoctor?.id === doctor.id
                                ? "border-[#0F4C75] bg-[#0F4C75]/5"
                                : "border-gray-200 hover:border-[#0F4C75]/50"
                            )}
                            onClick={() => setSelectedDoctor(doctor)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-16 w-16 border-2 border-[#0F4C75]/20">
                                  <AvatarImage src={doctor.photo} />
                                  <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75]">
                                    {doctor.first_name[0]}{doctor.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 mb-1">
                                    Dr(a). {doctor.first_name} {doctor.last_name}
                                  </div>
                                  <Badge variant="outline" className="mb-2">
                                    {specialtyIcons[doctor.specialty || ''] || '🩺'} {doctor.specialty || 'Clínico Geral'}
                                  </Badge>
                                  {doctor.rating && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      {doctor.rating} ({Math.floor(Math.random() * 100 + 20)} avaliações)
                                    </div>
                                  )}
                                  {doctor.available ? (
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                      <CheckCircle className="h-3 w-3" />
                                      Disponível agora
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500">
                                      Próxima disponibilidade: {doctor.nextAvailable ? format(parseISO(doctor.nextAvailable), "dd/MM HH:mm", { locale: ptBR }) : 'N/A'}
                                    </div>
                                  )}
                                </div>
                                {selectedDoctor?.id === doctor.id && (
                                  <CheckCircle className="h-5 w-5 text-[#0F4C75]" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Time Selection */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecione Data e Horário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Data</div>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => isBefore(date, startOfToday())}
                          className="rounded-lg border"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Tipo de Consulta</div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <Card
                            className={cn(
                              "cursor-pointer transition-all border-2",
                              appointmentType === 'consultation'
                                ? "border-[#0F4C75] bg-[#0F4C75]/5"
                                : "border-gray-200 hover:border-[#0F4C75]/50"
                            )}
                            onClick={() => setAppointmentType('consultation')}
                          >
                            <CardContent className="p-4 text-center">
                              <Stethoscope className="h-6 w-6 mx-auto mb-2 text-[#0F4C75]" />
                              <div className="text-sm font-medium">Presencial</div>
                            </CardContent>
                          </Card>
                          <Card
                            className={cn(
                              "cursor-pointer transition-all border-2",
                              appointmentType === 'telemedicine'
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-purple-200"
                            )}
                            onClick={() => setAppointmentType('telemedicine')}
                          >
                            <CardContent className="p-4 text-center">
                              <Video className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                              <div className="text-sm font-medium">Telemedicina</div>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Horário</div>
                        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                          {timeSlots.filter(slot => slot.available).map((slot) => (
                            <Button
                              key={slot.time}
                              variant={selectedTime === slot.time ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedTime(slot.time)}
                              className={selectedTime === slot.time ? 'bg-[#0F4C75] hover:bg-[#1B9AAA]' : ''}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Reason for Visit */}
              {bookingStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Motivo da Consulta</h3>
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Sintomas ou Motivo</div>
                      <div className="flex flex-wrap gap-2">
                        {commonSymptoms.map((symptom) => (
                          <Badge
                            key={symptom}
                            variant={selectedSymptoms.includes(symptom) ? 'default' : 'outline'}
                            className={cn(
                              "cursor-pointer transition-all",
                              selectedSymptoms.includes(symptom)
                                ? "bg-[#0F4C75] text-white border-[#0F4C75]"
                                : "hover:bg-[#0F4C75]/10"
                            )}
                            onClick={() => toggleSymptom(symptom)}
                          >
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Descrição Adicional (Opcional)</div>
                      <Textarea
                        placeholder="Descreva seus sintomas ou motivo da consulta com mais detalhes..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {bookingStep === 4 && selectedDoctor && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmação</h3>
                    <Card className="medical-card border-2 border-[#0F4C75]">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                            <Avatar className="h-16 w-16 border-2 border-[#0F4C75]/20">
                              <AvatarImage src={selectedDoctor.photo} />
                              <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75]">
                                {selectedDoctor.first_name[0]}{selectedDoctor.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-900 mb-1">
                                Dr(a). {selectedDoctor.first_name} {selectedDoctor.last_name}
                              </div>
                              <Badge variant="outline">
                                {specialtyIcons[selectedDoctor.specialty || ''] || '🩺'} {selectedDoctor.specialty || 'Clínico Geral'}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Data e Horário</div>
                              <div className="text-sm font-medium text-gray-900">
                                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </div>
                              <div className="text-sm text-gray-600">{selectedTime}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Tipo de Consulta</div>
                              <div className="flex items-center gap-2">
                                {appointmentType === 'telemedicine' ? (
                                  <>
                                    <Video className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-900">Telemedicina</span>
                                  </>
                                ) : (
                                  <>
                                    <Stethoscope className="h-4 w-4 text-[#0F4C75]" />
                                    <span className="text-sm font-medium text-gray-900">Presencial</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {selectedSymptoms.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 mb-2">Motivo</div>
                              <div className="flex flex-wrap gap-2">
                                {selectedSymptoms.map((symptom) => (
                                  <Badge key={symptom} variant="outline">{symptom}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {reason && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Descrição</div>
                              <div className="text-sm text-gray-900">{reason}</div>
                            </div>
                          )}
                          {appointmentType === 'telemedicine' && (
                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                              <div className="text-xs font-semibold text-purple-900 mb-2">Instruções para Telemedicina</div>
                              <ul className="space-y-1 text-xs text-purple-800">
                                <li>• Certifique-se de ter uma conexão de internet estável</li>
                                <li>• Esteja em um local silencioso e bem iluminado</li>
                                <li>• Tenha sua lista de medicamentos em mãos</li>
                                <li>• Entre na consulta 5 minutos antes do horário</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={bookingStep === 1 ? () => setShowBookingModal(false) : handleBookingBack}
                  disabled={isBooking}
                >
                  {bookingStep === 1 ? 'Cancelar' : 'Voltar'}
                </Button>
                <Button
                  onClick={bookingStep === 4 ? handleBookAppointment : handleBookingNext}
                  disabled={
                    isBooking ||
                    (bookingStep === 1 && !selectedDoctor) ||
                    (bookingStep === 2 && (!selectedDate || !selectedTime)) ||
                    (bookingStep === 3 && selectedSymptoms.length === 0 && !reason)
                  }
                  className="bg-[#0F4C75] hover:bg-[#1B9AAA]"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Agendando...
                    </>
                  ) : bookingStep === 4 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

