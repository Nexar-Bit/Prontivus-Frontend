"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL, api } from "@/lib/api";

type FileRec = {
  id: number; filename: string; filetype: string; upload_date: string; exam_type?: string;
};

export default function FileBrowser({ patientId }: { patientId: number }) {
  const [items, setItems] = useState<FileRec[]>([]);
  const [examType, setExamType] = useState<string>("all");

  useEffect(() => { load(); }, [patientId, examType]);

  const load = async () => {
    const params = new URLSearchParams();
    if (patientId) params.set('patient_id', String(patientId));
    if (examType && examType !== 'all') params.set('exam_type', examType);
    try {
      const data = await api.get<FileRec[]>(`/api/files?${params.toString()}`);
      setItems(data);
    } catch (e) {
      // silently ignore; UI can show empty
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Select value={examType} onValueChange={(v) => setExamType(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de exame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Laboratorial">Laboratorial</SelectItem>
            <SelectItem value="Imagem">Imagem</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(f => (
          <div key={f.id} className="border rounded p-2">
            <div className="text-sm font-medium truncate">{f.filename}</div>
            <div className="text-xs text-muted-foreground">{new Date(f.upload_date).toLocaleString()} • {f.exam_type || '—'}</div>
            <div className="mt-2">
              {f.filetype.startsWith('image/') ? (
                <img src={`${API_URL}/api/files/${f.id}`} alt={f.filename} className="max-h-48 rounded" />
              ) : f.filetype === 'application/pdf' ? (
                <object data={`${API_URL}/api/files/${f.id}`} type="application/pdf" width="100%" height="220">
                  <a href={`${API_URL}/api/files/${f.id}`} className="text-primary text-sm">Abrir PDF</a>
                </object>
              ) : (
                <a href={`${API_URL}/api/files/${f.id}`} className="text-primary text-sm">Baixar</a>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-muted-foreground">Sem arquivos.</div>}
      </div>
    </div>
  );
}


