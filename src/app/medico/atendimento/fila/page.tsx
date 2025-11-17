"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, Clock, User, Stethoscope, CheckCircle2, XCircle, RefreshCw,
  Play, Square, AlertCircle, Search, Filter, Eye, FileText, Phone,
  Mail, Calendar, MapPin, Activity, TrendingUp, UserCheck, UserX,
  ArrowRight, Bell, Timer, CheckCircle, X, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface QueueItem {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_time: string;
  scheduled_datetime: string;
  wait_time: string;
  wait_time_minutes: number;
  status: string;
  appointment_type: string | null;
  checked_in_at: string | null;
  started_at: string | null;
}

interface PatientDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  cpf: string | null;
}

interface AppointmentDetails {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  appointment_type: string | null;
  status: string;
  notes: string | null;
  checked_in_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  patient_name?: string;
  doctor_name?: string;
}

export default function FilaAtendimentoPage() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<QueueItem[]>([]);
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    loadQueue();
    // Auto-refresh every 15 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadQueue, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    // Find patient in consultation
    const inConsultation = queue.find(p => p.status === "in_consultation");
    setCurrentPatient(inConsultation || null);
    filterQueue();
  }, [queue, searchTerm, statusFilter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await api.get<QueueItem[]>("/api/v1/appointments/doctor/queue");
      
      // Sort: IN_CONSULTATION first, then by scheduled_datetime
      const sorted = [...data].sort((a, b) => {
        if (a.status === "in_consultation" && b.status !== "in_consultation") return -1;
        if (a.status !== "in_consultation" && b.status === "in_consultation") return 1;
        
        const dateA = parseISO(a.scheduled_datetime);
        const dateB = parseISO(b.scheduled_datetime);
        return dateA.getTime() - dateB.getTime();
      });
      
      setQueue(sorted);
    } catch (error: any) {
      console.error("Failed to load queue:", error);
      toast.error("Erro ao carregar fila", {
        description: error?.message || error?.detail || "Não foi possível carregar a fila de atendimento",
      });
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const filterQueue = () => {
    let filtered = [...queue];
    
    // Filter by status
    if (statusFilter === "waiting") {
      filtered = filtered.filter(p => p.status === "checked_in");
    } else if (statusFilter === "in_consultation") {
      filtered = filtered.filter(p => p.status === "in_consultation");
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        return p.patient_name.toLowerCase().includes(search) ||
               (p.appointment_type || "").toLowerCase().includes(search);
      });
    }
    
    setFilteredQueue(filtered);
  };

  const handleViewPatient = async (patient: QueueItem) => {
    try {
      setSelectedPatient(patient);
      
      // Load patient details
      const patientData = await api.get<PatientDetails>(`/api/v1/patients/${patient.patient_id}`);
      setPatientDetails(patientData);
      
      // Load appointment details
      const appointmentData = await api.get<AppointmentDetails>(`/api/v1/appointments/${patient.id}`);
      setAppointmentDetails(appointmentData);
      
      setShowPatientDialog(true);
    } catch (error: any) {
      console.error("Failed to load patient details:", error);
      toast.error("Erro ao carregar detalhes", {
        description: error?.message || error?.detail || "Não foi possível carregar os detalhes do paciente",
      });
    }
  };

  const handleCheckIn = async (appointmentId: number) => {
    try {
      setUpdatingStatus(appointmentId);
      await api.patch(`/api/v1/appointments/${appointmentId}/status`, {
        status: "checked_in"
      });
      
      toast.success("Check-in realizado", {
        description: "O paciente foi registrado na fila",
      });
      
      await loadQueue();
    } catch (error: any) {
      console.error("Failed to check in:", error);
      toast.error("Erro ao realizar check-in", {
        description: error?.message || error?.detail || "Não foi possível realizar o check-in",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStartAppointment = async (appointmentId: number) => {
    try {
      setUpdatingStatus(appointmentId);
      await api.patch(`/api/v1/appointments/${appointmentId}/status`, {
        status: "in_consultation"
      });
      
      toast.success("Atendimento iniciado", {
        description: "O atendimento foi iniciado com sucesso",
      });
      
      await loadQueue();
    } catch (error: any) {
      console.error("Failed to start appointment:", error);
      toast.error("Erro ao iniciar atendimento", {
        description: error?.message || error?.detail || "Não foi possível iniciar o atendimento",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFinishAppointment = async (appointmentId: number) => {
    try {
      setUpdatingStatus(appointmentId);
      await api.patch(`/api/v1/appointments/${appointmentId}/status`, {
        status: "completed"
      });
      
      toast.success("Atendimento finalizado", {
        description: "O atendimento foi finalizado com sucesso",
      });
      
      await loadQueue();
      setCurrentPatient(null);
    } catch (error: any) {
      console.error("Failed to finish appointment:", error);
      toast.error("Erro ao finalizar atendimento", {
        description: error?.message || error?.detail || "Não foi possível finalizar o atendimento",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedPatient) return;

    try {
      setCancelling(true);
      await api.patch(`/api/v1/appointments/${selectedPatient.id}/status`, {
        status: "cancelled"
      });
      
      toast.success("Atendimento cancelado", {
        description: "O atendimento foi cancelado com sucesso",
      });
      
      setShowCancelDialog(false);
      setSelectedPatient(null);
      await loadQueue();
    } catch (error: any) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Erro ao cancelar atendimento", {
        description: error?.message || error?.detail || "Não foi possível cancelar o atendimento",
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "in_consultation") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Em Atendimento</Badge>;
    }
    if (status === "checked_in") {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Aguardando</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
  };

  const getPriorityBadge = (waitTimeMinutes: number) => {
    if (waitTimeMinutes > 30) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Alta Prioridade</Badge>;
    }
    if (waitTimeMinutes > 15) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Média Prioridade</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Normal</Badge>;
  };

  const getWaitTimeColor = (waitTimeMinutes: number) => {
    if (waitTimeMinutes > 30) return "text-red-600 font-bold";
    if (waitTimeMinutes > 15) return "text-orange-600 font-semibold";
    return "text-gray-600";
  };

  const waitingQueue = filteredQueue.filter(p => p.status === "checked_in");
  const inConsultationQueue = filteredQueue.filter(p => p.status === "in_consultation");

  const stats = {
    total: queue.length,
    waiting: queue.filter(p => p.status === "checked_in").length,
    inConsultation: queue.filter(p => p.status === "in_consultation").length,
    avgWaitTime: queue.length > 0
      ? Math.round(
          queue
            .filter(p => p.status === "checked_in")
            .reduce((sum, p) => sum + p.wait_time_minutes, 0) / 
          Math.max(waitingQueue.length, 1)
        )
      : 0,
  };

  if (loading && queue.length === 0) {
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
            <Users className="h-8 w-8 text-green-600" />
            Fila de Atendimento
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie a fila de pacientes aguardando atendimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <Bell className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : ''}`} />
            {autoRefresh ? "Auto-atualizar ON" : "Auto-atualizar OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total na Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Pacientes na fila</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Aguardando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.waiting}</div>
            <p className="text-xs text-gray-500 mt-1">Pacientes aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Em Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.inConsultation}</div>
            <p className="text-xs text-gray-500 mt-1">Consultas em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.avgWaitTime} min</div>
            <p className="text-xs text-gray-500 mt-1">Tempo médio de espera</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome do paciente ou tipo de consulta..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="in_consultation">Em Atendimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Patient Card */}
        {currentPatient && (
          <Card className="lg:col-span-1 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Stethoscope className="h-5 w-5" />
                Em Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <User className="h-12 w-12 text-green-700" />
                  </div>
                  <div className="font-bold text-2xl text-gray-900">{currentPatient.patient_name}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário: {currentPatient.appointment_time}
                  </div>
                  {currentPatient.appointment_type && (
                    <div className="text-sm text-gray-500 mt-1">{currentPatient.appointment_type}</div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Tempo de espera:
                    </span>
                    <span className={`font-semibold ${getWaitTimeColor(currentPatient.wait_time_minutes)}`}>
                      {currentPatient.wait_time}
                    </span>
                  </div>
                  {currentPatient.started_at && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-sm text-gray-600">Iniciado às:</span>
                      <span className="font-semibold text-gray-900">
                        {format(parseISO(currentPatient.started_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleFinishAppointment(currentPatient.id)}
                    disabled={updatingStatus === currentPatient.id}
                  >
                    {updatingStatus === currentPatient.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Finalizar
                      </>
                    )}
                  </Button>
                  <Link href={`/medico/atendimento/${currentPatient.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Prontuário
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        <Card className={currentPatient ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fila de Espera</CardTitle>
                <CardDescription>
                  {waitingQueue.length > 0 
                    ? `${waitingQueue.length} ${waitingQueue.length === 1 ? "paciente aguardando" : "pacientes aguardando"}`
                    : "Nenhum paciente aguardando"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {waitingQueue.length > 0 ? (
              <div className="space-y-3">
                {waitingQueue.map((patient, index) => (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      patient.wait_time_minutes > 30 
                        ? "bg-red-50 border-red-200 hover:bg-red-100" 
                        : patient.wait_time_minutes > 15
                        ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        patient.wait_time_minutes > 30 
                          ? "bg-red-200 text-red-800" 
                          : patient.wait_time_minutes > 15
                          ? "bg-orange-200 text-orange-800"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900">{patient.patient_name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-4 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {patient.appointment_time}
                          </span>
                          <span className={`flex items-center gap-1 ${getWaitTimeColor(patient.wait_time_minutes)}`}>
                            <Timer className="h-4 w-4" />
                            Espera: {patient.wait_time}
                          </span>
                          {patient.appointment_type && (
                            <span className="text-gray-500">{patient.appointment_type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getPriorityBadge(patient.wait_time_minutes)}
                      {getStatusBadge(patient.status)}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPatient(patient)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStartAppointment(patient.id)}
                          disabled={updatingStatus === patient.id || !!currentPatient}
                        >
                          {updatingStatus === patient.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Iniciando...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Nenhum paciente aguardando atendimento</p>
                <p className="text-sm mt-2">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros"
                    : "A fila está vazia no momento"}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              {selectedPatient && `Informações completas de ${selectedPatient.patient_name}`}
            </DialogDescription>
          </DialogHeader>
          {patientDetails && appointmentDetails && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Informações do Paciente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Nome Completo</div>
                    <p className="font-medium">{patientDetails.first_name} {patientDetails.last_name}</p>
                  </div>
                  {patientDetails.cpf && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">CPF</div>
                      <p className="font-medium">{patientDetails.cpf}</p>
                    </div>
                  )}
                  {patientDetails.date_of_birth && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Data de Nascimento</div>
                      <p className="font-medium">
                        {format(parseISO(patientDetails.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {patientDetails.gender && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Sexo</div>
                      <p className="font-medium capitalize">{patientDetails.gender}</p>
                    </div>
                  )}
                  {patientDetails.email && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        E-mail
                      </div>
                      <p className="font-medium">{patientDetails.email}</p>
                    </div>
                  )}
                  {patientDetails.phone && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Telefone
                      </div>
                      <p className="font-medium">{patientDetails.phone}</p>
                    </div>
                  )}
                  {(patientDetails.address || patientDetails.city) && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Endereço
                      </div>
                      <p className="font-medium">
                        {[patientDetails.address, patientDetails.city, patientDetails.state, patientDetails.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Appointment Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Informações da Consulta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Data e Hora</div>
                    <p className="font-medium">
                      {format(parseISO(appointmentDetails.scheduled_datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Duração</div>
                    <p className="font-medium">{appointmentDetails.duration_minutes} minutos</p>
                  </div>
                  {appointmentDetails.appointment_type && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tipo</div>
                      <p className="font-medium">{appointmentDetails.appointment_type}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div>
                      {getStatusBadge(appointmentDetails.status)}
                    </div>
                  </div>
                  {appointmentDetails.checked_in_at && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Check-in</div>
                      <p className="font-medium">
                        {format(parseISO(appointmentDetails.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {appointmentDetails.started_at && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Iniciado</div>
                      <p className="font-medium">
                        {format(parseISO(appointmentDetails.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {appointmentDetails.notes && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Observações</div>
                      <p className="font-medium">{appointmentDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatientDialog(false)}>
              Fechar
            </Button>
            {selectedPatient && (
              <>
                {selectedPatient.status === "checked_in" && (
                  <Button
                    onClick={() => {
                      setShowPatientDialog(false);
                      handleStartAppointment(selectedPatient.id);
                    }}
                    disabled={updatingStatus === selectedPatient.id || !!currentPatient}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Atendimento
                  </Button>
                )}
                <Link href={`/medico/atendimento/${selectedPatient.id}`}>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Prontuário
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowPatientDialog(false);
                    setShowCancelDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o atendimento de {selectedPatient?.patient_name}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Sim, cancelar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
