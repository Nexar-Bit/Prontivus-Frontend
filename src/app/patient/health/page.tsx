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
import { Calendar, Clock, Activity, TestTube, Pill, User, Stethoscope, CheckCircle2, X, Download, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to reload all data
  const reloadData = async () => {
    try {
      setLoading(true);
      const [appts, dashboard, prescriptions, examResults] = await Promise.all([
        api.get<Appt[]>(`/api/v1/appointments/patient-appointments`),
        api.get<any>(`/api/v1/patient/dashboard`).catch(() => null), // Optional, don't fail if unavailable
        api.get<any[]>(`/api/v1/patient/prescriptions`).catch(() => []), // Get prescriptions
        api.get<any[]>(`/api/v1/patient/exam-results`).catch(() => []), // Get exam results
      ]);
      
      setAppointments(appts);
      
      // Extract health summary from dashboard if available
      if (dashboard?.health_summary) {
        setHealthSummary(dashboard.health_summary);
      }
      
      // Build history from appointments, prescriptions, and exam results
      const historyItems: HistoryItem[] = [];
      
      // Group data by appointment
      const appointmentMap = new Map<number, HistoryItem>();
      
      appts.forEach(apt => {
        appointmentMap.set(apt.id, {
          appointment_id: apt.id,
          appointment_date: apt.scheduled_datetime,
          doctor_name: apt.doctor_name,
          appointment_type: apt.appointment_type,
          clinical_record: {
            prescriptions: [],
            exam_requests: [],
            diagnoses: [],
          },
        });
      });
      
      // Add prescriptions to history
      prescriptions.forEach((presc: any) => {
        // Try to find the appointment for this prescription
        // For now, we'll add it to the most recent appointment or create a generic entry
        const aptId = presc.appointment_id || appts[0]?.id;
        if (aptId && appointmentMap.has(aptId)) {
          const item = appointmentMap.get(aptId)!;
          if (!item.clinical_record) {
            item.clinical_record = { prescriptions: [], exam_requests: [], diagnoses: [] };
          }
          // Ensure prescriptions array exists
          if (!item.clinical_record.prescriptions) {
            item.clinical_record.prescriptions = [];
          }
          item.clinical_record.prescriptions.push({
            id: presc.id,
            medication_name: presc.medication_name,
            dosage: presc.dosage,
            frequency: presc.frequency,
            duration: presc.duration,
            instructions: presc.instructions,
            issued_date: presc.issued_date || new Date().toISOString(),
            is_active: presc.is_active,
          });
        }
      });
      
      // Add exam results to history
      examResults.forEach((exam: any) => {
        // Try to find the appointment for this exam
        const aptId = exam.appointment_id || appts[0]?.id;
        if (aptId && appointmentMap.has(aptId)) {
          const item = appointmentMap.get(aptId)!;
          if (!item.clinical_record) {
            item.clinical_record = { prescriptions: [], exam_requests: [], diagnoses: [] };
          }
          // Ensure exam_requests array exists
          if (!item.clinical_record.exam_requests) {
            item.clinical_record.exam_requests = [];
          }
          item.clinical_record.exam_requests.push({
            id: exam.id,
            exam_type: exam.exam_type,
            description: exam.description,
            reason: exam.reason,
            requested_date: exam.requested_date || new Date().toISOString(),
            completed: exam.status === 'available',
            completed_date: exam.completed_date,
          });
        }
      });
      
      // Try to fetch clinical records with diagnoses for each appointment
      // Note: This would require a patient-accessible endpoint for clinical records
      // For now, we'll use the diagnoses from the dashboard health summary if available
      // and try to fetch clinical records if possible
      try {
        const clinicalRecordsPromises = appts.map(async (apt) => {
          try {
            // Try to get clinical record for this appointment
            // Note: This endpoint might require staff role, so we catch errors
            const record = await api.get<any>(`/api/v1/clinical/appointments/${apt.id}/clinical-record`).catch(() => null);
            return { appointmentId: apt.id, record };
          } catch {
            return { appointmentId: apt.id, record: null };
          }
        });
        
        const clinicalRecords = await Promise.all(clinicalRecordsPromises);
        
        clinicalRecords.forEach(({ appointmentId, record }) => {
          if (record && appointmentMap.has(appointmentId)) {
            const item = appointmentMap.get(appointmentId)!;
            if (!item.clinical_record) {
              item.clinical_record = { prescriptions: [], exam_requests: [], diagnoses: [] };
            }
            // Add diagnoses from clinical record
            if (record.diagnoses && Array.isArray(record.diagnoses)) {
              item.clinical_record.diagnoses = record.diagnoses.map((d: any) => ({
                id: d.id,
                cid_code: d.cid_code,
                description: d.description,
                type: d.type,
              }));
            }
          }
        });
      } catch (error) {
        // Silently fail if we can't fetch clinical records
        console.warn("Could not fetch clinical records with diagnoses:", error);
      }
      
      setHistory(Array.from(appointmentMap.values()).sort((a, b) => 
        new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      ));
    } catch (error: any) {
      console.error("Error loading health data:", error);
      toast.error("Erro ao carregar dados de saúde", {
        description: error?.message || error?.detail || "Não foi possível carregar suas informações de saúde",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await reloadData();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => {
        const aptDate = new Date(a.scheduled_datetime);
        // Handle status - can be enum object or string
        let statusValue = '';
        if (typeof a.status === 'string') {
          statusValue = a.status.toLowerCase();
        } else if (a.status && typeof a.status === 'object' && 'value' in a.status) {
          statusValue = String((a.status as any).value).toLowerCase();
        }
        return aptDate >= now && statusValue !== 'cancelled' && statusValue !== 'completed';
      })
      .sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime())[0] || null;
  }, [appointments]);

  const activePrescriptions = useMemo(() => {
    return history.flatMap(h => h.clinical_record?.prescriptions || []).filter(p => p.is_active);
  }, [history]);

  const pendingExams = useMemo(() => {
    return history.flatMap(h => h.clinical_record?.exam_requests || []).filter(er => !er.completed);
  }, [history]);

  const activeDiagnoses = useMemo(() => {
    // Get all diagnoses from history (model doesn't have is_active field, so we count all)
    const allDiagnoses = history.flatMap(h => h.clinical_record?.diagnoses || []);
    // Remove duplicates by ID
    const uniqueDiagnoses = Array.from(
      new Map(allDiagnoses.map(d => [d.id, d])).values()
    );
    return uniqueDiagnoses;
  }, [history]);

  // Use health summary from dashboard if available, otherwise calculate from history
  const activePrescriptionsCount = healthSummary?.active_prescriptions_count ?? activePrescriptions.length;
  const pendingExamsCount = healthSummary?.pending_exams_count ?? pendingExams.length;
  const activeConditionsCount = healthSummary?.active_conditions_count ?? activeDiagnoses.length;

  const cancelAppt = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/cancel`, {});
      await reloadData();
      toast.success('Consulta cancelada com sucesso!');
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast.error('Erro ao cancelar consulta', {
        description: error?.message || error?.detail || 'Não foi possível cancelar a consulta',
      });
    }
  };

  const rescheduleAppt = async (id: number, whenISO: string) => {
    try {
      await api.post(`/api/v1/appointments/${id}/reschedule`, { scheduled_datetime: whenISO });
      await reloadData();
      toast.success('Consulta reagendada com sucesso!');
    } catch (error: any) {
      console.error("Error rescheduling appointment:", error);
      toast.error('Erro ao reagendar consulta', {
        description: error?.message || error?.detail || 'Não foi possível reagendar a consulta',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
        <PatientHeader showSearch={false} notificationCount={3} />
        <PatientMobileNav />
        <div className="flex">
          <div className="hidden lg:block">
            <PatientSidebar />
          </div>
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
            <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <p className="text-gray-500 font-medium">Carregando informações de saúde...</p>
              </CardContent>
            </Card>
          </main>
        </div>
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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-7 w-7 text-blue-600" />
                </div>
                Saúde
              </h1>
              <p className="text-muted-foreground text-sm">Resumo da sua saúde, consultas, exames e medicações</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  await reloadData();
                  toast.success('Dados atualizados!');
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    // Export health summary as CSV
                    const csvRows = [];
                    csvRows.push('Tipo,Descrição,Data,Status');
                    
                    // Add appointments
                    appointments.forEach(apt => {
                      csvRows.push([
                        'Consulta',
                        `${apt.doctor_name} - ${apt.appointment_type || 'Consulta'}`,
                        format(parseISO(apt.scheduled_datetime), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
                        apt.status
                      ].join(','));
                    });
                    
                    // Add prescriptions
                    activePrescriptions.forEach(p => {
                      csvRows.push([
                        'Prescrição',
                        p.medication_name,
                        format(parseISO(p.issued_date), 'dd/MM/yyyy', { locale: ptBR }),
                        p.is_active ? 'Ativa' : 'Inativa'
                      ].join(','));
                    });
                    
                    // Add pending exams
                    pendingExams.forEach(e => {
                      csvRows.push([
                        'Exame',
                        e.exam_type,
                        format(parseISO(e.requested_date), 'dd/MM/yyyy', { locale: ptBR }),
                        e.completed ? 'Concluído' : 'Pendente'
                      ].join(','));
                    });
                    
                    const csvContent = csvRows.join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `resumo_saude_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Resumo exportado com sucesso!');
                  } catch (error: any) {
                    toast.error('Erro ao exportar resumo', {
                      description: error?.message || error?.detail || 'Não foi possível exportar o resumo',
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
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
                <div className="text-2xl font-bold">{activePrescriptionsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Medicações em uso</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Exames Pendentes</CardTitle>
                <TestTube className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingExamsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Aguardando resultados</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Condições Ativas</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeConditionsCount}</div>
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
                        // Note: This will be replaced with modal confirmation
                        if (!confirm('Deseja reagendar esta consulta para daqui a 7 dias?')) {
                          return;
                        }
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
                        // Note: This will be replaced with modal confirmation
                        if (!confirm('Tem certeza que deseja cancelar esta consulta?')) {
                          return;
                        }
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
                            onClick={async () => {
                              try {
                                // Generate prescription text for download
                                const prescriptionText = `
PRESCRIÇÃO MÉDICA

Medicamento: ${p.medication_name}
Dosagem: ${p.dosage || 'Não especificado'}
Frequência: ${p.frequency || 'Não especificado'}
Duração: ${p.duration || 'Não especificado'}
Instruções: ${p.instructions || 'Seguir orientações do médico'}

Emitido em: ${format(parseISO(p.issued_date), "dd/MM/yyyy", { locale: ptBR })}
                                `.trim();
                                
                                const blob = new Blob([prescriptionText], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `prescricao_${p.medication_name.replace(/\s+/g, '_')}_${format(parseISO(p.issued_date), 'yyyy-MM-dd', { locale: ptBR })}.txt`;
                                link.click();
                                URL.revokeObjectURL(url);
                                toast.success('Prescrição baixada com sucesso!');
                              } catch (error: any) {
                                toast.error('Erro ao baixar prescrição', {
                                  description: error?.message || 'Não foi possível baixar a prescrição',
                                });
                              }
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

          {/* Active Diagnoses/Conditions */}
          {activeDiagnoses.length > 0 && (
            <Card className="border-l-4 border-l-green-500 mb-6 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <Activity className="h-5 w-5" />
                      </div>
                      Condições de Saúde
                    </CardTitle>
                    <CardDescription>Diagnósticos e condições monitoradas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeDiagnoses.map(d => (
                    <div 
                      key={d.id} 
                      className="p-3 rounded-lg border border-green-200 bg-green-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {d.cid_code ? `${d.cid_code} - ` : ''}{d.description || 'Condição não especificada'}
                          </div>
                          {d.type && (
                            <div className="text-xs text-gray-600 mt-1">Tipo: {d.type}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        Ativa
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <div 
                      key={er.id} 
                      className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        // Navigate to test results page
                        window.location.href = '/patient/test-results';
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-orange-100"><TestTube className="h-4 w-4 text-orange-600" /></div>
                        <div>
                          <div className="font-medium text-gray-900">{er.exam_type}</div>
                          <div className="text-xs text-gray-600">
                            {er.description ? `${er.description.substring(0, 50)}...` : 'Solicitado em ' + format(parseISO(er.requested_date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          {er.reason && (
                            <div className="text-xs text-gray-500 mt-1">Motivo: {er.reason.substring(0, 60)}...</div>
                          )}
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


