"use client";

import * as React from "react";
import { Patient, Doctor, Prescription } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PrescriptionTemplateProps {
  prescriptions: Prescription[];
  patient: Patient;
  doctor: Doctor;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicCRM?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function PrescriptionTemplate({
  prescriptions,
  patient,
  doctor,
  clinicName = "Prontivus - Clínica de Saúde",
  clinicAddress,
  clinicPhone,
  clinicCRM,
  onPrint,
  onDownload,
  className,
}: PrescriptionTemplateProps) {
  const prescriptionId = `PRES-${Date.now()}`;
  const issueDate = new Date();

  // Generate QR code data (prescription ID + verification URL)
  const qrCodeData = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/prescription/${prescriptionId}`
    : `/verify/prescription/${prescriptionId}`;

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

  return (
    <div className={cn("bg-white", className)}>
      {/* Print Actions - Hidden when printing */}
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
      <div className="prescription-document bg-white p-8 shadow-lg border-2 border-gray-200 max-w-4xl mx-auto">
        {/* Medical Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none prescription-pattern" />

        {/* Header */}
        <div className="relative border-b-4 border-[#0F4C75] pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#0F4C75] flex items-center justify-center">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0F4C75]">Prontivus</h1>
                <p className="text-sm text-gray-600 font-medium">Sistema de Gestão em Saúde</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Receituário Médico</p>
              <p className="text-xs text-gray-400 mt-1">ID: {prescriptionId}</p>
            </div>
          </div>
        </div>

        {/* Clinic Information */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">{clinicName}</p>
              {clinicAddress && <p className="text-gray-600">{clinicAddress}</p>}
              {clinicPhone && <p className="text-gray-600">Tel: {clinicPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-600">
                Data: {format(issueDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-gray-600">
                Hora: {format(issueDate, "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#0F4C75] rounded-r">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-[#0F4C75]">📋</span>
            Dados do Paciente
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
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
          </div>
        </div>

        {/* Prescriptions Table */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-[#0F4C75]">💊</span>
            Prescrição Médica
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-[#0F4C75] text-white">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Medicamento
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Dosagem
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Frequência
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Duração
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                  Instruções
                </th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription, index) => (
                <tr key={prescription.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                    {prescription.medication_name}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {prescription.dosage || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {prescription.frequency || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {prescription.duration || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700 text-sm">
                    {prescription.instructions || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Safety Information */}
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Informações de Segurança
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Armazenar medicamentos fora do alcance de crianças</li>
            <li>Não compartilhar medicamentos com outras pessoas</li>
            <li>Em caso de dúvidas, consultar o médico ou farmacêutico</li>
            <li>Em caso de reação adversa, procurar atendimento médico imediatamente</li>
          </ul>
        </div>

        {/* Doctor Signature Section */}
        <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t-2 border-gray-300">
          <div>
            <p className="text-sm text-gray-600 mb-2">Médico Prescritor</p>
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
            <div className="mb-4">
              <QrCode className="h-24 w-24 mx-auto text-gray-400" />
              <p className="text-xs text-gray-500 mt-2">
                Verificação de autenticidade
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {prescriptionId}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Este documento é gerado eletronicamente pelo sistema Prontivus
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Em caso de dúvidas sobre a autenticidade, acesse o sistema de verificação
          </p>
        </div>
      </div>
    </div>
  );
}

