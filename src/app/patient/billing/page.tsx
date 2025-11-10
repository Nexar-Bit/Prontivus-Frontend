"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { financialApi } from "@/lib/financial-api";
import { normalizeError } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Receipt,
  Filter,
  Search,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: number;
  patient_id: number;
  appointment_id?: number;
  issue_date: string;
  due_date?: string;
  status: "draft" | "pending" | "paid" | "cancelled" | "overdue";
  total_amount: number;
  notes?: string;
  patient_name?: string;
  appointment_date?: string;
  invoice_lines?: Array<{
    id: number;
    description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    service_item?: {
      name: string;
      code?: string;
    };
    procedure?: {
      name: string;
    };
  }>;
  payments?: Array<{
    id: number;
    amount: number;
    method: string;
    status: string;
    paid_at?: string;
    created_at: string;
  }>;
}

export default function PatientBillingPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, dateFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const status = statusFilter !== "all" ? statusFilter as any : undefined;
      const data = await financialApi.getMyInvoices(status);
      
      // Filter by date if needed
      let filtered = data;
      if (dateFilter !== "all") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        filtered = data.filter(inv => {
          const issueDate = parseISO(inv.issue_date);
          switch (dateFilter) {
            case "this_month":
              return issueDate >= startOfMonth;
            case "this_year":
              return issueDate >= startOfYear;
            case "last_30_days":
              const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return issueDate >= thirtyDaysAgo;
            default:
              return true;
          }
        });
      }
      
      setInvoices(filtered as unknown as Invoice[]);
    } catch (error: any) {
      // Normalize error for logging
      const errorMessage = error?.message || normalizeError(error) || "Unknown error";
      const errorDetails = error?.data ? normalizeError(error.data) : '';
      
      console.error("Failed to load invoices:", {
        message: errorMessage,
        status: error?.status,
        details: errorDetails || undefined,
        fullError: error
      });
      
      toast.error("Erro ao carregar faturas", {
        description: errorMessage || "Não foi possível carregar suas faturas",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    
    const query = searchQuery.toLowerCase();
    return invoices.filter(inv => 
      inv.id.toString().includes(query) ||
      inv.notes?.toLowerCase().includes(query) ||
      inv.invoice_lines?.some(line => 
        line.description?.toLowerCase().includes(query) ||
        line.service_item?.name.toLowerCase().includes(query) ||
        line.procedure?.name.toLowerCase().includes(query)
      )
    );
  }, [invoices, searchQuery]);

  const totalAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  }, [invoices]);

  const paidAmount = useMemo(() => {
    return invoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  }, [invoices]);

  const pendingAmount = useMemo(() => {
    return invoices
      .filter(inv => inv.status === "pending" || inv.status === "overdue")
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      // Try to get invoice PDF if available
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/financial/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fatura-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Fatura baixada com sucesso");
      } else {
        toast.error("Não foi possível baixar a fatura");
      }
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Não foi possível baixar a fatura");
    }
  };

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const invoice = await financialApi.getInvoice(invoiceId);
      setSelectedInvoice(invoice as any);
    } catch (error: any) {
      toast.error("Erro ao carregar detalhes", {
        description: error.message || "Não foi possível carregar os detalhes da fatura",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Modern Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-7 w-7 text-blue-600" />
              </div>
              Faturas e Pagamentos
            </h1>
            <p className="text-muted-foreground text-sm">Visualize suas faturas e histórico de pagamentos</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Faturas</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">{invoices.length} fatura(s)</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoices.filter(inv => inv.status === "paid").length} fatura(s) paga(s)
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoices.filter(inv => inv.status === "pending" || inv.status === "overdue").length} fatura(s) pendente(s)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-l-4 border-l-blue-500 mb-6 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5" />
                </div>
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar faturas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                  title="Filtrar por status"
                  aria-label="Filtrar por status"
                >
                  <option value="all">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                  title="Filtrar por período"
                  aria-label="Filtrar por período"
                >
                  <option value="all">Todo o período</option>
                  <option value="last_30_days">Últimos 30 dias</option>
                  <option value="this_month">Este mês</option>
                  <option value="this_year">Este ano</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    Suas Faturas
                  </CardTitle>
                  <CardDescription>Lista de todas as suas faturas</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadInvoices} className="border-teal-300 text-teal-700 hover:bg-teal-50">
                  <Download className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-teal-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-teal-600" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data de Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const description = invoice.invoice_lines?.[0]?.description || 
                                          invoice.invoice_lines?.[0]?.service_item?.name ||
                                          invoice.invoice_lines?.[0]?.procedure?.name ||
                                          invoice.notes ||
                                          "Fatura";
                        
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">#{invoice.id}</TableCell>
                            <TableCell>
                              {format(parseISO(invoice.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {invoice.due_date ? (
                                format(parseISO(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{description}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(Number(invoice.total_amount))}
                            </TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewInvoice(invoice.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(invoice.id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
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
        </main>
      </div>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-blue-600 flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                Fatura #{selectedInvoice.id}
              </DialogTitle>
              <DialogDescription>
                Emitida em {format(parseISO(selectedInvoice.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold">{getStatusBadge(selectedInvoice.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(Number(selectedInvoice.total_amount))}
                  </p>
                </div>
                {selectedInvoice.due_date && (
                  <div>
                    <p className="text-sm text-gray-500">Data de Vencimento</p>
                    <p className="font-semibold">
                      {format(parseISO(selectedInvoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {selectedInvoice.appointment_date && (
                  <div>
                    <p className="text-sm text-gray-500">Consulta Relacionada</p>
                    <p className="font-semibold">
                      {format(parseISO(selectedInvoice.appointment_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Invoice Lines */}
              {selectedInvoice.invoice_lines && selectedInvoice.invoice_lines.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Itens da Fatura</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Preço Unitário</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.invoice_lines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>
                              {line.description || 
                               line.service_item?.name || 
                               line.procedure?.name || 
                               "Item"}
                              {line.service_item?.code && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({line.service_item.code})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(line.unit_price))}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(Number(line.total_price))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Payments */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Pagamentos</h3>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(Number(payment.amount))} - {payment.method}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.paid_at
                              ? format(parseISO(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : format(parseISO(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge
                          variant={payment.status === "completed" ? "default" : "outline"}
                        >
                          {payment.status === "completed" ? "Confirmado" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

