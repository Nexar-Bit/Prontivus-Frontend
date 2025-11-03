"use client";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Entry = { id: number; text: string; date: string; doctor: string };

export default function Evolucao({ recordId, onDirty }: { recordId: string; onDirty: (d: boolean) => void }) {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onDirty(text.length > 0);
  }, [text, onDirty]);

  const addTemplate = (t: string) => setText((prev) => (prev ? prev + "\n" + t : t));

  const save = async () => {
    try {
      setSaving(true);
      const entry: Entry = { id: Date.now(), text, date: new Date().toISOString(), doctor: "Você" };
      // TODO: API save entry + versioning
      setEntries([entry, ...entries]);
      setText("");
      toast.success("Evolução registrada");
      onDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => addTemplate("Paciente em bom estado geral, afebril, consciente e orientado.")}>Template 1</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addTemplate("Orientado repouso, hidratação e retorno se piora.")}>Template 2</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addTemplate("Solicitados exames complementares para investigação.")}>Template 3</Button>
        <Button type="button" variant="outline" size="sm" disabled>Transcrição por voz (em breve)</Button>
      </div>
      <div>
        <Label>Nota de evolução</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Descreva a evolução clínica..." className="min-h-[140px]" />
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !text}>{saving ? "Salvando..." : "Registrar"}</Button>
      </div>
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="rounded border p-2">
            <div className="text-xs text-muted-foreground mb-1">{new Date(e.date).toLocaleString()} • {e.doctor}</div>
            <div className="whitespace-pre-wrap text-sm">{e.text}</div>
          </div>
        ))}
        {entries.length === 0 && <div className="text-xs text-muted-foreground">Sem evoluções registradas.</div>}
      </div>
    </div>
  );
}


