"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Search, Edit, Trash2, User, RefreshCw, Eye, X, Filter, Download, Mail, Phone, MapPin, Calendar, Heart, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, differenceInYears, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { onlyDigits, validateCPF } from "@/lib/inputMasks";

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  date_of_birth: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  allergies: string;
  active_problems: string;
  blood_type: string;
  notes: string;
  is_active: boolean;
}

// Utility functions
const formatCPF = (cpf?: string) => {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (phone?: string) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

const unformatCPF = (cpf: string) => cpf.replace(/\D/g, "");
const unformatPhone = (phone: string) => phone.replace(/\D/g, "");

const calculateAge = (dateOfBirth: string): number | null => {
  try {
    const birthDate = parseISO(dateOfBirth);
    if (!isValid(birthDate)) return null;
    return differenceInYears(new Date(), birthDate);
  } catch {
    return null;
  }
};

const getGenderLabel = (gender?: string): string => {
  const labels: Record<string, string> = {
    male: "Masculino",
    female: "Feminino",
    other: "Outro",
    prefer_not_to_say: "Prefere não informar",
  };
  return labels[gender || ""] || gender || "-";
};

export default function PacientesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    cpf: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    allergies: "",
    active_problems: "",
    blood_type: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.get<Patient[]>("/api/patients");
      setPatients(data);
    } catch (error: any) {
      console.error("Failed to load patients:", error);
      toast.error("Erro ao carregar pacientes", {
        description: error?.message || error?.detail || "Não foi possível carregar os pacientes",
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.is_active);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower) ||
          patient.cpf?.includes(searchTerm) ||
          patient.email?.toLowerCase().includes(searchLower) ||
          patient.phone?.includes(searchTerm)
      );
    }

    return filtered;
  }, [patients, searchTerm, statusFilter]);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "",
      cpf: "",
      phone: "",
      email: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      allergies: "",
      active_problems: "",
      blood_type: "",
      notes: "",
      is_active: true,
    });
    setEditingPatient(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (patient: Patient) => {
    setEditingPatient(patient);
    const birthDate = patient.date_of_birth ? parseISO(patient.date_of_birth).toISOString().split('T')[0] : "";
    setFormData({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      date_of_birth: birthDate,
      gender: patient.gender || "",
      cpf: patient.cpf || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      emergency_contact_relationship: patient.emergency_contact_relationship || "",
      allergies: patient.allergies || "",
      active_problems: patient.active_problems || "",
      blood_type: patient.blood_type || "",
      notes: patient.notes || "",
      is_active: patient.is_active ?? true,
    });
    setShowForm(true);
  };

  const openDetailView = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetail(true);
  };

  const handleCPFChange = (value: string) => {
    const cleaned = unformatCPF(value);
    if (cleaned.length <= 11) {
      setFormData({ ...formData, cpf: formatCPF(cleaned) });
    }
  };

  const handlePhoneChange = (value: string, field: "phone" | "emergency_contact_phone") => {
    const cleaned = unformatPhone(value);
    if (cleaned.length <= 11) {
      setFormData({ ...formData, [field]: formatPhone(cleaned) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.date_of_birth) {
      toast.error("Preencha os campos obrigatórios", {
        description: "Nome, sobrenome e data de nascimento são obrigatórios",
      });
      return;
    }

    if (!user?.clinic_id) {
      toast.error("Erro ao identificar a clínica");
      return;
    }

    try {
      setSaving(true);

      // Validate and clean CPF
      let cleanedCpf: string | undefined = undefined;
      if (formData.cpf && formData.cpf.trim()) {
        const cpfDigits = onlyDigits(formData.cpf.trim());
        if (cpfDigits.length === 11) {
          if (!validateCPF(cpfDigits)) {
            toast.error("CPF inválido. Verifique os dígitos informados.");
            setSaving(false);
            return;
          }
          cleanedCpf = cpfDigits;
        } else if (cpfDigits.length > 0) {
          toast.error("CPF deve ter 11 dígitos.");
          setSaving(false);
          return;
        }
      }

      // Validate and clean phone
      let cleanedPhone: string | undefined = undefined;
      if (formData.phone && formData.phone.trim()) {
        const phoneDigits = onlyDigits(formData.phone.trim());
        if (phoneDigits.length >= 10 && phoneDigits.length <= 11) {
          // Add country code for Brazil if not present
          if (!phoneDigits.startsWith('55')) {
            cleanedPhone = `+55${phoneDigits}`;
          } else if (phoneDigits.startsWith('55')) {
            cleanedPhone = `+${phoneDigits}`;
          } else {
            cleanedPhone = phoneDigits;
          }
        } else if (phoneDigits.length > 0) {
          toast.error("Telefone deve ter 10 ou 11 dígitos.");
          setSaving(false);
          return;
        }
      }

      // Validate and clean emergency contact phone
      let cleanedEmergencyPhone: string | undefined = undefined;
      if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
        const emergencyPhoneDigits = onlyDigits(formData.emergency_contact_phone.trim());
        if (emergencyPhoneDigits.length >= 10 && emergencyPhoneDigits.length <= 11) {
          if (!emergencyPhoneDigits.startsWith('55')) {
            cleanedEmergencyPhone = `+55${emergencyPhoneDigits}`;
          } else if (emergencyPhoneDigits.startsWith('55')) {
            cleanedEmergencyPhone = `+${emergencyPhoneDigits}`;
          } else {
            cleanedEmergencyPhone = emergencyPhoneDigits;
          }
        } else if (emergencyPhoneDigits.length > 0) {
          toast.error("Telefone de emergência deve ter 10 ou 11 dígitos.");
          setSaving(false);
          return;
        }
      }

      const patientData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender || undefined,
        cpf: cleanedCpf,
        phone: cleanedPhone,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: cleanedEmergencyPhone,
        emergency_contact_relationship: formData.emergency_contact_relationship.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        active_problems: formData.active_problems.trim() || undefined,
        blood_type: formData.blood_type || undefined,
        notes: formData.notes.trim() || undefined,
        is_active: formData.is_active,
      };

      if (editingPatient) {
        await api.put(`/api/patients/${editingPatient.id}`, patientData);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        patientData.clinic_id = user.clinic_id;
        await api.post("/api/patients", patientData);
        toast.success("Paciente cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadPatients();
      setCurrentPage(1);
    } catch (error: any) {
      console.error("Failed to save patient:", error);
      toast.error(editingPatient ? "Erro ao atualizar paciente" : "Erro ao cadastrar paciente", {
        description: error?.response?.data?.detail || error?.message || "Não foi possível salvar o paciente",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePatient) return;

    try {
      await api.delete(`/api/patients/${deletePatient.id}`);
      toast.success("Paciente excluído com sucesso!");
      await loadPatients();
      setDeletePatient(null);
      if (currentPage > totalPages && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      console.error("Failed to delete patient:", error);
      toast.error("Erro ao excluir paciente", {
        description: error?.response?.data?.detail || error?.message || "Não foi possível excluir o paciente",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
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
            <Users className="h-8 w-8 text-teal-600" />
            Cadastro de Pacientes
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie o cadastro completo de pacientes da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPatients}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pacientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {patients.filter((p) => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pacientes Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {patients.filter((p) => !p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Resultados da Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredPatients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Pacientes Cadastrados</CardTitle>
              <CardDescription>
                {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CPF, email ou telefone..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "active" | "inactive") => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedPatients.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPatients.map((patient) => {
                      const birthDate = patient.date_of_birth
                        ? format(parseISO(patient.date_of_birth), "dd/MM/yyyy", { locale: ptBR })
                        : "-";
                      const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : null;
                      return (
                        <TableRow key={patient.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{birthDate}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{patient.cpf ? formatCPF(patient.cpf) : "-"}</TableCell>
                          <TableCell>
                            {patient.phone ? formatPhone(patient.phone) : "-"}
                          </TableCell>
                          <TableCell>{patient.email || "-"}</TableCell>
                          <TableCell>{age !== null ? `${age} anos` : "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={patient.is_active ? "default" : "secondary"}
                              className={patient.is_active ? "bg-green-100 text-green-800" : ""}
                            >
                              {patient.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailView(patient)}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditForm(patient)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletePatient(patient)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhum paciente encontrado"
                  : "Nenhum paciente cadastrado"}
              </p>
              <p className="text-sm mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando seu primeiro paciente"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Paciente
            </DialogTitle>
            <DialogDescription>
              Informações completas do paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Pessoal</TabsTrigger>
                  <TabsTrigger value="contact">Contato</TabsTrigger>
                  <TabsTrigger value="medical">Médico</TabsTrigger>
                  <TabsTrigger value="notes">Observações</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                      <p className="text-base font-semibold">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data de Nascimento</Label>
                      <p className="text-base">
                        {selectedPatient.date_of_birth
                          ? format(parseISO(selectedPatient.date_of_birth), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                        {selectedPatient.date_of_birth && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({calculateAge(selectedPatient.date_of_birth)} anos)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Sexo</Label>
                      <p className="text-base">{getGenderLabel(selectedPatient.gender)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">CPF</Label>
                      <p className="text-base">
                        {selectedPatient.cpf ? formatCPF(selectedPatient.cpf) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tipo Sanguíneo</Label>
                      <p className="text-base">{selectedPatient.blood_type || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <div>
                        <Badge
                          variant={selectedPatient.is_active ? "default" : "secondary"}
                          className={selectedPatient.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {selectedPatient.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <p className="text-base">
                        {selectedPatient.phone ? formatPhone(selectedPatient.phone) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <p className="text-base">{selectedPatient.email || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </Label>
                      <p className="text-base">{selectedPatient.address || "-"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Contato de Emergência
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Nome</Label>
                        <p className="text-base">
                          {selectedPatient.emergency_contact_name || "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                        <p className="text-base">
                          {selectedPatient.emergency_contact_phone
                            ? formatPhone(selectedPatient.emergency_contact_phone)
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Parentesco</Label>
                        <p className="text-base">
                          {selectedPatient.emergency_contact_relationship || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Alergias
                      </Label>
                      <p className="text-base whitespace-pre-wrap">
                        {selectedPatient.allergies || "Nenhuma alergia registrada"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Problemas Ativos
                      </Label>
                      <p className="text-base whitespace-pre-wrap">
                        {selectedPatient.active_problems || "Nenhum problema registrado"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observações
                    </Label>
                    <p className="text-base whitespace-pre-wrap mt-2">
                      {selectedPatient.notes || "Nenhuma observação registrada"}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              Fechar
            </Button>
            {selectedPatient && (
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setShowDetail(false);
                  openEditForm(selectedPatient);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Patient Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Editar Paciente" : "Cadastrar Novo Paciente"}
            </DialogTitle>
            <DialogDescription>
              {editingPatient
                ? "Atualize os dados do paciente"
                : "Preencha os dados do paciente"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="medical">Informações Médicas</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nome *</Label>
                    <Input
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Sobrenome *</Label>
                    <Input
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Data de Nascimento *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({ ...formData, date_of_birth: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Sexo</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefere não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
                    <Select
                      value={formData.blood_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, blood_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleCPFChange(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="is_active" className="cursor-pointer">
                        Paciente Ativo
                      </Label>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, "phone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Contato de Emergência</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Nome</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Telefone</Label>
                      <Input
                        id="emergency_contact_phone"
                        placeholder="(00) 00000-0000"
                        value={formData.emergency_contact_phone}
                        onChange={(e) =>
                          handlePhoneChange(e.target.value, "emergency_contact_phone")
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_relationship">Parentesco</Label>
                      <Input
                        id="emergency_contact_relationship"
                        placeholder="Ex: Pai, Mãe, Cônjuge"
                        value={formData.emergency_contact_relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_relationship: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="allergies">Alergias</Label>
                    <Textarea
                      id="allergies"
                      placeholder="Liste as alergias do paciente..."
                      value={formData.allergies}
                      onChange={(e) =>
                        setFormData({ ...formData, allergies: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="active_problems">Problemas Ativos</Label>
                    <Textarea
                      id="active_problems"
                      placeholder="Liste os problemas de saúde ativos..."
                      value={formData.active_problems}
                      onChange={(e) =>
                        setFormData({ ...formData, active_problems: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observações adicionais sobre o paciente..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={6}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                {saving
                  ? "Salvando..."
                  : editingPatient
                  ? "Atualizar"
                  : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePatient} onOpenChange={() => setDeletePatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente{" "}
              <strong>
                {deletePatient?.first_name} {deletePatient?.last_name}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
