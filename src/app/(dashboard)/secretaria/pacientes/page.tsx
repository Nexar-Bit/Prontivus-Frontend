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
import { PlusCircle, Pencil, Eye, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie os pacientes da clínica
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {patients.length} paciente{patients.length !== 1 ? "s" : ""} cadastrado{patients.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando pacientes...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base font-medium mb-2">Nenhum paciente cadastrado</p>
              <p className="text-sm">Clique em "Novo Paciente" para adicionar um paciente.</p>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              Visualize as informações completas do paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Nome Completo
                  </h3>
                  <p className="text-base">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Data de Nascimento
                  </h3>
                  <p className="text-base">
                    {formatDate(selectedPatient.date_of_birth)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Gênero
                  </h3>
                  <p className="text-base">
                    {formatGender(selectedPatient.gender)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    CPF
                  </h3>
                  <p className="text-base">{selectedPatient.cpf || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Telefone
                  </h3>
                  <p className="text-base">{selectedPatient.phone || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Email
                  </h3>
                  <p className="text-base">{selectedPatient.email || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tipo Sanguíneo
                  </h3>
                  <p className="text-base">
                    {selectedPatient.blood_type || "-"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Endereço
                </h3>
                <p className="text-base">{selectedPatient.address || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Contato de Emergência
                </h3>
                <p className="text-base">
                  {selectedPatient.emergency_contact_name || "-"}
                  {selectedPatient.emergency_contact_name && selectedPatient.emergency_contact_relationship && 
                    ` (${selectedPatient.emergency_contact_relationship})`}
                  {selectedPatient.emergency_contact_phone && 
                    ` - ${selectedPatient.emergency_contact_phone}`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Alergias
                </h3>
                <p className="text-base">{selectedPatient.allergies || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Problemas Ativos
                </h3>
                <p className="text-base">
                  {selectedPatient.active_problems || "-"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

