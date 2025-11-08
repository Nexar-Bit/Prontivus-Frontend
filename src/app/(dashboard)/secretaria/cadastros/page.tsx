"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Stethoscope, 
  DollarSign, 
  Building2, 
  Package, 
  FileText,
  Search,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
  Calendar,
  Loader2,
  RefreshCw,
  UserPlus,
  ClipboardList,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { patientsApi } from "@/lib/patients-api";
import { appointmentsApi } from "@/lib/appointments-api";
import { api } from "@/lib/api";
import { Patient } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  clinic_name?: string;
}

interface ServiceItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  price: number;
  category: string;
  is_active: boolean;
}

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  email?: string;
  is_active: boolean;
  user_count: number;
}

export default function SecretariaCadastrosPage() {
  const [activeTab, setActiveTab] = useState("patients");
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    todayAppointments: 0,
    pendingRegistrations: 0,
  });

  useEffect(() => {
    loadStats();
    if (activeTab === "patients") {
      loadPatients();
    } else if (activeTab === "doctors") {
      loadDoctors();
    } else if (activeTab === "services") {
      loadServices();
    } else if (activeTab === "clinics") {
      loadClinics();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      // Load dashboard stats from API if available
      try {
        const dashboardStats = await api.get<{
          patients: { value: number };
          today_appointments: { value: number };
        }>("/api/analytics/dashboard/stats");
        
        const [patientsData] = await Promise.all([
          patientsApi.getAll(),
        ]);

        setStats({
          totalPatients: dashboardStats.patients?.value || patientsData.length,
          activePatients: patientsData.filter(p => p.is_active !== false).length,
          todayAppointments: dashboardStats.today_appointments?.value || 0,
          pendingRegistrations: 0, // Can be calculated from pending appointments or other sources
        });
      } catch (error: any) {
        // Check for 403 errors
        if (error.status === 403) {
          toast.error("Acesso Negado", { 
            description: "Você não tem permissão para acessar as estatísticas." 
          });
        }
        // Fallback to direct API calls
        try {
        const [patientsData, appointmentsData] = await Promise.all([
          patientsApi.getAll(),
          appointmentsApi.getAll({
            start_date: format(today, "yyyy-MM-dd"),
            end_date: format(end, "yyyy-MM-dd"),
          }),
        ]);

        setStats({
          totalPatients: patientsData.length,
          activePatients: patientsData.filter(p => p.is_active !== false).length,
          todayAppointments: appointmentsData.length || 0,
          pendingRegistrations: 0,
          });
        } catch (fallbackError: any) {
          if (fallbackError.status === 403) {
            toast.error("Acesso Negado", { 
              description: "Você não tem permissão para acessar estas informações." 
        });
          }
          console.error("Error loading stats:", fallbackError);
        }
      }
    } catch (error: any) {
      if (error.status === 403) {
        toast.error("Acesso Negado", { 
          description: "Você não tem permissão para acessar as estatísticas." 
        });
      }
      console.error("Error loading stats:", error);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error: any) {
      if (error.status === 403) {
        toast.error("Acesso Negado", { 
          description: "Você não tem permissão para acessar esta funcionalidade." 
        });
      } else {
      toast.error("Erro ao carregar pacientes", { description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const data = await api.get<Doctor[]>("/api/users/doctors");
      setDoctors(data || []);
    } catch (error: any) {
      if (error.status === 403) {
        toast.error("Acesso Negado", { 
          description: "Você não tem permissão para acessar esta funcionalidade." 
        });
      } else {
      toast.error("Erro ao carregar médicos", { description: error.message });
      }
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const data = await api.get<ServiceItem[]>("/api/financial/service-items");
      setServices(data || []);
    } catch (error: any) {
      if (error.status === 403) {
        toast.error("Acesso Negado", { 
          description: "Você não tem permissão para acessar esta funcionalidade." 
        });
      } else {
      toast.error("Erro ao carregar serviços", { description: error.message });
      }
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadClinics = async () => {
    try {
      setLoadingClinics(true);
      const data = await api.get<Clinic[]>("/api/admin/clinics");
      setClinics(data || []);
    } catch (error: any) {
      // Admin only endpoint - might fail for non-admin users
      if (error.status === 403 || error.message?.includes("403") || error.message?.includes("Forbidden")) {
        toast.error("Acesso Negado", { 
          description: "Apenas administradores podem visualizar clínicas." 
        });
        setClinics([]);
      } else {
        toast.error("Erro ao carregar clínicas", { description: error.message });
        setClinics([]);
      }
    } finally {
      setLoadingClinics(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.first_name?.toLowerCase().includes(term) ||
      p.last_name?.toLowerCase().includes(term) ||
      p.cpf?.includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
  });

  const filteredDoctors = doctors.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.first_name?.toLowerCase().includes(term) ||
      d.last_name?.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term)
    );
  });

  const filteredServices = services.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.code?.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term)
    );
  });

  const filteredClinics = clinics.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.legal_name?.toLowerCase().includes(term) ||
      c.tax_id?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

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
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
        <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                      Cadastros
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie pacientes, médicos, serviços e outros registros do sistema
          </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={loadStats}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total de Pacientes</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">
              {stats.activePatients} ativos
            </p>
          </CardContent>
        </Card>
          <Card className="border-teal-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-blue-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Agendamentos Hoje</CardTitle>
              <div className="p-2 bg-teal-100 rounded-lg">
                <Calendar className="h-4 w-4 text-teal-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
              Consultas agendadas
            </p>
          </CardContent>
        </Card>
          <Card className="border-orange-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-red-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pendências</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">
              Registros pendentes
            </p>
          </CardContent>
        </Card>
          <Card className="border-green-100 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-teal-600" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Crescimento</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-gray-900">+12%</div>
              <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <Card className="border-blue-100 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-3 lg:grid-cols-6 gap-2 bg-blue-50/50 p-1">
                  <TabsTrigger 
                    value="patients"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
              <Users className="h-4 w-4 mr-2" />
              Pacientes
            </TabsTrigger>
                  <TabsTrigger 
                    value="doctors"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
              <Stethoscope className="h-4 w-4 mr-2" />
              Médicos
            </TabsTrigger>
                  <TabsTrigger 
                    value="services"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
              <DollarSign className="h-4 w-4 mr-2" />
              Serviços
            </TabsTrigger>
                  <TabsTrigger 
                    value="clinics"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
              <Building2 className="h-4 w-4 mr-2" />
              Clínicas
            </TabsTrigger>
                  <TabsTrigger 
                    value="stock"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
              <Package className="h-4 w-4 mr-2" />
              Estoque
            </TabsTrigger>
                  <TabsTrigger 
                    value="other"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
              <FileText className="h-4 w-4 mr-2" />
              Outros
            </TabsTrigger>
          </TabsList>
                <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === "patients" && (
                    <Link href="/secretaria/pacientes" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-md">
                        <UserPlus className="h-4 w-4 mr-2" />
                  Novo Paciente
                </Button>
              </Link>
            )}
          </div>
        </div>
            </CardContent>
          </Card>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Cadastro de Pacientes</CardTitle>
                    <CardDescription className="mt-1">
                Busque e gerencie os pacientes cadastrados no sistema
              </CardDescription>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <Link href="/secretaria/pacientes">
                    <Button variant="outline" className="w-full sm:w-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </Link>
              </div>

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
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {searchTerm ? "Tente ajustar os termos de busca." : "Clique em 'Adicionar' para cadastrar um novo paciente."}
                    </p>
                    {!searchTerm && (
                      <Link href="/secretaria/pacientes">
                        <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar Primeiro Paciente
                        </Button>
                      </Link>
                    )}
                </div>
              ) : (
                  <div className="space-y-3">
                  {filteredPatients.slice(0, 10).map((patient) => (
                    <div
                      key={patient.id}
                        className="group relative overflow-hidden border-2 border-blue-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white"
                      >
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg shadow-md flex-shrink-0">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          {patient.is_active === false && (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inativo</Badge>
                          )}
                        </div>
                              <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                                {patient.cpf && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                                    {patient.cpf}
                                  </span>
                                )}
                                {patient.email && (
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-400">•</span>
                                    {patient.email}
                                  </span>
                                )}
                                {patient.phone && (
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-400">•</span>
                                    {patient.phone}
                                  </span>
                                )}
                              </div>
                        </div>
                      </div>
                      <Link href={`/secretaria/pacientes?id=${patient.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                        </div>
                    </div>
                  ))}
                  {filteredPatients.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/secretaria/pacientes">
                          <Button variant="outline" className="border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                          Ver todos ({filteredPatients.length} pacientes)
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4">
            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Stethoscope className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Cadastro de Médicos</CardTitle>
                    <CardDescription className="mt-1">
                Gerencie os profissionais médicos cadastrados
              </CardDescription>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <Link href="/secretaria/medicos">
                    <Button variant="outline" className="w-full sm:w-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Ver todos
                  </Button>
                </Link>
              </div>

              {loadingDoctors ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-base font-medium text-gray-700">Carregando médicos...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-teal-50 rounded-full mb-4">
                      <Stethoscope className="h-12 w-12 text-teal-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "Nenhum médico encontrado" : "Nenhum médico cadastrado"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {searchTerm ? "Tente ajustar os termos de busca." : "Acesse a página de médicos para ver todos os profissionais."}
                    </p>
                </div>
              ) : (
                  <div className="space-y-3">
                  {filteredDoctors.slice(0, 10).map((doctor) => (
                    <div
                      key={doctor.id}
                        className="group relative overflow-hidden border-2 border-teal-100 rounded-xl p-4 hover:border-teal-300 hover:shadow-md transition-all duration-300 bg-white"
                      >
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-3 bg-gradient-to-br from-teal-600 to-blue-600 rounded-lg shadow-md flex-shrink-0">
                              <Stethoscope className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">
                            Dr(a). {doctor.first_name} {doctor.last_name}
                          </h3>
                              <div className="text-sm text-gray-600">
                                {doctor.email && <span>{doctor.email}</span>}
                                {doctor.clinic_name && (
                                  <span className="flex items-center gap-1 mt-1">
                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                    {doctor.clinic_name}
                                  </span>
                                )}
                        </div>
                        </div>
                      </div>
                      <Link href={`/secretaria/medicos?doctor_id=${doctor.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            >
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                        </div>
                    </div>
                  ))}
                  {filteredDoctors.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/secretaria/medicos">
                          <Button variant="outline" className="border-teal-200 hover:bg-teal-50 hover:border-teal-300">
                          Ver todos ({filteredDoctors.length} médicos)
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Itens de Serviço</CardTitle>
                    <CardDescription className="mt-1">
                Configure os serviços e procedimentos oferecidos pela clínica
              </CardDescription>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <Link href="/financeiro/servicos">
                    <Button variant="outline" className="w-full sm:w-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </Link>
              </div>

              {loadingServices ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-base font-medium text-gray-700">Carregando serviços...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-green-50 rounded-full mb-4">
                      <DollarSign className="h-12 w-12 text-green-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {searchTerm ? "Tente ajustar os termos de busca." : "Acesse o módulo financeiro para cadastrar serviços."}
                    </p>
                </div>
              ) : (
                  <div className="space-y-3">
                  {filteredServices.slice(0, 10).map((service) => (
                    <div
                      key={service.id}
                        className="group relative overflow-hidden border-2 border-green-100 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all duration-300 bg-white"
                      >
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-3 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg shadow-md flex-shrink-0">
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                  {service.name}
                                </h3>
                          {service.code && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                                    {service.code}
                                  </Badge>
                          )}
                          {!service.is_active && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700">Inativo</Badge>
                          )}
                        </div>
                              <div className="text-sm text-gray-600">
                                {service.description && <span>{service.description}</span>}
                                <span className="font-bold text-green-600 ml-2">
                                  R$ {typeof service.price === 'number' 
                                    ? service.price.toFixed(2).replace('.', ',')
                                    : typeof service.price === 'string'
                                    ? parseFloat(service.price || '0').toFixed(2).replace('.', ',')
                                    : '0,00'}
                          </span>
                                {service.category && (
                                  <span className="text-gray-500 ml-2">• {service.category}</span>
                                )}
                              </div>
                        </div>
                      </div>
                      <Link href={`/financeiro/servicos?service_id=${service.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                        </div>
                    </div>
                  ))}
                  {filteredServices.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/financeiro/servicos">
                          <Button variant="outline" className="border-green-200 hover:bg-green-50 hover:border-green-300">
                          Ver todos ({filteredServices.length} serviços)
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinics Tab */}
        <TabsContent value="clinics" className="space-y-4">
            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Cadastro de Clínicas</CardTitle>
                    <CardDescription className="mt-1">
                Gerencie informações das unidades da clínica (Apenas administradores)
              </CardDescription>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
              </div>

              {loadingClinics ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-base font-medium text-gray-700">Carregando clínicas...</p>
                </div>
              ) : filteredClinics.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-purple-50 rounded-full mb-4">
                      <Building2 className="h-12 w-12 text-purple-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? "Nenhuma clínica encontrada" : clinics.length === 0 && !loadingClinics ? "Apenas administradores podem visualizar clínicas" : "Nenhuma clínica encontrada"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {searchTerm ? "Tente ajustar os termos de busca." : "Ou não há clínicas cadastradas no sistema"}
                    </p>
                </div>
              ) : (
                  <div className="space-y-3">
                  {filteredClinics.slice(0, 10).map((clinic) => (
                    <div
                      key={clinic.id}
                        className="group relative overflow-hidden border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all duration-300 bg-white"
                      >
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-md flex-shrink-0">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                  {clinic.name}
                                </h3>
                          {!clinic.is_active && (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inativa</Badge>
                          )}
                        </div>
                              <div className="text-sm text-gray-600">
                                {clinic.legal_name && <span>{clinic.legal_name}</span>}
                                {clinic.tax_id && (
                                  <span className="flex items-center gap-1 mt-1">
                                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                                    CNPJ: {clinic.tax_id}
                                  </span>
                                )}
                                {clinic.email && (
                                  <span className="flex items-center gap-1 mt-1">
                                    <span className="text-gray-400">•</span>
                                    {clinic.email}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 mt-1">
                                  <Users className="h-3.5 w-3.5 text-gray-400" />
                                  {clinic.user_count} usuário(s)
                                </span>
                              </div>
                        </div>
                      </div>
                      <Link href={`/admin/clinics?id=${clinic.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                        </div>
                    </div>
                  ))}
                  {filteredClinics.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/admin/clinics">
                          <Button variant="outline" className="border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                          Ver todas ({filteredClinics.length} clínicas)
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Gestão de Estoque</CardTitle>
                    <CardDescription className="mt-1">
                Controle de medicamentos e materiais em estoque
              </CardDescription>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="pt-6">
              <Link href="/estoque">
                  <Button 
                    variant="outline" 
                    className="w-full h-16 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-700 font-semibold"
                  >
                    <Package className="h-5 w-5 mr-2" />
                  Acessar módulo de estoque
                    <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">Códigos TUSS</CardTitle>
                      <CardDescription className="mt-1">Gerenciar códigos de procedimentos</CardDescription>
                    </div>
                  </div>
              </CardHeader>
                <CardContent className="pt-6">
                <Link href="/financeiro/tuss-codes">
                    <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    Gerenciar Códigos TUSS
                      <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
              <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <FileText className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">Templates TISS</CardTitle>
                      <CardDescription className="mt-1">Configurar templates de faturamento</CardDescription>
                    </div>
                  </div>
              </CardHeader>
                <CardContent className="pt-6">
                <Link href="/financeiro/tiss-templates">
                    <Button variant="outline" className="w-full border-teal-200 hover:bg-teal-50 hover:border-teal-300">
                    Gerenciar Templates
                      <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

