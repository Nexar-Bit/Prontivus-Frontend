"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, FlaskConical, Calendar, User, CheckCircle2, Clock } from "lucide-react";
import SecretariaBulkUpload from "@/components/files/SecretariaBulkUpload";

interface ExamRequest {
  id: number;
  clinical_record_id: number;
  exam_type: string;
  description: string | null;
  reason: string | null;
  urgency: string;
  requested_date: string;
  completed: boolean;
  completed_date: string | null;
}

export default function SecretariaExamesPage() {
  const [loading, setLoading] = useState(false);
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed" | "all">("pending");
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState<ExamRequest | null>(null);
  const [resultDescription, setResultDescription] = useState("");
  const [savingResult, setSavingResult] = useState(false);

  const loadExamRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status_filter", statusFilter);
      }
      const data = await api.get<ExamRequest[]>(
        `/api/v1/clinical/exam-requests?${params.toString()}`
      );
      setExamRequests(data);
    } catch (error: any) {
      console.error("Failed to load exam requests:", error);
      toast.error("Erro ao carregar exames", {
        description:
          error?.message ||
          error?.detail ||
          "Não foi possível carregar a lista de exames",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleOpenResultForm = (exam: ExamRequest) => {
    setSelectedExam(exam);
    setResultDescription(exam.description || "");
  };

  const handleSaveResult = async () => {
    if (!selectedExam) return;

    try {
      setSavingResult(true);
      await api.put(`/api/v1/clinical/exam-requests/${selectedExam.id}/result`, {
        description: resultDescription || null,
        completed: true,
      });
      toast.success("Resultado do exame registrado com sucesso!");
      setSelectedExam(null);
      setResultDescription("");
      await loadExamRequests();
    } catch (error: any) {
      console.error("Failed to save exam result:", error);
      toast.error("Erro ao salvar resultado", {
        description:
          error?.message ||
          error?.detail ||
          "Não foi possível salvar o resultado do exame",
      });
    } finally {
      setSavingResult(false);
    }
  };

  const filteredExams = examRequests.filter((exam) => {
    if (!search.trim()) return true;
    const value = search.toLowerCase();
    return (
      exam.exam_type.toLowerCase().includes(value) ||
      (exam.description || "").toLowerCase().includes(value) ||
      (exam.reason || "").toLowerCase().includes(value)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-cyan-600" />
            Exames
          </h1>
          <p className="text-gray-600 mt-1">
            Registrar resultados de exames e enviar arquivos em lote.
          </p>
        </div>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Resultados de Exames</TabsTrigger>
          <TabsTrigger value="upload">Envio em Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Fila de Exames</CardTitle>
                <CardDescription>
                  Exames solicitados para os pacientes da clínica.
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="flex rounded-md border bg-white">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("pending")}
                    className={`px-3 py-1 text-sm rounded-l-md ${
                      statusFilter === "pending"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={`px-3 py-1 text-sm ${
                      statusFilter === "completed"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Concluídos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 text-sm rounded-r-md ${
                      statusFilter === "all"
                        ? "bg-cyan-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Todos
                  </button>
                </div>
                <Input
                  placeholder="Buscar por exame, motivo ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-72"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando exames...
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  Nenhum exame encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exame</TableHead>
                        <TableHead>Data Solicitação</TableHead>
                        <TableHead>Urgência</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">
                            {exam.exam_type}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {exam.requested_date
                                ? format(parseISO(exam.requested_date), "dd/MM/yyyy HH:mm", {
                                    locale: ptBR,
                                  })
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {exam.urgency === "EMERGENCY"
                                ? "Emergência"
                                : exam.urgency === "URGENT"
                                ? "Urgente"
                                : "Rotina"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exam.completed ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Concluído
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenResultForm(exam)}
                            >
                              {exam.completed ? "Editar Resultado" : "Registrar Resultado"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedExam && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado do Exame</CardTitle>
                <CardDescription>
                  {selectedExam.exam_type} •{" "}
                  {selectedExam.requested_date
                    ? format(parseISO(selectedExam.requested_date), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })
                    : "-"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Exame</Label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {selectedExam.exam_type}
                    </p>
                  </div>
                  <div>
                    <Label>Urgência</Label>
                    <p className="mt-1 text-sm text-gray-700">
                      {selectedExam.urgency === "EMERGENCY"
                        ? "Emergência"
                        : selectedExam.urgency === "URGENT"
                        ? "Urgente"
                        : "Rotina"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="result_description">Resultado / Laudo</Label>
                  <Textarea
                    id="result_description"
                    value={resultDescription}
                    onChange={(e) => setResultDescription(e.target.value)}
                    rows={5}
                    placeholder="Descreva o resultado do exame ou cole o laudo do laboratório..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setSelectedExam(null);
                      setResultDescription("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveResult}
                    disabled={savingResult}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {savingResult ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Resultado"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Envio em Lote de Exames</CardTitle>
              <CardDescription>
                Faça upload de arquivos de exames em lote para anexar aos pacientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecretariaBulkUpload />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

