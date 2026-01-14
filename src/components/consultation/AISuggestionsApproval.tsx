"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, Loader2, BookOpen, ClipboardList, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ICD10Suggestion {
  code: string;
  description: string;
  match_score?: number;
  category?: string;
}

interface ExamSuggestion {
  exam_type: string;
  description?: string;
  reason?: string;
}

interface AISuggestionsApprovalProps {
  transcription: string;
  appointmentId: number;
  onICD10Approve: (code: string, description: string) => void;
  onExamApprove: (exam: ExamSuggestion) => void;
  onClose?: () => void;
}

export function AISuggestionsApproval({
  transcription,
  appointmentId,
  onICD10Approve,
  onExamApprove,
  onClose,
}: AISuggestionsApprovalProps) {
  const [icd10Suggestions, setIcd10Suggestions] = useState<ICD10Suggestion[]>([]);
  const [examSuggestions, setExamSuggestions] = useState<ExamSuggestion[]>([]);
  const [isLoadingICD10, setIsLoadingICD10] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [approvedICD10Codes, setApprovedICD10Codes] = useState<Set<string>>(new Set());
  const [approvedExams, setApprovedExams] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (transcription && transcription.trim().length > 20) {
      fetchICD10Suggestions();
      fetchExamSuggestions();
    }
  }, [transcription]);

  const fetchICD10Suggestions = async () => {
    try {
      setIsLoadingICD10(true);
      const data = await api.post<{
        success: boolean;
        suggested_codes: ICD10Suggestion[];
        count: number;
      }>("/api/v1/ai/icd10/suggest", {
        clinical_findings: transcription,
      });

      if (data.success && data.suggested_codes) {
        setIcd10Suggestions(data.suggested_codes.slice(0, 5)); // Top 5
      }
    } catch (error: any) {
      console.error("Error fetching ICD-10 suggestions:", error);
      // Silent fail - don't show error toast
    } finally {
      setIsLoadingICD10(false);
    }
  };

  const fetchExamSuggestions = async () => {
    try {
      setIsLoadingExams(true);
      // Use AI service to suggest exams based on transcription
      // For now, we'll use a simple approach - in production, this would call an AI endpoint
      // that analyzes the transcription and suggests relevant exams
      
      // Placeholder: In production, this should call an AI endpoint
      // For now, we'll suggest common exams based on keywords
      const suggestedExams: ExamSuggestion[] = [];
      
      const lowerText = transcription.toLowerCase();
      
      // Simple keyword-based suggestions (in production, use AI)
      if (lowerText.includes("dor") || lowerText.includes("dor de cabeça")) {
        suggestedExams.push({
          exam_type: "Hemograma completo",
          reason: "Investigação de processo inflamatório ou infeccioso",
        });
      }
      if (lowerText.includes("pressão") || lowerText.includes("hipertensão")) {
        suggestedExams.push({
          exam_type: "Eletrocardiograma",
          reason: "Avaliação cardiovascular",
        });
      }
      
      setExamSuggestions(suggestedExams.slice(0, 5)); // Top 5
    } catch (error: any) {
      console.error("Error fetching exam suggestions:", error);
      // Silent fail
    } finally {
      setIsLoadingExams(false);
    }
  };

  const handleICD10Approve = (suggestion: ICD10Suggestion) => {
    setApprovedICD10Codes((prev) => new Set(prev).add(suggestion.code));
    onICD10Approve(suggestion.code, suggestion.description);
    toast.success(`CID-10 ${suggestion.code} aprovado`);
  };

  const handleExamApprove = (suggestion: ExamSuggestion) => {
    setApprovedExams((prev) => new Set(prev).add(suggestion.exam_type));
    onExamApprove(suggestion);
    toast.success(`Exame "${suggestion.exam_type}" aprovado`);
  };

  const handleICD10Reject = (code: string) => {
    setIcd10Suggestions((prev) => prev.filter((s) => s.code !== code));
    toast.info("Sugestão de CID-10 rejeitada");
  };

  const handleExamReject = (examType: string) => {
    setExamSuggestions((prev) => prev.filter((s) => s.exam_type !== examType));
    toast.info("Sugestão de exame rejeitada");
  };

  if (isLoadingICD10 && isLoadingExams) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando sugestões...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (icd10Suggestions.length === 0 && examSuggestions.length === 0 && !isLoadingICD10 && !isLoadingExams) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#0F4C75]" />
              Sugestões da IA - Requer Aprovação
            </CardTitle>
            <CardDescription>
              Revise e aprove expressamente as sugestões de CID e exames
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ICD-10 Suggestions */}
        {icd10Suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#0F4C75]" />
              <h4 className="font-semibold">Sugestões de CID-10</h4>
              {isLoadingICD10 && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="space-y-2">
              {icd10Suggestions.map((suggestion) => {
                const isApproved = approvedICD10Codes.has(suggestion.code);
                return (
                  <div
                    key={suggestion.code}
                    className={cn(
                      "flex items-start justify-between p-3 border rounded-lg",
                      isApproved && "bg-green-50 border-green-200"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#0F4C75]">
                          {suggestion.code}
                        </span>
                        {isApproved && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                      {suggestion.match_score && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Relevância: {(suggestion.match_score * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                    {!isApproved && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleICD10Approve(suggestion)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleICD10Reject(suggestion.code)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exam Suggestions */}
        {examSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#0F4C75]" />
              <h4 className="font-semibold">Sugestões de Exames</h4>
              {isLoadingExams && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="space-y-2">
              {examSuggestions.map((suggestion) => {
                const isApproved = approvedExams.has(suggestion.exam_type);
                return (
                  <div
                    key={suggestion.exam_type}
                    className={cn(
                      "flex items-start justify-between p-3 border rounded-lg",
                      isApproved && "bg-green-50 border-green-200"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{suggestion.exam_type}</span>
                        {isApproved && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        )}
                      </div>
                      {suggestion.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.reason}
                        </p>
                      )}
                      {suggestion.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                    {!isApproved && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleExamApprove(suggestion)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExamReject(suggestion.exam_type)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
