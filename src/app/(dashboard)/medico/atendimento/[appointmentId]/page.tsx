"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { appointmentsApi } from "@/lib/appointments-api";
import { patientsApi } from "@/lib/patients-api";
import {
  clinicalRecordsApi,
  prescriptionsApi,
  examRequestsApi,
} from "@/lib/clinical-api";
import {
  Appointment,
  Patient,
  ClinicalRecord,
  Prescription,
  ExamRequest,
  PrescriptionCreate,
  ExamRequestCreate,
} from "@/lib/types";
import { PatientSummary } from "@/components/consultation/patient-summary";
import { SoapForm } from "@/components/consultation/soap-form";
import { PrescriptionsForm } from "@/components/consultation/prescriptions-form";
import { ExamRequestsForm } from "@/components/consultation/exam-requests-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, Mic, Phone } from "lucide-react";
import { toast } from "sonner";
import { patientCallingApi } from "@/lib/patient-calling-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = Number(params.appointmentId);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | null>(
    null
  );
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  // Load appointment and related data
  useEffect(() => {
    loadData();
  }, [appointmentId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load appointment
      const appointmentData = await appointmentsApi.getById(appointmentId);
      setAppointment(appointmentData);

      // Load patient
      const patientData = await patientsApi.getById(appointmentData.patient_id);
      setPatient(patientData);

      // Try to load clinical record (may not exist yet)
      try {
        const clinicalRecordData = await clinicalRecordsApi.getByAppointment(
          appointmentId
        );
        setClinicalRecord(clinicalRecordData);

        // If clinical record exists, load prescriptions and exam requests
        if (clinicalRecordData.id) {
          const [prescriptionsData, examRequestsData] = await Promise.all([
            prescriptionsApi.getByClinicalRecord(clinicalRecordData.id),
            examRequestsApi.getByClinicalRecord(clinicalRecordData.id),
          ]);
          setPrescriptions(prescriptionsData);
          setExamRequests(examRequestsData);
        }
      } catch (error) {
        // Clinical record doesn't exist yet, that's ok
        console.log("No clinical record yet");
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save SOAP note
  const handleSaveSoap = async (data: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  }) => {
    try {
      setIsSaving(true);
      const savedRecord = await clinicalRecordsApi.createOrUpdate(
        appointmentId,
        data
      );
      setClinicalRecord(savedRecord);
      toast.success("Prontuário salvo com sucesso");
    } catch (error: any) {
      toast.error("Erro ao salvar prontuário", {
        description: error.message,
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Add prescription
  const handleAddPrescription = async (
    data: Omit<PrescriptionCreate, "clinical_record_id">
  ) => {
    if (!clinicalRecord?.id) {
      toast.error("Salve o prontuário SOAP primeiro");
      return;
    }

    const newPrescription = await prescriptionsApi.create(clinicalRecord.id, data);
    setPrescriptions([...prescriptions, newPrescription]);
  };

  // Delete prescription
  const handleDeletePrescription = async (prescriptionId: number) => {
    await prescriptionsApi.delete(prescriptionId);
    setPrescriptions(
      prescriptions.filter((p) => p.id !== prescriptionId)
    );
  };

  // Add exam request
  const handleAddExamRequest = async (
    data: Omit<ExamRequestCreate, "clinical_record_id">
  ) => {
    if (!clinicalRecord?.id) {
      toast.error("Salve o prontuário SOAP primeiro");
      return;
    }

    const newExamRequest = await examRequestsApi.create(clinicalRecord.id, data);
    setExamRequests([...examRequests, newExamRequest]);
  };

  // Delete exam request
  const handleDeleteExamRequest = async (examRequestId: number) => {
    await examRequestsApi.delete(examRequestId);
    setExamRequests(examRequests.filter((e) => e.id !== examRequestId));
  };

  // Call patient
  const handleCallPatient = async () => {
    try {
      setIsCalling(true);
      await patientCallingApi.call(appointmentId);
      toast.success("Paciente chamado com sucesso", {
        description: `${patient?.first_name} ${patient?.last_name} foi notificado`,
      });
      setShowCallDialog(false);
    } catch (error: any) {
      toast.error("Erro ao chamar paciente", {
        description: error.message,
      });
    } finally {
      setIsCalling(false);
    }
  };

  // Complete appointment
  const handleCompleteAppointment = async () => {
    if (!clinicalRecord) {
      toast.error("Preencha o prontuário SOAP antes de finalizar");
      return;
    }

    if (
      !confirm(
        "Deseja finalizar este atendimento? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      await appointmentsApi.updateStatus(appointmentId, "completed");
      toast.success("Atendimento finalizado com sucesso");
      router.push("/secretaria/agendamentos");
    } catch (error: any) {
      toast.error("Erro ao finalizar atendimento", {
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!appointment || !patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Agendamento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Atendimento Médico</h1>
            <p className="text-muted-foreground">
              {format(new Date(appointment.scheduled_datetime), "PPP 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(appointment.status === "scheduled" || appointment.status === "checked_in") && (
            <Button
              variant="default"
              onClick={() => setShowCallDialog(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Chamar Paciente
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/medico/atendimento/${appointmentId}/voice`)}
          >
            <Mic className="h-4 w-4 mr-2" />
            Documentação por Voz
          </Button>
          <Badge variant={appointment.status === "completed" ? "default" : "secondary"}>
            {appointment.status === "scheduled" && "Agendado"}
            {appointment.status === "checked_in" && "Check-in Realizado"}
            {appointment.status === "in_consultation" && "Em Consulta"}
            {appointment.status === "completed" && "Finalizado"}
            {appointment.status === "cancelled" && "Cancelado"}
          </Badge>
          {appointment.status !== "completed" && (
            <Button onClick={handleCompleteAppointment}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Atendimento
            </Button>
          )}
        </div>
      </div>

      {/* Patient Summary */}
      <PatientSummary patient={patient} />

      {/* SOAP Form */}
      <SoapForm
        clinicalRecord={clinicalRecord || undefined}
        onSave={handleSaveSoap}
        isSaving={isSaving}
      />

      {/* Prescriptions and Exam Requests */}
      <Tabs defaultValue="prescriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prescriptions">
            Prescrições ({prescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="exams">
            Solicitar Exames ({examRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="mt-6">
          <PrescriptionsForm
            prescriptions={prescriptions}
            clinicalRecordId={clinicalRecord?.id}
            onAdd={handleAddPrescription}
            onDelete={handleDeletePrescription}
          />
        </TabsContent>

        <TabsContent value="exams" className="mt-6">
          <ExamRequestsForm
            examRequests={examRequests}
            clinicalRecordId={clinicalRecord?.id}
            onAdd={handleAddExamRequest}
            onDelete={handleDeleteExamRequest}
          />
        </TabsContent>
      </Tabs>

      {/* Call Patient Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chamar Paciente</DialogTitle>
            <DialogDescription>
              Deseja chamar o paciente <strong>{patient?.first_name} {patient?.last_name}</strong> para a consulta?
              Esta ação enviará uma notificação visual e sonora na recepção.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCallPatient} disabled={isCalling}>
              <Phone className="h-4 w-4 mr-2" />
              {isCalling ? "Chamando..." : "Confirmar Chamada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

