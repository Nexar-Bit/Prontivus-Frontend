"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, Search, Calendar, DollarSign, RefreshCw, Download,
  Eye, FileText, TrendingUp, TrendingDown, Filter, User, Phone, Mail,
  CreditCard, Clock, AlertTriangle, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Percent, CheckCircle2, XCircle
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

interface DelinquencyItem {
  id: number;
  patient_id: number;
  patient_name: string;
  amount: number;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  issue_date: string | null;
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

export default function InadimplenciaPage() {
  const [loading, setLoading] = useState(true);
  const [delinquency, setDelinquency] = useState<DelinquencyItem[]>([]);
  const [filteredDelinquency, setFilteredDelinquency] = useState<DelinquencyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [daysFilter, setDaysFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<DelinquencyItem | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [minDaysOverdue, setMinDaysOverdue] = useState<number>(1);

  useEffect(() => {
    loadDelinquency();
  }, [minDaysOverdue]);

  useEffect(() => {
    filterDelinquency();
  }, [delinquency, searchTerm, daysFilter]);

  const loadDelinquency = async () => {
    try {
      setLoading(true);
      const data = await api.get<DelinquencyItem[]>(
        `/api/v1/financial/doctor/delinquency?min_days_overdue=${minDaysOverdue}`
      );
      setDelinquency(data);
    } catch (error: any) {
      console.error("Failed to load delinquency:", error);
      toast.error("Erro ao carregar inadimplência", {
        description: error?.message || error?.detail || "Não foi possível carregar a inadimplência",
      });
      setDelinquency([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceDetails = async (item: DelinquencyItem) => {
    try {
      setLoadingDetails(true);
      const invoice = await api.get<InvoiceDetail>(`/api/v1/financial/invoices/${item.id}`);
      setInvoiceDetail(invoice);
      
      // Load patient info
      try {
        const patient = await api.get<PatientInfo>(`/api/v1/patients/${item.patient_id}`);
        setPatientInfo(patient);
      } catch (error) {
        console.error("Failed to load patient info:", error);
      }
      
      setSelectedItem(item);
      setShowDetails(true);
    } catch (error: any) {
      console.error("Failed to load invoice details:", error);
      toast.error("Erro ao carregar detalhes", {
        description: error?.message || error?.detail || "Não foi possível carregar os detalhes",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterDelinquency = () => {
    let filtered = [...delinquency];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.patient_name.toLowerCase().includes(search) ||
        item.id.toString().includes(search)
      );
    }
    
    // Filter by days overdue
    if (daysFilter !== "all") {
      filtered = filtered.filter(item => {
        if (daysFilter === "0-30") {
          return item.days_overdue >= 0 && item.days_overdue <= 30;
        } else if (daysFilter === "31-60") {
          return item.days_overdue >= 31 && item.days_overdue <= 60;
        } else if (daysFilter === "61-90") {
          return item.days_overdue >= 61 && item.days_overdue <= 90;
        } else if (daysFilter === "90+") {
          return item.days_overdue > 90;
        }
        return true;
      });
    }
    
    setFilteredDelinquency(filtered);
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

  const getDaysOverdueBadge = (days: number) => {
    if (days > 90) {
      return <Badge className="bg-red-200 text-red-900 border-red-300">+90 dias</Badge>;
    } else if (days > 60) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">{days} dias</Badge>;
    } else if (days > 30) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{days} dias</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{days} dias</Badge>;
    }
  };

  const getPriorityBadge = (days: number) => {
    if (days > 90) {
      return <Badge className="bg-red-200 text-red-900">Crítico</Badge>;
    } else if (days > 60) {
      return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
    } else if (days > 30) {
      return <Badge className="bg-orange-100 text-orange-800">Média</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Baixa</Badge>;
    }
  };

  const exportData = () => {
    if (filteredDelinquency.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    
    // Create CSV content
    const csvRows = [];
    csvRows.push("ID,Paciente,Valor em Atraso,Valor Total,Valor Pago,Data Vencimento,Dias em Atraso,Prioridade");
    
    filteredDelinquency.forEach(item => {
      const priority = item.days_overdue > 90 ? "Crítico" :
                      item.days_overdue > 60 ? "Alta" :
                      item.days_overdue > 30 ? "Média" : "Baixa";
      csvRows.push([
        item.id,
        item.patient_name,
        item.amount.toFixed(2),
        item.total_amount.toFixed(2),
        item.paid_amount.toFixed(2),
        formatDate(item.due_date),
        item.days_overdue,
        priority
      ].join(","));
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `inadimplencia-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Dados exportados com sucesso!");
  };

  // Calculate statistics
  const stats = {
    total: delinquency.length,
    totalAmount: delinquency.reduce((sum, item) => sum + item.amount, 0),
    avgDaysOverdue: delinquency.length > 0
      ? Math.round(delinquency.reduce((sum, item) => sum + item.days_overdue, 0) / delinquency.length)
      : 0,
    critical: delinquency.filter(item => item.days_overdue > 90).length,
    criticalAmount: delinquency
      .filter(item => item.days_overdue > 90)
      .reduce((sum, item) => sum + item.amount, 0),
    high: delinquency.filter(item => item.days_overdue > 60 && item.days_overdue <= 90).length,
    highAmount: delinquency
      .filter(item => item.days_overdue > 60 && item.days_overdue <= 90)
      .reduce((sum, item) => sum + item.amount, 0),
    medium: delinquency.filter(item => item.days_overdue > 30 && item.days_overdue <= 60).length,
    mediumAmount: delinquency
      .filter(item => item.days_overdue > 30 && item.days_overdue <= 60)
      .reduce((sum, item) => sum + item.amount, 0),
    low: delinquency.filter(item => item.days_overdue <= 30).length,
    lowAmount: delinquency
      .filter(item => item.days_overdue <= 30)
      .reduce((sum, item) => sum + item.amount, 0),
  };

  // Aging buckets
  const agingBuckets = {
    "0-30": filteredDelinquency.filter(item => item.days_overdue >= 0 && item.days_overdue <= 30),
    "31-60": filteredDelinquency.filter(item => item.days_overdue >= 31 && item.days_overdue <= 60),
    "61-90": filteredDelinquency.filter(item => item.days_overdue >= 61 && item.days_overdue <= 90),
    "90+": filteredDelinquency.filter(item => item.days_overdue > 90),
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
            <AlertCircle className="h-8 w-8 text-red-600" />
            Inadimplência
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie contas em atraso e acompanhe a inadimplência dos pacientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={filteredDelinquency.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDelinquency}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total} {stats.total === 1 ? "conta" : "contas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Média de Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.avgDaysOverdue} dias
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tempo médio de atraso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Crítico (+90 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {formatCurrency(stats.criticalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.critical} {stats.critical === 1 ? "conta crítica" : "contas críticas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alta (61-90 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.highAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.high} {stats.high === 1 ? "conta" : "contas"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Relatório de Envelhecimento
          </CardTitle>
          <CardDescription>
            Distribuição de contas por faixa de atraso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(agingBuckets).map(([range, items]) => {
              const total = items.reduce((sum, item) => sum + item.amount, 0);
              const percentage = stats.totalAmount > 0
                ? (total / stats.totalAmount) * 100
                : 0;
              
              return (
                <Card key={range} className={
                  range === "90+" ? "border-red-300 bg-red-50" :
                  range === "61-90" ? "border-orange-300 bg-orange-50" :
                  range === "31-60" ? "border-yellow-300 bg-yellow-50" :
                  "border-green-300 bg-green-50"
                }>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">{range} dias</div>
                    <div className={`text-2xl font-bold mb-1 ${
                      range === "90+" ? "text-red-700" :
                      range === "61-90" ? "text-orange-700" :
                      range === "31-60" ? "text-yellow-700" :
                      "text-green-700"
                    }`}>
                      {formatCurrency(total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {items.length} {items.length === 1 ? "conta" : "contas"} ({percentage.toFixed(1)}%)
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Faixa de Atraso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="0-30">0-30 dias</SelectItem>
                  <SelectItem value="31-60">31-60 dias</SelectItem>
                  <SelectItem value="61-90">61-90 dias</SelectItem>
                  <SelectItem value="90+">+90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={minDaysOverdue.toString()} onValueChange={(v) => {
                setMinDaysOverdue(parseInt(v));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Dias Mínimos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ dias</SelectItem>
                  <SelectItem value="7">7+ dias</SelectItem>
                  <SelectItem value="30">30+ dias</SelectItem>
                  <SelectItem value="60">60+ dias</SelectItem>
                  <SelectItem value="90">90+ dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delinquency Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contas Inadimplentes</CardTitle>
              <CardDescription>
                {filteredDelinquency.length} {filteredDelinquency.length === 1 ? "conta encontrada" : "contas encontradas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDelinquency.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Valor em Atraso</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias em Atraso</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelinquency.map((item) => (
                    <TableRow 
                      key={item.id}
                      className={
                        item.days_overdue > 90 ? "bg-red-50" :
                        item.days_overdue > 60 ? "bg-orange-50" :
                        item.days_overdue > 30 ? "bg-yellow-50" :
                        ""
                      }
                    >
                      <TableCell className="font-medium">#{item.id}</TableCell>
                      <TableCell className="font-medium">{item.patient_name}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(item.paid_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(item.due_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDaysOverdueBadge(item.days_overdue)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(item.days_overdue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadInvoiceDetails(item)}
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
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {searchTerm || daysFilter !== "all"
                  ? "Nenhuma conta encontrada com os filtros aplicados"
                  : "Nenhuma conta inadimplente encontrada"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || daysFilter !== "all"
                  ? "Tente ajustar os filtros ou limpar a busca"
                  : "Todos os pacientes estão em dia com os pagamentos"}
              </p>
              {(searchTerm || daysFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setDaysFilter("all");
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
            <DialogTitle>Detalhes da Conta Inadimplente</DialogTitle>
            <DialogDescription>
              {selectedItem && `Fatura #${selectedItem.id} - ${selectedItem.patient_name}`}
            </DialogDescription>
          </DialogHeader>
          {invoiceDetail && selectedItem && (
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
                    <div>
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Inadimplente
                      </Badge>
                    </div>
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
                    <div className="text-sm text-gray-600 mb-1">Valor em Atraso</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedItem.amount)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Dias em Atraso</div>
                    <div className="flex items-center gap-2">
                      {getDaysOverdueBadge(selectedItem.days_overdue)}
                      {getPriorityBadge(selectedItem.days_overdue)}
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
            {selectedItem?.appointment_id && (
              <Link href={`/medico/atendimento/${selectedItem.appointment_id}`}>
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
