"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pill } from "lucide-react";
import { Prescription, PrescriptionCreate } from "@/lib/types";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

interface PrescriptionsFormProps {
  prescriptions: Prescription[];
  clinicalRecordId?: number;
  onAdd: (data: Omit<PrescriptionCreate, "clinical_record_id">) => Promise<void>;
  onDelete: (prescriptionId: number) => Promise<void>;
}

type MedicationProduct = {
  id: number;
  name: string;
  unit_of_measure?: string | null;
  current_stock?: number | null;
};

export function PrescriptionsForm({
  prescriptions,
  clinicalRecordId,
  onAdd,
  onDelete,
}: PrescriptionsFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [medications, setMedications] = useState<MedicationProduct[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null);

  // Load medication list from inventory (stock products)
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setIsLoadingMedications(true);
        // Only medications, active, ordered by name (handled by backend)
        const products = await api.get<MedicationProduct[]>(
          "/api/v1/stock/products?category=medication&is_active=true"
        );
        setMedications(products || []);
      } catch (error: any) {
        console.error("Erro ao carregar medicamentos do estoque:", error);
        toast.error("Erro ao carregar lista de medicamentos", {
          description:
            error?.message ||
            error?.detail ||
            "Não foi possível carregar os medicamentos do estoque.",
        });
      } finally {
        setIsLoadingMedications(false);
      }
    };

    fetchMedications();
  }, []);

  const handleAdd = async () => {
    if (!newPrescription.medication_name.trim()) {
      toast.error("O nome do medicamento é obrigatório");
      return;
    }

    if (!clinicalRecordId) {
      toast.error("Salve o prontuário SOAP primeiro");
      return;
    }

    try {
      await onAdd(newPrescription);
      setNewPrescription({
        medication_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });
      setIsAdding(false);
      toast.success("Prescrição adicionada com sucesso");
    } catch (error: any) {
      toast.error("Erro ao adicionar prescrição", {
        description: error.message,
      });
    }
  };

  const handleDelete = (prescriptionId: number) => {
    setPrescriptionToDelete(prescriptionId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!prescriptionToDelete) return;

    try {
      await onDelete(prescriptionToDelete);
      toast.success("Prescrição excluída");
      setPrescriptionToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao excluir prescrição", {
        description: error.message,
      });
    }
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Prescrições
        </CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Medicamento
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma prescrição adicionada
          </p>
        )}

        {prescriptions.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Dosagem</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Instruções</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell className="font-medium">
                    {prescription.medication_name}
                  </TableCell>
                  <TableCell>{prescription.dosage || "-"}</TableCell>
                  <TableCell>{prescription.frequency || "-"}</TableCell>
                  <TableCell>{prescription.duration || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {prescription.instructions || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(prescription.id)}
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
            <h4 className="font-semibold">Nova Prescrição</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medication_name">
                  Medicamento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newPrescription.medication_name}
                  onValueChange={(value) =>
                    setNewPrescription({
                      ...newPrescription,
                      medication_name: value,
                    })
                  }
                  disabled={isLoadingMedications}
                >
                  <SelectTrigger id="medication_name">
                    <SelectValue
                      placeholder={
                        isLoadingMedications
                          ? "Carregando medicamentos..."
                          : medications.length === 0
                          ? "Nenhum medicamento cadastrado no estoque"
                          : "Selecione um medicamento do estoque"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((med) => (
                      <SelectItem key={med.id} value={med.name}>
                        {med.name}
                        {med.unit_of_measure
                          ? ` (${med.unit_of_measure}${
                              med.current_stock != null
                                ? ` • estoque: ${med.current_stock}`
                                : ""
                            })`
                          : med.current_stock != null
                          ? ` (estoque: ${med.current_stock})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosagem</Label>
                <Input
                  id="dosage"
                  value={newPrescription.dosage}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      dosage: e.target.value,
                    })
                  }
                  placeholder="Ex: 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Input
                  id="frequency"
                  value={newPrescription.frequency}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      frequency: e.target.value,
                    })
                  }
                  placeholder="Ex: 8/8 horas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração</Label>
                <Input
                  id="duration"
                  value={newPrescription.duration}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      duration: e.target.value,
                    })
                  }
                  placeholder="Ex: 7 dias"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções</Label>
              <Textarea
                id="instructions"
                value={newPrescription.instructions}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    instructions: e.target.value,
                  })
                }
                placeholder="Ex: Tomar após as refeições"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Adicionar</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewPrescription({
                    medication_name: "",
                    dosage: "",
                    frequency: "",
                    duration: "",
                    instructions: "",
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
        title="Excluir Prescrição"
        description="Deseja realmente excluir esta prescrição? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  );
}

