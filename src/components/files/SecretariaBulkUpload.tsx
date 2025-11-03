"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const ACCEPT = ["application/pdf", "image/jpeg", "image/png", "application/dicom", "application/dicom+json"];
const MAX = 10 * 1024 * 1024;

export default function SecretariaBulkUpload() {
  const [patientId, setPatientId] = useState<number | ''>('' as any);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadAll = async () => {
    if (!patientId || !files || files.length === 0) return toast.error("Selecione paciente e arquivos");
    setUploading(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      if (!ACCEPT.includes(file.type) || file.size > MAX) { fail++; continue; }
      try {
        const fd = new FormData();
        fd.append("file", file);
        const params = new URLSearchParams({ patient_id: String(patientId) });
        const res = await fetch(`${API_URL}/api/files/upload?${params.toString()}`, { method: 'POST', body: fd, credentials: 'include', headers: { Authorization: `Bearer ${getAccessToken() || ''}` } });
        if (!res.ok) throw new Error();
        ok++;
      } catch { fail++; }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} arquivo(s) enviados`);
    if (fail) toast.error(`${fail} falharam`);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Paciente (ID)</Label>
        <Input type="number" value={patientId as any} onChange={(e) => setPatientId(e.target.value ? parseInt(e.target.value) : '' as any)} placeholder="ID do paciente" />
      </div>
      <div>
        <Label>Arquivos</Label>
        <Input type="file" multiple accept={ACCEPT.join(",")} onChange={(e) => setFiles(e.target.files)} />
        <div className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DICOM (até 10MB cada)</div>
      </div>
      <div className="flex justify-end">
        <Button onClick={uploadAll} disabled={uploading}>{uploading ? 'Enviando...' : 'Enviar'}</Button>
      </div>
    </div>
  );
}


