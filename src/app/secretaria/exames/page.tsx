"use client";
import React from "react";
import SecretariaBulkUpload from "@/components/files/SecretariaBulkUpload";

export default function SecretariaExamesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Envio em Lote de Exames</h1>
      <SecretariaBulkUpload />
    </div>
  );
}


