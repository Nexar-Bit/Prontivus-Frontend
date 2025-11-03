"use client";

import * as React from "react";
import { Patient, Doctor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, TestTube, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TestRequest {
  id?: string;
  testName: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  clinicalReason?: string;
}

interface LaboratoryRequestTemplateProps {
  patient: Patient;
  doctor: Doctor;
  clinicName?: string;
  clinicCRM?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

const commonTestPanels = {
  hematology: [
    'Hemograma Completo',
    'Coagulograma',
    'Plaquetas',
  ],
  biochemistry: [
    'Glicemia',
    'Hemoglobina Glicada (HbA1c)',
    'Colesterol Total',
    'HDL',
    'LDL',
    'Triglicerídeos',
    'Creatinina',
    'Ureia',
    'TGO/AST',
    'TGP/ALT',
    'TSH',
    'T4 Livre',
  ],
  serology: [
    'Sorologia HIV',
    'Sorologia Hepatite B',
    'Sorologia Hepatite C',
    'VDRL',
    'Anticorpos COVID-19',
  ],
  urinalysis: [
    'Urina Tipo 1',
    'Urinocultura',
    'Urocultura com Antibiograma',
  ],
};

export function LaboratoryRequestTemplate({
  patient,
  doctor,
  clinicName = "Prontivus - Clínica de Saúde",
  clinicCRM,
  onPrint,
  onDownload,
  className,
}: LaboratoryRequestTemplateProps) {
  const [selectedTests, setSelectedTests] = React.useState<Set<string>>(new Set());
  const [customTests, setCustomTests] = React.useState<TestRequest[]>([]);
  const [urgency, setUrgency] = React.useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [clinicalReason, setClinicalReason] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const requestId = `LAB-${Date.now()}`;
  const issueDate = new Date();

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const toggleTest = (testName: string) => {
    const newSet = new Set(selectedTests);
    if (newSet.has(testName)) {
      newSet.delete(testName);
    } else {
      newSet.add(testName);
    }
    setSelectedTests(newSet);
  };

  const addCustomTest = () => {
    if (searchQuery.trim()) {
      setCustomTests([
        ...customTests,
        {
          id: `custom-${Date.now()}`,
          testName: searchQuery,
          urgency: urgency,
          clinicalReason,
        },
      ]);
      setSearchQuery("");
      setClinicalReason("");
    }
  };

  const removeCustomTest = (id: string) => {
    setCustomTests(customTests.filter((t) => t.id !== id));
  };

  const getAllSelectedTests = () => {
    const panelTests = Array.from(selectedTests);
    const custom = customTests.map((t) => t.testName);
    return [...panelTests, ...custom];
  };

  const getUrgencyColor = (urg: string) => {
    switch (urg) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getUrgencyLabel = (urg: string) => {
    switch (urg) {
      case 'emergency':
        return 'Emergência';
      case 'urgent':
        return 'Urgente';
      default:
        return 'Rotina';
    }
  };

  return (
    <div className={cn("bg-white", className)}>
      {/* Print Actions */}
      <div className="print:hidden flex items-center justify-end gap-2 mb-4 pb-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint || (() => window.print())}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Document Container */}
      <div className="lab-request-document bg-white p-8 shadow-lg border-2 border-gray-200 max-w-5xl mx-auto">
        {/* Header */}
        <div className="border-b-4 border-[#0F4C75] pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#0F4C75] flex items-center justify-center">
                <TestTube className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0F4C75]">{clinicName}</h1>
                <p className="text-sm text-gray-600 font-medium">Solicitação de Exames Laboratoriais</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Requisição Médica</p>
              <p className="text-xs text-gray-400 mt-1">ID: {requestId}</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#0F4C75] rounded-r">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-[#0F4C75]">👤</span>
            Dados do Paciente
          </h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Nome</p>
              <p className="font-medium text-gray-900">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Idade</p>
              <p className="font-medium text-gray-900">
                {calculateAge(patient.date_of_birth)} anos
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">CPF</p>
              <p className="font-medium text-gray-900">{patient.cpf || "Não informado"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Urgência</p>
              <Badge className={getUrgencyColor(urgency)}>
                {getUrgencyLabel(urgency)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Test Selection Interface */}
        <div className="space-y-6 mb-6">
          {/* Urgency Selector */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <Label className="text-sm font-semibold mb-3 block">Nível de Urgência</Label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUrgency('routine')}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all",
                  urgency === 'routine'
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                Rotina
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all",
                  urgency === 'urgent'
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                Urgente
              </button>
              <button
                type="button"
                onClick={() => setUrgency('emergency')}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all",
                  urgency === 'emergency'
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                Emergência
              </button>
            </div>
          </div>

          {/* Common Test Panels */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-[#0F4C75]" />
                Hematologia
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {commonTestPanels.hematology.map((test) => (
                  <div key={test} className="flex items-center gap-2">
                    <Checkbox
                      id={test}
                      checked={selectedTests.has(test)}
                      onCheckedChange={() => toggleTest(test)}
                    />
                    <Label htmlFor={test} className="text-sm cursor-pointer">
                      {test}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-[#0F4C75]" />
                Bioquímica
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {commonTestPanels.biochemistry.map((test) => (
                  <div key={test} className="flex items-center gap-2">
                    <Checkbox
                      id={test}
                      checked={selectedTests.has(test)}
                      onCheckedChange={() => toggleTest(test)}
                    />
                    <Label htmlFor={test} className="text-sm cursor-pointer">
                      {test}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-[#0F4C75]" />
                Sorologia
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {commonTestPanels.serology.map((test) => (
                  <div key={test} className="flex items-center gap-2">
                    <Checkbox
                      id={test}
                      checked={selectedTests.has(test)}
                      onCheckedChange={() => toggleTest(test)}
                    />
                    <Label htmlFor={test} className="text-sm cursor-pointer">
                      {test}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-[#0F4C75]" />
                Urinálise
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {commonTestPanels.urinalysis.map((test) => (
                  <div key={test} className="flex items-center gap-2">
                    <Checkbox
                      id={test}
                      checked={selectedTests.has(test)}
                      onCheckedChange={() => toggleTest(test)}
                    />
                    <Label htmlFor={test} className="text-sm cursor-pointer">
                      {test}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Test Search */}
          <div className="p-4 border-2 border-[#0F4C75] rounded-lg bg-blue-50/30">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-[#0F4C75]" />
              Solicitar Exame Personalizado
            </h4>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Buscar exame..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addCustomTest()}
              />
              <Button onClick={addCustomTest} size="sm">
                Adicionar
              </Button>
            </div>
            {customTests.length > 0 && (
              <div className="mt-3 space-y-2">
                {customTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(test.urgency)}>
                        {getUrgencyLabel(test.urgency)}
                      </Badge>
                      <span className="text-sm font-medium">{test.testName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => test.id && removeCustomTest(test.id)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clinical Reason */}
        <div className="mb-6">
          <Label className="text-sm font-semibold mb-2 block">Justificativa Clínica</Label>
          <Textarea
            value={clinicalReason}
            onChange={(e) => setClinicalReason(e.target.value)}
            placeholder="Descreva a justificativa clínica para os exames solicitados..."
            className="min-h-[100px]"
          />
        </div>

        {/* Selected Tests Summary */}
        {getAllSelectedTests().length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Exames Solicitados</h4>
            <div className="grid grid-cols-2 gap-2">
              {getAllSelectedTests().map((test, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-[#0F4C75]" />
                  <span>{test}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Information */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Médico Solicitante</p>
              <p className="font-semibold text-gray-900 text-lg">
                Dr(a). {doctor.first_name} {doctor.last_name}
              </p>
              {clinicCRM && (
                <p className="text-sm text-gray-600 mt-1">CRM: {clinicCRM}</p>
              )}
              <div className="mt-6 pt-16 border-t border-gray-400">
                <p className="text-sm text-gray-700 text-center">
                  {doctor.first_name} {doctor.last_name}
                </p>
                <p className="text-xs text-gray-500 text-center">Assinatura Digital</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Data de Emissão</p>
              <p className="font-semibold text-gray-900">
                {format(issueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Este documento foi gerado eletronicamente pelo sistema Prontivus
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Requisição ID: {requestId}
          </p>
        </div>
      </div>
    </div>
  );
}

