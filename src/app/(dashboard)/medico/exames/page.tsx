"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Upload, ListFilter } from "lucide-react";
import PatientUpload from "@/components/files/PatientUpload";
import FileBrowser from "@/components/files/FileBrowser";

export default function MedicoExamesPage() {
  const [patientId, setPatientId] = useState<number | ''>('' as any);
  const [examType, setExamType] = useState<string>("all");
  const [refreshTick, setRefreshTick] = useState<number>(0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exames do Paciente</h1>
          <p className="text-sm text-muted-foreground">Faça upload de exames, filtre e visualize documentos (imagens e PDFs).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/secretaria/exames">
            <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2"/>Envio em Lote</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
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
          <div>
            <Label>Tipo de Exame</Label>
            <Select value={examType} onValueChange={setExamType}>
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
          <Button variant="secondary" size="sm" onClick={() => setRefreshTick((t) => t + 1)}>
            <RefreshCw className="h-4 w-4 mr-2"/>Atualizar
          </Button>
        </CardContent>
      </Card>

      {patientId ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enviar novo exame</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientUpload patientId={patientId as number} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* FileBrowser already includes exam type filter; we pass patient only. */}
              <FileBrowser key={`${patientId}-${examType}-${refreshTick}`} patientId={patientId as number} />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <ListFilter className="h-4 w-4"/> Informe um paciente para visualizar e enviar arquivos.
        </div>
      )}
    </div>
  );
}


