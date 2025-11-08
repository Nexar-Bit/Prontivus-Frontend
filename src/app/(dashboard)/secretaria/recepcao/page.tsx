"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { appointmentsApi } from "@/lib/appointments-api";
import { patientsApi } from "@/lib/patients-api";
import { Appointment, AppointmentStatus, Patient } from "@/lib/types";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { 
  Users, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Bell,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Activity,
  Stethoscope,
  UserCheck,
  Timer,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ReceptionPatient {
  id: number;
  appointmentId: number;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  arrivalTime: string;
  appointmentTime?: string;
  doctor?: string;
  reason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface ReceptionStats {
  totalWaiting: number;
  inConsultation: number;
  completedToday: number;
  averageWaitTime: number;
}

const PRIORITY_LEVELS = [
  { value: 'all', label: 'Todas as Prioridades' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'waiting', label: 'Aguardando' },
  { value: 'in_consultation', label: 'Em Atendimento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function ReceptionPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [stats, setStats] = useState<ReceptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<ReceptionPatient | null>(null);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<Patient | null>(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && user?.role !== 'secretary') {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadReceptionData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadReceptionData = async () => {
    try {
      setLoading(true);
      
      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const appointments = await appointmentsApi.getAll({
        start_date: format(today, "yyyy-MM-dd"),
        end_date: format(tomorrow, "yyyy-MM-dd"),
      });
      
      // Convert appointments to reception patients
      const receptionPatients: ReceptionPatient[] = appointments.map((apt: Appointment) => {
        // Map appointment status to reception status
        let receptionStatus: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' = 'waiting';
        if (apt.status === AppointmentStatus.CHECKED_IN || apt.status === AppointmentStatus.SCHEDULED) {
          receptionStatus = 'waiting';
        } else if (apt.status === AppointmentStatus.IN_CONSULTATION) {
          receptionStatus = 'in_consultation';
        } else if (apt.status === AppointmentStatus.COMPLETED) {
          receptionStatus = 'completed';
        } else if (apt.status === AppointmentStatus.CANCELLED) {
          receptionStatus = 'cancelled';
        }
        
        // Determine priority based on appointment type and time
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (apt.appointment_type?.toLowerCase().includes('emergência') || apt.appointment_type?.toLowerCase().includes('urgente')) {
          priority = 'urgent';
        } else if (apt.appointment_type?.toLowerCase().includes('retorno')) {
          priority = 'low';
        } else if (apt.appointment_type?.toLowerCase().includes('procedimento')) {
          priority = 'high';
        }
        
        // Use appointment created_at as arrival time, or scheduled_datetime if checked in
        const arrivalTime = apt.status === AppointmentStatus.CHECKED_IN 
          ? apt.scheduled_datetime 
          : apt.created_at || apt.scheduled_datetime;
        
        return {
          id: apt.patient_id,
          appointmentId: apt.id,
          name: apt.patient_name || 'Paciente',
          doctor: apt.doctor_name || 'Médico',
          appointmentTime: format(new Date(apt.scheduled_datetime), "HH:mm"),
          reason: apt.reason,
          status: receptionStatus,
          arrivalTime: arrivalTime,
          priority: priority,
        };
      });
      
      // Calculate stats
      const totalWaiting = receptionPatients.filter(p => p.status === 'waiting').length;
      const inConsultation = receptionPatients.filter(p => p.status === 'in_consultation').length;
      const completedToday = receptionPatients.filter(p => p.status === 'completed').length;
      
      // Calculate average wait time for waiting patients
      const waitingPatients = receptionPatients.filter(p => p.status === 'waiting');
      let totalWaitTime = 0;
      waitingPatients.forEach(patient => {
        const waitTime = getWaitTime(patient.arrivalTime);
        totalWaitTime += waitTime;
      });
      const averageWaitTime = waitingPatients.length > 0 ? Math.round(totalWaitTime / waitingPatients.length) : 0;
      
      setStats({
        totalWaiting,
        inConsultation,
        completedToday,
        averageWaitTime,
      });
      
      setPatients(receptionPatients);
    } catch (error: any) {
      console.error("Failed to load reception data:", error);
      toast.error("Erro ao carregar dados da recepção", {
        description: error.message || "Não foi possível carregar os agendamentos",
      });
      setPatients([]);
      setStats({
        totalWaiting: 0,
        inConsultation: 0,
        completedToday: 0,
        averageWaitTime: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatus = async (appointmentId: number, receptionStatus: string) => {
    try {
      // Map reception status to appointment status
      let appointmentStatus: AppointmentStatus;
      if (receptionStatus === 'in_consultation') {
        appointmentStatus = AppointmentStatus.IN_CONSULTATION;
      } else if (receptionStatus === 'completed') {
        appointmentStatus = AppointmentStatus.COMPLETED;
      } else if (receptionStatus === 'cancelled') {
        appointmentStatus = AppointmentStatus.CANCELLED;
      } else {
        appointmentStatus = AppointmentStatus.CHECKED_IN;
      }
      
      await appointmentsApi.updateStatus(appointmentId, appointmentStatus);
      
      // Reload data to get updated information
      await loadReceptionData();
      
      toast.success("Status atualizado com sucesso");
    } catch (error: any) {
      console.error("Failed to update patient status:", error);
      toast.error("Erro ao atualizar status", {
        description: error.message || "Não foi possível atualizar o status do agendamento",
      });
    }
  };

  const handleCheckIn = async (appointmentId: number) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, AppointmentStatus.CHECKED_IN);
      await loadReceptionData();
      toast.success("Check-in realizado com sucesso");
    } catch (error: any) {
      toast.error("Erro ao realizar check-in", {
        description: error.message,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_consultation':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'in_consultation':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWaitTime = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchTerm || 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.cpf && patient.cpf.includes(searchTerm)) ||
      (patient.phone && patient.phone.includes(searchTerm));
    
    const matchesPriority = priorityFilter === 'all' || patient.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados da recepção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-teal-500/10 to-blue-600/10 rounded-2xl blur-3xl" />
          <div className="relative bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
        <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Recepção
          </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie chegadas de pacientes e o fluxo da recepção
          </p>
        </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={loadReceptionData}
                  disabled={loading}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Atualizar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/notificacoes')}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
                <Button 
                  onClick={() => router.push('/secretaria/pacientes')}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-md"
                >
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/secretaria/agendamentos')}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
            <Calendar className="h-4 w-4 mr-2" />
            Agendamentos
          </Button>
              </div>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-yellow-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 to-orange-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Aguardando</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalWaiting || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
              pacientes aguardando
            </p>
          </CardContent>
        </Card>

          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Em Atendimento</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.inConsultation || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
              em atendimento
            </p>
          </CardContent>
        </Card>

          <Card className="border-green-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-teal-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Concluídos Hoje</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.completedToday || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
              consultas concluídas
            </p>
          </CardContent>
        </Card>

          <Card className="border-orange-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-red-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Tempo Médio de Espera</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Timer className="h-4 w-4 text-orange-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.averageWaitTime || 0}min</div>
              <p className="text-xs text-muted-foreground mt-1">
              tempo médio de espera
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Filtros de Busca</CardTitle>
                <CardDescription className="mt-1">Filtre pacientes por prioridade e status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
              <div className="w-full md:w-56">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Prioridade</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
              <div className="w-full md:w-56">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Fila de Pacientes ({filteredPatients.length})
                </CardTitle>
                <CardDescription className="mt-1">
            Gerencie chegadas de pacientes e status de consultas
          </CardDescription>
              </div>
            </div>
        </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-base font-medium text-gray-700">Carregando pacientes...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                  <Users className="h-12 w-12 text-blue-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Nenhum paciente encontrado</p>
                <p className="text-sm text-gray-600">Tente ajustar os filtros de busca.</p>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-blue-100 overflow-hidden">
                <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                        <TableHead className="font-semibold text-gray-900">Paciente</TableHead>
                        <TableHead className="font-semibold text-gray-900">Prioridade</TableHead>
                        <TableHead className="font-semibold text-gray-900">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900">Hora de Chegada</TableHead>
                        <TableHead className="font-semibold text-gray-900">Tempo de Espera</TableHead>
                        <TableHead className="font-semibold text-gray-900">Médico</TableHead>
                        <TableHead className="font-semibold text-gray-900">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                      {filteredPatients.map((patient, index) => (
                        <TableRow 
                          key={patient.id}
                          className={cn(
                            "border-b border-blue-50 transition-colors",
                            index % 2 === 0 ? "bg-white" : "bg-blue-50/20",
                            "hover:bg-blue-50/50"
                          )}
                        >
                  <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg shadow-sm">
                                <User className="h-4 w-4 text-white" />
                              </div>
                    <div>
                                <div className="font-semibold text-gray-900">{patient.name}</div>
                      {patient.cpf && (
                                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                                    <FileText className="h-3 w-3" />
                                    {patient.cpf}
                        </div>
                      )}
                              </div>
                    </div>
                  </TableCell>
                  <TableCell>
                            <Badge className={cn("text-xs font-semibold border", getPriorityColor(patient.priority))}>
                              {patient.priority === 'urgent' ? 'Urgente' :
                               patient.priority === 'high' ? 'Alta' :
                               patient.priority === 'medium' ? 'Média' :
                               patient.priority === 'low' ? 'Baixa' : patient.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                            <Badge className={cn("text-xs font-semibold border flex items-center gap-1 w-fit", getStatusColor(patient.status))}>
                      {getStatusIcon(patient.status)}
                              <span className="capitalize">
                                {patient.status === 'waiting' ? 'Aguardando' :
                                 patient.status === 'in_consultation' ? 'Em Atendimento' :
                                 patient.status === 'completed' ? 'Concluído' :
                                 patient.status === 'cancelled' ? 'Cancelado' : patient.status}
                              </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {formatTime(patient.arrivalTime)}
                            </div>
                  </TableCell>
                  <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Timer className="h-4 w-4 text-orange-600" />
                              <span className="font-semibold text-gray-900">{getWaitTime(patient.arrivalTime)}min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                      {patient.doctor || 'Não atribuído'}
                    </div>
                  </TableCell>
                  <TableCell>
                            <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setSelectedPatient(patient);
                          setShowPatientDialog(true);
                          try {
                            setLoadingPatientDetails(true);
                            const patientDetails = await patientsApi.getById(patient.id);
                            setSelectedPatientDetails(patientDetails);
                          } catch (error: any) {
                            console.error("Failed to load patient details:", error);
                            toast.error("Erro ao carregar detalhes do paciente");
                          } finally {
                            setLoadingPatientDetails(false);
                          }
                        }}
                        title="Ver detalhes"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {patient.status === 'waiting' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckIn(patient.appointmentId)}
                            title="Check-in"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                                    <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updatePatientStatus(patient.appointmentId, 'in_consultation')}
                            title="Iniciar atendimento"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                                    <Stethoscope className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {patient.status === 'in_consultation' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePatientStatus(patient.appointmentId, 'completed')}
                          title="Marcar como concluído"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                                  <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Detalhes do Paciente
                  </DialogTitle>
                  <DialogDescription className="mt-1">
              Visualize e gerencie informações do paciente
            </DialogDescription>
                </div>
              </div>
          </DialogHeader>
          {loadingPatientDetails ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-base font-medium text-gray-700">Carregando detalhes...</p>
            </div>
          ) : selectedPatient && (
              <div className="space-y-6 pt-4">
                {/* Patient Header */}
                <div className="relative overflow-hidden border-2 border-blue-100 rounded-xl p-6 bg-gradient-to-r from-blue-50/50 to-white">
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                    {selectedPatientDetails?.first_name && selectedPatientDetails?.last_name
                      ? `${selectedPatientDetails.first_name} ${selectedPatientDetails.last_name}`
                      : selectedPatient.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={cn("text-xs font-semibold border", getStatusColor(selectedPatient.status))}>
                          {getStatusIcon(selectedPatient.status)}
                          <span className="ml-1 capitalize">
                            {selectedPatient.status === 'waiting' ? 'Aguardando' :
                             selectedPatient.status === 'in_consultation' ? 'Em Atendimento' :
                             selectedPatient.status === 'completed' ? 'Concluído' :
                             selectedPatient.status === 'cancelled' ? 'Cancelado' : selectedPatient.status}
                          </span>
                        </Badge>
                        <Badge className={cn("text-xs font-semibold border", getPriorityColor(selectedPatient.priority))}>
                          {selectedPatient.priority === 'urgent' ? 'Urgente' :
                           selectedPatient.priority === 'high' ? 'Alta' :
                           selectedPatient.priority === 'medium' ? 'Média' :
                           selectedPatient.priority === 'low' ? 'Baixa' : selectedPatient.priority}
                        </Badge>
                </div>
                </div>
              </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">CPF</h4>
                      <p className="text-base font-medium text-gray-900">
                        {selectedPatientDetails?.cpf || selectedPatient.cpf || 'Não informado'}
                  </p>
                </div>
              {(selectedPatientDetails?.date_of_birth || selectedPatient.birthDate) && (
                      <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Data de Nascimento</h4>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                      {selectedPatientDetails?.date_of_birth
                        ? format(new Date(selectedPatientDetails.date_of_birth), "dd/MM/yyyy")
                        : selectedPatient.birthDate
                        ? format(new Date(selectedPatient.birthDate), "dd/MM/yyyy")
                        : 'Não informado'}
                    </p>
                  </div>
                    )}
                  {selectedPatientDetails?.gender && (
                      <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gênero</h4>
                        <p className="text-base font-medium text-gray-900 capitalize">
                        {selectedPatientDetails.gender === 'male' ? 'Masculino' : 
                         selectedPatientDetails.gender === 'female' ? 'Feminino' : 
                         selectedPatientDetails.gender}
                      </p>
                    </div>
                  )}
                  </div>
                </div>

                <Separator className="bg-blue-100" />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-teal-600" />
                    Informações de Contato
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-teal-100 bg-teal-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Telefone</h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-teal-600" />
                        {selectedPatientDetails?.phone || selectedPatient.phone || 'Não informado'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-teal-100 bg-teal-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-teal-600" />
                        {selectedPatientDetails?.email || selectedPatient.email || 'Não informado'}
                      </p>
                    </div>
                    {selectedPatientDetails?.address && (
                      <div className="p-4 rounded-lg border border-teal-100 bg-teal-50/30 sm:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Endereço</h4>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-teal-600" />
                          {selectedPatientDetails.address}
                        </p>
                </div>
              )}
                </div>
                </div>

                <Separator className="bg-blue-100" />

                {/* Appointment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Informações do Agendamento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Horário do Agendamento</h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        {selectedPatient.appointmentTime || 'Não agendado'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Médico</h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-purple-600" />
                        {selectedPatient.doctor || 'Não atribuído'}
                      </p>
              </div>
              {selectedPatient.reason && (
                      <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30 sm:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Motivo da Consulta</h4>
                        <p className="text-base text-gray-900">{selectedPatient.reason}</p>
                </div>
              )}
                  </div>
                </div>

                <Separator className="bg-blue-100" />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/secretaria/pacientes?id=${selectedPatient.id}`)}
                    className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Paciente
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/secretaria/agendamentos/new?patient_id=${selectedPatient.id}`)}
                    className="border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-teal-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Novo Agendamento
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
