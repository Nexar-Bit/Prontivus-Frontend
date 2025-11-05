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
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch={false} notificationCount={0} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Nossos Médicos</h1>
            <p className="text-[#5D737E]">Escolha um médico para agendar sua consulta</p>
          </div>

          {/* Filters */}
          <Card className="medical-card mb-6">
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
            <p className="text-sm text-muted-foreground">
              {filteredDoctors.length} {filteredDoctors.length === 1 ? "médico encontrado" : "médicos encontrados"}
            </p>
          </div>

          {/* Doctors Grid */}
          {filteredDoctors.length === 0 ? (
            <Card className="medical-card">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum médico encontrado com os filtros selecionados.
                </p>
                {(searchQuery || specialtyFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSpecialtyFilter("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="medical-card hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-20 w-20 mb-3">
                        <AvatarImage src="" alt={`${doctor.first_name} ${doctor.last_name}`} />
                        <AvatarFallback className="text-lg">
                          {getInitials(doctor.first_name, doctor.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold text-[#0F4C75]">
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
                        className="flex-1"
                        onClick={() => handleViewDetails(doctor)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button
                        className="flex-1"
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
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt={`${selectedDoctor?.first_name} ${selectedDoctor?.last_name}`} />
                    <AvatarFallback>
                      {selectedDoctor ? getInitials(selectedDoctor.first_name, selectedDoctor.last_name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">
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
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
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
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

