"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExamRequestsForm } from "@/components/consultation/exam-requests-form";
import { ExamRequest, ExamRequestCreate, UrgencyLevel } from "@/lib/types";

interface TodayPatient {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  scheduled_datetime: string;
}

export default function MedicoExamesPage() {
  const [patients, setPatients] = useState<TodayPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  // Load today's patients for this doctor
  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const data = await api.get<TodayPatient[]>("/api/v1/appointments/today-patients");
      setPatients(data);
      if (data.length > 0 && !selectedAppointmentId) {
        setSelectedAppointmentId(data[0].appointment_id);
      }
    } catch (error: any) {
      console.error("Failed to load today's patients:", error);
      toast.error("Erro ao carregar pacientes de hoje", {
        description:
          error?.message ||
          error?.detail ||
          "Não foi possível carregar os pacientes com consulta hoje",
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  // Load exam requests for selected appointment (optional enhancement)
  const loadExamRequests = async () => {
    if (!selectedAppointmentId) {
      setExamRequests([]);
      return;
    }
    try {
      setLoadingExams(true);
      // Get exam requests for the selected appointment
      const exams = await api.get<any[]>(
        `/api/v1/clinical/exam-requests?appointment_id=${selectedAppointmentId}`
      ).catch(() => [] as any[]);

      // Map backend response to frontend interface
      setExamRequests(
        exams.map((e: any) => ({
          id: e.id,
          clinical_record_id: e.clinical_record_id,
          exam_type: e.exam_type,
          description: e.description,
          reason: e.reason,
          urgency: e.urgency || UrgencyLevel.ROUTINE,
          is_completed: e.completed || false,
          completed_at: e.completed_date || undefined,
          created_at: e.created_at,
          updated_at: e.updated_at,
        }))
      );
    } catch {
      setExamRequests([]);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadExamRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppointmentId]);

  const handleAddExam = async (
    data: Omit<ExamRequestCreate, "clinical_record_id">
  ) => {
    if (!selectedAppointmentId) {
      toast.error("Selecione um paciente/atendimento primeiro");
      return;
    }

    await api.post("/api/v1/clinical/exam-requests/from-appointment", {
      appointment_id: selectedAppointmentId,
      exam_type: data.exam_type,
      description: data.description,
      reason: data.reason,
      urgency: data.urgency,
    });

    await loadExamRequests();
  };

  const handleDeleteExam = async (examRequestId: number) => {
    await api.delete(`/api/v1/clinical/exam-requests/${examRequestId}`);
    await loadExamRequests();
  };

  const selectedPatient = patients.find(
    (p) => p.appointment_id === selectedAppointmentId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-cyan-600" />
            Solicitar Exames
          </h1>
          <p className="text-gray-600 mt-1">
            Solicite exames para pacientes com atendimentos agendados para hoje.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione o Paciente</CardTitle>
          <CardDescription>
            Apenas pacientes com atendimento hoje são exibidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPatients ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando pacientes...
            </div>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum paciente com atendimento agendado para hoje.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select
                value={selectedAppointmentId?.toString() ?? ""}
                onValueChange={(value) =>
                  setSelectedAppointmentId(parseInt(value, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem
                      key={p.appointment_id}
                      value={p.appointment_id.toString()}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {p.patient_name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {p.doctor_name} •{" "}
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(p.scheduled_datetime), "HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPatient && (
            <p className="text-xs text-muted-foreground">
              Atendimento hoje às{" "}
              {format(parseISO(selectedPatient.scheduled_datetime), "HH:mm", {
                locale: ptBR,
              })}{" "}
              com {selectedPatient.doctor_name}.
            </p>
          )}
        </CardContent>
      </Card>

      <ExamRequestsForm
        examRequests={examRequests}
        clinicalRecordId={0}
        onAdd={handleAddExam}
        onDelete={handleDeleteExam}
      />
    </div>
  );
}


