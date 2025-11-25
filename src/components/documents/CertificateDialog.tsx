"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  onGenerate: (data: { justification: string; validity_days: number }) => void;
}

export function CertificateDialog({
  open,
  onOpenChange,
  patientName,
  onGenerate,
}: CertificateDialogProps) {
  const [justification, setJustification] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!justification.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate({
        justification: justification.trim(),
        validity_days: validityDays,
      });
      // Reset form
      setJustification('');
      setValidityDays(7);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Atestado Médico</DialogTitle>
          <DialogDescription>
            {patientName
              ? `Gerar atestado médico para ${patientName}`
              : 'Preencha os dados para gerar o atestado médico'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              placeholder="Ex: Paciente necessita de repouso médico por 7 dias devido a procedimento cirúrgico"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Descreva a justificativa médica para o atestado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity-days">Validade (dias) *</Label>
            <Input
              id="validity-days"
              type="number"
              min="1"
              max="365"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Número de dias que o atestado será válido
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!justification.trim() || isGenerating}
          >
            {isGenerating ? 'Gerando...' : 'Gerar Atestado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

