"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, FileText } from "lucide-react";
import { toast } from "sonner";

interface ManualConsultationFormProps {
  appointmentId: number;
  onSave: (data: {
    subjective?: string; // Anamnese
    objective?: string; // Exame Físico
    assessment?: string; // Parecer da IA / Diagnóstico
    plan?: string; // Conduta
  }) => Promise<void>;
  isSaving?: boolean;
  initialData?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

export function ManualConsultationForm({
  appointmentId,
  onSave,
  isSaving = false,
  initialData,
}: ManualConsultationFormProps) {
  const [subjective, setSubjective] = useState(initialData?.subjective || ""); // Anamnese
  const [objective, setObjective] = useState(initialData?.objective || ""); // Exame Físico
  const [assessment, setAssessment] = useState(initialData?.assessment || ""); // Parecer da IA / Diagnóstico
  const [plan, setPlan] = useState(initialData?.plan || ""); // Conduta
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSubjective(initialData.subjective || "");
      setObjective(initialData.objective || "");
      setAssessment(initialData.assessment || "");
      setPlan(initialData.plan || "");
    }
  }, [initialData]);

  useEffect(() => {
    const changed =
      subjective !== (initialData?.subjective || "") ||
      objective !== (initialData?.objective || "") ||
      assessment !== (initialData?.assessment || "") ||
      plan !== (initialData?.plan || "");
    setHasChanges(changed);
  }, [subjective, objective, assessment, plan, initialData]);

  const handleSave = async () => {
    try {
      await onSave({
        subjective,
        objective,
        assessment,
        plan,
      });
      setHasChanges(false);
      toast.success("Consulta salva com sucesso");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar consulta");
      throw error;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consulta Manual
          </CardTitle>
          <CardDescription>
            Preencha os campos da consulta manualmente
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Consulta"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Anamnese */}
        <div className="space-y-2">
          <Label htmlFor="subjective">Anamnese</Label>
          <Textarea
            id="subjective"
            placeholder="Descreva a história clínica do paciente, sintomas relatados, queixas principais, histórico familiar e outras informações relevantes..."
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>

        {/* Exame Físico */}
        <div className="space-y-2">
          <Label htmlFor="objective">Exame Físico</Label>
          <Textarea
            id="objective"
            placeholder="Descreva os achados do exame físico: sinais vitais, inspeção, palpação, percussão, ausculta, e outros achados relevantes..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>

        {/* Parecer da IA / Diagnóstico */}
        <div className="space-y-2">
          <Label htmlFor="assessment">Parecer da IA / Diagnóstico</Label>
          <Textarea
            id="assessment"
            placeholder="Descreva o diagnóstico, impressão clínica, CID-10 e outras avaliações. O parecer da IA pode ser gerado automaticamente (opcional)..."
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Campo para diagnóstico e impressão clínica. O parecer da IA pode ser integrado aqui se necessário.
          </p>
        </div>

        {/* Conduta */}
        <div className="space-y-2">
          <Label htmlFor="plan">Conduta</Label>
          <Textarea
            id="plan"
            placeholder="Descreva o plano de tratamento, prescrições, orientações ao paciente, exames solicitados e retorno..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
