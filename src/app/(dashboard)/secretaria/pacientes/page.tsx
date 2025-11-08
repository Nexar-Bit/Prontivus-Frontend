"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Patient, PatientCreate, PatientUpdate, Gender } from "@/lib/types";
import { patientsApi } from "@/lib/patients-api";
import { DataTable } from "@/components/patients/data-table";
import { PatientForm } from "@/components/patients/patient-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts";
import { Pencil, Eye, Trash2, Loader2, Users, RefreshCw, UserPlus, Calendar, Phone, Mail, FileText, Heart, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Load patients
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error: any) {
      toast.error("Erro ao carregar pacientes", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Handle create patient
  const handleCreate = async (data: PatientCreate | PatientUpdate) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const patientData: PatientCreate = {
        ...(data as PatientCreate),
        clinic_id: user.clinic_id,
      };
      await patientsApi.create(patientData);
      toast.success("Paciente criado com sucesso!");
      setIsCreateDialogOpen(false);
      loadPatients();
    } catch (error: any) {
      toast.error("Erro ao criar paciente", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update patient
  const handleUpdate = async (data: PatientCreate | PatientUpdate) => {
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    try {
      await patientsApi.update(selectedPatient.id, data as PatientUpdate);
      toast.success("Paciente atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedPatient(null);
      loadPatients();
    } catch (error: any) {
      toast.error("Erro ao atualizar paciente", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete patient
  const handleDelete = async (patientId: number) => {
    if (!confirm("Tem certeza que deseja excluir este paciente?")) {
      return;
    }
    
    try {
      await patientsApi.delete(patientId);
      toast.success("Paciente excluído com sucesso!");
      loadPatients();
    } catch (error: any) {
      toast.error("Erro ao excluir paciente", {
        description: error.message,
      });
    }
  };

  // Format gender for display
  const formatGender = (gender: Gender) => {
    const genderMap = {
      [Gender.MALE]: "Masculino",
      [Gender.FEMALE]: "Feminino",
      [Gender.OTHER]: "Outro",
    };
    return genderMap[gender] || gender;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Table columns
  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => {
        const firstName = row.original.first_name;
        const lastName = row.original.last_name;
        return `${firstName} ${lastName}`;
      },
    },
    {
      accessorKey: "cpf",
      header: "CPF",
      cell: ({ row }) => row.original.cpf || "-",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "-",
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPatient(patient);
                setIsViewDialogOpen(true);
              }}
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPatient(patient);
                setIsEditDialogOpen(true);
              }}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(patient.id)}
              title="Excluir"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

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
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                      Pacientes
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      Gerencie os pacientes da clínica
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-700">{patients.length}</span>
                    <span>paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={loadPatients}
                  disabled={isLoading}
                  variant="outline"
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Atualizar
                </Button>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Patients Table Card */}
        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Lista de Pacientes</CardTitle>
                <CardDescription className="mt-1">
                  {patients.length} paciente{patients.length !== 1 ? "s" : ""} cadastrado{patients.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-base font-medium text-gray-700">Carregando pacientes...</p>
                <p className="text-sm text-muted-foreground">Aguarde um momento</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                  <Users className="h-12 w-12 text-blue-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Nenhum paciente cadastrado</p>
                <p className="text-sm text-gray-600 mb-4">Clique em "Novo Paciente" para adicionar um paciente.</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Paciente
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={patients} />
            )}
          </CardContent>
        </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo paciente
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize os dados do paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm
              patient={selectedPatient}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedPatient(null);
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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
                    Visualize as informações completas do paciente
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {selectedPatient && (
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
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                          ID: {selectedPatient.id}
                        </Badge>
                        {selectedPatient.blood_type && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                            <Heart className="h-3 w-3 mr-1" />
                            {selectedPatient.blood_type}
                          </Badge>
                        )}
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
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Data de Nascimento
                      </h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {formatDate(selectedPatient.date_of_birth)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Gênero
                      </h4>
                      <p className="text-base font-medium text-gray-900">
                        {formatGender(selectedPatient.gender)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        CPF
                      </h4>
                      <p className="text-base font-medium text-gray-900">
                        {selectedPatient.cpf || "-"}
                      </p>
                    </div>
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
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Telefone
                      </h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-teal-600" />
                        {selectedPatient.phone || "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-teal-100 bg-teal-50/30">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Email
                      </h4>
                      <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-teal-600" />
                        {selectedPatient.email || "-"}
                      </p>
                    </div>
                    {selectedPatient.address && (
                      <div className="p-4 rounded-lg border border-teal-100 bg-teal-50/30 sm:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Endereço
                        </h4>
                        <p className="text-base font-medium text-gray-900">
                          {selectedPatient.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                {(selectedPatient.allergies || selectedPatient.active_problems || selectedPatient.blood_type) && (
                  <>
                    <Separator className="bg-blue-100" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-600" />
                        Informações Médicas
                      </h3>
                      {selectedPatient.allergies && (
                        <div className="p-4 rounded-lg border border-red-100 bg-red-50/30">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Alergias
                          </h4>
                          <p className="text-base text-gray-900">
                            {selectedPatient.allergies}
                          </p>
                        </div>
                      )}
                      {selectedPatient.active_problems && (
                        <div className="p-4 rounded-lg border border-orange-100 bg-orange-50/30">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            Problemas Ativos
                          </h4>
                          <p className="text-base text-gray-900">
                            {selectedPatient.active_problems}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Emergency Contact */}
                {(selectedPatient.emergency_contact_name || selectedPatient.emergency_contact_phone) && (
                  <>
                    <Separator className="bg-blue-100" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Contato de Emergência
                      </h3>
                      <div className="p-4 rounded-lg border border-orange-100 bg-orange-50/30">
                        <p className="text-base font-medium text-gray-900">
                          {selectedPatient.emergency_contact_name || "-"}
                          {selectedPatient.emergency_contact_name && selectedPatient.emergency_contact_relationship && 
                            ` (${selectedPatient.emergency_contact_relationship})`}
                        </p>
                        {selectedPatient.emergency_contact_phone && (
                          <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-orange-600" />
                            {selectedPatient.emergency_contact_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

