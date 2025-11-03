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
  Calendar
} from "lucide-react";
import { patientsApi } from "@/lib/patients-api";
import { appointmentsApi } from "@/lib/appointments-api";
import { Patient } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function SecretariaCadastrosPage() {
  const [activeTab, setActiveTab] = useState("patients");
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
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
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

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
        todayAppointments: appointmentsData.length,
        pendingRegistrations: 0,
      });
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
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
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
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade de cadastro de médicos em desenvolvimento</p>
                <Link href="/secretaria/medicos">
                  <Button variant="outline" className="mt-4">
                    Ver página de médicos
                  </Button>
                </Link>
              </div>
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
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade de cadastro de serviços em desenvolvimento</p>
                <Link href="/financeiro/servicos">
                  <Button variant="outline" className="mt-4">
                    Ver serviços financeiros
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinics Tab */}
        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Clínicas</CardTitle>
              <CardDescription>
                Gerencie informações das unidades da clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade de cadastro de clínicas em desenvolvimento</p>
              </div>
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

