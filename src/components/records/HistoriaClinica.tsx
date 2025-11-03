"use client";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HistoriaClinica({ recordId, onDirty }: { recordId: string; onDirty: (d: boolean) => void }) {
  const [complaints, setComplaints] = useState("");
  const [history, setHistory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onDirty(complaints.length > 0 || history.length > 0);
  }, [complaints, history, onDirty]);

  const save = async () => {
    try {
      setSaving(true);
      // TODO: API save
      toast.success("História clínica salva");
      onDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Queixas principais</Label>
        <Textarea value={complaints} onChange={(e) => setComplaints(e.target.value)} placeholder="Descreva as queixas principais..." className="min-h-[120px]" />
      </div>
      <div>
        <Label>História médica</Label>
        <Textarea value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Histórico clínico, comorbidades, alergias..." className="min-h-[160px]" />
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}


