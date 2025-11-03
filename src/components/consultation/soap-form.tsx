"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { ClinicalRecord } from "@/lib/types";
import { clinicalRecordsApi, diagnosesApi } from "@/lib/clinical-api";
import { Input } from "@/components/ui/input";
import { ICD10Search } from "@/components/icd10-search";

interface SoapFormProps {
  clinicalRecord?: ClinicalRecord;
  onSave: (data: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function SoapForm({ clinicalRecord, onSave, isSaving }: SoapFormProps) {
  const [subjective, setSubjective] = useState(clinicalRecord?.subjective || "");
  const [objective, setObjective] = useState(clinicalRecord?.objective || "");
  const [assessment, setAssessment] = useState(clinicalRecord?.assessment || "");
  const [plan, setPlan] = useState(clinicalRecord?.plan || "");
  const [hasChanges, setHasChanges] = useState(false);
  const [cidInput, setCidInput] = useState("");
  const [cidDesc, setCidDesc] = useState("");
  const [diagnoses, setDiagnoses] = useState<any[]>((clinicalRecord as any)?.diagnoses || []);

  useEffect(() => {
    if (clinicalRecord) {
      setSubjective(clinicalRecord.subjective || "");
      setObjective(clinicalRecord.objective || "");
      setAssessment(clinicalRecord.assessment || "");
      setPlan(clinicalRecord.plan || "");
      setDiagnoses((clinicalRecord as any).diagnoses || []);
    }
  }, [clinicalRecord]);

  useEffect(() => {
    const changed =
      subjective !== (clinicalRecord?.subjective || "") ||
      objective !== (clinicalRecord?.objective || "") ||
      assessment !== (clinicalRecord?.assessment || "") ||
      plan !== (clinicalRecord?.plan || "");
    setHasChanges(changed);
  }, [subjective, objective, assessment, plan, clinicalRecord]);

  // Debounced autosave
  useEffect(() => {
    if (!clinicalRecord?.appointment_id) return;
    if (!hasChanges) return;
    const t = setTimeout(async () => {
      try {
        await clinicalRecordsApi.autosave(clinicalRecord.appointment_id, {
          subjective,
          objective,
          assessment,
          plan,
        });
        // optional toast or silent
      } catch (e) {
        // silent fail
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [hasChanges, subjective, objective, assessment, plan, clinicalRecord?.appointment_id]);

  const handleSave = async () => {
    try {
      await onSave({
      subjective,
      objective,
      assessment,
      plan,
    });
      setHasChanges(false);
      toast.success("Prontuário salvo com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar prontuário");
      throw e;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prontuário SOAP
        </CardTitle>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar SOAP"}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subjective" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subjective">Subjetivo (S)</TabsTrigger>
            <TabsTrigger value="objective">Objetivo (O)</TabsTrigger>
            <TabsTrigger value="assessment">Avaliação (A)</TabsTrigger>
            <TabsTrigger value="plan">Plano (P)</TabsTrigger>
          </TabsList>

          <TabsContent value="subjective" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subjective">
                Subjetivo - Queixas e História do Paciente
              </Label>
              <p className="text-sm text-muted-foreground">
                O que o paciente relata? Sintomas, queixas principais, história
                da doença atual, etc.
              </p>
              <Textarea
                id="subjective"
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Ex: Paciente relata dor de cabeça há 3 dias, de intensidade moderada a forte, que piora com a exposição à luz..."
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="objective" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="objective">
                Objetivo - Dados Observáveis e Mensuráveis
              </Label>
              <p className="text-sm text-muted-foreground">
                Sinais vitais, exame físico, resultados de exames, observações
                clínicas.
              </p>
              <Textarea
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: PA: 120/80 mmHg, FC: 72 bpm, Tax: 36.5°C. Paciente alerta, orientado. Exame neurológico sem alterações..."
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="assessment">
                Avaliação - Diagnóstico e Impressão Clínica
              </Label>
              <p className="text-sm text-muted-foreground">
                Sua análise, diagnósticos diferenciais, hipóteses diagnósticas,
                CID-10.
              </p>
              <Textarea
                id="assessment"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Ex: Hipótese diagnóstica: Enxaqueca (CID-10: G43.9). Quadro compatível com cefaleia do tipo migranosa..."
                className="min-h-[300px]"
              />
              {/* Diagnoses quick add */}
              {clinicalRecord?.id && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label>Buscar CID-10</Label>
                    <ICD10Search
                      onSelect={(code, description) => {
                        setCidInput(code);
                        setCidDesc(description);
                      }}
                      placeholder="Digite para buscar códigos CID-10..."
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="cid">CID-10</Label>
                      <Input id="cid" value={cidInput} onChange={(e) => setCidInput(e.target.value)} placeholder="Ex: G43.9" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="cidDesc">Descrição</Label>
                      <Input id="cidDesc" value={cidDesc} onChange={(e) => setCidDesc(e.target.value)} placeholder="Descrição opcional" />
                    </div>
                    <Button
                      onClick={async () => {
                        if (!cidInput) return;
                        const dx = await diagnosesApi.create(clinicalRecord.id!, { cid_code: cidInput, description: cidDesc });
                        setDiagnoses([...(diagnoses || []), dx]);
                        setCidInput("");
                        setCidDesc("");
                      }}
                      type="button"
                    >
                      Adicionar CID
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {diagnoses?.map((dx) => (
                      <div key={dx.id} className="flex items-center justify-between rounded border p-2 text-sm">
                        <div>{dx.cid_code} {dx.description ? `- ${dx.description}` : ""}</div>
                        <Button variant="outline" size="sm" onClick={async () => {
                          await diagnosesApi.delete(dx.id);
                          setDiagnoses(diagnoses.filter((d) => d.id !== dx.id));
                        }}>Remover</Button>
                      </div>
                    ))}
                    {(!diagnoses || diagnoses.length === 0) && (
                      <div className="text-xs text-muted-foreground">Nenhum CID adicionado.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Plano - Conduta e Tratamento</Label>
              <p className="text-sm text-muted-foreground">
                Tratamento proposto, medicações, exames solicitados,
                orientações, retorno.
              </p>
              <Textarea
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Ex: 1. Prescrição de analgésico; 2. Orientações sobre hidratação e repouso; 3. Retorno em 7 dias ou se piora..."
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

