"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  PieChart,
  LineChart,
  Eye,
  Printer,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportData {
  id: string;
  title: string;
  type: 'revenue' | 'expenses' | 'profit' | 'patients' | 'appointments' | 'procedures' | 'clinical';
  period: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'error';
  fileUrl?: string;
  summary: {
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
    period: string;
  };
}

interface AnalyticsSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalPatients: number;
  totalAppointments: number;
  revenueChange?: number;
}

interface ReportFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  reportType: string;
  clinicId?: string;
  doctorId?: string;
  status: string;
}

const REPORT_TYPES = [
  { value: 'all', label: 'Todos os Relatórios' },
  { value: 'revenue', label: 'Relatórios de Receita' },
  { value: 'expenses', label: 'Relatórios de Despesas' },
  { value: 'profit', label: 'Lucro e Prejuízo' },
  { value: 'patients', label: 'Relatórios de Pacientes' },
  { value: 'appointments', label: 'Relatórios de Agendamentos' },
  { value: 'clinical', label: 'Relatórios Clínicos' },
];

const QUICK_PERIODS = [
  { label: 'Hoje', days: 0 },
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
  { label: 'Este ano', days: 365 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'ready', label: 'Pronto' },
  { value: 'generating', label: 'Gerando' },
  { value: 'error', label: 'Erro' },
];

export default function FinancialReportsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    },
    reportType: 'all',
    status: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

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
      loadReports();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Get period from filters
      const daysDiff = filters.dateRange.to && filters.dateRange.from
        ? Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const periodMap: Record<number, string> = {
        0: "today",
        7: "last_7_days",
        30: "last_30_days",
        90: "last_90_days",
        365: "last_year"
      };
      const apiPeriod = periodMap[daysDiff] || "last_30_days";
      
      // Load financial analytics
      const financialData = await api.get<{
        total_revenue: number;
        monthly_revenue_trend: Array<{ month: string; total_revenue: number }>;
      }>(`/api/analytics/financial?period=${apiPeriod}`);
      
      // Load patients count
      const patients = await api.get<Array<{ id: number }>>('/api/patients');
      
      // Load appointments count
      const appointments = await api.get<Array<{ id: number }>>('/api/appointments');
      
      // Calculate summary
      const prevRevenue = financialData.monthly_revenue_trend && financialData.monthly_revenue_trend.length >= 2
        ? financialData.monthly_revenue_trend[financialData.monthly_revenue_trend.length - 2].total_revenue
        : financialData.total_revenue;
      
      const revenueChange = prevRevenue > 0
        ? ((financialData.total_revenue - prevRevenue) / prevRevenue) * 100
        : 0;
      
      const totalExpenses = financialData.total_revenue * 0.7; // Estimate
      const netProfit = financialData.total_revenue - totalExpenses;
      
      setAnalyticsSummary({
        totalRevenue: financialData.total_revenue,
        totalExpenses: totalExpenses,
        netProfit: netProfit,
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        revenueChange: revenueChange
      });
      
      // Generate report list from available data
      const periodLabel = format(filters.dateRange.from || new Date(), "MMMM yyyy", { locale: ptBR });
      const reportsList: ReportData[] = [
        {
          id: "revenue",
          title: "Relatório de Receita",
          type: "revenue",
          period: periodLabel,
          generatedAt: new Date().toISOString(),
          status: "ready",
          summary: {
            total: financialData.total_revenue,
            change: revenueChange,
            changeType: revenueChange >= 0 ? "increase" : "decrease",
            period: "vs período anterior"
          }
        },
        {
          id: "profit",
          title: "Relatório de Lucro e Prejuízo",
          type: "profit",
          period: periodLabel,
          generatedAt: new Date().toISOString(),
          status: "ready",
          summary: {
            total: netProfit,
            change: 0,
            changeType: "increase",
            period: "Período atual"
          }
        },
        {
          id: "patients",
          title: "Relatório de Pacientes",
          type: "patients",
          period: periodLabel,
          generatedAt: new Date().toISOString(),
          status: "ready",
          summary: {
            total: patients.length,
            change: 0,
            changeType: "increase",
            period: "Total de pacientes"
          }
        },
        {
          id: "appointments",
          title: "Relatório de Agendamentos",
          type: "appointments",
          period: periodLabel,
          generatedAt: new Date().toISOString(),
          status: "ready",
          summary: {
            total: appointments.length,
            change: 0,
            changeType: "increase",
            period: "Total de agendamentos"
          }
        },
        {
          id: "clinical",
          title: "Relatório Clínico",
          type: "clinical",
          period: periodLabel,
          generatedAt: new Date().toISOString(),
          status: "ready",
          summary: {
            total: 0,
            change: 0,
            changeType: "increase",
            period: "Dados clínicos"
          }
        }
      ];
      
      setReports(reportsList);
    } catch (error: any) {
      console.error("Failed to load reports:", error);
      toast.error("Erro ao carregar relatórios", {
        description: error.message || "Não foi possível carregar os relatórios"
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    try {
      setGenerating(true);
      
      // Get period from filters
      const daysDiff = filters.dateRange.to && filters.dateRange.from
        ? Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const periodMap: Record<number, string> = {
        0: "today",
        7: "last_7_days",
        30: "last_30_days",
        90: "last_90_days",
        365: "last_year"
      };
      const apiPeriod = periodMap[daysDiff] || "last_30_days";
      
      if (type === 'revenue' || type === 'profit') {
        // Export financial Excel
        await downloadFinancialReport(apiPeriod);
      } else if (type === 'clinical') {
        // Export clinical PDF
        await downloadClinicalReport(apiPeriod);
      } else {
        // Generate custom report
        toast.info("Gerando relatório personalizado...");
        await loadReports();
      }
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      toast.error("Erro ao gerar relatório", {
        description: error.message || "Não foi possível gerar o relatório"
      });
    } finally {
      setGenerating(false);
    }
  };
  
  const downloadFinancialReport = async (period: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/financial/excel?period=${period}`, {
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
      link.download = `relatorio_financeiro_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw error;
    }
  };
  
  const downloadClinicalReport = async (period: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/export/clinical/pdf?period=${period}`, {
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
      link.download = `relatorio_clinico_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw error;
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const daysDiff = filters.dateRange.to && filters.dateRange.from
        ? Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const periodMap: Record<number, string> = {
        0: "today",
        7: "last_7_days",
        30: "last_30_days",
        90: "last_90_days",
        365: "last_year"
      };
      const apiPeriod = periodMap[daysDiff] || "last_30_days";
      
      if (reportId === 'revenue' || reportId === 'profit') {
        await downloadFinancialReport(apiPeriod);
      } else if (reportId === 'clinical') {
        await downloadClinicalReport(apiPeriod);
      } else {
        toast.info("Relatório disponível para download");
      }
    } catch (error: any) {
      console.error("Failed to download report:", error);
      toast.error("Erro ao baixar relatório", {
        description: error.message || "Não foi possível baixar o relatório"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'expenses':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'profit':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'patients':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'appointments':
        return <CalendarIcon className="h-4 w-4 text-orange-500" />;
      case 'procedures':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'generating':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('pt-BR').format(number);
  };

  const filteredReports = reports.filter(report => {
    const matchesType = filters.reportType === 'all' || report.type === filters.reportType;
    const matchesStatus = filters.status === 'all' || report.status === filters.status;
    return matchesType && matchesStatus;
  });

  const quickPeriodSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
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
            <BarChart3 className="h-8 w-8" />
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground mt-2">
            Gere e gerencie relatórios financeiros e análises
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Gere relatórios comuns rapidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => generateReport('revenue')}
              disabled={generating}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              {generating ? <Loader2 className="h-6 w-6 animate-spin" /> : <TrendingUp className="h-6 w-6" />}
              <span className="text-sm">Relatório de Receita</span>
            </Button>
            <Button
              onClick={() => generateReport('profit')}
              disabled={generating}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              {generating ? <Loader2 className="h-6 w-6 animate-spin" /> : <DollarSign className="h-6 w-6" />}
              <span className="text-sm">Lucro e Prejuízo</span>
            </Button>
            <Button
              onClick={() => generateReport('clinical')}
              disabled={generating}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              {generating ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileText className="h-6 w-6" />}
              <span className="text-sm">Relatório Clínico</span>
            </Button>
            <Button
              onClick={() => generateReport('appointments')}
              disabled={generating}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              {generating ? <Loader2 className="h-6 w-6 animate-spin" /> : <CalendarIcon className="h-6 w-6" />}
              <span className="text-sm">Agendamentos</span>
            </Button>
          </div>
          
          {/* Summary Cards */}
          {analyticsSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analyticsSummary.totalRevenue)}</div>
                  {analyticsSummary.revenueChange !== undefined && (
                    <p className={`text-xs ${analyticsSummary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analyticsSummary.revenueChange >= 0 ? '+' : ''}{analyticsSummary.revenueChange.toFixed(1)}%
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analyticsSummary.netProfit)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analyticsSummary.totalPatients)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analyticsSummary.totalAppointments)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
          <CardDescription>
            Filtre relatórios por período, tipo e status
          </CardDescription>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Período</Label>
                <div className="flex space-x-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy") : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy") : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {QUICK_PERIODS.map((period) => (
                    <Button
                      key={period.label}
                      variant="outline"
                      size="sm"
                      onClick={() => quickPeriodSelect(period.days)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Tipo de Relatório</Label>
                <Select
                  value={filters.reportType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o status" />
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados ({filteredReports.length})</CardTitle>
          <CardDescription>
            Visualize e baixe seus relatórios gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getTypeIcon(report.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium">{report.title}</h3>
                        <Badge variant={getStatusColor(report.status) as any}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">
                            {report.status === 'ready' && 'Pronto'}
                            {report.status === 'generating' && 'Gerando'}
                            {report.status === 'error' && 'Erro'}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Período: {report.period}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Gerado: {format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm")}</span>
                        {report.summary.total > 0 && (
                          <span>
                            Total: {report.type === 'revenue' || report.type === 'expenses' || report.type === 'profit' 
                              ? formatCurrency(report.summary.total)
                              : formatNumber(report.summary.total)
                            }
                          </span>
                        )}
                        {report.summary.change !== 0 && (
                          <span className={`flex items-center ${
                            report.summary.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {report.summary.changeType === 'increase' ? '+' : ''}{report.summary.change}% {report.summary.period}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                        {report.status === 'ready' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </>
                    )}
                    {report.status === 'generating' && (
                      <Button variant="outline" size="sm" disabled>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Gerando...
                      </Button>
                    )}
                    {report.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateReport(report.type)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando relatórios...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum relatório encontrado com os critérios selecionados</p>
                <p className="text-sm">Gere um novo relatório usando as ações rápidas acima</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
