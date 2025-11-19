"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import HistoriaClinica from "@/components/records/HistoriaClinica";
import ExameFisico from "@/components/records/ExameFisico";
import Evolucao from "@/components/records/Evolucao";
import Conduta from "@/components/records/Conduta";
import FileBrowser from "@/components/files/FileBrowser";

export default function ProntuarioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("historia");
  const [unsaved, setUnsaved] = useState(false);
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // TODO: fetch record by id
        setRecord({ id, patient: { name: "" } });
      } catch (e) {
        toast.error("Erro ao carregar prontuário");
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsaved]);

  const handleTabChange = async (value: string) => {
    if (unsaved) {
      // Note: This confirm is for unsaved changes warning, not delete - keeping it for now
      const confirmLeave = confirm("Existem alterações não salvas. Deseja continuar?");
      if (!confirmLeave) return;
    }
    setActiveTab(value);
    setUnsaved(false);
  };

  const onDirty = (dirty: boolean) => setUnsaved(dirty);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prontuário #{id}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 grid grid-cols-5">
            <TabsTrigger value="historia">História Clínica</TabsTrigger>
            <TabsTrigger value="exame">Exame Físico</TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
            <TabsTrigger value="conduta">Conduta</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          </TabsList>

          <TabsContent value="historia">
            <HistoriaClinica recordId={String(id)} onDirty={onDirty} />
          </TabsContent>
          <TabsContent value="exame">
            <ExameFisico recordId={String(id)} onDirty={onDirty} />
          </TabsContent>
          <TabsContent value="evolucao">
            <Evolucao recordId={String(id)} onDirty={onDirty} />
          </TabsContent>
          <TabsContent value="conduta">
            <Conduta recordId={String(id)} onDirty={onDirty} />
          </TabsContent>
          <TabsContent value="arquivos">
            <FileBrowser patientId={parseInt(String(id))} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


