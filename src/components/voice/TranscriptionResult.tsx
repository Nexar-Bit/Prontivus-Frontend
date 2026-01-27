"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface TranscriptionResultProps {
  result: {
    raw_text: string;
    enhanced_text: string;
    structured_notes: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
    confidence: number;
    word_count?: number;
  };
  onApplyToForm: (section: string, text: string) => void;
  onClose?: () => void;
}

export function TranscriptionResult({ result, onApplyToForm, onClose }: TranscriptionResultProps) {
  const { structured_notes, enhanced_text, confidence, word_count } = result;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado para a área de transferência');
  };

  const handleApplyAll = () => {
    Object.entries(structured_notes).forEach(([section, text]) => {
      if (text.trim()) {
        onApplyToForm(section, text);
      }
    });
    toast.success('Todo o conteúdo aplicado ao formulário');
  };

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      subjective: 'A - Anamnese',
      objective: 'E - Exame Físico',
      assessment: 'O - Opinião da IA',
      plan: 'C - Conduta',
    };
    return labels[section] || section;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resultado da Transcrição
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(confidence)} text-white border-0`}
            >
              Confiança: {(confidence * 100).toFixed(0)}%
            </Badge>
            {word_count && (
              <Badge variant="secondary">
                {word_count} palavras
              </Badge>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Texto Transcrito</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(enhanced_text)}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </Button>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-md border">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {enhanced_text || 'Nenhum texto transcrito'}
            </p>
          </div>
        </div>

        {/* SOAP Structure */}
        {Object.values(structured_notes).some(text => text.trim()) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Estruturado (SOAP)</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyAll}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Aplicar Tudo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(structured_notes).map(([section, text]) => (
                text.trim() && (
                  <Card key={section} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-semibold uppercase">
                          {getSectionLabel(section)}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(text)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onApplyToForm(section, text)}
                            className="h-6 text-xs"
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {text}
                      </p>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!enhanced_text && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum texto foi transcrito do áudio.</p>
            <p className="text-xs mt-1">Tente gravar novamente com melhor qualidade de áudio.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

