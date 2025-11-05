"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  RefreshCw
} from "lucide-react";

interface Payment {
  id: number;
  invoice_id: number;
  patientName?: string;
  patientId?: number;
  amount: number;
  method: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paid_at?: string;
  created_at: string;
  reference_number?: string;
  notes?: string;
  description?: string;
  creator_name?: string;
}

const PAYMENT_METHODS = [
  { value: 'all', label: 'Todos os Métodos' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'completed', label: 'Concluído' },
  { value: 'failed', label: 'Falhado' },
  { value: 'refunded', label: 'Estornado' },
];

export default function PaymentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && !['admin', 'secretary'].includes(user?.role || '')) {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadPayments();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Get all invoices first
      const invoices = await api.get<Array<{
        id: number;
        patient_id: number;
        patient_name?: string;
        invoice_lines?: Array<{ description?: string }>;
        notes?: string;
      }>>('/api/financial/invoices');
      
      // Get payments for each invoice
      const allPayments: Payment[] = [];
      
      for (const invoice of invoices) {
        try {
          const invoicePayments = await api.get<Payment[]>(`/api/financial/invoices/${invoice.id}/payments`);
          
          // Enrich payment data with invoice information
          const enrichedPayments = invoicePayments.map(payment => ({
            ...payment,
            patientId: invoice.patient_id,
            patientName: invoice.patient_name,
            description: invoice.invoice_lines?.[0]?.description || invoice.notes || 'Pagamento de fatura',
          }));
          
          allPayments.push(...enrichedPayments);
        } catch (error) {
          // Skip invoices without payments
          console.warn(`No payments for invoice ${invoice.id}`);
        }
      }
      
      // Sort by date (most recent first)
      allPayments.sort((a, b) => {
        const dateA = new Date(a.paid_at || a.created_at);
        const dateB = new Date(b.paid_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPayments(allPayments);
    } catch (error: any) {
      console.error("Failed to load payments:", error);
      toast.error("Erro ao carregar pagamentos", {
        description: error.message || "Não foi possível carregar os pagamentos"
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'pix':
        return <DollarSign className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <XCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      (payment.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(payment.patientId || '').includes(searchTerm) ||
      (payment.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handleRetryPayment = async (payment: Payment) => {
    try {
      // Update payment status to pending/retry
      await api.put(`/api/financial/payments/${payment.id}`, {
        status: 'pending'
      });
      toast.success("Pagamento marcado para retentativa");
      loadPayments();
    } catch (error: any) {
      toast.error("Erro ao atualizar pagamento", {
        description: error.message
      });
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: number, newStatus: 'completed' | 'failed' | 'refunded') => {
    try {
      await api.put(`/api/financial/payments/${paymentId}`, {
        status: newStatus
      });
      toast.success("Status do pagamento atualizado");
      loadPayments();
      setShowPaymentDialog(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar status", {
        description: error.message
      });
    }
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (isLoading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Pagamentos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie pagamentos e transações de pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadPayments}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => {
            // Export payments as JSON
            const data = payments.map(p => ({
              id: p.id,
              paciente: p.patientName || `Paciente #${p.patientId}`,
              valor: formatCurrency(p.amount),
              metodo: p.method,
              status: p.status,
              data: format(new Date(p.paid_at || p.created_at), "dd/MM/yyyy HH:mm"),
              referencia: p.reference_number || '-',
            }));
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pagamentos_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success("Pagamentos exportados!");
          }}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/financeiro/faturas')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.length} transações
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(completedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.filter(p => p.status === 'completed').length} concluídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.filter(p => p.status === 'pending').length} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar pagamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Método de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações de Pagamento</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as transações de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.patientName || `Paciente #${payment.patientId}`}</div>
                      {payment.patientId && (
                        <div className="text-sm text-muted-foreground">
                          ID: {payment.patientId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(payment.method)}
                      <span className="capitalize">
                        {payment.method.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payment.status) as any}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.paid_at || payment.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{payment.description || payment.notes || 'Pagamento de fatura'}</div>
                      {payment.reference_number && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {payment.reference_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDialog(true);
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status === 'failed' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRetryPayment(payment)}
                          title="Tentar novamente"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loading && payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando pagamentos...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pagamento encontrado com os critérios selecionados</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informações completas da transação
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Paciente</Label>
                  <p className="text-sm font-medium">
                    {selectedPayment.patientName || `Paciente #${selectedPayment.patientId}`}
                  </p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Método de Pagamento</Label>
                  <p className="text-sm font-medium capitalize">
                    {selectedPayment.method.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedPayment.status) as any} className="mt-1">
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ml-1 capitalize">{selectedPayment.status}</span>
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Pagamento</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedPayment.paid_at || selectedPayment.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                {selectedPayment.reference_number && (
                  <div>
                    <Label>Número de Referência</Label>
                    <p className="text-sm font-medium">{selectedPayment.reference_number}</p>
                  </div>
                )}
              </div>
              {selectedPayment.description && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm font-medium">{selectedPayment.description}</p>
                </div>
              )}
              {selectedPayment.notes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm font-medium">{selectedPayment.notes}</p>
                </div>
              )}
              {selectedPayment.creator_name && (
                <div>
                  <Label>Criado por</Label>
                  <p className="text-sm font-medium">{selectedPayment.creator_name}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-4 border-t">
                {selectedPayment.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'completed')}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Concluído
                  </Button>
                )}
                {selectedPayment.status !== 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'failed')}
                    className="text-red-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Marcar como Falhado
                  </Button>
                )}
                {selectedPayment.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'refunded')}
                    className="text-blue-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Estornar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/financeiro/faturas?id=${selectedPayment.invoice_id}`)}
                >
                  Ver Fatura
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
