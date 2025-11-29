"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Search,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
} from "lucide-react";

interface Doctor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  clinic_name?: string;
  specialty?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
}

const specialtyIcons: Record<string, string> = {
  'Cardiologia': '❤️',
  'Clínico Geral': '🩺',
  'Pediatria': '👶',
  'Dermatologia': '🧴',
  'Ortopedia': '🦴',
  'Neurologia': '🧠',
  'Oftalmologia': '👁️',
  'Ginecologia': '🌸',
  'Urologia': '🔬',
  'Psiquiatria': '🧘',
  'Endocrinologia': '⚖️',
  'Gastroenterologia': '🍽️',
};

const SPECIALTIES = [
  'Cardiologia',
  'Clínico Geral',
  'Pediatria',
  'Dermatologia',
  'Ortopedia',
  'Neurologia',
  'Oftalmologia',
  'Ginecologia',
  'Urologia',
  'Psiquiatria',
  'Endocrinologia',
  'Gastroenterologia',
];

export default function PatientDoctorsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      loadDoctors();
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, specialtyFilter, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const doctorsData = await api.get<Doctor[]>("/api/users/doctors");
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      toast.error("Erro ao carregar médicos", {
        description: error.message || "Não foi possível carregar a lista de médicos",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        doctor =>
          doctor.first_name.toLowerCase().includes(query) ||
          doctor.last_name.toLowerCase().includes(query) ||
          `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(query) ||
          doctor.specialty?.toLowerCase().includes(query) ||
          doctor.email?.toLowerCase().includes(query)
      );
    }

    // Filter by specialty
    if (specialtyFilter !== "all") {
      filtered = filtered.filter(doctor => doctor.specialty === specialtyFilter);
    }

    setFilteredDoctors(filtered);
  };

  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailDialogOpen(true);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    router.push(`/patient/appointments?doctor=${doctor.id}`);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const getSpecialtyIcon = (specialty?: string) => {
    if (!specialty) return "🩺";
    return specialtyIcons[specialty] || "🩺";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PatientHeader showSearch={false} notificationCount={0} />
      <PatientMobileNav />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 overflow-y-auto patient-content-scroll w-full">
          <div className="px-4 lg:px-5 py-4 lg:py-6 pb-20 lg:pb-6">
          {/* Modern Header */}
          <div className="mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-700 to-teal-700 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <User className="h-7 w-7 text-white" />
              </div>
              Nossos Médicos
            </h1>
            <p className="text-gray-600 text-sm lg:text-base font-medium mt-2">Escolha um médico para agendar sua consulta</p>
          </div>

          {/* Statistics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Médicos</CardTitle>
                <User className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{doctors.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Médicos disponíveis</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Especialidades</CardTitle>
                <GraduationCap className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(doctors.map(d => d.specialty).filter(Boolean)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Especialidades diferentes</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Verificados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {doctors.filter(d => d.is_verified).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Médicos verificados</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-l-4 border-l-blue-500 mb-6 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-blue-600 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5" />
                </div>
                Buscar Médicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, especialidade ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger title="Filtrar por especialidade">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Todas as especialidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as especialidades</SelectItem>
                      {SPECIALTIES.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="whitespace-nowrap"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground font-medium">
              {filteredDoctors.length} {filteredDoctors.length === 1 ? "médico encontrado" : "médicos encontrados"}
            </p>
          </div>

          {/* Doctors Grid */}
          {filteredDoctors.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              variant={(searchQuery || specialtyFilter !== "all") ? "filter" : "database"}
              title={(searchQuery || specialtyFilter !== "all") 
                ? "Nenhum médico encontrado com os filtros selecionados"
                : "Nenhum médico cadastrado no banco de dados"
              }
              description={(searchQuery || specialtyFilter !== "all")
                ? "Não há médicos que correspondam aos filtros selecionados. Tente ajustar os filtros de busca."
                : "Não há médicos cadastrados no banco de dados. Os médicos aparecerão aqui quando forem adicionados ao sistema."
              }
              action={(searchQuery || specialtyFilter !== "all") ? {
                label: "Limpar filtros",
                onClick: () => {
                  setSearchQuery("");
                  setSpecialtyFilter("all");
                }
              } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-20 w-20 mb-3 border-2 border-blue-200">
                        <AvatarImage src="" alt={`${doctor.first_name} ${doctor.last_name}`} />
                        <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                          {getInitials(doctor.first_name, doctor.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold text-blue-600">
                        Dr(a). {doctor.first_name} {doctor.last_name}
                      </h3>
                      {doctor.specialty && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-2xl">{getSpecialtyIcon(doctor.specialty)}</span>
                          <Badge variant="secondary" className="mt-1">
                            {doctor.specialty}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        {doctor.is_verified ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Não verificado
                          </Badge>
                        )}
                        {doctor.is_active ? (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {doctor.clinic_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>{doctor.clinic_name}</span>
                        </div>
                      )}
                      {doctor.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                      )}
                      {doctor.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{doctor.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => handleViewDetails(doctor)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleBookAppointment(doctor)}
                        disabled={!doctor.is_active}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Doctor Detail Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="h-16 w-16 border-2 border-blue-200">
                    <AvatarImage src="" alt={`${selectedDoctor?.first_name} ${selectedDoctor?.last_name}`} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedDoctor ? getInitials(selectedDoctor.first_name, selectedDoctor.last_name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl text-blue-600">
                      Dr(a). {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                    </DialogTitle>
                    {selectedDoctor?.specialty && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl">{getSpecialtyIcon(selectedDoctor.specialty)}</span>
                        <Badge variant="secondary">{selectedDoctor.specialty}</Badge>
                      </div>
                    )}
                  </div>
                </div>
                <DialogDescription>
                  Informações detalhadas do médico
                </DialogDescription>
              </DialogHeader>

              {selectedDoctor && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        {selectedDoctor.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Verificação</Label>
                      <div className="mt-1">
                        {selectedDoctor.is_verified ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Não verificado</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {selectedDoctor.clinic_name && (
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">Clínica</Label>
                          <p className="font-medium">{selectedDoctor.clinic_name}</p>
                        </div>
                      </div>
                    )}
                    {selectedDoctor.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">Email</Label>
                          <p className="font-medium">{selectedDoctor.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedDoctor.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">Telefone</Label>
                          <p className="font-medium">{selectedDoctor.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Especialidade
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.specialty || "Não especificada"}
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)} className="border-gray-300">
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedDoctor) {
                      handleBookAppointment(selectedDoctor);
                      setIsDetailDialogOpen(false);
                    }
                  }}
                  disabled={!selectedDoctor?.is_active}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}

