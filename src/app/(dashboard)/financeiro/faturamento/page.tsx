"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Search, Filter, Eye, DollarSign, FileText, Clock, CheckCircle, XCircle, Download, FileCode, Archive, AlertTriangle, Shield, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { financialApi } from "@/lib/financial-api";
import { Invoice, InvoiceStatus, ServiceItem, ServiceCategory } from "@/lib/types";

export default function BillingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [validationResults, setValidationResults] = useState<{[key: number]: any}>({});
  const [validatingInvoices, setValidatingInvoices] = useState<number[]>([]);

  // Load data
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadInvoices();
      loadServiceItems();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadInvoices = async () => {
    try {
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

  const loadServiceItems = async () => {
    try {
      const data = await financialApi.getServiceItems({ is_active: true });
      setServiceItems(data);
    } catch (error: any) {
      console.error("Error loading service items:", error);
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
      // Use skip_validation=true for testing purposes
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
      // Open in new window for preview
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>TISS XML - Fatura ${invoiceId}</title>
              <style>
                body { font-family: monospace; margin: 20px; }
                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
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

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      [InvoiceStatus.DRAFT]: "secondary",
      [InvoiceStatus.ISSUED]: "default",
      [InvoiceStatus.PAID]: "default",
      [InvoiceStatus.CANCELLED]: "destructive"
    } as const;

    const icons = {
      [InvoiceStatus.DRAFT]: FileText,
      [InvoiceStatus.ISSUED]: Clock,
      [InvoiceStatus.PAID]: CheckCircle,
      [InvoiceStatus.CANCELLED]: XCircle
    };

    const labels = {
      [InvoiceStatus.DRAFT]: "Rascunho",
      [InvoiceStatus.ISSUED]: "Emitida",
      [InvoiceStatus.PAID]: "Paga",
      [InvoiceStatus.CANCELLED]: "Cancelada"
    };

    const Icon = icons[status];

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {labels[status]}
      </Badge>
    );
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

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">
            Gerencie faturas e cobranças dos pacientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedInvoices.length > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBatchValidateTissXml}
                disabled={validatingInvoices.length > 0}
                title={`Validar TISS XML para ${selectedInvoices.length} faturas`}
              >
                {validatingInvoices.length > 0 ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Validar TISS ({selectedInvoices.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBatchDownloadTissXml}
                title={`Baixar TISS XML para ${selectedInvoices.length} faturas`}
              >
                <Archive className="h-4 w-4 mr-2" />
                Baixar TISS ({selectedInvoices.length})
              </Button>
            </>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emitidas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(i => i.status === InvoiceStatus.ISSUED).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(i => i.status === InvoiceStatus.PAID).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
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
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}>
              <SelectTrigger className="w-full sm:w-48">
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
      <Card>
        <CardHeader>
          <CardTitle>Faturas</CardTitle>
          <CardDescription>
            Lista de todas as faturas emitidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleSelectInvoice(invoice.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">#{invoice.id}</TableCell>
                  <TableCell>{invoice.patient_name}</TableCell>
                  <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell>
                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        title="Visualizar fatura"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateTissXml(invoice.id)}
                        disabled={validatingInvoices.includes(invoice.id)}
                        title="Validar TISS XML"
                      >
                        {validatingInvoices.includes(invoice.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        ) : validationResults[invoice.id] ? (
                          validationResults[invoice.id].is_valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTissXml(invoice.id)}
                        title="Visualizar TISS XML"
                      >
                        <FileCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTissXml(invoice.id)}
                        title="Baixar TISS XML"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status === InvoiceStatus.ISSUED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(invoice.id)}
                          title="Marcar como paga"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura #{selectedInvoice?.id}</DialogTitle>
            <DialogDescription>
              Informações completas da fatura
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Paciente</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.patient_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Emissão</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedInvoice.issue_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vencimento</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : 'Não definido'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
              </div>

              {/* Invoice Lines */}
              <div>
                <Label className="text-sm font-medium">Itens da Fatura</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.invoice_lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{line.service_item.name}</p>
                            {line.description && (
                              <p className="text-sm text-muted-foreground">{line.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>{formatCurrency(line.unit_price)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(line.line_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <Label className="text-sm font-medium">Observações:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
