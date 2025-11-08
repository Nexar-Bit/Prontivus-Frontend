"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  FileCode, 
  Archive, 
  AlertTriangle, 
  Shield, 
  Zap,
  Loader2,
  RefreshCw,
  MoreVertical,
  Edit,
  Receipt,
  TrendingUp,
  User,
  Calendar,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { financialApi } from "@/lib/financial-api";
import { Invoice, InvoiceStatus } from "@/lib/types";

export default function BillingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [validationResults, setValidationResults] = useState<{[key: number]: any}>({});
  const [validatingInvoices, setValidatingInvoices] = useState<number[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadInvoices();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getInvoices();
      setInvoices(data);
    } catch (error: any) {
      toast.error("Erro ao carregar faturas", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  const handleMarkPaid = async (invoiceId: number) => {
    try {
      await financialApi.markInvoicePaid(invoiceId);
      toast.success("Fatura marcada como paga!");
      loadInvoices();
    } catch (error: any) {
      toast.error("Erro ao marcar fatura como paga", {
        description: error.message
      });
    }
  };

  const handleDownloadTissXml = async (invoiceId: number) => {
    try {
      const blob = await financialApi.downloadTissXml(invoiceId, true);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiss_invoice_${invoiceId.toString().padStart(6, '0')}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Arquivo TISS XML baixado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao baixar arquivo TISS XML", {
        description: error.message
      });
    }
  };

  const handlePreviewTissXml = async (invoiceId: number) => {
    try {
      const xmlContent = await financialApi.previewTissXml(invoiceId);
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>TISS XML - Fatura ${invoiceId}</title>
              <style>
                body { font-family: monospace; margin: 20px; background: #f5f5f5; }
                pre { background: white; padding: 15px; border-radius: 5px; overflow-x: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <h2>TISS XML - Fatura ${invoiceId}</h2>
              <pre>${xmlContent}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error: any) {
      toast.error("Erro ao visualizar TISS XML", {
        description: error.message
      });
    }
  };

  const handleBatchDownloadTissXml = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Selecione pelo menos uma fatura para baixar");
      return;
    }

    try {
      const blob = await financialApi.downloadBatchTissXml(selectedInvoices);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiss_batch_${selectedInvoices.length}_invoices.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Arquivo ZIP com ${selectedInvoices.length} TISS XMLs baixado com sucesso!`);
      setSelectedInvoices([]);
    } catch (error: any) {
      toast.error("Erro ao baixar arquivos TISS XML em lote", {
        description: error.message
      });
    }
  };

  const handleSelectInvoice = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    }
  };

  const handleValidateTissXml = async (invoiceId: number) => {
    try {
      setValidatingInvoices(prev => [...prev, invoiceId]);
      const result = await financialApi.validateTissXml(invoiceId);
      setValidationResults(prev => ({
        ...prev,
        [invoiceId]: result
      }));
      
      if (result.is_valid) {
        toast.success("TISS XML válido!", {
          description: "O arquivo está em conformidade com o padrão TISS 3.05.02"
        });
      } else {
        toast.error("TISS XML inválido", {
          description: `${result.total_errors} erro(s) encontrado(s)`
        });
      }
    } catch (error: any) {
      toast.error("Erro ao validar TISS XML", {
        description: error.message
      });
    } finally {
      setValidatingInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleBatchValidateTissXml = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Selecione pelo menos uma fatura para validar");
      return;
    }

    try {
      setValidatingInvoices(prev => [...prev, ...selectedInvoices]);
      const results: {[key: number]: any} = {};
      let validCount = 0;
      let invalidCount = 0;

      for (const invoiceId of selectedInvoices) {
        try {
          const result = await financialApi.validateTissXml(invoiceId);
          results[invoiceId] = result;
          if (result.is_valid) {
            validCount++;
          } else {
            invalidCount++;
          }
        } catch (error) {
          results[invoiceId] = { is_valid: false, errors: [{ message: "Erro na validação" }] };
          invalidCount++;
        }
      }

      setValidationResults(prev => ({ ...prev, ...results }));
      toast.success(`Validação concluída: ${validCount} válido(s), ${invalidCount} inválido(s)`);
    } catch (error: any) {
      toast.error("Erro ao validar TISS XMLs em lote", {
        description: error.message
      });
    } finally {
      setValidatingInvoices(prev => prev.filter(id => !selectedInvoices.includes(id)));
    }
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    const configs = {
      [InvoiceStatus.DRAFT]: {
        label: "Rascunho",
        color: "text-slate-700",
        bgColor: "bg-slate-100 hover:bg-slate-200",
        icon: FileText,
        borderColor: "border-slate-300"
      },
      [InvoiceStatus.ISSUED]: {
        label: "Emitida",
        color: "text-blue-700",
        bgColor: "bg-blue-100 hover:bg-blue-200",
        icon: Clock,
        borderColor: "border-blue-300"
      },
      [InvoiceStatus.PAID]: {
        label: "Paga",
        color: "text-green-700",
        bgColor: "bg-green-100 hover:bg-green-200",
        icon: CheckCircle,
        borderColor: "border-green-300"
      },
      [InvoiceStatus.CANCELLED]: {
        label: "Cancelada",
        color: "text-red-700",
        bgColor: "bg-red-100 hover:bg-red-200",
        icon: XCircle,
        borderColor: "border-red-300"
      }
    };
    return configs[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const issued = invoices.filter(i => i.status === InvoiceStatus.ISSUED).length;
    const paid = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const paidAmount = invoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    return { total, issued, paid, totalAmount, paidAmount };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando faturas...</p>
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
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg text-white shadow-lg">
              <Receipt className="h-6 w-6" />
            </div>
            Faturamento
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gerencie faturas, cobranças e integração TISS
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedInvoices.length > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBatchValidateTissXml}
                disabled={validatingInvoices.length > 0}
                className="bg-white"
              >
                {validatingInvoices.length > 0 ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Validar ({selectedInvoices.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBatchDownloadTissXml}
                className="bg-white"
              >
                <Archive className="h-4 w-4 mr-2" />
                Baixar TISS ({selectedInvoices.length})
              </Button>
            </>
          )}
          <Button 
            onClick={() => router.push('/financeiro/faturamento/new')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
          <Button 
            variant="outline" 
            onClick={loadInvoices} 
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Faturas</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Emitidas</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.issued}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pagas</p>
                <p className="text-2xl font-bold text-green-700">{stats.paid}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Recebido</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-emerald-700" />
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por paciente ou ID da fatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value={InvoiceStatus.DRAFT}>Rascunho</SelectItem>
                <SelectItem value={InvoiceStatus.ISSUED}>Emitida</SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>Paga</SelectItem>
                <SelectItem value={InvoiceStatus.CANCELLED}>Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Faturas</CardTitle>
              <CardDescription>
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'fatura encontrada' : 'faturas encontradas'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Receipt className="h-12 w-12 opacity-50" />
              <p className="font-medium text-lg">Nenhuma fatura encontrada</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const StatusIcon = statusConfig.icon;
                    const isOverdue = invoice.due_date && 
                      new Date(invoice.due_date) < new Date() && 
                      invoice.status !== InvoiceStatus.PAID && 
                      invoice.status !== InvoiceStatus.CANCELLED;
                    
                    return (
                      <TableRow 
                        key={invoice.id}
                        className={cn(
                          "hover:bg-slate-50 transition-colors",
                          isOverdue && "bg-orange-50/50"
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.includes(invoice.id)}
                            onCheckedChange={() => handleSelectInvoice(invoice.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">#{invoice.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {invoice.patient_name || `Paciente #${invoice.patient_id}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(invoice.issue_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? (
                            <div className={cn(
                              "flex items-center gap-2",
                              isOverdue && "text-orange-600 font-medium"
                            )}>
                              <Calendar className="h-4 w-4" />
                              {formatDate(invoice.due_date)}
                              {isOverdue && (
                                <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-200 text-xs">
                                  Vencida
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit",
                              statusConfig.color,
                              statusConfig.bgColor,
                              "border-0"
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                              title="Visualizar fatura"
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
                                <DropdownMenuItem onClick={() => handlePreviewTissXml(invoice.id)}>
                                  <FileCode className="h-4 w-4 mr-2" />
                                  Visualizar TISS XML
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadTissXml(invoice.id)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar TISS XML
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleValidateTissXml(invoice.id)}
                                  disabled={validatingInvoices.includes(invoice.id)}
                                >
                                  {validatingInvoices.includes(invoice.id) ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : validationResults[invoice.id] ? (
                                    validationResults[invoice.id].is_valid ? (
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    )
                                  ) : (
                                    <Shield className="h-4 w-4 mr-2" />
                                  )}
                                  Validar TISS XML
                                </DropdownMenuItem>
                                {invoice.status === InvoiceStatus.ISSUED && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleMarkPaid(invoice.id)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Marcar como Paga
                                    </DropdownMenuItem>
                                  </>
                                )}
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

      {/* Invoice Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Fatura #{selectedInvoice?.id}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos da fatura
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Paciente</Label>
                    <p className="text-base font-semibold mt-1">{selectedInvoice.patient_name}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Data de Emissão</Label>
                    <p className="text-base font-semibold mt-1">{formatDate(selectedInvoice.issue_date)}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Vencimento</Label>
                    <p className="text-base font-semibold mt-1">
                      {selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : 'Não definido'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {(() => {
                        const config = getStatusConfig(selectedInvoice.status);
                        const Icon = config.icon;
                        return (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit",
                              config.color,
                              config.bgColor,
                              "border-0"
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Invoice Lines */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Itens da Fatura</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.invoice_lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.service_item?.name || 'Item'}</p>
                              {line.description && (
                                <p className="text-sm text-muted-foreground mt-1">{line.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{line.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.unit_price)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(line.line_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-3xl font-bold text-emerald-600">{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <Card className="border-slate-200 bg-slate-50">
                  <CardContent className="p-4">
                    <Label className="text-sm font-semibold mb-2 block">Observações:</Label>
                    <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
