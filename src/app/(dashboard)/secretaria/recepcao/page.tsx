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

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
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
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<ReceptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);

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
      // TODO: Replace with actual API call
      // const response = await receptionApi.getReceptionData();
      // setPatients(response.patients);
      // setStats(response.stats);
      
      // Mock data for now
      const mockPatients: Patient[] = [
        {
          id: "1",
          name: "João Silva",
          cpf: "123.456.789-00",
          phone: "(11) 99999-9999",
          email: "joao@email.com",
          address: "Rua das Flores, 123",
          birthDate: "1985-03-15",
          gender: "male",
          status: "waiting",
          arrivalTime: new Date().toISOString(),
          appointmentTime: "14:00",
          doctor: "Dr. Maria Santos",
          reason: "Consulta de rotina",
          priority: "medium"
        },
        {
          id: "2",
          name: "Maria Santos",
          cpf: "987.654.321-00",
          phone: "(11) 88888-8888",
          email: "maria@email.com",
          address: "Av. Paulista, 456",
          birthDate: "1990-07-22",
          gender: "female",
          status: "in_consultation",
          arrivalTime: new Date(Date.now() - 1800000).toISOString(),
          appointmentTime: "13:30",
          doctor: "Dr. Carlos Lima",
          reason: "Dor de cabeça",
          priority: "high"
        },
        {
          id: "3",
          name: "Pedro Costa",
          cpf: "456.789.123-00",
          phone: "(11) 77777-7777",
          email: "pedro@email.com",
          address: "Rua da Paz, 789",
          birthDate: "1978-11-10",
          gender: "male",
          status: "waiting",
          arrivalTime: new Date(Date.now() - 3600000).toISOString(),
          appointmentTime: "15:30",
          doctor: "Dr. Ana Oliveira",
          reason: "Exame de sangue",
          priority: "low"
        },
        {
          id: "4",
          name: "Ana Oliveira",
          cpf: "789.123.456-00",
          phone: "(11) 66666-6666",
          email: "ana@email.com",
          address: "Rua da Esperança, 321",
          birthDate: "1995-05-18",
          gender: "female",
          status: "completed",
          arrivalTime: new Date(Date.now() - 7200000).toISOString(),
          appointmentTime: "12:00",
          doctor: "Dr. Roberto Silva",
          reason: "Retorno",
          priority: "medium"
        },
        {
          id: "5",
          name: "Carlos Lima",
          cpf: "321.654.987-00",
          phone: "(11) 55555-5555",
          email: "carlos@email.com",
          address: "Av. Brasil, 654",
          birthDate: "1982-09-03",
          gender: "male",
          status: "waiting",
          arrivalTime: new Date(Date.now() - 900000).toISOString(),
          appointmentTime: "16:00",
          doctor: "Dr. Maria Santos",
          reason: "Emergência",
          priority: "urgent"
        }
      ];
      
      const mockStats: ReceptionStats = {
        totalWaiting: 3,
        inConsultation: 1,
        completedToday: 1,
        averageWaitTime: 25
      };
      
      setPatients(mockPatients);
      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load reception data:", error);
      toast.error("Failed to load reception data");
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatus = async (patientId: string, status: string) => {
    try {
      // TODO: Replace with actual API call
      // await receptionApi.updatePatientStatus(patientId, status);
      
      setPatients(prev => 
        prev.map(p => p.id === patientId ? { ...p, status: status as any } : p)
      );
      
      toast.success("Patient status updated successfully");
    } catch (error) {
      console.error("Failed to update patient status:", error);
      toast.error("Failed to update patient status");
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
      patient.cpf.includes(searchTerm) ||
      patient.phone.includes(searchTerm);
    
    const matchesPriority = priorityFilter === 'all' || patient.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            Reception
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage patient arrivals and reception workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWaiting || 0}</div>
            <p className="text-xs text-muted-foreground">
              patients waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Consultation</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inConsultation || 0}</div>
            <p className="text-xs text-muted-foreground">
              currently consulting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              consultations completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageWaitTime || 0}min</div>
            <p className="text-xs text-muted-foreground">
              average waiting time
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
                  placeholder="Search patients..."
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
          <CardTitle>Patient Queue ({filteredPatients.length})</CardTitle>
          <CardDescription>
            Manage patient arrivals and consultation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arrival Time</TableHead>
                <TableHead>Wait Time</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        CPF: {patient.cpf}
                      </div>
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
                      {patient.doctor || 'Not assigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {patient.status === 'waiting' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePatientStatus(patient.id, 'in_consultation')}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      )}
                      {patient.status === 'in_consultation' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePatientStatus(patient.id, 'completed')}
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
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No patients found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              View and manage patient information
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium">{selectedPatient.name}</p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="text-sm font-medium">{selectedPatient.cpf}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm font-medium">{selectedPatient.phone}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{selectedPatient.email}</p>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <p className="text-sm font-medium">{selectedPatient.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Birth Date</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label>Gender</Label>
                  <p className="text-sm font-medium capitalize">{selectedPatient.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Appointment Time</Label>
                  <p className="text-sm font-medium">{selectedPatient.appointmentTime || 'Not scheduled'}</p>
                </div>
                <div>
                  <Label>Doctor</Label>
                  <p className="text-sm font-medium">{selectedPatient.doctor || 'Not assigned'}</p>
                </div>
              </div>
              <div>
                <Label>Reason for Visit</Label>
                <p className="text-sm font-medium">{selectedPatient.reason || 'Not specified'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
