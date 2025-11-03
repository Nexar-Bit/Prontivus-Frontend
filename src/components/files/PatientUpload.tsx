"use client";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const ACCEPT = ["application/pdf", "image/jpeg", "image/png", "application/dicom", "application/dicom+json"];
const MAX = 10 * 1024 * 1024;

export default function PatientUpload({ patientId, appointmentId }: { patientId: number; appointmentId?: number }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const validate = (file: File) => {
    if (!ACCEPT.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado");
      return false;
    }
    if (file.size > MAX) {
      toast.error("Arquivo excede 10MB");
      return false;
    }
    return true;
  };

  const upload = async (file: File) => {
    if (!validate(file)) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const params = new URLSearchParams();
      params.set("patient_id", String(patientId));
      if (appointmentId) params.set("appointment_id", String(appointmentId));
      const res = await fetch(`${API_URL}/api/files/upload?${params.toString()}`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getAccessToken() || ''}`,
        },
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Falha no upload");
      toast.success("Arquivo enviado");
    } catch (e: any) {
      toast.error(e?.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  }, []);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded p-6 text-center ${dragOver ? 'border-primary bg-primary/5' : 'border-muted'}`}
      >
        <div className="mb-2 text-sm">Arraste e solte um arquivo aqui ou clique para selecionar</div>
        <input type="file" onChange={onChange} disabled={uploading} accept={ACCEPT.join(",")} className="mx-auto" />
        <div className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG, DICOM (até 10MB)</div>
      </div>
    </div>
  );
}


