"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Copy, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ICD10SuggestionsProps {
  clinicalFindings: string;
  onCodeSelect: (code: string, description: string) => void;
}

export function ICD10Suggestions({ clinicalFindings, onCodeSelect }: ICD10SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only fetch if findings are substantial
    if (clinicalFindings.trim().length > 10) {
      // Debounce API calls
      debounceTimerRef.current = setTimeout(() => {
        fetchICD10Suggestions(clinicalFindings);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [clinicalFindings]);

  const fetchICD10Suggestions = async (findings: string) => {
    if (!findings.trim() || findings.trim().length <= 10) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.post<{
        success: boolean;
        suggested_codes: any[];
        count: number;
      }>('/api/v1/ai/icd10/suggest', {
        clinical_findings: findings,
      });

      if (data.success && data.suggested_codes) {
        setSuggestions(data.suggested_codes);
      } else {
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error('ICD-10 suggestion error:', error);
      // Silently fail - don't show error toast for suggestions
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSelect = (code: string, description: string) => {
    onCodeSelect(code, description);
    toast.success(`CID-10 ${code} selecionado`);
  };

  if (!clinicalFindings.trim() || clinicalFindings.trim().length <= 10) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-green-600" />
        <h4 className="font-semibold">Sugestões de CID-10</h4>
        {isLoading && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando...
          </Badge>
        )}
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.slice(0, 5).map((suggestion) => (
            <div
              key={suggestion.code}
              className="flex items-center justify-between p-2 border rounded hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium font-mono">{suggestion.code}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {suggestion.description}
                </div>
                {suggestion.category && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {suggestion.category}
                  </Badge>
                )}
                {suggestion.match_score && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Relevância: {(suggestion.match_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCodeSelect(suggestion.code, suggestion.description)}
                className="ml-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Usar
              </Button>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-sm text-muted-foreground">
            Digite mais detalhes clínicos para obter sugestões de CID-10.
          </div>
        )
      )}
    </div>
  );
}

