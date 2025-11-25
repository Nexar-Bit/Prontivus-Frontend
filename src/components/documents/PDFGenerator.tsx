"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateConsultationPDF,
  generatePrescriptionPDF,
  generateCertificatePDF,
  downloadPDF,
} from '@/lib/documents-api';
import { CertificateDialog } from './CertificateDialog';

interface PDFGeneratorProps {
  consultationId?: number;
  prescriptionId?: number;
  patientId?: number;
  documentType: 'consultation' | 'prescription' | 'certificate';
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  // For certificate generation
  certificateData?: {
    justification: string;
    validity_days: number;
  };
}

export function PDFGenerator({
  consultationId,
  prescriptionId,
  patientId,
  documentType,
  buttonVariant = 'default',
  buttonSize = 'default',
  className = '',
  onSuccess,
  onError,
  certificateData,
}: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);

  const generatePDF = async () => {
    // For certificates, show dialog first
    if (documentType === 'certificate') {
      if (!patientId) {
        toast.error('ID do paciente é obrigatório');
        return;
      }
      setShowCertificateDialog(true);
      return;
    }

    setIsGenerating(true);
    try {
      let blob: Blob;
      let filename = '';

      switch (documentType) {
        case 'consultation':
          if (!consultationId) {
            throw new Error('Consultation ID is required');
          }
          blob = await generateConsultationPDF(consultationId);
          filename = `consulta_${consultationId}_${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        case 'prescription':
          if (!prescriptionId) {
            throw new Error('Prescription ID is required');
          }
          blob = await generatePrescriptionPDF(prescriptionId);
          filename = `receita_${prescriptionId}_${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        default:
          throw new Error('Invalid document type');
      }

      downloadPDF(blob, filename);
      toast.success('PDF gerado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('PDF generation error:', error);
      const errorMessage = error?.message || 'Erro ao gerar PDF. Tente novamente.';
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCertificateGenerate = async (data: { justification: string; validity_days: number }) => {
    if (!patientId) {
      toast.error('ID do paciente é obrigatório');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateCertificatePDF({
        patient_id: patientId,
        justification: data.justification,
        validity_days: data.validity_days,
      });
      const filename = `atestado_${patientId}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(blob, filename);
      toast.success('Atestado gerado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Certificate generation error:', error);
      const errorMessage = error?.message || 'Erro ao gerar atestado. Tente novamente.';
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonText = () => {
    switch (documentType) {
      case 'consultation':
        return 'Relatório da Consulta';
      case 'prescription':
        return 'Receita Médica';
      case 'certificate':
        return 'Atestado Médico';
      default:
        return 'Gerar PDF';
    }
  };

  const getIcon = () => {
    if (isGenerating) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return <Download className="h-4 w-4" />;
  };

  // Check if required IDs are available
  const isDisabled = isGenerating || 
    (documentType === 'consultation' && !consultationId) ||
    (documentType === 'prescription' && !prescriptionId) ||
    (documentType === 'certificate' && !patientId);

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={generatePDF}
        disabled={isDisabled}
        className={`flex items-center gap-2 ${className}`}
      >
        {getIcon()}
        {isGenerating ? 'Gerando...' : getButtonText()}
      </Button>

      {documentType === 'certificate' && patientId && (
        <CertificateDialog
          open={showCertificateDialog}
          onOpenChange={setShowCertificateDialog}
          onGenerate={handleCertificateGenerate}
        />
      )}
    </>
  );
}

