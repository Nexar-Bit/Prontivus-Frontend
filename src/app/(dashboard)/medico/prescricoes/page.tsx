"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { prescriptionsApi } from "@/lib/clinical-api";
import type { Prescription } from "@/lib/types";

export default function MedicoPrescricoesPage() {
  const [recordId, setRecordId] = useState<number | ''>('' as any);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [form, setForm] = useState<Partial<Prescription>>({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  useEffect(() => {
    if (recordId) loadPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await prescriptionsApi.getByClinicalRecord(Number(recordId));
      setPrescriptions(data);
    } catch (e) {
      toast.error("Falha ao carregar prescrições");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ medication_name: "", dosage: "", frequency: "", duration: "", instructions: "" });
    setIsCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      if (!recordId) return;
      const { medication_name, dosage, frequency, duration, instructions } = form;
      if (!medication_name) { toast.error("Informe o medicamento"); return; }
      await prescriptionsApi.create(Number(recordId), {
        medication_name: medication_name!,
        dosage: dosage || undefined,
        frequency: frequency || undefined,
        duration: duration || undefined,
        instructions: instructions || undefined,
      } as any);
      setIsCreateOpen(false);
      await loadPrescriptions();
      toast.success("Prescrição adicionada");
    } catch (e:any) {
      toast.error("Erro ao criar prescrição", { description: e?.message });
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
    setIsEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      const { medication_name, dosage, frequency, duration, instructions } = form;
      await prescriptionsApi.update(editing.id, {
        medication_name,
        dosage,
        frequency,
        duration,
        instructions,
      } as any);
      setIsEditOpen(false);
      setEditing(null);
      await loadPrescriptions();
      toast.success("Prescrição atualizada");
    } catch (e:any) {
      toast.error("Erro ao atualizar", { description: e?.message });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir esta prescrição?")) return;
    try {
      await prescriptionsApi.delete(id);
      await loadPrescriptions();
      toast.success("Excluída");
    } catch (e:any) {
      toast.error("Erro ao excluir", { description: e?.message });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prescrições</h1>
        <p className="text-sm text-muted-foreground">Acesse as prescrições vinculadas ao prontuário</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Abrir prescrições por prontuário</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label>ID do Prontuário</Label>
            <Input
              type="number"
              placeholder="ID do prontuário clínico"
              value={recordId as any}
              onChange={(e) => setRecordId(e.target.value ? parseInt(e.target.value) : '' as any)}
              className="w-56"
            />
          </div>
          <Link href={recordId ? `/medico/prontuario/${recordId}` : '#'}>
            <Button disabled={!recordId}>Abrir</Button>
          </Link>
          <Button variant="outline" onClick={loadPrescriptions} disabled={!recordId || loading}>
            {loading ? 'Carregando...' : 'Recarregar'}
          </Button>
          <Button onClick={openCreate} disabled={!recordId}>Nova Prescrição</Button>
        </CardContent>
      </Card>

      {/* Prescriptions table */}
      {recordId && (
        <Card>
          <CardHeader>
            <CardTitle>Prescrições do prontuário #{recordId}</CardTitle>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma prescrição encontrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosagem</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Instruções</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.medication_name}</TableCell>
                      <TableCell>{p.dosage || '-'}</TableCell>
                      <TableCell>{p.frequency || '-'}</TableCell>
                      <TableCell>{p.duration || '-'}</TableCell>
                      <TableCell>{p.instructions || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                        <Button variant="outline" size="sm" onClick={() => remove(p.id)} className="text-destructive">Excluir</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Prescrição</DialogTitle>
            <DialogDescription>Adicionar uma nova prescrição ao prontuário</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Medicamento</Label>
              <Input value={form.medication_name as any} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} />
            </div>
            <div>
              <Label>Dosagem</Label>
              <Input value={form.dosage as any} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
            </div>
            <div>
              <Label>Frequência</Label>
              <Input value={form.frequency as any} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
            </div>
            <div>
              <Label>Duração</Label>
              <Input value={form.duration as any} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Instruções</Label>
              <Input value={form.instructions as any} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={submitCreate}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Prescrição</DialogTitle>
            <DialogDescription>Atualize os dados da prescrição</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Medicamento</Label>
              <Input value={form.medication_name as any} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} />
            </div>
            <div>
              <Label>Dosagem</Label>
              <Input value={form.dosage as any} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
            </div>
            <div>
              <Label>Frequência</Label>
              <Input value={form.frequency as any} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
            </div>
            <div>
              <Label>Duração</Label>
              <Input value={form.duration as any} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Instruções</Label>
              <Input value={form.instructions as any} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
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


