"use client";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Conduta({ recordId, onDirty }: { recordId: string; onDirty: (d: boolean) => void }) {
  const [plan, setPlan] = useState("");
  const [referrals, setReferrals] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onDirty(plan.length > 0 || referrals.length > 0);
  }, [plan, referrals, onDirty]);

  const save = async () => {
    try {
      setSaving(true);
      // TODO: API save
      toast.success("Conduta salva");
      onDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Plano Terapêutico</Label>
        <Textarea value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Tratamentos, medicações, orientações..." className="min-h-[140px]" />
      </div>
      <div>
        <Label>Encaminhamentos</Label>
        <Textarea value={referrals} onChange={(e) => setReferrals(e.target.value)} placeholder="Especialidades, motivos, urgência..." className="min-h-[120px]" />
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}


