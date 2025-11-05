"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { financialApi } from "@/lib/financial-api";
import { Invoice } from "@/lib/types";
import { Loader2 } from "lucide-react";
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
  id: number;
  invoiceId: number;
  patientName: string;
  generatedAt: string;
  generatedBy?: string;
  status: 'success' | 'error' | 'pending';
  fileName: string;
  fileSize: number;
  errorMessage?: string;
  downloadCount: number;
  lastDownloaded?: string;
  issueDate: string;
  totalAmount: number;
}


export default function TissHistoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<TissHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

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
      loadHistory();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Load invoices from database using financialApi
      const invoices = await financialApi.getInvoices();
      
      // Load download history from localStorage (tracking downloads)
      const downloadHistory = JSON.parse(localStorage.getItem('tiss-download-history') || '{}');
      
      // Convert invoices to TISS history entries
      const entries: TissHistoryEntry[] = await Promise.all(
        invoices.map(async (invoice) => {
          const invoiceId = invoice.id;
          const downloadInfo = downloadHistory[invoiceId] || { count: 0, lastDownloaded: null };
          
          // Try to validate/get TISS XML to check if it can be generated
          let status: 'success' | 'error' | 'pending' = 'pending';
          let errorMessage: string | undefined = undefined;
          let fileSize = 0;
          
          try {
            // Try to get preview to check if XML can be generated
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/${invoiceId}/tiss-xml/preview`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
              },
            });
            
            if (response.ok) {
              const xmlContent = await response.text();
              fileSize = new Blob([xmlContent]).size;
              status = 'success';
            } else {
              status = 'error';
              errorMessage = await response.text().catch(() => 'Não foi possível gerar XML TISS');
            }
          } catch (error: any) {
            status = 'error';
            errorMessage = error.message || 'Erro ao verificar XML TISS';
          }
          
          return {
            id: invoiceId,
            invoiceId: invoiceId,
            patientName: invoice.patient_name || `Paciente #${invoice.patient_id}`,
            generatedAt: invoice.issue_date || invoice.created_at,
            generatedBy: user?.email || user?.username || 'Sistema',
            status: status,
            fileName: `tiss_invoice_${String(invoiceId).padStart(6, '0')}.xml`,
            fileSize: fileSize,
            errorMessage: errorMessage,
            downloadCount: downloadInfo.count || 0,
            lastDownloaded: downloadInfo.lastDownloaded || undefined,
            issueDate: invoice.issue_date,
            totalAmount: invoice.total_amount
          };
        })
      );
      
      // Sort by date (most recent first)
      entries.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      
      setHistoryEntries(entries);
    } catch (error: any) {
      console.error("Failed to load TISS history:", error);
      toast.error("Erro ao carregar histórico TISS", {
        description: error.message || "Não foi possível carregar o histórico TISS"
      });
      setHistoryEntries([]);
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
    } else if (status === 'pending') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pendente
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

  const handleDownload = async (entry: TissHistoryEntry) => {
    if (entry.status === 'error' || entry.status === 'pending') {
      toast.error("Não é possível baixar arquivo com erro ou pendente");
      return;
    }

    try {
      setDownloadingIds(prev => new Set(prev).add(entry.invoiceId));
      
      // Download TISS XML from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/${entry.invoiceId}/tiss-xml`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = entry.fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
      // Update download history
      const downloadHistory = JSON.parse(localStorage.getItem('tiss-download-history') || '{}');
      downloadHistory[entry.invoiceId] = {
        count: (downloadHistory[entry.invoiceId]?.count || 0) + 1,
        lastDownloaded: new Date().toISOString()
      };
      localStorage.setItem('tiss-download-history', JSON.stringify(downloadHistory));
      
      // Update entry in state
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
      
      toast.success(`Arquivo ${entry.fileName} baixado com sucesso!`);
    } catch (error: any) {
      console.error("Failed to download TISS XML:", error);
      toast.error("Erro ao baixar arquivo TISS", {
        description: error.message || "Não foi possível baixar o arquivo TISS"
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.invoiceId);
        return newSet;
      });
    }
  };

  const handleView = async (entry: TissHistoryEntry) => {
    if (entry.status === 'error') {
      toast.error(`Erro: ${entry.errorMessage || 'Não foi possível gerar XML TISS'}`);
      return;
    }

    try {
      // Get preview XML from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoices/${entry.invoiceId}/tiss-xml/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      
      // Open XML in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>TISS XML - ${entry.fileName}</title>
              <style>
                body { font-family: monospace; margin: 20px; background: #fff; }
                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid #ddd; }
                h2 { color: #333; }
                .info { margin: 10px 0; padding: 10px; background: #e8f4f8; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h2>TISS XML - ${entry.fileName}</h2>
              <div class="info">
                <p><strong>Paciente:</strong> ${entry.patientName}</p>
                <p><strong>Fatura:</strong> #${entry.invoiceId}</p>
                <p><strong>Gerado em:</strong> ${formatDate(entry.generatedAt)}</p>
                <p><strong>Tamanho:</strong> ${formatFileSize(entry.fileSize)}</p>
              </div>
              <hr>
              <pre>${xmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error: any) {
      console.error("Failed to view TISS XML:", error);
      toast.error("Erro ao visualizar XML TISS", {
        description: error.message || "Não foi possível carregar o XML TISS"
      });
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

  if (isLoading || (loading && historyEntries.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando histórico TISS...</p>
        </div>
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
        <Button
          variant="outline"
          onClick={loadHistory}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCode className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
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
                <SelectItem value="pending">Pendente</SelectItem>
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
                        disabled={entry.status === 'error' || entry.status === 'pending'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {entry.status === 'success' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(entry)}
                          title="Baixar arquivo"
                          disabled={downloadingIds.has(entry.invoiceId)}
                        >
                          {downloadingIds.has(entry.invoiceId) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {entry.status === 'error' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/financeiro/tiss-validator?invoice=${entry.invoiceId}`)}
                          title="Validar e corrigir"
                        >
                          <FileCode className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {loading && historyEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando histórico...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum arquivo TISS XML encontrado</p>
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" ? (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
              ) : (
                <p className="text-sm mt-2">As faturas aparecerão aqui quando o TISS XML for gerado</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
