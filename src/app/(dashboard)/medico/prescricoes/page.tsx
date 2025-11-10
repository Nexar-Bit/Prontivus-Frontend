"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { prescriptionsApi } from "@/lib/clinical-api";
import type { Prescription } from "@/lib/types";
import { 
  Pill, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  FileText,
  AlertCircle,
  ArrowRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MedicoPrescricoesPage() {
  const [recordId, setRecordId] = useState<number | ''>('' as any);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<Prescription>>({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordId) loadPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prescriptionsApi.getByClinicalRecord(Number(recordId));
      setPrescriptions(data);
    } catch (e: any) {
      const errorMsg = e?.message || "Falha ao carregar prescrições";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ medication_name: "", dosage: "", frequency: "", duration: "", instructions: "" });
    setError(null);
    setIsCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      if (!recordId) return;
      const { medication_name, dosage, frequency, duration, instructions } = form;
      if (!medication_name || medication_name.trim() === "") { 
        setError("O nome do medicamento é obrigatório");
        return;
      }
      setSubmitting(true);
      setError(null);
      await prescriptionsApi.create(Number(recordId), {
        medication_name: medication_name.trim(),
        dosage: dosage?.trim() || undefined,
        frequency: frequency?.trim() || undefined,
        duration: duration?.trim() || undefined,
        instructions: instructions?.trim() || undefined,
      } as any);
      setIsCreateOpen(false);
      await loadPrescriptions();
      toast.success("Prescrição adicionada com sucesso");
    } catch (e: any) {
      const errorMsg = e?.message || "Erro ao criar prescrição";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (p: Prescription) => {
    setEditing(p);
    setForm({
      medication_name: p.medication_name,
      dosage: p.dosage || "",
      frequency: p.frequency || "",
      duration: p.duration || "",
      instructions: p.instructions || "",
    });
    setError(null);
    setIsEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      const { medication_name, dosage, frequency, duration, instructions } = form;
      if (!medication_name || medication_name.trim() === "") {
        setError("O nome do medicamento é obrigatório");
        return;
      }
      setSubmitting(true);
      setError(null);
      await prescriptionsApi.update(editing.id, {
        medication_name: medication_name.trim(),
        dosage: dosage?.trim() || undefined,
        frequency: frequency?.trim() || undefined,
        duration: duration?.trim() || undefined,
        instructions: instructions?.trim() || undefined,
      } as any);
      setIsEditOpen(false);
      setEditing(null);
      await loadPrescriptions();
      toast.success("Prescrição atualizada com sucesso");
    } catch (e: any) {
      const errorMsg = e?.message || "Erro ao atualizar prescrição";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta prescrição?")) return;
    try {
      await prescriptionsApi.delete(id);
      await loadPrescriptions();
      toast.success("Prescrição excluída com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao excluir prescrição");
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Pill className="h-7 w-7 text-blue-600" />
          </div>
          Prescrições
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Gerencie as prescrições médicas vinculadas aos prontuários
        </p>
      </div>

      {/* Search Card */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-600">Buscar Prescrições</CardTitle>
              <CardDescription className="mt-1">
                Digite o ID do prontuário clínico para visualizar e gerenciar prescrições
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="recordId" className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                ID do Prontuário Clínico
              </Label>
              <Input
                id="recordId"
                type="number"
                placeholder="Ex: 123"
                value={recordId as any}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : '' as any;
                  setRecordId(value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && recordId) {
                    loadPrescriptions();
                  }
                }}
                className="text-lg"
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={loadPrescriptions} 
                disabled={!recordId || loading}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                {loading ? 'Carregando...' : 'Carregar'}
              </Button>
              <Button 
                onClick={openCreate} 
                disabled={!recordId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Prescrição
              </Button>
            </div>
          </div>
          {recordId && (
            <div className="flex items-center gap-2">
              <Link 
                href={`/medico/prontuario/${recordId}`}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Ver prontuário completo
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      {recordId && (
        <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Pill className="h-5 w-5" />
                  </div>
                  Prescrições do Prontuário #{recordId}
                </CardTitle>
                <CardDescription className="mt-1">
                  {prescriptions.length === 0 
                    ? "Nenhuma prescrição encontrada para este prontuário"
                    : `${prescriptions.length} prescrição(ões) encontrada(s)`
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 font-medium">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={loadPrescriptions}
                  className="mt-4 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">Nenhuma prescrição encontrada</p>
                <p className="text-sm">Clique em "Nova Prescrição" para adicionar uma prescrição a este prontuário.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/50">
                      <TableHead className="font-semibold">Medicamento</TableHead>
                      <TableHead className="font-semibold">Dosagem</TableHead>
                      <TableHead className="font-semibold">Frequência</TableHead>
                      <TableHead className="font-semibold">Duração</TableHead>
                      <TableHead className="font-semibold">Instruções</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((p, index) => (
                      <TableRow 
                        key={p.id}
                        className={cn(
                          "hover:bg-blue-50/30 transition-colors",
                          index % 2 === 0 && "bg-white",
                          index % 2 === 1 && "bg-blue-50/10"
                        )}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            {p.medication_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.dosage ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {p.dosage}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.frequency ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {p.frequency}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.duration ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              {p.duration}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {p.instructions ? (
                            <p className="text-sm line-clamp-2">{p.instructions}</p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEdit(p)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => remove(p.id)}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Nova Prescrição
            </DialogTitle>
            <DialogDescription>
              Adicionar uma nova prescrição ao prontuário #{recordId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="create-medication" className="text-sm font-medium">
                  Medicamento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-medication"
                  value={form.medication_name as any}
                  onChange={(e) => {
                    setForm({ ...form, medication_name: e.target.value });
                    setError(null);
                  }}
                  placeholder="Nome do medicamento"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="create-dosage" className="text-sm font-medium">Dosagem</Label>
                <Input
                  id="create-dosage"
                  value={form.dosage as any}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="Ex: 500mg"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="create-frequency" className="text-sm font-medium">Frequência</Label>
                <Input
                  id="create-frequency"
                  value={form.frequency as any}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  placeholder="Ex: 3x ao dia"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="create-duration" className="text-sm font-medium">Duração</Label>
                <Input
                  id="create-duration"
                  value={form.duration as any}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="Ex: 7 dias"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="create-instructions" className="text-sm font-medium">Instruções</Label>
                <Textarea
                  id="create-instructions"
                  value={form.instructions as any}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Instruções adicionais para o paciente"
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitCreate} 
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar Prescrição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Prescrição
            </DialogTitle>
            <DialogDescription>
              Atualize os dados da prescrição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-medication" className="text-sm font-medium">
                  Medicamento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-medication"
                  value={form.medication_name as any}
                  onChange={(e) => {
                    setForm({ ...form, medication_name: e.target.value });
                    setError(null);
                  }}
                  placeholder="Nome do medicamento"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-dosage" className="text-sm font-medium">Dosagem</Label>
                <Input
                  id="edit-dosage"
                  value={form.dosage as any}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="Ex: 500mg"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-frequency" className="text-sm font-medium">Frequência</Label>
                <Input
                  id="edit-frequency"
                  value={form.frequency as any}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  placeholder="Ex: 3x ao dia"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-duration" className="text-sm font-medium">Duração</Label>
                <Input
                  id="edit-duration"
                  value={form.duration as any}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="Ex: 7 dias"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-instructions" className="text-sm font-medium">Instruções</Label>
                <Textarea
                  id="edit-instructions"
                  value={form.instructions as any}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Instruções adicionais para o paciente"
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitEdit} 
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
