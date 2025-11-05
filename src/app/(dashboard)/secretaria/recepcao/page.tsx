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
  Trash2
} from "lucide-react";

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
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'in_consultation', label: 'In Consultation' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
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
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'outline';
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
        return 'secondary';
      case 'in_consultation':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
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
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados da recepção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Recepção
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie chegadas de pacientes e o fluxo da recepção
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/notificacoes')}>
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
          <Button onClick={() => router.push('/secretaria/pacientes')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
          <Button variant="outline" onClick={() => router.push('/secretaria/agendamentos')}>
            <Calendar className="h-4 w-4 mr-2" />
            Agendamentos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWaiting || 0}</div>
            <p className="text-xs text-muted-foreground">
              pacientes aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inConsultation || 0}</div>
            <p className="text-xs text-muted-foreground">
              em atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              consultas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageWaitTime || 0}min</div>
            <p className="text-xs text-muted-foreground">
              tempo médio de espera
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
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
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Pacientes ({filteredPatients.length})</CardTitle>
          <CardDescription>
            Gerencie chegadas de pacientes e status de consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hora de Chegada</TableHead>
                <TableHead>Tempo de Espera</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      {patient.cpf && (
                        <div className="text-sm text-muted-foreground">
                          CPF: {patient.cpf}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(patient.priority) as any}>
                      {patient.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(patient.status) as any}>
                      {getStatusIcon(patient.status)}
                      <span className="ml-1 capitalize">{patient.status.replace('_', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatTime(patient.arrivalTime)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{getWaitTime(patient.arrivalTime)}min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {patient.doctor || 'Não atribuído'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setSelectedPatient(patient);
                          setShowPatientDialog(true);
                          // Load patient details
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
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updatePatientStatus(patient.appointmentId, 'in_consultation')}
                            title="Iniciar atendimento"
                          >
                            <User className="h-4 w-4 text-blue-600" />
                          </Button>
                        </>
                      )}
                      {patient.status === 'in_consultation' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePatientStatus(patient.appointmentId, 'completed')}
                          title="Marcar como concluído"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum paciente encontrado com os critérios selecionados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              Visualize e gerencie informações do paciente
            </DialogDescription>
          </DialogHeader>
          {loadingPatientDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando detalhes...</span>
            </div>
          ) : selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm font-medium">
                    {selectedPatientDetails?.first_name && selectedPatientDetails?.last_name
                      ? `${selectedPatientDetails.first_name} ${selectedPatientDetails.last_name}`
                      : selectedPatient.name}
                  </p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="text-sm font-medium">
                    {selectedPatientDetails?.cpf || selectedPatient.cpf || 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm font-medium">
                    {selectedPatientDetails?.phone || selectedPatient.phone || 'Não informado'}
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">
                    {selectedPatientDetails?.email || selectedPatient.email || 'Não informado'}
                  </p>
                </div>
              </div>
              {selectedPatientDetails?.address && (
                <div>
                  <Label>Endereço</Label>
                  <p className="text-sm font-medium">{selectedPatientDetails.address}</p>
                </div>
              )}
              {(selectedPatientDetails?.date_of_birth || selectedPatient.birthDate) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Nascimento</Label>
                    <p className="text-sm font-medium">
                      {selectedPatientDetails?.date_of_birth
                        ? format(new Date(selectedPatientDetails.date_of_birth), "dd/MM/yyyy")
                        : selectedPatient.birthDate
                        ? format(new Date(selectedPatient.birthDate), "dd/MM/yyyy")
                        : 'Não informado'}
                    </p>
                  </div>
                  {selectedPatientDetails?.gender && (
                    <div>
                      <Label>Gênero</Label>
                      <p className="text-sm font-medium capitalize">
                        {selectedPatientDetails.gender === 'male' ? 'Masculino' : 
                         selectedPatientDetails.gender === 'female' ? 'Feminino' : 
                         selectedPatientDetails.gender}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário do Agendamento</Label>
                  <p className="text-sm font-medium">{selectedPatient.appointmentTime || 'Não agendado'}</p>
                </div>
                <div>
                  <Label>Médico</Label>
                  <p className="text-sm font-medium">{selectedPatient.doctor || 'Não atribuído'}</p>
                </div>
              </div>
              {selectedPatient.reason && (
                <div>
                  <Label>Motivo da Consulta</Label>
                  <p className="text-sm font-medium">{selectedPatient.reason}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/secretaria/pacientes?id=${selectedPatient.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Paciente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/secretaria/agendamentos/new?patient_id=${selectedPatient.id}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
