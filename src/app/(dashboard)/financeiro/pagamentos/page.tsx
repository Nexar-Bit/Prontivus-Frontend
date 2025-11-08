"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  TrendingUp,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  FileText,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const paymentMethodConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  credit_card: {
    label: 'Cartão de Crédito',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  debit_card: {
    label: 'Cartão de Débito',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100'
  },
  pix: {
    label: 'PIX',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  cash: {
    label: 'Dinheiro',
    icon: <Wallet className="h-4 w-4" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  bank_transfer: {
    label: 'Transferência',
    icon: <Receipt className="h-4 w-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  completed: {
    label: 'Concluído',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100 hover:bg-green-200'
  },
  pending: {
    label: 'Pendente',
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 hover:bg-yellow-200'
  },
  failed: {
    label: 'Falhado',
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-red-700',
    bgColor: 'bg-red-100 hover:bg-red-200'
  },
  refunded: {
    label: 'Estornado',
    icon: <ArrowDownRight className="h-3.5 w-3.5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 hover:bg-blue-200'
  },
  cancelled: {
    label: 'Cancelado',
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 hover:bg-slate-200'
  },
};

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
      
      const invoices = await api.get<Array<{
        id: number;
        patient_id: number;
        patient_name?: string;
        invoice_lines?: Array<{ description?: string }>;
        notes?: string;
      }>>('/api/financial/invoices');
      
      const allPayments: Payment[] = [];
      
      for (const invoice of invoices) {
        try {
          const invoicePayments = await api.get<Payment[]>(`/api/financial/invoices/${invoice.id}/payments`);
          
          const enrichedPayments = invoicePayments.map(payment => ({
            ...payment,
            patientId: invoice.patient_id,
            patientName: invoice.patient_name,
            description: invoice.invoice_lines?.[0]?.description || invoice.notes || 'Pagamento de fatura',
          }));
          
          allPayments.push(...enrichedPayments);
        } catch (error) {
          console.warn(`No payments for invoice ${invoice.id}`);
        }
      }
      
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      (payment.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(payment.patientId || '').includes(searchTerm) ||
      (payment.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesMethod && matchesStatus;
  });
  }, [payments, searchTerm, methodFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const completed = filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = filteredPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const failed = filteredPayments
      .filter(p => p.status === 'failed')
      .reduce((sum, p) => sum + p.amount, 0);
    const completedCount = filteredPayments.filter(p => p.status === 'completed').length;
    const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;
    
    return { total, completed, pending, failed, completedCount, pendingCount, totalCount: filteredPayments.length };
  }, [filteredPayments]);

  const handleRetryPayment = async (payment: Payment) => {
    try {
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

  const handleExportPayments = () => {
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
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <CreditCard className="h-6 w-6" />
            </div>
            Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie pagamentos e transações de pacientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadPayments}
            disabled={loading}
            className="bg-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPayments}
            className="bg-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={() => router.push('/financeiro/faturamento')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(stats.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.totalCount} transações</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Concluídos</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.completed)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.completedCount} concluídos</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.pending)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingCount} pendentes</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Falhados</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(stats.failed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredPayments.filter(p => p.status === 'failed').length} falhados
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.totalCount > 0 
                    ? ((stats.completedCount / stats.totalCount) * 100).toFixed(1) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Taxa de conclusão</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por paciente, descrição ou referência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white">
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
              <SelectTrigger className="w-full md:w-48 bg-white">
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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Transações de Pagamento</CardTitle>
          <CardDescription>
                {filteredPayments.length} {filteredPayments.length === 1 ? 'transação encontrada' : 'transações encontradas'}
          </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <CreditCard className="h-12 w-12 opacity-50" />
              <p className="font-medium text-lg">Nenhum pagamento encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {filteredPayments.map((payment) => {
                    const methodInfo = paymentMethodConfig[payment.method] || paymentMethodConfig.credit_card;
                    const statusInfo = statusConfig[payment.status] || statusConfig.pending;
                    
                    return (
                      <TableRow 
                        key={payment.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                  <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <User className="h-3.5 w-3.5 text-blue-700" />
                            </div>
                    <div>
                              <div className="font-medium">
                                {payment.patientName || `Paciente #${payment.patientId}`}
                              </div>
                      {payment.patientId && (
                                <div className="text-xs text-muted-foreground">
                          ID: {payment.patientId}
                        </div>
                      )}
                    </div>
                          </div>
                  </TableCell>
                  <TableCell>
                          <div className="font-semibold text-green-700">
                            {formatCurrency(payment.amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit",
                              methodInfo.color,
                              methodInfo.bgColor,
                              "border-0"
                            )}
                          >
                            {methodInfo.icon}
                            {methodInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit",
                              statusInfo.color,
                              statusInfo.bgColor,
                              "border-0"
                            )}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(payment.paid_at || payment.created_at)}
                            </span>
                          </div>
                  </TableCell>
                  <TableCell>
                    <div>
                            <div className="text-sm font-medium">
                              {payment.description || payment.notes || 'Pagamento de fatura'}
                            </div>
                      {payment.reference_number && (
                              <div className="text-xs text-muted-foreground mt-1">
                          Ref: {payment.reference_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                          <div className="flex items-center justify-end gap-1">
                      <Button 
                              variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDialog(true);
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                      {payment.status === 'failed' && (
                                  <DropdownMenuItem onClick={() => handleRetryPayment(payment)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Tentar Novamente
                                  </DropdownMenuItem>
                                )}
                                {payment.status !== 'completed' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Concluído
                                  </DropdownMenuItem>
                                )}
                                {payment.status !== 'failed' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdatePaymentStatus(payment.id, 'failed')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Marcar como Falhado
                                  </DropdownMenuItem>
                                )}
                                {payment.status === 'completed' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdatePaymentStatus(payment.id, 'refunded')}
                                    className="text-blue-600"
                                  >
                                    <ArrowDownRight className="h-4 w-4 mr-2" />
                                    Estornar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => router.push(`/financeiro/faturamento?id=${payment.invoice_id}`)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver Fatura
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Detalhes do Pagamento
            </DialogTitle>
            <DialogDescription>
              Informações completas da transação
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Paciente</Label>
                    <p className="text-base font-semibold mt-1">
                    {selectedPayment.patientName || `Paciente #${selectedPayment.patientId}`}
                  </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Valor</Label>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Método de Pagamento</Label>
                    <div className="mt-1">
                      {(() => {
                        const methodInfo = paymentMethodConfig[selectedPayment.method] || paymentMethodConfig.credit_card;
                        return (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit",
                              methodInfo.color,
                              methodInfo.bgColor,
                              "border-0"
                            )}
                          >
                            {methodInfo.icon}
                            {methodInfo.label}
                          </Badge>
                        );
                      })()}
                </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {(() => {
                        const statusInfo = statusConfig[selectedPayment.status] || statusConfig.pending;
                        return (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit",
                              statusInfo.color,
                              statusInfo.bgColor,
                              "border-0"
                            )}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                  </Badge>
                        );
                      })()}
                </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data do Pagamento</Label>
                  <p className="text-sm font-semibold mt-1">
                    {formatDate(selectedPayment.paid_at || selectedPayment.created_at)}
                  </p>
                </div>
                {selectedPayment.reference_number && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Número de Referência</Label>
                    <p className="text-sm font-semibold mt-1">{selectedPayment.reference_number}</p>
                  </div>
                )}
              </div>

              {selectedPayment.description && (
                <Card className="border-slate-200 bg-slate-50">
                  <CardContent className="p-4">
                    <Label className="text-sm font-semibold mb-2 block">Descrição</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.description}</p>
                  </CardContent>
                </Card>
              )}

              {selectedPayment.notes && (
                <Card className="border-slate-200 bg-slate-50">
                  <CardContent className="p-4">
                    <Label className="text-sm font-semibold mb-2 block">Observações</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedPayment.creator_name && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Criado por</Label>
                  <p className="text-sm font-semibold mt-1">{selectedPayment.creator_name}</p>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedPayment.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'completed')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
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
                    className="text-red-600 border-red-200 hover:bg-red-50"
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
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    Estornar
                  </Button>
                )}
                {selectedPayment.status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetryPayment(selectedPayment)}
                    className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/financeiro/faturamento?id=${selectedPayment.invoice_id}`)}
                  className="ml-auto"
                >
                  <FileText className="h-4 w-4 mr-2" />
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
