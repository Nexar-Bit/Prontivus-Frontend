"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { documentSignatureApi, DocumentType } from "@/lib/document-signature-api";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentSignatureButtonProps {
  documentType: DocumentType;
  documentId: number;
  documentContent?: string; // Optional: document content for hashing
  onSigned?: () => void;
  buttonVariant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

// Brazilian states for CRM
const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function DocumentSignatureButton({
  documentType,
  documentId,
  documentContent,
  onSigned,
  buttonVariant = "default",
  buttonSize = "default",
  className = "",
}: DocumentSignatureButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [crmNumber, setCrmNumber] = useState("");
  const [crmState, setCrmState] = useState("");
  const [certificatePassword, setCertificatePassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
  };

  const handleClose = () => {
    if (!isSigning) {
      setIsOpen(false);
      setCrmNumber("");
      setCrmState("");
      setCertificatePassword("");
      setError(null);
    }
  };

  const generateDocumentHash = async (content: string): Promise<string> => {
    // Use Web Crypto API to generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  const handleSign = async () => {
    if (!crmNumber || !crmState) {
      setError("CRM número e estado são obrigatórios");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      // Generate document hash
      const contentToHash = documentContent || `${documentType}_${documentId}_${Date.now()}`;
      const documentHash = await generateDocumentHash(contentToHash);

      // In a real implementation, you would:
      // 1. Load the AR CFM certificate from secure storage or hardware token
      // 2. Sign the document hash with the private key
      // 3. Extract certificate information
      // 
      // For now, this is a placeholder that demonstrates the flow
      // In production, this should integrate with:
      // - Windows Certificate Store (for A1 certificates)
      // - Hardware tokens (for A3 certificates)
      // - AR CFM certificate management API

      // Placeholder signature data (in production, this would be the actual signature)
      const signatureData = btoa(`signature_${documentHash}_${Date.now()}`);

      // Create signature
      const signature = await documentSignatureApi.create({
        document_type: documentType,
        document_id: documentId,
        crm_number: crmNumber,
        crm_state: crmState,
        document_hash: documentHash,
        signature_data: signatureData,
        signature_algorithm: "RSA-SHA256",
        // In production, these would come from the certificate:
        // certificate_serial: cert.serialNumber,
        // certificate_issuer: cert.issuer,
        // certificate_valid_from: cert.validFrom,
        // certificate_valid_to: cert.validTo,
      });

      toast.success("Documento assinado digitalmente com sucesso!", {
        description: `Assinatura criada em ${new Date(signature.signed_at).toLocaleString("pt-BR")}`,
      });

      setIsOpen(false);
      onSigned?.();
    } catch (error: any) {
      console.error("Error signing document:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Erro ao assinar documento. Verifique suas credenciais e tente novamente.";
      setError(errorMessage);
      toast.error("Erro ao assinar documento", {
        description: errorMessage,
      });
    } finally {
      setIsSigning(false);
    }
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      prescription: "Receita Médica",
      certificate: "Atestado Médico",
      consultation_report: "Relatório de Consulta",
      exam_request: "Solicitação de Exame",
      other: "Documento",
    };
    return labels[type] || "Documento";
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpen}
        className={className}
      >
        <FileCheck className="h-4 w-4 mr-2" />
        Assinar Digitalmente
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assinatura Digital com AR CFM</DialogTitle>
            <DialogDescription>
              Assine digitalmente o {getDocumentTypeLabel(documentType)} usando seu
              certificado digital AR CFM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erro</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="crm-number">CRM Número *</Label>
              <Input
                id="crm-number"
                placeholder="Ex: 123456"
                value={crmNumber}
                onChange={(e) => setCrmNumber(e.target.value)}
                disabled={isSigning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm-state">CRM Estado *</Label>
              <Select
                value={crmState}
                onValueChange={setCrmState}
                disabled={isSigning}
              >
                <SelectTrigger id="crm-state">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate-password">
                Senha do Certificado Digital
              </Label>
              <Input
                id="certificate-password"
                type="password"
                placeholder="Digite a senha do certificado (se necessário)"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                disabled={isSigning}
              />
              <p className="text-xs text-muted-foreground">
                A senha será usada apenas localmente para acessar o certificado.
                Não será enviada ao servidor.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Esta é uma implementação de demonstração.
                Em produção, o certificado digital AR CFM será acessado através
                de um token de hardware ou certificado instalado no sistema.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSigning}
            >
              Cancelar
            </Button>
            <Button onClick={handleSign} disabled={isSigning || !crmNumber || !crmState}>
              {isSigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assinando...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Assinar Documento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
