"use client";

import * as React from "react";
import { Patient } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalRecordsTimeline } from "./medical-records-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Stethoscope, FileText, TestTube, Pill } from "lucide-react";
import FileBrowser from "@/components/files/FileBrowser";

interface PatientProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  patientId: number;
  patient: Patient;
}

export function PatientProfileTabs({
  activeTab,
  onTabChange,
  patientId,
  patient,
}: PatientProfileTabsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid w-auto grid-cols-4 gap-2">
          <TabsTrigger value="records" className="gap-2">
            <FileText className="h-4 w-4" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="consultations" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Consultas
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-2">
            <Pill className="h-4 w-4" />
            Prescrições
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <TestTube className="h-4 w-4" />
            Exames
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      <TabsContent value="records" className="space-y-0">
        <MedicalRecordsTimeline patientId={patientId} />
      </TabsContent>

      <TabsContent value="consultations" className="space-y-4">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Consultas</CardTitle>
            <CardDescription>
              Histórico de consultas e atendimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Histórico de consultas será exibido aqui</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="prescriptions" className="space-y-4">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Prescrições</CardTitle>
            <CardDescription>
              Medicamentos prescritos e histórico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Histórico de prescrições será exibido aqui</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tests" className="space-y-4">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Exames e Resultados</CardTitle>
            <CardDescription>
              Resultados de exames laboratoriais e de imagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileBrowser patientId={patientId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

