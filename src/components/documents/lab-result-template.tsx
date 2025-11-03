"use client";

import * as React from "react";
import { Patient, Doctor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  previousValue?: string;
  previousDate?: Date;
}

interface LabResultTemplateProps {
  patient: Patient;
  doctor?: Doctor;
  results: LabResult[];
  collectionDate: Date;
  reportDate: Date;
  laboratoryName?: string;
  doctorComments?: string;
  recommendations?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function LabResultTemplate({
  patient,
  doctor,
  results,
  collectionDate,
  reportDate,
  laboratoryName = "Laboratório Prontivus",
  doctorComments,
  recommendations,
  onPrint,
  onDownload,
  className,
}: LabResultTemplateProps) {
  const reportId = `LAB-RES-${Date.now()}`;

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

  const getStatusBadge = (status: LabResult['status']) => {
    switch (status) {
      case 'normal':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            Normal
          </Badge>
        );
      case 'abnormal':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            Alterado
          </Badge>
        );
      case 'critical':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            Crítico
          </Badge>
        );
    }
  };

  const getTrendIcon = (current: string, previous?: string) => {
    if (!previous) return null;
    const currentNum = parseFloat(current);
    const previousNum = parseFloat(previous);
    if (currentNum > previousNum) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else if (currentNum < previousNum) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
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
      <div className="lab-result-document bg-white p-8 shadow-lg border-2 border-gray-200 max-w-5xl mx-auto">
        {/* Header */}
        <div className="border-b-4 border-[#0F4C75] pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#0F4C75] flex items-center justify-center">
                <span className="text-white text-2xl font-bold">L</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0F4C75]">{laboratoryName}</h1>
                <p className="text-sm text-gray-600 font-medium">Laudo de Exames Laboratoriais</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Relatório de Resultados</p>
              <p className="text-xs text-gray-400 mt-1">ID: {reportId}</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#0F4C75] rounded-r">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Paciente</p>
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
              <p className="text-gray-500 text-xs uppercase mb-1">Coleta</p>
              <p className="font-medium text-gray-900">
                {format(collectionDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1">Emissão</p>
              <p className="font-medium text-gray-900">
                {format(reportDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-[#0F4C75]">📊</span>
            Resultados dos Exames
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-[#0F4C75] text-white">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Exame
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Resultado
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Unidade
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Valores de Referência
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr
                  key={result.id}
                  className={cn(
                    index % 2 === 0 ? "bg-white" : "bg-gray-50",
                    result.status === 'critical' && "bg-red-50",
                    result.status === 'abnormal' && "bg-yellow-50"
                  )}
                >
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {result.previousValue &&
                        getTrendIcon(result.value, result.previousValue)}
                      {result.testName}
                    </div>
                  </td>
                  <td className={cn(
                    "border border-gray-300 px-4 py-3 font-semibold",
                    result.status === 'critical' && "text-red-700",
                    result.status === 'abnormal' && "text-yellow-700",
                    result.status === 'normal' && "text-green-700"
                  )}>
                    {result.value}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {result.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-600 text-sm">
                    {result.referenceRange}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {getStatusBadge(result.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trend Analysis */}
        {results.some((r) => r.previousValue) && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Análise de Tendência</h4>
            <div className="space-y-2 text-sm">
              {results
                .filter((r) => r.previousValue)
                .map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <span className="font-medium">{result.testName}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {result.previousValue} ({format(result.previousDate!, "dd/MM/yy")}) →
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          result.status === 'critical' && "text-red-700",
                          result.status === 'abnormal' && "text-yellow-700"
                        )}
                      >
                        {result.value}
                      </span>
                      {getTrendIcon(result.value, result.previousValue)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Doctor Comments */}
        {doctorComments && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>💬</span>
              Comentários do Médico
            </h4>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
              {doctorComments}
            </p>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <span>✅</span>
              Recomendações
            </h4>
            <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
              {recommendations}
            </p>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          {doctor && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Médico Responsável</p>
              <p className="font-semibold text-gray-900">
                Dr(a). {doctor.first_name} {doctor.last_name}
              </p>
            </div>
          )}
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Laboratório</p>
              <p className="font-semibold text-gray-900">{laboratoryName}</p>
            </div>
            <div className="text-center ml-8">
              <div className="border-2 border-gray-400 p-8 rounded mb-2 min-w-[200px]">
                <p className="text-sm text-gray-700">Assinatura Digital</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Este documento foi gerado eletronicamente pelo sistema Prontivus
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Relatório ID: {reportId} | Data de emissão: {format(reportDate, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  );
}

