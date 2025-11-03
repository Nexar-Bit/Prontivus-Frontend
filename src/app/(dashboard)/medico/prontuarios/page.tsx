"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MedicoProntuariosPage() {
  const [patientId, setPatientId] = useState<number | ''>('' as any);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prontuários</h1>
        <p className="text-sm text-muted-foreground">Acesse o prontuário do paciente pelo ID</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Abrir prontuário</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div>
            <Label>Paciente (ID)</Label>
            <Input
              type="number"
              placeholder="ID do paciente"
              value={patientId as any}
              onChange={(e) => setPatientId(e.target.value ? parseInt(e.target.value) : '' as any)}
              className="w-48"
            />
          </div>
          <Link href={patientId ? `/medico/prontuario/${patientId}` : '#'}>
            <Button disabled={!patientId}>Abrir</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}


