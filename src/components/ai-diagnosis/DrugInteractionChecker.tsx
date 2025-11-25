"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Pill, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DrugInteractionCheckerProps {
  medications: string[];
}

export function DrugInteractionChecker({ medications }: DrugInteractionCheckerProps) {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Auto-check when medications change (if more than 1)
  useEffect(() => {
    if (medications.length >= 2) {
      checkInteractions();
    } else {
      setInteractions([]);
      setHasChecked(false);
    }
  }, [medications]);

  const checkInteractions = async () => {
    if (medications.length < 2) {
      setInteractions([]);
      return;
    }

    setIsChecking(true);
    setHasChecked(false);
    try {
      const data = await api.post<{
        success: boolean;
        interactions: any[];
        count: number;
        medications_checked: string[];
      }>('/api/v1/ai/drug-interactions/check', {
        medications: medications.filter(m => m.trim()),
      });

      if (data.success && data.interactions) {
        setInteractions(data.interactions);
        setHasChecked(true);
        
        if (data.interactions.length > 0) {
          const severeCount = data.interactions.filter((i: any) => i.severity === 'severe').length;
          if (severeCount > 0) {
            toast.warning(`${severeCount} interação(ões) grave(is) detectada(s)!`);
          } else {
            toast.info(`${data.interactions.length} interação(ões) detectada(s)`);
          }
        }
      } else {
        setInteractions([]);
        setHasChecked(true);
      }
    } catch (error: any) {
      console.error('Drug interaction check error:', error);
      toast.error('Erro ao verificar interações medicamentosas');
      setInteractions([]);
      setHasChecked(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (medications.length < 2) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'moderate':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'mild':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-orange-50 border-orange-200 text-orange-800';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'mild':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Pill className="h-4 w-4 text-orange-600" />
        <h4 className="font-semibold">Verificação de Interações</h4>
        {isChecking && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verificando...
          </Badge>
        )}
      </div>

      {isChecking ? (
        <div className="text-sm text-muted-foreground py-4">
          Analisando {medications.length} medicamento(s)...
        </div>
      ) : interactions.length > 0 ? (
        <div className="space-y-3">
          {interactions.map((interaction, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${getSeverityColor(interaction.severity)}`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium mb-1">
                    {interaction.drug1} + {interaction.drug2}
                  </div>
                  {interaction.description && (
                    <div className="text-sm mb-2 opacity-90">
                      {interaction.description}
                    </div>
                  )}
                  {interaction.recommendation && (
                    <div className="text-sm font-medium mb-2">
                      Recomendação: {interaction.recommendation}
                    </div>
                  )}
                  <Badge
                    variant={getSeverityBadgeVariant(interaction.severity)}
                    className="mt-1"
                  >
                    Gravidade: {interaction.severity}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        hasChecked && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
            ✅ Nenhuma interação medicamentosa significativa detectada.
          </div>
        )
      )}
    </div>
  );
}

