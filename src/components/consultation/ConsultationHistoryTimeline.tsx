"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clinicalRecordsApi } from "@/lib/clinical-api";
import { generateConsultationPDF, downloadPDF } from "@/lib/documents-api";
import { PatientClinicalHistoryResponse } from "@/lib/types";
import { toast } from "sonner";

interface ConsultationHistoryTimelineProps {
  patientId: number;
  currentAppointmentId?: number;
}

export function ConsultationHistoryTimeline({
  patientId,
  currentAppointmentId,
}: ConsultationHistoryTimelineProps) {
  const [history, setHistory] = useState<PatientClinicalHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (patientId) {
      loadHistory();
    }
  }, [patientId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await clinicalRecordsApi.getPatientHistoryById(patientId);
      
      // Filter to only show completed consultations with clinical records
      // Exclude current appointment
      const filtered = data
        .filter(
          (item) =>
            item.clinical_record &&
            item.appointment_id !== currentAppointmentId
        )
        .sort(
          (a, b) =>
            new Date(b.appointment_date).getTime() -
            new Date(a.appointment_date).getTime()
        )
        .slice(0, 10); // Limit to last 10 consultations
      
      setHistory(filtered);
    } catch (error: any) {
      console.error("Failed to load consultation history:", error);
      setHistory([]);
      toast.error("Erro ao carregar histórico", {
        description: error?.response?.data?.detail || error?.message || "Não foi possível carregar o histórico de consultas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (appointmentId: number) => {
    try {
      setDownloadingIds((prev) => new Set(prev).add(appointmentId));
      
      const blob = await generateConsultationPDF(appointmentId);
      const filename = `consulta_${appointmentId}_${format(new Date(), "yyyyMMdd", { locale: ptBR })}.pdf`;
      downloadPDF(blob, filename);

      toast.success("PDF baixado com sucesso");
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
      toast.error("Erro ao baixar PDF", {
        description: "Não foi possível baixar o documento da consulta",
      });
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Atendimentos
          </CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Atendimentos
          </CardTitle>
          <CardDescription>
            Histórico de consultas e documentos gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhum histórico de consultas anterior encontrado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Atendimentos
        </CardTitle>
        <CardDescription>
          Consultas anteriores e documentos gerados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.appointment_id}
              className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {format(new Date(item.appointment_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.appointment_type || "Consulta"} • Dr. {item.doctor_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF Consulta
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadPDF(item.appointment_id)}
                disabled={downloadingIds.has(item.appointment_id)}
                className="flex-shrink-0"
              >
                {downloadingIds.has(item.appointment_id) ? (
                  <Download className="h-4 w-4 animate-pulse" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
