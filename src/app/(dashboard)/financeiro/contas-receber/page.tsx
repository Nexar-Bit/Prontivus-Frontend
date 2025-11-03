"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Download,
  RefreshCw,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { financialApi } from "@/lib/financial-api";
import { AccountsReceivableSummary, AgingReport, AgingReportItem } from "@/lib/types";

export default function AccountsReceivablePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<AccountsReceivableSummary | null>(null);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = async () => {
    try {
      const [summaryData, agingData] = await Promise.all([
        financialApi.getAccountsReceivableSummary(),
        financialApi.getAgingReport()
      ]);
      setSummary(summaryData);
      setAgingReport(agingData);
    } catch (error: any) {
      toast.error("Erro ao carregar dados", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadData();
  };

  const handleExportAgingReport = () => {
    if (!agingReport) return;
    
    // Create CSV content
    const csvContent = [
      ["ID Fatura", "Paciente", "Data Fatura", "Vencimento", "Valor Total", "Valor Pago", "Valor Pendente", "Dias Atraso", "Status"],
      ...agingReport.items.map(item => [
        item.invoice_id.toString(),
        item.patient_name,
        format(new Date(item.invoice_date), 'dd/MM/yyyy', { locale: ptBR }),
        item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        item.total_amount.toFixed(2),
        item.paid_amount.toFixed(2),
        item.outstanding_amount.toFixed(2),
        item.days_overdue.toString(),
        item.status
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contas_receber_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Relatório exportado com sucesso!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getAgingBadge = (days: number) => {
    if (days <= 30) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Atual</Badge>;
    } else if (days <= 60) {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">31-60 dias</Badge>;
    } else if (days <= 90) {
      return <Badge variant="default" className="bg-orange-100 text-orange-800">61-90 dias</Badge>;
    } else {
      return <Badge variant="destructive">+90 dias</Badge>;
    }
  };

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
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">
            Acompanhe o fluxo de recebimentos e relatórios de envelhecimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportAgingReport} disabled={!agingReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_outstanding)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_invoices} faturas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atual (0-30 dias)</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.current)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">31-60 dias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.days_31_60)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">61-90 dias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.days_61_90)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">+90 dias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.over_90_days)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aging Report */}
      {agingReport && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Envelhecimento</CardTitle>
            <CardDescription>
              Detalhamento das contas a receber por período de vencimento
              {agingReport.generated_at && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Gerado em: {format(new Date(agingReport.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data Fatura</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Valor Pendente</TableHead>
                  <TableHead>Dias Atraso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingReport.items.map((item) => (
                  <TableRow key={item.invoice_id}>
                    <TableCell className="font-medium">#{item.invoice_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {item.patient_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.invoice_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(item.paid_amount)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.outstanding_amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={item.days_overdue > 30 ? "text-red-600 font-medium" : ""}>
                          {item.days_overdue} dias
                        </span>
                        {getAgingBadge(item.days_overdue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'paid' ? 'default' : 'secondary'}>
                        {item.status === 'paid' ? 'Paga' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
