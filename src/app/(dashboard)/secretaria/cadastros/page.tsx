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
  Loader2
} from "lucide-react";
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
      } catch {
        // Fallback to direct API calls
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
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error: any) {
      toast.error("Erro ao carregar pacientes", { description: error.message });
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
      toast.error("Erro ao carregar médicos", { description: error.message });
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
      toast.error("Erro ao carregar serviços", { description: error.message });
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
      if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie pacientes, médicos, serviços e outros registros do sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePatients} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Consultas agendadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              Registros pendentes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="patients">
              <Users className="h-4 w-4 mr-2" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="doctors">
              <Stethoscope className="h-4 w-4 mr-2" />
              Médicos
            </TabsTrigger>
            <TabsTrigger value="services">
              <DollarSign className="h-4 w-4 mr-2" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="clinics">
              <Building2 className="h-4 w-4 mr-2" />
              Clínicas
            </TabsTrigger>
            <TabsTrigger value="stock">
              <Package className="h-4 w-4 mr-2" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="other">
              <FileText className="h-4 w-4 mr-2" />
              Outros
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {activeTab === "patients" && (
              <Link href="/secretaria/pacientes">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Paciente
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Pacientes</CardTitle>
              <CardDescription>
                Busque e gerencie os pacientes cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Link href="/secretaria/pacientes">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando pacientes...
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.slice(0, 10).map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          {patient.is_active === false && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {patient.cpf && `CPF: ${patient.cpf} • `}
                          {patient.email && `Email: ${patient.email}`}
                          {patient.phone && ` • Tel: ${patient.phone}`}
                        </div>
                      </div>
                      <Link href={`/secretaria/pacientes?id=${patient.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {filteredPatients.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/secretaria/pacientes">
                        <Button variant="outline">
                          Ver todos ({filteredPatients.length} pacientes)
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
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Médicos</CardTitle>
              <CardDescription>
                Gerencie os profissionais médicos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Link href="/secretaria/medicos">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ver todos
                  </Button>
                </Link>
              </div>

              {loadingDoctors ? (
                <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando médicos...
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum médico encontrado" : "Nenhum médico cadastrado"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDoctors.slice(0, 10).map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            Dr(a). {doctor.first_name} {doctor.last_name}
                          </h3>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {doctor.email && `Email: ${doctor.email}`}
                          {doctor.clinic_name && ` • ${doctor.clinic_name}`}
                        </div>
                      </div>
                      <Link href={`/secretaria/medicos?doctor_id=${doctor.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {filteredDoctors.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/secretaria/medicos">
                        <Button variant="outline">
                          Ver todos ({filteredDoctors.length} médicos)
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
          <Card>
            <CardHeader>
              <CardTitle>Itens de Serviço</CardTitle>
              <CardDescription>
                Configure os serviços e procedimentos oferecidos pela clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Link href="/financeiro/servicos">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </Link>
              </div>

              {loadingServices ? (
                <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando serviços...
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredServices.slice(0, 10).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{service.name}</h3>
                          {service.code && (
                            <Badge variant="secondary">{service.code}</Badge>
                          )}
                          {!service.is_active && (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {service.description && `${service.description} • `}
                          <span className="font-medium">
                            R$ {service.price.toFixed(2).replace('.', ',')}
                          </span>
                          {service.category && ` • ${service.category}`}
                        </div>
                      </div>
                      <Link href={`/financeiro/servicos?service_id=${service.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {filteredServices.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/financeiro/servicos">
                        <Button variant="outline">
                          Ver todos ({filteredServices.length} serviços)
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
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Clínicas</CardTitle>
              <CardDescription>
                Gerencie informações das unidades da clínica (Apenas administradores)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loadingClinics ? (
                <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando clínicas...
                </div>
              ) : filteredClinics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhuma clínica encontrada" : clinics.length === 0 && !loadingClinics ? (
                    <>
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Apenas administradores podem visualizar clínicas</p>
                      <p className="text-sm">Ou não há clínicas cadastradas no sistema</p>
                    </>
                  ) : "Nenhuma clínica encontrada"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClinics.slice(0, 10).map((clinic) => (
                    <div
                      key={clinic.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{clinic.name}</h3>
                          {!clinic.is_active && (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {clinic.legal_name && `${clinic.legal_name} • `}
                          {clinic.tax_id && `CNPJ: ${clinic.tax_id} • `}
                          {clinic.email && `Email: ${clinic.email} • `}
                          <span>{clinic.user_count} usuário(s)</span>
                        </div>
                      </div>
                      <Link href={`/admin/clinics?id=${clinic.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {filteredClinics.length > 10 && (
                    <div className="text-center pt-4">
                      <Link href="/admin/clinics">
                        <Button variant="outline">
                          Ver todas ({filteredClinics.length} clínicas)
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
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Estoque</CardTitle>
              <CardDescription>
                Controle de medicamentos e materiais em estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/estoque">
                <Button variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Acessar módulo de estoque
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Códigos TUSS</CardTitle>
                <CardDescription>Gerenciar códigos de procedimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/financeiro/tuss-codes">
                  <Button variant="outline" className="w-full">
                    Gerenciar Códigos TUSS
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Templates TISS</CardTitle>
                <CardDescription>Configurar templates de faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/financeiro/tiss-templates">
                  <Button variant="outline" className="w-full">
                    Gerenciar Templates
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

