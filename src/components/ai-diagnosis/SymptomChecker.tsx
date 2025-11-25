"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, Stethoscope, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SymptomCheckerProps {
  onDiagnosisUpdate: (diagnoses: any[]) => void;
}

export function SymptomChecker({ onDiagnosisUpdate }: SymptomCheckerProps) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load common symptoms
  useEffect(() => {
    loadCommonSymptoms();
  }, []);

  const loadCommonSymptoms = async () => {
    setIsLoadingSuggestions(true);
    try {
      const data = await api.get<{ success: boolean; symptoms: string[]; count: number }>(
        '/api/v1/ai/symptoms/database'
      );
      setSuggestions(data.symptoms || []);
    } catch (error: any) {
      console.error('Failed to load symptoms:', error);
      toast.error('Erro ao carregar sintomas comuns');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSymptom = () => {
    const trimmed = currentSymptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (symptomToRemove: string) => {
    setSymptoms(symptoms.filter(s => s !== symptomToRemove));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Adicione pelo menos um sintoma');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await api.post<{
        success: boolean;
        symptoms_analyzed: string[];
        differential_diagnoses: any[];
        primary_suspicion: any;
        patient_data_used: boolean;
      }>('/api/v1/ai/symptoms/analyze', {
        symptoms,
        patient_data: null,
      });

      if (result.success && result.differential_diagnoses) {
        setDiagnoses(result.differential_diagnoses);
        onDiagnosisUpdate(result.differential_diagnoses);
        toast.success(`Análise concluída: ${result.differential_diagnoses.length} diagnóstico(s) encontrado(s)`);
      } else {
        throw new Error('Análise não retornou resultados');
      }
    } catch (error: any) {
      console.error('Symptom analysis error:', error);
      toast.error(error.message || 'Erro na análise de sintomas. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredSuggestions = currentSymptom
    ? suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(currentSymptom.toLowerCase()) &&
        !symptoms.includes(suggestion)
      )
    : [];

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Analisador de Sintomas</h3>
      </div>

      {/* Symptom Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              placeholder="Digite um sintoma..."
              onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              disabled={isLoadingSuggestions}
            />
            {currentSymptom && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredSuggestions.slice(0, 5).map((suggestion) => (
                  <div
                    key={suggestion}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setCurrentSymptom(suggestion);
                      setTimeout(() => addSymptom(), 0);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={addSymptom} disabled={!currentSymptom.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Symptoms */}
        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {symptoms.map((symptom) => (
              <Badge key={symptom} variant="secondary" className="flex items-center gap-1">
                {symptom}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeSymptom(symptom)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {symptoms.length > 0 && (
        <Button
          onClick={analyzeSymptoms}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando Sintomas...
            </>
          ) : (
            <>Analisar {symptoms.length} Sintoma(s)</>
          )}
        </Button>
      )}

      {/* Diagnosis Results */}
      {diagnoses.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="font-semibold">Diagnósticos Diferenciais</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {diagnoses.map((diagnosis, index) => (
              <div key={`${diagnosis.icd10_code}-${index}`} className="border rounded-lg p-3 bg-muted/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{diagnosis.description}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Código: <span className="font-mono">{diagnosis.icd10_code}</span>
                    </div>
                    <div className="text-sm mt-1">
                      Confiança: <span className="font-medium">{(diagnosis.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {(diagnosis.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                
                {diagnosis.supporting_symptoms && diagnosis.supporting_symptoms.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Sintomas relacionados:</div>
                    <div className="flex flex-wrap gap-1">
                      {diagnosis.supporting_symptoms.map((symptom: string) => (
                        <Badge key={symptom} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {diagnosis.recommended_tests && diagnosis.recommended_tests.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Exames recomendados:</div>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                      {diagnosis.recommended_tests.map((test: string, i: number) => (
                        <li key={i}>{test}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

