"use client";

import { useEffect, useState, useRef } from "react";
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
  AppointmentStatus,
} from "@/lib/types";
import { PatientSummary } from "@/components/consultation/patient-summary";
import { SoapForm } from "@/components/consultation/soap-form";
import { PrescriptionsForm } from "@/components/consultation/prescriptions-form";
import { ExamRequestsForm } from "@/components/consultation/exam-requests-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  Mic,
  Phone,
  Play,
  UserCheck,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { patientCallingApi } from "@/lib/patient-calling-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PDFGenerator } from "@/components/documents/PDFGenerator";
import { DocumentSignatureButton } from "@/components/documents/DocumentSignatureButton";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { TranscriptionResult } from "@/components/voice/TranscriptionResult";
import { SoapFormRef } from "@/components/consultation/soap-form";
import { SymptomChecker } from "@/components/ai-diagnosis/SymptomChecker";
import { ICD10Suggestions } from "@/components/ai-diagnosis/ICD10Suggestions";
import { DrugInteractionChecker } from "@/components/ai-diagnosis/DrugInteractionChecker";

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = Number(params.appointmentId);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [previousAppointments, setPreviousAppointments] = useState<Appointment[]>([]);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const soapFormRef = useRef<SoapFormRef>(null);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);

  // Load appointment and related data
  useEffect(() => {
    if (appointmentId) {
      loadData();
    }
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

      // Load previous appointments for this patient
      try {
        const previousAppts = await appointmentsApi.getAll({
          patient_id: patientData.id,
          status: AppointmentStatus.COMPLETED,
        });
        // Filter out current appointment and sort by date (most recent first)
        const filtered = previousAppts
          .filter((apt) => apt.id !== appointmentId)
          .sort((a, b) => 
            new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime()
          )
          .slice(0, 10); // Get last 10 appointments
        setPreviousAppointments(filtered);
      } catch (error) {
        console.error("Failed to load previous appointments:", error);
      }

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
        description: error.message || "Não foi possível carregar os dados do atendimento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update appointment status
  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    try {
      setUpdatingStatus(true);
      await appointmentsApi.updateStatus(appointmentId, newStatus);
      
      // Reload appointment data
      const updatedAppointment = await appointmentsApi.getById(appointmentId);
      setAppointment(updatedAppointment);
      
      const statusMessages: Record<AppointmentStatus, string> = {
        [AppointmentStatus.CHECKED_IN]: "Check-in realizado com sucesso",
        [AppointmentStatus.IN_CONSULTATION]: "Atendimento iniciado com sucesso",
        [AppointmentStatus.COMPLETED]: "Atendimento finalizado com sucesso",
        [AppointmentStatus.CANCELLED]: "Atendimento cancelado",
        [AppointmentStatus.SCHEDULED]: "Status atualizado",
      };
      
      toast.success(statusMessages[newStatus] || "Status atualizado");
    } catch (error: any) {
      toast.error("Erro ao atualizar status", {
        description: error.message || "Não foi possível atualizar o status do atendimento",
      });
    } finally {
      setUpdatingStatus(false);
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
      
      // Reload prescriptions and exam requests
      if (savedRecord.id) {
        const [prescriptionsData, examRequestsData] = await Promise.all([
          prescriptionsApi.getByClinicalRecord(savedRecord.id),
          examRequestsApi.getByClinicalRecord(savedRecord.id),
        ]);
        setPrescriptions(prescriptionsData);
        setExamRequests(examRequestsData);
      }
    } catch (error: any) {
      toast.error("Erro ao salvar prontuário", {
        description: error.message || "Não foi possível salvar o prontuário",
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

    try {
      const newPrescription = await prescriptionsApi.create(clinicalRecord.id, data);
      setPrescriptions([...prescriptions, newPrescription]);
      toast.success("Prescrição adicionada com sucesso");
    } catch (error: any) {
      toast.error("Erro ao adicionar prescrição", {
        description: error.message || "Não foi possível adicionar a prescrição",
      });
    }
  };

  // Delete prescription
  const handleDeletePrescription = async (prescriptionId: number) => {
    try {
      await prescriptionsApi.delete(prescriptionId);
      setPrescriptions(
        prescriptions.filter((p) => p.id !== prescriptionId)
      );
      toast.success("Prescrição removida com sucesso");
    } catch (error: any) {
      toast.error("Erro ao remover prescrição", {
        description: error.message || "Não foi possível remover a prescrição",
      });
    }
  };

  // Add exam request
  const handleAddExamRequest = async (
    data: Omit<ExamRequestCreate, "clinical_record_id">
  ) => {
    if (!clinicalRecord?.id) {
      toast.error("Salve o prontuário SOAP primeiro");
      return;
    }

    try {
      const newExamRequest = await examRequestsApi.create(clinicalRecord.id, data);
      setExamRequests([...examRequests, newExamRequest]);
      toast.success("Solicitação de exame adicionada com sucesso");
    } catch (error: any) {
      toast.error("Erro ao adicionar solicitação de exame", {
        description: error.message || "Não foi possível adicionar a solicitação",
      });
    }
  };

  // Delete exam request
  const handleDeleteExamRequest = async (examRequestId: number) => {
    try {
      await examRequestsApi.delete(examRequestId);
      setExamRequests(examRequests.filter((e) => e.id !== examRequestId));
      toast.success("Solicitação de exame removida com sucesso");
    } catch (error: any) {
      toast.error("Erro ao remover solicitação de exame", {
        description: error.message || "Não foi possível remover a solicitação",
      });
    }
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
        description: error.message || "Não foi possível chamar o paciente",
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
      // Note: This confirm is for unsaved changes, not delete - keeping it for now
      !confirm(
        "Deseja finalizar este atendimento? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      await handleStatusUpdate(AppointmentStatus.COMPLETED);
      toast.success("Atendimento finalizado com sucesso");
      // Redirect to queue after a short delay
      setTimeout(() => {
        router.push("/medico/atendimento/fila");
      }, 1500);
    } catch (error: any) {
      toast.error("Erro ao finalizar atendimento", {
        description: error.message || "Não foi possível finalizar o atendimento",
      });
    }
  };

  const handleTranscriptionComplete = (result: any) => {
    setTranscriptionResult(result);
  };

  const applyTranscriptionToForm = (section: string, text: string) => {
    if (soapFormRef.current) {
      soapFormRef.current.updateField(section, text);
      toast.success(`Texto aplicado à seção ${section}`);
    }
  };

  const handleDiagnosisUpdate = (newDiagnoses: any[]) => {
    setDiagnoses(newDiagnoses);
  };

  // Extract medication names from prescriptions for drug interaction checker
  const medicationNames = prescriptions
    .map(p => p.medication_name)
    .filter((name): name is string => !!name);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Agendado", variant: "secondary" },
      checked_in: { label: "Check-in Realizado", variant: "outline" },
      in_consultation: { label: "Em Consulta", variant: "default" },
      completed: { label: "Finalizado", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!appointment || !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Agendamento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O agendamento solicitado não foi encontrado ou você não tem permissão para acessá-lo.
          </p>
          <Button onClick={() => router.push("/medico/atendimento/fila")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a Fila
          </Button>
        </div>
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
            onClick={() => router.push("/medico/atendimento/fila")}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {getStatusBadge(appointment.status)}
        </div>
      </div>

      {/* Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações do Atendimento</CardTitle>
          <CardDescription>
            Gerencie o status e ações do atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {appointment.status === AppointmentStatus.SCHEDULED && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(AppointmentStatus.CHECKED_IN)}
                disabled={updatingStatus}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Realizar Check-in
              </Button>
            )}
            
            {(appointment.status === AppointmentStatus.SCHEDULED || 
              appointment.status === AppointmentStatus.CHECKED_IN) && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(AppointmentStatus.IN_CONSULTATION)}
                disabled={updatingStatus}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Atendimento
              </Button>
            )}

            {(appointment.status === AppointmentStatus.SCHEDULED || 
              appointment.status === AppointmentStatus.CHECKED_IN) && (
              <Button
                variant="default"
                onClick={() => setShowCallDialog(true)}
                className="bg-teal-600 hover:bg-teal-700"
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

            {appointment.status === AppointmentStatus.IN_CONSULTATION && (
              <Button
                onClick={handleCompleteAppointment}
                disabled={!clinicalRecord || isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Atendimento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Summary and Previous Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Summary */}
          <PatientSummary patient={patient} />

          {/* Previous Appointments */}
          {previousAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Consultas Anteriores
                </CardTitle>
                <CardDescription>
                  Histórico de consultas anteriores deste paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousAppointments.map((prevAppt) => (
                    <div
                      key={prevAppt.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(new Date(prevAppt.scheduled_datetime), "PPP 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          {prevAppt.reason && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {prevAppt.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/medico/prontuario/${prevAppt.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Prontuário
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Recording Section */}
          <VoiceRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            consultationId={appointmentId}
            language="pt-BR"
            enhanceMedicalTerms={true}
            structureSoap={true}
          />

          {/* Transcription Result */}
          {transcriptionResult && (
            <TranscriptionResult
              result={transcriptionResult}
              onApplyToForm={applyTranscriptionToForm}
              onClose={() => setTranscriptionResult(null)}
            />
          )}

          {/* AI Diagnosis Support Section */}
          <SymptomChecker onDiagnosisUpdate={handleDiagnosisUpdate} />

          {/* SOAP Form */}
          <SoapForm
            ref={soapFormRef}
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

            <TabsContent value="prescriptions" className="mt-6 space-y-6">
              <PrescriptionsForm
                prescriptions={prescriptions}
                clinicalRecordId={clinicalRecord?.id}
                onAdd={handleAddPrescription}
                onDelete={handleDeletePrescription}
              />
              
              {/* Drug Interaction Checker */}
              {medicationNames.length >= 2 && (
                <DrugInteractionChecker medications={medicationNames} />
              )}
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

          {/* PDF Generation Section */}
          {clinicalRecord && (
            <div className="mt-6 p-6 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </h3>
              <div className="flex flex-wrap gap-3">
                <PDFGenerator
                  consultationId={appointmentId}
                  documentType="consultation"
                  buttonVariant="default"
                />
                {prescriptions.length > 0 && (
                  <>
                    <PDFGenerator
                      prescriptionId={prescriptions[0].id}
                      documentType="prescription"
                      buttonVariant="outline"
                    />
                    <DocumentSignatureButton
                      documentType="prescription"
                      documentId={prescriptions[0].id}
                      buttonVariant="outline"
                      buttonSize="default"
                    />
                  </>
                )}
                {patient && (
                  <>
                    <PDFGenerator
                      patientId={patient.id}
                      documentType="certificate"
                      buttonVariant="outline"
                    />
                    <DocumentSignatureButton
                      documentType="certificate"
                      documentId={patient.id}
                      buttonVariant="outline"
                      buttonSize="default"
                    />
                  </>
                )}
                {clinicalRecord && (
                  <DocumentSignatureButton
                    documentType="consultation_report"
                    documentId={appointmentId}
                    buttonVariant="outline"
                    buttonSize="default"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Appointment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informações do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data e Hora</p>
                <p className="text-base font-semibold">
                  {format(new Date(appointment.scheduled_datetime), "PPP 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              
              {appointment.appointment_type && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p className="text-base">{appointment.appointment_type}</p>
                </div>
              )}

              {appointment.reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                  <p className="text-base">{appointment.reason}</p>
                </div>
              )}

              {appointment.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-base">{appointment.notes}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-2">{getStatusBadge(appointment.status)}</div>
              </div>

              {appointment.checked_in_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Check-in realizado</p>
                  <p className="text-base">
                    {format(new Date(appointment.checked_in_at), "PPp", { locale: ptBR })}
                  </p>
                </div>
              )}

              {appointment.started_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Atendimento iniciado</p>
                  <p className="text-base">
                    {format(new Date(appointment.started_at), "PPp", { locale: ptBR })}
                  </p>
                </div>
              )}

              {appointment.completed_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Atendimento finalizado</p>
                  <p className="text-base">
                    {format(new Date(appointment.completed_at), "PPp", { locale: ptBR })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

