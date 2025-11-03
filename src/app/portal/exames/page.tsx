"use client";
import React, { useEffect, useState } from "react";
import PatientUpload from "@/components/files/PatientUpload";
import FileBrowser from "@/components/files/FileBrowser";

export default function PortalExamesPage() {
  const [patientId, setPatientId] = useState<number | null>(null);
  useEffect(() => {
    // TODO: derive patientId from auth context; temporary prompt
    const pid = localStorage.getItem('portal_patient_id');
    if (pid) setPatientId(parseInt(pid));
  }, []);
  if (!patientId) return <div className="p-6 text-sm">Defina o paciente (localStorage portal_patient_id)</div>;
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-2">Enviar Exame</h1>
        <PatientUpload patientId={patientId} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Meus Arquivos</h2>
        <FileBrowser patientId={patientId} />
      </div>
    </div>
  );
}


