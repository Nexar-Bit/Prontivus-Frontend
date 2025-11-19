"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { ExamRequest, ExamRequestCreate, UrgencyLevel } from "@/lib/types";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ExamRequestsFormProps {
  examRequests: ExamRequest[];
  clinicalRecordId?: number;
  onAdd: (data: Omit<ExamRequestCreate, "clinical_record_id">) => Promise<void>;
  onDelete: (examRequestId: number) => Promise<void>;
}

export function ExamRequestsForm({
  examRequests,
  clinicalRecordId,
  onAdd,
  onDelete,
}: ExamRequestsFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newExam, setNewExam] = useState({
    exam_type: "",
    description: "",
    reason: "",
    urgency: UrgencyLevel.ROUTINE as UrgencyLevel,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [examRequestToDelete, setExamRequestToDelete] = useState<number | null>(null);

  const handleAdd = async () => {
    if (!newExam.exam_type.trim()) {
      toast.error("O tipo de exame é obrigatório");
      return;
    }

    if (!clinicalRecordId) {
      toast.error("Salve o prontuário SOAP primeiro");
      return;
    }

    try {
      await onAdd(newExam);
      setNewExam({
        exam_type: "",
        description: "",
        reason: "",
        urgency: UrgencyLevel.ROUTINE,
      });
      setIsAdding(false);
      toast.success("Exame solicitado com sucesso");
    } catch (error: any) {
      toast.error("Erro ao solicitar exame", {
        description: error.message,
      });
    }
  };

  const handleDelete = (examRequestId: number) => {
    setExamRequestToDelete(examRequestId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!examRequestToDelete) return;

    try {
      await onDelete(examRequestToDelete);
      toast.success("Solicitação excluída");
      setExamRequestToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao excluir solicitação", {
        description: error.message,
      });
    }
  };

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case UrgencyLevel.EMERGENCY:
        return <Badge variant="destructive">Emergência</Badge>;
      case UrgencyLevel.URGENT:
        return <Badge className="bg-orange-500">Urgente</Badge>;
      case UrgencyLevel.ROUTINE:
        return <Badge variant="secondary">Rotina</Badge>;
      default:
        return <Badge variant="secondary">Rotina</Badge>;
    }
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Solicitar Exames
        </CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Solicitar Exame
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {examRequests.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum exame solicitado
          </p>
        )}

        {examRequests.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Exame</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examRequests.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.exam_type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {exam.description || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {exam.reason || "-"}
                  </TableCell>
                  <TableCell>{getUrgencyBadge(exam.urgency)}</TableCell>
                  <TableCell>
                    {exam.is_completed ? (
                      <Badge variant="outline" className="bg-green-50">
                        Realizado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {isAdding && (
          <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold">Nova Solicitação de Exame</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_type">
                  Tipo de Exame <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="exam_type"
                  value={newExam.exam_type}
                  onChange={(e) =>
                    setNewExam({
                      ...newExam,
                      exam_type: e.target.value,
                    })
                  }
                  placeholder="Ex: Hemograma completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgência</Label>
                <Select
                  value={newExam.urgency}
                  onValueChange={(value: UrgencyLevel) =>
                    setNewExam({ ...newExam, urgency: value })
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
                value={newExam.description}
                onChange={(e) =>
                  setNewExam({
                    ...newExam,
                    description: e.target.value,
                  })
                }
                placeholder="Detalhes adicionais sobre o exame"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Solicitação</Label>
              <Textarea
                id="reason"
                value={newExam.reason}
                onChange={(e) =>
                  setNewExam({
                    ...newExam,
                    reason: e.target.value,
                  })
                }
                placeholder="Por que este exame está sendo solicitado?"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Solicitar</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewExam({
                    exam_type: "",
                    description: "",
                    reason: "",
                    urgency: UrgencyLevel.ROUTINE,
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Solicitação de Exame"
        description="Deseja realmente excluir esta solicitação de exame? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  );
}

