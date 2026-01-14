"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Clock, AlertCircle, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { appointmentsApi } from "@/lib/appointments-api";

interface ReturnApprovalRequest {
  id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  requested_appointment_date: string;
  appointment_type: string;
  notes?: string;
  returns_count_this_month: number;
  status: string;
  requested_by: number;
  approved_by?: number;
  approval_notes?: string;
  resulting_appointment_id?: number;
  requested_at: string;
  reviewed_at?: string;
  expires_at?: string;
  patient_name?: string;
  doctor_name?: string;
  requester_name?: string;
  approver_name?: string;
}

interface ReturnApprovalRequestsProps {
  doctorId?: number; // If provided, only show requests for this doctor
  onApprovalChange?: () => void; // Callback when an approval is made
}

export function ReturnApprovalRequests({ doctorId, onApprovalChange }: ReturnApprovalRequestsProps) {
  const [requests, setRequests] = useState<ReturnApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReturnApprovalRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [doctorId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await appointmentsApi.getReturnApprovalRequests(doctorId ? undefined : "pending");
      setRequests(data.filter(r => r.status?.toLowerCase() === "pending"));
    } catch (error) {
      console.error("Failed to load approval requests:", error);
      toast.error("Erro ao carregar solicitações de aprovação");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request: ReturnApprovalRequest) => {
    setSelectedRequest(request);
    setApprovalAction("approve");
    setApprovalNotes("");
    setShowApprovalDialog(true);
  };

  const handleReject = (request: ReturnApprovalRequest) => {
    setSelectedRequest(request);
    setApprovalAction("reject");
    setApprovalNotes("");
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedRequest || !approvalAction) return;

    try {
      setProcessing(true);
      await appointmentsApi.updateReturnApprovalRequest(selectedRequest.id, {
        status: approvalAction === "approve" ? "approved" : "rejected",
        approval_notes: approvalNotes || undefined,
      });

      toast.success(
        approvalAction === "approve"
          ? "Solicitação aprovada com sucesso!"
          : "Solicitação rejeitada."
      );
      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setApprovalAction(null);
      setApprovalNotes("");
      await loadRequests();
      onApprovalChange?.();
    } catch (error: any) {
      console.error("Failed to update approval request:", error);
      toast.error("Erro ao processar solicitação", {
        description: error?.message || error?.detail,
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Expirado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitações de Aprovação de Retorno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitações de Aprovação de Retorno
          </CardTitle>
          <CardDescription>
            Solicitações pendentes de aprovação para múltiplos retornos no mesmo mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma solicitação pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitações de Aprovação de Retorno
          </CardTitle>
          <CardDescription>
            {requests.length} solicitação(ões) pendente(s) de aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{request.patient_name || "Paciente"}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(request.requested_appointment_date), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {request.returns_count_this_month} retorno(s) este mês
                      </div>
                    </div>
                    {request.notes && (
                      <p className="text-sm text-gray-600 mt-2">{request.notes}</p>
                    )}
                    {request.requester_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Solicitado por: {request.requester_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(request)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Aprovar Solicitação" : "Rejeitar Solicitação"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "Ao aprovar, o agendamento será criado automaticamente."
                : "Informe o motivo da rejeição (opcional)."}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Paciente: {selectedRequest.patient_name}</p>
                <p className="text-sm text-gray-600">
                  Data solicitada:{" "}
                  {format(new Date(selectedRequest.requested_appointment_date), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Retornos este mês: {selectedRequest.returns_count_this_month}
                </p>
              </div>
              <div>
                <Label htmlFor="approval-notes">
                  {approvalAction === "approve" ? "Observações (opcional)" : "Motivo da rejeição (opcional)"}
                </Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalAction === "approve"
                      ? "Adicione observações sobre a aprovação..."
                      : "Informe o motivo da rejeição..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false);
                setSelectedRequest(null);
                setApprovalAction(null);
                setApprovalNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={processing}
              className={
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {processing ? (
                "Processando..."
              ) : approvalAction === "approve" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
