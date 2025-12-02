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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FlaskConical,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { UrgencyLevel } from "@/lib/types";

interface TodayPatient {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  scheduled_datetime: string;
}

export default function SecretariaSolicitarExamesPage() {
  const [patients, setPatients] = useState<TodayPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [examType, setExamType] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.ROUTINE);
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

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

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppointmentId) {
      toast.error("Selecione um paciente/atendimento primeiro");
      return;
    }
    if (!examType.trim()) {
      toast.error("O tipo de exame é obrigatório");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/v1/clinical/exam-requests/from-appointment", {
        appointment_id: selectedAppointmentId,
        exam_type: examType.trim(),
        urgency,
        description: description.trim() || null,
        reason: reason.trim() || null,
      });

      toast.success("Exame solicitado com sucesso!");
      setExamType("");
      setDescription("");
      setReason("");
    } catch (error: any) {
      console.error("Failed to create exam request:", error);
      toast.error("Erro ao solicitar exame", {
        description:
          error?.message ||
          error?.detail ||
          "Não foi possível criar a solicitação de exame",
      });
    } finally {
      setSaving(false);
    }
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
            Solicite exames para pacientes com consultas agendadas para hoje.
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

      <Card>
        <CardHeader>
          <CardTitle>Nova Solicitação de Exame</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_type">
                  Tipo de Exame <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="exam_type"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  placeholder="Ex: Hemograma completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgência</Label>
                <Select
                  value={urgency}
                  onValueChange={(value: UrgencyLevel) =>
                    setUrgency(value)
                  }
                >
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UrgencyLevel.ROUTINE}>Rotina</SelectItem>
                    <SelectItem value={UrgencyLevel.URGENT}>Urgente</SelectItem>
                    <SelectItem value={UrgencyLevel.EMERGENCY}>
                      Emergência
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes adicionais sobre o exame"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Solicitação</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Por que este exame está sendo solicitado?"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  "Solicitar"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


