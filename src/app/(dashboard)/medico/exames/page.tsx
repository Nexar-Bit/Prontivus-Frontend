"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Upload, ListFilter } from "lucide-react";
import PatientUpload from "@/components/files/PatientUpload";
import FileBrowser from "@/components/files/FileBrowser";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { examRequestsApi } from "@/lib/clinical-api";
import type { ExamRequest } from "@/lib/types";

export default function MedicoExamesPage() {
  const [patientId, setPatientId] = useState<number | ''>('' as any);
  const [examType, setExamType] = useState<string>("all");
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [recordId, setRecordId] = useState<number | ''>('' as any);
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [loadingReq, setLoadingReq] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<ExamRequest | null>(null);
  const [form, setForm] = useState<Partial<ExamRequest>>({ exam_type: "", description: "", reason: "", urgency: "ROUTINE" } as any);

  useEffect(() => {
    if (recordId) loadExamRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const loadExamRequests = async () => {
    try {
      setLoadingReq(true);
      const data = await examRequestsApi.getByClinicalRecord(Number(recordId));
      setExamRequests(data as any);
    } catch (e) {
      toast.error("Falha ao carregar solicitações de exame");
    } finally {
      setLoadingReq(false);
    }
  };

  const openCreate = () => {
    setForm({ exam_type: "", description: "", reason: "", urgency: "ROUTINE" } as any);
    setIsCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      if (!recordId) return;
      const { exam_type, description, reason, urgency } = form as any;
      if (!exam_type) { toast.error("Informe o tipo de exame"); return; }
      await examRequestsApi.create(Number(recordId), { exam_type, description, reason, urgency } as any);
      setIsCreateOpen(false);
      await loadExamRequests();
      toast.success("Solicitação criada");
    } catch (e:any) {
      toast.error("Erro ao criar solicitação", { description: e?.message });
    }
  };

  const openEdit = (req: ExamRequest) => {
    setEditing(req);
    setForm({ exam_type: req.exam_type as any, description: req.description || "", reason: req.reason || "", urgency: req.urgency as any } as any);
    setIsEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      const { exam_type, description, reason, urgency } = form as any;
      await examRequestsApi.update(editing.id, { exam_type, description, reason, urgency } as any);
      setIsEditOpen(false);
      setEditing(null);
      await loadExamRequests();
      toast.success("Solicitação atualizada");
    } catch (e:any) {
      toast.error("Erro ao atualizar", { description: e?.message });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir esta solicitação?")) return;
    try {
      await examRequestsApi.delete(id);
      await loadExamRequests();
      toast.success("Excluída");
    } catch (e:any) {
      toast.error("Erro ao excluir", { description: e?.message });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exames do Paciente</h1>
          <p className="text-sm text-muted-foreground">Faça upload de exames, filtre e visualize documentos (imagens e PDFs).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/secretaria/exames">
            <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2"/>Envio em Lote</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <Label>Paciente (ID)</Label>
            <Input
              type="number"
              placeholder="ID do paciente"
              value={patientId as any}
              onChange={(e) => setPatientId(e.target.value ? parseInt(e.target.value) : '' as any)}
              className="w-48"
            />
          </div>
          <div>
            <Label>Prontuário (ID) para solicitações</Label>
            <Input
              type="number"
              placeholder="ID do prontuário clínico"
              value={recordId as any}
              onChange={(e) => setRecordId(e.target.value ? parseInt(e.target.value) : '' as any)}
              className="w-56"
            />
          </div>
          <div>
            <Label>Tipo de Exame</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de exame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Laboratorial">Laboratorial</SelectItem>
                <SelectItem value="Imagem">Imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setRefreshTick((t) => t + 1)}>
            <RefreshCw className="h-4 w-4 mr-2"/>Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={loadExamRequests} disabled={!recordId || loadingReq}>
            {loadingReq ? 'Carregando...' : 'Recarregar solicitações'}
          </Button>
          <Button size="sm" onClick={openCreate} disabled={!recordId}>Nova Solicitação</Button>
        </CardContent>
      </Card>

      {patientId ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enviar novo exame</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientUpload patientId={patientId as number} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* FileBrowser already includes exam type filter; we pass patient only. */}
              <FileBrowser key={`${patientId}-${examType}-${refreshTick}`} patientId={patientId as number} />
            </CardContent>
          </Card>

          {recordId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Solicitações de Exame do prontuário #{recordId}</CardTitle>
              </CardHeader>
              <CardContent>
                {examRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Urgência</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.exam_type}</TableCell>
                          <TableCell>{r.reason || '-'}</TableCell>
                          <TableCell>{r.urgency}</TableCell>
                          <TableCell>{r.description || '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(r)}>Editar</Button>
                            <Button variant="outline" size="sm" onClick={() => remove(r.id)} className="text-destructive">Excluir</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <ListFilter className="h-4 w-4"/> Informe um paciente para visualizar e enviar arquivos.
        </div>
      )}

      {/* Create Exam Request Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Exame</DialogTitle>
            <DialogDescription>Adicionar solicitação ao prontuário selecionado</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Tipo de Exame</Label>
              <Input value={(form as any).exam_type || ''} onChange={(e) => setForm({ ...form, exam_type: e.target.value } as any)} />
            </div>
            <div>
              <Label>Urgência</Label>
              <Select value={(form as any).urgency || 'ROUTINE'} onValueChange={(v) => setForm({ ...form, urgency: v } as any)}>
                <SelectTrigger><SelectValue placeholder="Urgência" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Rotina</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="EMERGENCY">Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={(form as any).reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value } as any)} />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Input value={(form as any).description || ''} onChange={(e) => setForm({ ...form, description: e.target.value } as any)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={submitCreate}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Exam Request Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Solicitação de Exame</DialogTitle>
            <DialogDescription>Atualize os dados da solicitação</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Tipo de Exame</Label>
              <Input value={(form as any).exam_type || ''} onChange={(e) => setForm({ ...form, exam_type: e.target.value } as any)} />
            </div>
            <div>
              <Label>Urgência</Label>
              <Select value={(form as any).urgency || 'ROUTINE'} onValueChange={(v) => setForm({ ...form, urgency: v } as any)}>
                <SelectTrigger><SelectValue placeholder="Urgência" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Rotina</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="EMERGENCY">Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={(form as any).reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value } as any)} />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Input value={(form as any).description || ''} onChange={(e) => setForm({ ...form, description: e.target.value } as any)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={submitEdit}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


