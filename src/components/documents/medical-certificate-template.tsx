"use client";

import * as React from "react";
import { Patient, Doctor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Printer, Shield, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MedicalCertificateTemplateProps {
  patient: Patient;
  doctor: Doctor;
  certificateType: 'medical_leave' | 'fitness' | 'medical_exam' | 'custom';
  justification: string;
  startDate: Date;
  endDate: Date;
  clinicName?: string;
  clinicAddress?: string;
  clinicCRM?: string;
  clinicCNPJ?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function MedicalCertificateTemplate({
  patient,
  doctor,
  certificateType,
  justification,
  startDate,
  endDate,
  clinicName = "Prontivus - Clínica de Saúde",
  clinicAddress,
  clinicCRM,
  clinicCNPJ,
  onPrint,
  onDownload,
  className,
}: MedicalCertificateTemplateProps) {
  const certificateId = `CERT-${Date.now()}`;
  const issueDate = new Date();
  const validityDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getCertificateTitle = () => {
    switch (certificateType) {
      case 'medical_leave':
        return 'Atestado Médico';
      case 'fitness':
        return 'Atestado de Aptidão';
      case 'medical_exam':
        return 'Atestado para Exame';
      default:
        return 'Atestado Médico';
    }
  };

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
      <div className="certificate-document bg-white p-8 shadow-lg border-4 border-[#0F4C75] max-w-4xl mx-auto relative">
        {/* Security Pattern Background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none certificate-pattern" />
        
        {/* Security Border */}
        <div className="absolute inset-0 border-4 border-blue-300 pointer-events-none certificate-security-border" />

        {/* Header */}
        <div className="relative border-b-4 border-[#0F4C75] pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-[#0F4C75] flex items-center justify-center border-4 border-white shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#0F4C75]">{clinicName}</h1>
                <p className="text-sm text-gray-600 font-medium">Certificado Médico Oficial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                {getCertificateTitle()}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">#{certificateId}</p>
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="relative space-y-6 mb-8">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Atesto para os devidos fins que o(a) paciente{' '}
              <span className="font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </span>
              , portador(a) do CPF{' '}
              <span className="font-bold">{patient.cpf || 'não informado'}</span>,{' '}
              <span className="font-bold">{calculateAge(patient.date_of_birth)} anos</span>,{' '}
              sob meus cuidados médicos, encontra-se:
            </p>
          </div>

          {/* Certificate Type Content */}
          <div className="p-6 bg-blue-50 border-l-4 border-[#0F4C75] rounded-r">
            {certificateType === 'medical_leave' && (
              <p className="text-base text-gray-800 leading-relaxed">
                <span className="font-semibold">Incapacitado(a) para atividades laborais</span> no
                período compreendido entre{' '}
                <span className="font-bold">
                  {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>{' '}
                e{' '}
                <span className="font-bold">
                  {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                , correspondente a{' '}
                <span className="font-bold">{validityDays} dia(s)</span>.
              </p>
            )}

            {certificateType === 'fitness' && (
              <p className="text-base text-gray-800 leading-relaxed">
                <span className="font-semibold">Apto(a) para prática de atividades físicas</span>,
                após avaliação clínica realizada em{' '}
                <span className="font-bold">
                  {format(issueDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                .
              </p>
            )}

            {certificateType === 'medical_exam' && (
              <p className="text-base text-gray-800 leading-relaxed">
                <span className="font-semibold">Necessita de exames complementares</span> para
                avaliação diagnóstica. O período de afastamento necessário é de{' '}
                <span className="font-bold">{validityDays} dia(s)</span>, entre{' '}
                <span className="font-bold">
                  {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>{' '}
                e{' '}
                <span className="font-bold">
                  {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                .
              </p>
            )}
          </div>

          {/* Justification */}
          {justification && (
            <div className="p-4 bg-gray-50 border border-gray-300 rounded">
              <p className="text-sm font-semibold text-gray-700 mb-2">Justificativa Médica:</p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {justification}
              </p>
            </div>
          )}

          {/* Validity Timeline */}
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-green-700" />
              <div>
                <p className="text-sm font-semibold text-green-900">Período de Validade</p>
                <p className="text-sm text-green-800">
                  De {format(startDate, "dd/MM/yyyy", { locale: ptBR })} até{' '}
                  {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinic Information */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">{clinicName}</p>
              {clinicAddress && <p className="text-gray-600">{clinicAddress}</p>}
              {clinicCNPJ && (
                <p className="text-gray-600 text-xs">CNPJ: {clinicCNPJ}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-600">
                Emitido em: {format(issueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Signature Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Médico Responsável</p>
              <p className="font-semibold text-gray-900 text-lg">
                Dr(a). {doctor.first_name} {doctor.last_name}
              </p>
              {clinicCRM && (
                <p className="text-sm text-gray-600 mt-1">CRM: {clinicCRM}</p>
              )}
            </div>
            <div className="text-center ml-8">
              <div className="border-2 border-gray-400 p-8 rounded mb-2 min-w-[200px]">
                <p className="text-sm text-gray-700">
                  {doctor.first_name} {doctor.last_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">Assinatura Digital</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-semibold mb-1">Verificação</p>
              <p className="font-mono">{certificateId}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold mb-1">Autenticidade</p>
              <p>Verificar em: prontivus.com/verify</p>
            </div>
            <div className="text-right">
              <p className="font-semibold mb-1">Segurança</p>
              <p>Documento protegido digitalmente</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Este documento foi gerado eletronicamente pelo sistema Prontivus
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Documento oficial com validade jurídica conforme legislação vigente
          </p>
        </div>
      </div>
    </div>
  );
}

