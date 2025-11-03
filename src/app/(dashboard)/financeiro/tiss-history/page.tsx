"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Search, 
  Download, 
  Eye, 
  Calendar,
  FileCode,
  User,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TissHistoryEntry {
  id: string;
  invoiceId: number;
  patientName: string;
  generatedAt: string;
  generatedBy: string;
  status: 'success' | 'error';
  fileName: string;
  fileSize: number;
  errorMessage?: string;
  downloadCount: number;
  lastDownloaded?: string;
}

export default function TissHistoryPage() {
  const [historyEntries, setHistoryEntries] = useState<TissHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Load from localStorage (in a real app, this would be from the backend)
      const savedHistory = localStorage.getItem('tiss-history');
      if (savedHistory) {
        setHistoryEntries(JSON.parse(savedHistory));
      } else {
        // Generate sample data
        const sampleData: TissHistoryEntry[] = [
          {
            id: "1",
            invoiceId: 1,
            patientName: "João Silva",
            generatedAt: new Date().toISOString(),
            generatedBy: "admin@clinica.com",
            status: 'success',
            fileName: "tiss_invoice_000001.xml",
            fileSize: 15420,
            downloadCount: 2,
            lastDownloaded: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "2",
            invoiceId: 2,
            patientName: "Maria Santos",
            generatedAt: new Date(Date.now() - 86400000).toISOString(),
            generatedBy: "secretaria@clinica.com",
            status: 'success',
            fileName: "tiss_invoice_000002.xml",
            fileSize: 12850,
            downloadCount: 1,
            lastDownloaded: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "3",
            invoiceId: 3,
            patientName: "Pedro Costa",
            generatedAt: new Date(Date.now() - 172800000).toISOString(),
            generatedBy: "admin@clinica.com",
            status: 'error',
            fileName: "tiss_invoice_000003.xml",
            fileSize: 0,
            errorMessage: "Dados do paciente incompletos",
            downloadCount: 0
          }
        ];
        setHistoryEntries(sampleData);
        localStorage.setItem('tiss-history', JSON.stringify(sampleData));
      }
    } catch (error: any) {
      toast.error("Erro ao carregar histórico TISS", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Sucesso
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Erro
        </Badge>
      );
    }
  };

  const handleDownload = (entry: TissHistoryEntry) => {
    if (entry.status === 'error') {
      toast.error("Não é possível baixar arquivo com erro");
      return;
    }

    // Simulate download
    toast.success(`Baixando ${entry.fileName}...`);
    
    // Update download count
    const updatedEntries = historyEntries.map(e => 
      e.id === entry.id 
        ? { 
            ...e, 
            downloadCount: e.downloadCount + 1,
            lastDownloaded: new Date().toISOString()
          }
        : e
    );
    setHistoryEntries(updatedEntries);
    localStorage.setItem('tiss-history', JSON.stringify(updatedEntries));
  };

  const handleView = (entry: TissHistoryEntry) => {
    if (entry.status === 'error') {
      toast.error(`Erro: ${entry.errorMessage}`);
      return;
    }

    // Simulate XML preview
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>TISS XML - ${entry.fileName}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h2>TISS XML - ${entry.fileName}</h2>
            <p><strong>Paciente:</strong> ${entry.patientName}</p>
            <p><strong>Fatura:</strong> #${entry.invoiceId}</p>
            <p><strong>Gerado em:</strong> ${formatDate(entry.generatedAt)}</p>
            <hr>
            <pre>&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"&gt;
  &lt;ans:cabecalho&gt;
    &lt;ans:identificacaoTransacao&gt;
      &lt;ans:tipoTransacao&gt;ENVIO_LOTE_GUIAS&lt;/ans:tipoTransacao&gt;
      &lt;ans:sequencialTransacao&gt;1&lt;/ans:sequencialTransacao&gt;
      &lt;ans:dataRegistroTransacao&gt;${format(new Date(), 'yyyy-MM-dd')}&lt;/ans:dataRegistroTransacao&gt;
      &lt;ans:horaRegistroTransacao&gt;${format(new Date(), 'HH:mm:ss')}&lt;/ans:horaRegistroTransacao&gt;
    &lt;/ans:identificacaoTransacao&gt;
    &lt;ans:origem&gt;
      &lt;ans:identificacaoPrestador&gt;
        &lt;ans:codigoPrestadorNaOperadora&gt;001&lt;/ans:codigoPrestadorNaOperadora&gt;
        &lt;ans:cnpjPrestador&gt;12345678000199&lt;/ans:cnpjPrestador&gt;
        &lt;ans:nomePrestador&gt;Clínica Exemplo&lt;/ans:nomePrestador&gt;
      &lt;/ans:identificacaoPrestador&gt;
    &lt;/ans:origem&gt;
    &lt;ans:destino&gt;
      &lt;ans:registroANS&gt;000000&lt;/ans:registroANS&gt;
      &lt;ans:cnpjOperadora&gt;98765432000188&lt;/ans:cnpjOperadora&gt;
      &lt;ans:nomeOperadora&gt;Operadora Exemplo&lt;/ans:nomeOperadora&gt;
    &lt;/ans:destino&gt;
    &lt;ans:versaoPadrao&gt;3.03.00&lt;/ans:versaoPadrao&gt;
  &lt;/ans:cabecalho&gt;
  &lt;ans:prestadorParaOperadora&gt;
    &lt;ans:loteGuias&gt;
      &lt;ans:numeroLote&gt;${entry.invoiceId}&lt;/ans:numeroLote&gt;
      &lt;ans:guiasTISS&gt;
        &lt;!-- Conteúdo da guia TISS para fatura ${entry.invoiceId} --&gt;
      &lt;/ans:guiasTISS&gt;
    &lt;/ans:loteGuias&gt;
  &lt;/ans:prestadorParaOperadora&gt;
  &lt;ans:operadoraParaPrestador&gt;
    &lt;ans:protocoloRecebimento&gt;
      &lt;ans:identificacaoOperadora&gt;
        &lt;ans:registroANS&gt;000000&lt;/ans:registroANS&gt;
        &lt;ans:cnpjOperadora&gt;98765432000188&lt;/ans:cnpjOperadora&gt;
        &lt;ans:nomeOperadora&gt;Operadora Exemplo&lt;/ans:nomeOperadora&gt;
      &lt;/ans:identificacaoOperadora&gt;
      &lt;ans:numeroProtocolo&gt;PROT${entry.invoiceId}&lt;/ans:numeroProtocolo&gt;
      &lt;ans:dataProtocolo&gt;${format(new Date(), 'yyyy-MM-dd')}&lt;/ans:dataProtocolo&gt;
    &lt;/ans:protocoloRecebimento&gt;
  &lt;/ans:operadoraParaPrestador&gt;
&lt;/ans:mensagemTISS&gt;</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const filteredEntries = historyEntries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoiceId.toString().includes(searchTerm) ||
      entry.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    
    const matchesDate = dateFilter === "all" || (() => {
      const entryDate = new Date(entry.generatedAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today": return daysDiff === 0;
        case "week": return daysDiff <= 7;
        case "month": return daysDiff <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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
          <h1 className="text-3xl font-bold">Histórico TISS XML</h1>
          <p className="text-muted-foreground">
            Acompanhe o histórico de geração e download de arquivos TISS XML
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gerados</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyEntries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyEntries.filter(e => e.status === 'success').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyEntries.filter(e => e.status === 'error').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyEntries.reduce((sum, e) => sum + e.downloadCount, 0)}
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
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, fatura ou arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Geração ({filteredEntries.length})</CardTitle>
          <CardDescription>
            Lista de todos os arquivos TISS XML gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead>Gerado por</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">#{entry.invoiceId}</TableCell>
                  <TableCell>{entry.patientName}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-mono text-sm">{entry.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(entry.fileSize)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.generatedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entry.generatedBy}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{entry.downloadCount}</div>
                      {entry.lastDownloaded && (
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.lastDownloaded)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(entry)}
                        title="Visualizar XML"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {entry.status === 'success' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(entry)}
                          title="Baixar arquivo"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum arquivo TISS XML encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
