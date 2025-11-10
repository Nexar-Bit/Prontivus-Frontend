"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Activity, TestTube, Pill, User, Stethoscope, CheckCircle2, X, Download, ChevronRight } from "lucide-react";

type Appt = {
  id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  status: string;
  appointment_type?: string;
  reason?: string;
  notes?: string;
  doctor_id: number;
  doctor_name: string;
};

type HistoryItem = {
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  appointment_type?: string;
  clinical_record?: {
    notes?: string;
    prescriptions?: Array<{
      id: number;
      medication_name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
      issued_date: string;
      is_active: boolean;
    }>;
    exam_requests?: Array<{
      id: number;
      exam_type: string;
      description?: string;
      reason?: string;
      requested_date: string;
      completed: boolean;
      completed_date?: string;
    }>;
    diagnoses?: Array<{ id: number; cid_code: string; description?: string; type?: string }>;
  };
};

export default function PatientHealthPage() {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [appts, hist] = await Promise.all([
          api.get<Appt[]>(`/api/appointments/patient-appointments`),
          api.get<HistoryItem[]>(`/api/clinical/me/history`),
        ]);
        setAppointments(appts);
        setHistory(hist);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.scheduled_datetime) >= now && a.status.toLowerCase() !== 'cancelled')
      .sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime())[0] || null;
  }, [appointments]);

  const activePrescriptions = useMemo(() => {
    return history.flatMap(h => h.clinical_record?.prescriptions || []).filter(p => p.is_active);
  }, [history]);

  const pendingExams = useMemo(() => {
    return history.flatMap(h => h.clinical_record?.exam_requests || []).filter(er => !er.completed);
  }, [history]);

  const activeDiagnoses = useMemo(() => {
    return history.flatMap(h => h.clinical_record?.diagnoses || []).filter(d => (d as any).type !== 'resolved');
  }, [history]);

  const cancelAppt = async (id: number) => {
    await api.post(`/api/appointments/${id}/cancel`, {});
    const appts = await api.get<Appt[]>(`/api/appointments/patient-appointments`);
    setAppointments(appts);
  };

  const rescheduleAppt = async (id: number, whenISO: string) => {
    await api.post(`/api/appointments/${id}/reschedule`, { scheduled_datetime: whenISO });
    const appts = await api.get<Appt[]>(`/api/appointments/patient-appointments`);
    setAppointments(appts);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Modern Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-7 w-7 text-blue-600" />
              </div>
              Saúde
            </h1>
            <p className="text-muted-foreground text-sm">Resumo da sua saúde, consultas, exames e medicações</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Consulta</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      {format(parseISO(nextAppointment.scheduled_datetime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      {nextAppointment.doctor_name}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhuma consulta agendada</div>
                )}
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Prescrições Ativas</CardTitle>
                <Pill className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePrescriptions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Medicações em uso</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Exames Pendentes</CardTitle>
                <TestTube className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingExams.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Aguardando resultados</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Condições Ativas</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeDiagnoses.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Condições monitoradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Next appointment card */}
          <Card className="border-l-4 border-l-blue-500 mb-6 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5" />
                    </div>
                    Sua próxima consulta
                  </CardTitle>
                  <CardDescription>Gerencie sua consulta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {nextAppointment ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-16 w-16 border-2 border-blue-200">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {nextAppointment.doctor_name?.split(' ')[0]?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg text-blue-600">
                          {nextAppointment.doctor_name}
                        </CardTitle>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">{nextAppointment.appointment_type || 'Consulta'}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(nextAppointment.scheduled_datetime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(parseISO(nextAppointment.scheduled_datetime), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const newDate = addDays(parseISO(nextAppointment.scheduled_datetime), 7).toISOString();
                        await rescheduleAppt(nextAppointment.id, newDate);
                      }}
                    >
                      Reagendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        await cancelAppt(nextAppointment.id);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sem consultas agendadas</div>
              )}
            </CardContent>
          </Card>

          {/* Active prescriptions */}
          <Card className="border-l-4 border-l-teal-500 mb-6 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-lg">
                      <Pill className="h-5 w-5" />
                    </div>
                    Prescrições ativas
                  </CardTitle>
                  <CardDescription>Medicações atuais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activePrescriptions.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma prescrição ativa</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Posologia</TableHead>
                      <TableHead>Emitido em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePrescriptions.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.medication_name}</TableCell>
                        <TableCell className="text-sm text-gray-700">{[p.dosage, p.frequency, p.duration].filter(Boolean).join(' • ')}</TableCell>
                        <TableCell>{format(parseISO(p.issued_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/prescriptions/${p.id}/pdf`;
                              window.open(url, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending exams */}
          <Card className="border-l-4 border-l-orange-500 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-orange-600 flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <TestTube className="h-5 w-5" />
                    </div>
                    Exames pendentes
                  </CardTitle>
                  <CardDescription>Solicitações de exame ainda não concluídas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingExams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-orange-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <TestTube className="h-10 w-10 text-orange-600" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Nenhum exame pendente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingExams.map(er => (
                    <div key={er.id} className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-orange-100"><TestTube className="h-4 w-4 text-orange-600" /></div>
                        <div>
                          <div className="font-medium text-gray-900">{er.exam_type}</div>
                          <div className="text-xs text-gray-600">Solicitado em {format(parseISO(er.requested_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}


