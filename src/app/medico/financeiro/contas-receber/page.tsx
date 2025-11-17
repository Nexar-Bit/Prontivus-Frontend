"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ReceiptText, Search, Calendar, DollarSign, RefreshCw, Download,
  Eye, FileText, AlertCircle, CheckCircle2, Clock, TrendingUp,
  TrendingDown, Filter, User, Phone, Mail, MapPin, CreditCard,
  Banknote, CalendarDays, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Receivable {
  id: number;
  patient_id: number;
  patient_name: string;
  amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  issue_date: string | null;
  status: string;
  invoice_status: string;
  days_overdue: number;
  appointment_id: number | null;
}

interface InvoiceDetail {
  id: number;
  patient_id: number;
  appointment_id: number | null;
  total_amount: number;
  issue_date: string | null;
  due_date: string | null;
  status: string;
  notes: string | null;
  patient_name?: string;
  invoice_lines?: any[];
  payments?: PaymentDetail[];
}

interface PaymentDetail {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes: string | null;
}

interface PatientInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
}

export default function ContasReceberPage() {
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filteredReceivables, setFilteredReceivables] = useState<Receivable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadReceivables();
  }, []);

  useEffect(() => {
    filterReceivables();
  }, [receivables, searchTerm, statusFilter]);

  const loadReceivables = async () => {
    try {
      setLoading(true);
      const data = await api.get<Receivable[]>("/api/v1/financial/doctor/accounts-receivable");
      setReceivables(data);
    } catch (error: any) {
      console.error("Failed to load receivables:", error);
      toast.error("Erro ao carregar contas a receber", {
        description: error?.message || error?.detail || "Não foi possível carregar as contas a receber",
      });
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceDetails = async (receivable: Receivable) => {
    try {
      setLoadingDetails(true);
      const invoice = await api.get<InvoiceDetail>(`/api/v1/financial/invoices/${receivable.id}`);
      setInvoiceDetail(invoice);
      
      // Load patient info
      try {
        const patient = await api.get<PatientInfo>(`/api/v1/patients/${receivable.patient_id}`);
        setPatientInfo(patient);
      } catch (error) {
        console.error("Failed to load patient info:", error);
      }
      
      setSelectedReceivable(receivable);
      setShowDetails(true);
    } catch (error: any) {
      console.error("Failed to load invoice details:", error);
      toast.error("Erro ao carregar detalhes", {
        description: error?.message || error?.detail || "Não foi possível carregar os detalhes da fatura",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterReceivables = () => {
    let filtered = [...receivables];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.patient_name.toLowerCase().includes(search) ||
        rec.id.toString().includes(search)
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(rec => {
        if (statusFilter === "paid") {
          return rec.status === "Pago";
        } else if (statusFilter === "pending") {
          return rec.status === "Pendente";
        } else if (statusFilter === "overdue") {
          return rec.status === "Atrasado";
        }
        return true;
      });
    }
    
    setFilteredReceivables(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string, daysOverdue: number) => {
    if (status === "Pago") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
    } else if (status === "Atrasado") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Atrasado {daysOverdue > 0 ? `(${daysOverdue} dias)` : ""}
        </Badge>
      );
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    }
  };

  const getAgingBadge = (daysOverdue: number) => {
    if (daysOverdue <= 0) {
      return <Badge className="bg-green-100 text-green-800">Em dia</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">0-30 dias</Badge>;
    } else if (daysOverdue <= 60) {
      return <Badge className="bg-orange-100 text-orange-800">31-60 dias</Badge>;
    } else if (daysOverdue <= 90) {
      return <Badge className="bg-red-100 text-red-800">61-90 dias</Badge>;
    } else {
      return <Badge className="bg-red-200 text-red-900">+90 dias</Badge>;
    }
  };

  const exportData = () => {
    if (filteredReceivables.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    
    // Create CSV content
    const csvRows = [];
    csvRows.push("ID,Paciente,Valor Total,Valor Pago,Valor Pendente,Data Vencimento,Status,Dias em Atraso");
    
    filteredReceivables.forEach(rec => {
      csvRows.push([
        rec.id,
        rec.patient_name,
        rec.amount.toFixed(2),
        rec.paid_amount.toFixed(2),
        rec.outstanding_amount.toFixed(2),
        formatDate(rec.due_date),
        rec.status,
        rec.days_overdue
      ].join(","));
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `contas-receber-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Dados exportados com sucesso!");
  };

  // Calculate statistics
  const stats = {
    total: receivables.length,
    totalAmount: receivables.reduce((sum, r) => sum + r.amount, 0),
    totalPaid: receivables.reduce((sum, r) => sum + r.paid_amount, 0),
    totalOutstanding: receivables.reduce((sum, r) => sum + r.outstanding_amount, 0),
    overdue: receivables.filter(r => r.status === "Atrasado").length,
    overdueAmount: receivables
      .filter(r => r.status === "Atrasado")
      .reduce((sum, r) => sum + r.outstanding_amount, 0),
    pending: receivables.filter(r => r.status === "Pendente").length,
    paid: receivables.filter(r => r.status === "Pago").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ReceiptText className="h-8 w-8 text-green-600" />
            Contas a Receber
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as contas a receber dos seus atendimentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={filteredReceivables.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReceivables}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total} {stats.total === 1 ? "conta" : "contas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(stats.totalPaid)} já recebido
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.overdueAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overdue} {stats.overdue === 1 ? "conta atrasada" : "contas atrasadas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contas pendentes de pagamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente ou ID da fatura..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receivables Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                {filteredReceivables.length} {filteredReceivables.length === 1 ? "conta encontrada" : "contas encontradas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReceivables.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Valor Pendente</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Envelhecimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable) => (
                    <TableRow 
                      key={receivable.id}
                      className={receivable.status === "Atrasado" ? "bg-red-50" : ""}
                    >
                      <TableCell className="font-medium">#{receivable.id}</TableCell>
                      <TableCell className="font-medium">{receivable.patient_name}</TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(receivable.amount)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(receivable.paid_amount)}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(receivable.outstanding_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(receivable.due_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAgingBadge(receivable.days_overdue)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receivable.status, receivable.days_overdue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadInvoiceDetails(receivable)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ReceiptText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhuma conta encontrada com os filtros aplicados"
                  : "Nenhuma conta a receber encontrada"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros ou limpar a busca"
                  : "Suas contas a receber aparecerão aqui quando houver faturas"}
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura</DialogTitle>
            <DialogDescription>
              {selectedReceivable && `Fatura #${selectedReceivable.id} - ${selectedReceivable.patient_name}`}
            </DialogDescription>
          </DialogHeader>
          {invoiceDetail && selectedReceivable && (
            <Tabs defaultValue="invoice" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="invoice">Fatura</TabsTrigger>
                <TabsTrigger value="payments">
                  Pagamentos ({invoiceDetail.payments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="patient">Paciente</TabsTrigger>
              </TabsList>

              <TabsContent value="invoice" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">ID da Fatura</div>
                    <div className="font-semibold">#{invoiceDetail.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div>{getStatusBadge(selectedReceivable.status, selectedReceivable.days_overdue)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Data de Emissão</div>
                    <div className="font-medium">{formatDate(invoiceDetail.issue_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Data de Vencimento</div>
                    <div className="font-medium">{formatDate(invoiceDetail.due_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Valor Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(invoiceDetail.total_amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Valor Pendente</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(selectedReceivable.outstanding_amount)}
                    </div>
                  </div>
                </div>
                {invoiceDetail.notes && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Observações</div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {invoiceDetail.notes}
                    </div>
                  </div>
                )}
                {invoiceDetail.invoice_lines && invoiceDetail.invoice_lines.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Itens da Fatura</div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Valor Unitário</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceDetail.invoice_lines.map((line: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{line.description || line.service_item_name || "Item"}</TableCell>
                              <TableCell>{line.quantity || 1}</TableCell>
                              <TableCell>{formatCurrency(line.unit_price || 0)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency((line.unit_price || 0) * (line.quantity || 1))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {invoiceDetail.payments && invoiceDetail.payments.length > 0 ? (
                  <div className="space-y-3">
                    {invoiceDetail.payments.map((payment: PaymentDetail) => (
                      <Card key={payment.id} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <span className="font-semibold">
                                  {formatCurrency(payment.amount)}
                                </span>
                                {payment.status === "completed" && (
                                  <Badge className="bg-green-100 text-green-800">Pago</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>
                                  <strong>Data:</strong> {formatDateTime(payment.payment_date)}
                                </div>
                                <div>
                                  <strong>Método:</strong> {payment.payment_method || "N/A"}
                                </div>
                                {payment.notes && (
                                  <div>
                                    <strong>Observações:</strong> {payment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum pagamento registrado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="patient" className="space-y-4">
                {patientInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Nome Completo</div>
                      <div className="font-medium">
                        {patientInfo.first_name} {patientInfo.last_name}
                      </div>
                    </div>
                    {patientInfo.cpf && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">CPF</div>
                        <div className="font-medium">{patientInfo.cpf}</div>
                      </div>
                    )}
                    {patientInfo.email && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          E-mail
                        </div>
                        <div className="font-medium">{patientInfo.email}</div>
                      </div>
                    )}
                    {patientInfo.phone && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Telefone
                        </div>
                        <div className="font-medium">{patientInfo.phone}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Informações do paciente não disponíveis</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
            {selectedReceivable?.appointment_id && (
              <Link href={`/medico/atendimento/${selectedReceivable.appointment_id}`}>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Atendimento
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
