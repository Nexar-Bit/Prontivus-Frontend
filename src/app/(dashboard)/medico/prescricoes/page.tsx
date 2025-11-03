"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function MedicoPrescricoesPage() {
  const [recordId, setRecordId] = useState<number | ''>('' as any);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prescrições</h1>
        <p className="text-sm text-muted-foreground">Acesse as prescrições vinculadas ao prontuário</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Abrir prescrições por prontuário</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div>
            <Label>ID do Prontuário</Label>
            <Input
              type="number"
              placeholder="ID do prontuário clínico"
              value={recordId as any}
              onChange={(e) => setRecordId(e.target.value ? parseInt(e.target.value) : '' as any)}
              className="w-56"
            />
          </div>
          <Link href={recordId ? `/medico/prontuario/${recordId}` : '#'}>
            <Button disabled={!recordId}>Abrir</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}


