"use client";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ExameFisico({ recordId, onDirty }: { recordId: string; onDirty: (d: boolean) => void }) {
  const [general, setGeneral] = useState("");
  const [cardio, setCardio] = useState("");
  const [resp, setResp] = useState("");
  const [neuro, setNeuro] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onDirty([general, cardio, resp, neuro].some((v) => v.length > 0));
  }, [general, cardio, resp, neuro, onDirty]);

  const save = async () => {
    try {
      setSaving(true);
      // TODO: API save
      toast.success("Exame físico salvo");
      onDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Geral</Label>
        <Textarea value={general} onChange={(e) => setGeneral(e.target.value)} placeholder="Aspecto geral, sinais vitais..." className="min-h-[100px]" />
      </div>
      <div>
        <Label>Cardiovascular</Label>
        <Textarea value={cardio} onChange={(e) => setCardio(e.target.value)} className="min-h-[100px]" />
      </div>
      <div>
        <Label>Respiratório</Label>
        <Textarea value={resp} onChange={(e) => setResp(e.target.value)} className="min-h-[100px]" />
      </div>
      <div>
        <Label>Neurológico</Label>
        <Textarea value={neuro} onChange={(e) => setNeuro(e.target.value)} className="min-h-[100px]" />
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}


