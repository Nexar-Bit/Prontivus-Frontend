"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, Search, Calendar, User, Eye, RefreshCw, Filter, Edit, 
  CheckCircle2, XCircle, Clock, Stethoscope, Pill, TestTube, 
  FileCheck, AlertCircle, ChevronLeft, ChevronRight, Download, 
  Plus, Trash2, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface ClinicalRecord {
  id?: number;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  plan_soap?: string;
  prescriptions?: Prescription[];
  exam_requests?: ExamRequest[];
  diagnoses?: Diagnosis[];
  created_at?: string;
  updated_at?: string;
}

interface Prescription {
  id?: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  is_active?: boolean;
}

interface ExamRequest {
  id?: number;
  exam_type: string;
  description?: string;
  reason?: string;
  urgency?: string;
  completed?: boolean;
}

interface Diagnosis {
  id?: number;
  cid_code: string;
  description?: string;
  type?: string;
}

interface ClinicalRecordItem {
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  patient_name?: string | null;
  appointment_type: string | null;
  status: string;
  clinical_record: ClinicalRecord | null;
}

export default function ProntuariosPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ClinicalRecordItem[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ClinicalRecordItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecordItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClinicalRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    loadRecords();
  }, [dateFilter, selectedDateRange]);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, statusFilter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (dateFilter === "custom") {
        if (selectedDateRange.start) {
          params.append("start_date", selectedDateRange.start);
        }
        if (selectedDateRange.end) {
          params.append("end_date", selectedDateRange.end);
        }
      } else if (dateFilter === "month") {
        const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
        const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
        params.append("start_date", start);
        params.append("end_date", end);
      } else if (dateFilter === "last3months") {
        const start = format(subMonths(new Date(), 3), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        params.append("start_date", start);
        params.append("end_date", end);
      }
      
      const queryString = params.toString();
      const url = `/api/v1/clinical/doctor/my-clinical-records${queryString ? `?${queryString}` : ''}`;
      const data = await api.get<ClinicalRecordItem[]>(url);
      
      // Sort by appointment date (most recent first)
      const sorted = [...data].sort((a, b) => {
        const dateA = parseISO(a.appointment_date);
        const dateB = parseISO(b.appointment_date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRecords(sorted);
    } catch (error: any) {
      console.error("Failed to load records:", error);
      toast.error("Erro ao carregar prontuários", {
        description: error?.message || error?.detail || "Não foi possível carregar os prontuários",
      });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];
    
    // Filter by status
    if (statusFilter === "completed") {
      filtered = filtered.filter(record => record.clinical_record !== null);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter(record => record.clinical_record === null);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const patientName = (record.patient_name || "").toLowerCase();
        const appointmentType = (record.appointment_type || "").toLowerCase();
        const recordText = record.clinical_record
          ? `${record.clinical_record.subjective || ''} ${record.clinical_record.objective || ''} ${record.clinical_record.assessment || ''} ${record.clinical_record.plan || ''} ${record.clinical_record.plan_soap || ''}`.toLowerCase()
          : '';
        
        return patientName.includes(search) || 
               appointmentType.includes(search) || 
               recordText.includes(search);
      });
    }
    
    setFilteredRecords(filtered);
  };

  const handleViewDetails = async (record: ClinicalRecordItem) => {
    // If record exists, load full details
    if (record.clinical_record?.id) {
      try {
        const fullRecord = await api.get<ClinicalRecord>(
          `/api/v1/appointments/${record.appointment_id}/clinical-record`
        );
        setSelectedRecord({
          ...record,
          clinical_record: fullRecord,
        });
      } catch (error: any) {
        console.error("Failed to load record details:", error);
        setSelectedRecord(record);
      }
    } else {
      setSelectedRecord(record);
    }
    setShowDetails(true);
  };

  const handleEdit = (record: ClinicalRecordItem) => {
    if (record.clinical_record) {
      setEditingRecord({ ...record.clinical_record });
    } else {
      setEditingRecord({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        plan_soap: "",
        prescriptions: [],
        exam_requests: [],
        diagnoses: [],
      });
    }
    setSelectedRecord(record);
    setShowEditDialog(true);
  };

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;

    try {
      setSaving(true);
      const recordData = {
        subjective: editingRecord?.subjective || null,
        objective: editingRecord?.objective || null,
        assessment: editingRecord?.assessment || null,
        plan: editingRecord?.plan || null,
        plan_soap: editingRecord?.plan_soap || null,
      };

      await api.post(
        `/api/v1/appointments/${selectedRecord.appointment_id}/clinical-record`,
        recordData
      );

      toast.success("Prontuário salvo com sucesso!");
      await loadRecords();
      setShowEditDialog(false);
      setEditingRecord(null);
      setSelectedRecord(null);
    } catch (error: any) {
      console.error("Failed to save record:", error);
      toast.error("Erro ao salvar prontuário", {
        description: error?.message || error?.detail || "Não foi possível salvar o prontuário",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (hasRecord: boolean) => {
    if (hasRecord) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Finalizado</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
  };

  const getRecordPreview = (record: ClinicalRecord | null) => {
    if (!record) {
      return "Aguardando preenchimento do prontuário";
    }
    
    const parts = [];
    if (record.assessment) parts.push(`Avaliação: ${record.assessment.substring(0, 80)}${record.assessment.length > 80 ? '...' : ''}`);
    if (record.plan_soap) parts.push(`Plano: ${record.plan_soap.substring(0, 80)}${record.plan_soap.length > 80 ? '...' : ''}`);
    if (record.plan) parts.push(`Plano: ${record.plan.substring(0, 80)}${record.plan.length > 80 ? '...' : ''}`);
    if (record.subjective) parts.push(`Subjetivo: ${record.subjective.substring(0, 60)}${record.subjective.length > 60 ? '...' : ''}`);
    
    return parts.length > 0 ? parts.join(" • ") : "Prontuário sem descrição";
  };

  const getStats = () => {
    const total = records.length;
    const completed = records.filter(r => r.clinical_record !== null).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
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
            <FileText className="h-8 w-8 text-green-600" />
            Prontuários Médicos
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie o histórico de prontuários dos seus pacientes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecords}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Consultas realizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Prontuários Finalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% de conclusão
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Prontuários Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Aguardando preenchimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente, tipo ou conteúdo do prontuário..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Finalizados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="last3months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {dateFilter === "custom" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={selectedDateRange.start}
                  onChange={(e) => setSelectedDateRange({ ...selectedDateRange, start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={selectedDateRange.end}
                  onChange={(e) => setSelectedDateRange({ ...selectedDateRange, end: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prontuários</CardTitle>
              <CardDescription>
                {filteredRecords.length} {filteredRecords.length === 1 ? "prontuário encontrado" : "prontuários encontrados"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const patientName = record.patient_name || "Paciente";
                    const hasRecord = record.clinical_record !== null;
                    
                    return (
                      <TableRow key={record.appointment_id} className={hasRecord ? '' : 'bg-yellow-50'}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{formatDate(record.appointment_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-gray-400" />
                            {record.appointment_type || "Consulta"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate text-sm" title={getRecordPreview(record.clinical_record)}>
                            {getRecordPreview(record.clinical_record)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(hasRecord)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(record)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {hasRecord ? "Editar" : "Criar"}
                            </Button>
                            <Link href={`/medico/atendimento/${record.appointment_id}`}>
                              <Button variant="ghost" size="sm">
                                <FileCheck className="h-4 w-4 mr-2" />
                                Atender
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "Nenhum prontuário encontrado com os filtros aplicados"
                  : "Nenhum prontuário encontrado"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "Tente ajustar os filtros ou limpar a busca"
                  : "Seus prontuários aparecerão aqui quando houver consultas"}
              </p>
              {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Prontuário</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  {selectedRecord.patient_name} • {formatDateTime(selectedRecord.appointment_date)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {selectedRecord.clinical_record ? (
                <Tabs defaultValue="soap" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="soap">SOAP</TabsTrigger>
                    <TabsTrigger value="prescriptions">
                      Prescrições ({selectedRecord.clinical_record.prescriptions?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="exams">
                      Exames ({selectedRecord.clinical_record.exam_requests?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="diagnoses">
                      Diagnósticos ({selectedRecord.clinical_record.diagnoses?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="soap" className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Subjetivo</Label>
                      <div className="p-4 bg-gray-50 rounded-lg border min-h-[100px]">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedRecord.clinical_record.subjective || (
                            <span className="text-gray-400 italic">Não informado</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Objetivo</Label>
                      <div className="p-4 bg-gray-50 rounded-lg border min-h-[100px]">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedRecord.clinical_record.objective || (
                            <span className="text-gray-400 italic">Não informado</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Avaliação</Label>
                      <div className="p-4 bg-blue-50 rounded-lg border min-h-[100px]">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedRecord.clinical_record.assessment || (
                            <span className="text-gray-400 italic">Não informado</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Plano</Label>
                      <div className="p-4 bg-green-50 rounded-lg border min-h-[100px]">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedRecord.clinical_record.plan_soap || selectedRecord.clinical_record.plan || (
                            <span className="text-gray-400 italic">Não informado</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="prescriptions" className="space-y-4">
                    {selectedRecord.clinical_record.prescriptions && selectedRecord.clinical_record.prescriptions.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRecord.clinical_record.prescriptions.map((presc: Prescription, idx: number) => (
                          <Card key={idx} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Pill className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold">{presc.medication_name}</span>
                                    {presc.is_active === false && (
                                      <Badge variant="outline" className="text-xs">Inativo</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div><strong>Dosagem:</strong> {presc.dosage}</div>
                                    <div><strong>Frequência:</strong> {presc.frequency}</div>
                                    {presc.duration && (
                                      <div><strong>Duração:</strong> {presc.duration}</div>
                                    )}
                                    {presc.instructions && (
                                      <div><strong>Instruções:</strong> {presc.instructions}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma prescrição registrada</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="exams" className="space-y-4">
                    {selectedRecord.clinical_record.exam_requests && selectedRecord.clinical_record.exam_requests.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRecord.clinical_record.exam_requests.map((exam: ExamRequest, idx: number) => (
                          <Card key={idx} className={`border-l-4 ${
                            exam.urgency === "urgent" ? "border-l-orange-500" :
                            exam.urgency === "emergency" ? "border-l-red-500" :
                            "border-l-green-500"
                          }`}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TestTube className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold">{exam.exam_type}</span>
                                    {exam.completed && (
                                      <Badge className="bg-green-100 text-green-800">Concluído</Badge>
                                    )}
                                    {exam.urgency && (
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {exam.urgency === "urgent" ? "Urgente" :
                                         exam.urgency === "emergency" ? "Emergência" :
                                         "Rotina"}
                                      </Badge>
                                    )}
                                  </div>
                                  {exam.description && (
                                    <div className="text-sm text-gray-600 mb-1">
                                      <strong>Descrição:</strong> {exam.description}
                                    </div>
                                  )}
                                  {exam.reason && (
                                    <div className="text-sm text-gray-600">
                                      <strong>Indicação:</strong> {exam.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum exame solicitado</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="diagnoses" className="space-y-4">
                    {selectedRecord.clinical_record.diagnoses && selectedRecord.clinical_record.diagnoses.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRecord.clinical_record.diagnoses.map((diag: Diagnosis, idx: number) => (
                          <Card key={idx} className="border-l-4 border-l-purple-500">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileCheck className="h-4 w-4 text-purple-600" />
                                    <span className="font-semibold">{diag.cid_code}</span>
                                    {diag.type && (
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {diag.type === "primary" ? "Principal" : "Secundário"}
                                      </Badge>
                                    )}
                                  </div>
                                  {diag.description && (
                                    <div className="text-sm text-gray-600">
                                      {diag.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum diagnóstico registrado</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Prontuário ainda não foi preenchido</p>
                  <p className="text-sm mt-2">
                    Este agendamento ainda não possui prontuário médico associado.
                  </p>
                  <div className="mt-6 flex gap-3 justify-center">
                    <Button onClick={() => {
                      setShowDetails(false);
                      handleEdit(selectedRecord);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Prontuário
                    </Button>
                    <Link href={`/medico/atendimento/${selectedRecord.appointment_id}`}>
                      <Button variant="outline">
                        <FileCheck className="h-4 w-4 mr-2" />
                        Ir para Atendimento
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
            {selectedRecord && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedRecord);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {selectedRecord.clinical_record ? "Editar" : "Criar"}
                </Button>
                <Link href={`/medico/atendimento/${selectedRecord.appointment_id}`}>
                  <Button>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Atender
                  </Button>
                </Link>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord?.clinical_record ? "Editar Prontuário" : "Criar Prontuário"}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  {selectedRecord.patient_name} • {formatDateTime(selectedRecord.appointment_date)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="subjective">Subjetivo</Label>
                <Textarea
                  id="subjective"
                  placeholder="Queixas e sintomas relatados pelo paciente..."
                  value={editingRecord.subjective || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subjective: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="objective">Objetivo</Label>
                <Textarea
                  id="objective"
                  placeholder="Achados do exame físico, sinais vitais..."
                  value={editingRecord.objective || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, objective: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="assessment">Avaliação</Label>
                <Textarea
                  id="assessment"
                  placeholder="Diagnóstico ou impressão clínica..."
                  value={editingRecord.assessment || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, assessment: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="plan_soap">Plano</Label>
                <Textarea
                  id="plan_soap"
                  placeholder="Plano de tratamento, orientações, próximos passos..."
                  value={editingRecord.plan_soap || editingRecord.plan || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, plan_soap: e.target.value, plan: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Nota:</p>
                    <p>Para adicionar prescrições, exames e diagnósticos, acesse a página de atendimento da consulta.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingRecord(null);
                setSelectedRecord(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveRecord} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
