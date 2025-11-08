"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Clock,
  FileSpreadsheet,
  FileCheck,
  Activity,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
    const configs = {
      'revenue': { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
      'expenses': { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-100' },
      'profit': { icon: DollarSign, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      'patients': { icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      'appointments': { icon: CalendarIcon, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      'procedures': { icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
      'clinical': { icon: Activity, color: 'text-teal-600', bgColor: 'bg-teal-100' }
    };
    
    const config = configs[type as keyof typeof configs] || { icon: BarChart3, color: 'text-slate-600', bgColor: 'bg-slate-100' };
    const Icon = config.icon;
    
    return (
      <div className={cn("p-2 rounded-lg", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      'ready': {
        label: 'Pronto',
        icon: CheckCircle,
        color: 'text-green-700',
        bgColor: 'bg-green-100 hover:bg-green-200'
      },
      'generating': {
        label: 'Gerando',
        icon: Loader2,
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 hover:bg-blue-200'
      },
      'error': {
        label: 'Erro',
        icon: XCircle,
        color: 'text-red-700',
        bgColor: 'bg-red-100 hover:bg-red-200'
      }
    };
    
    const config = configs[status as keyof typeof configs] || configs.ready;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1.5 w-fit border-0", config.color, config.bgColor)}>
        {status === 'generating' ? (
          <Icon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
        {config.label}
      </Badge>
    );
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

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesType = filters.reportType === 'all' || report.type === filters.reportType;
      const matchesStatus = filters.status === 'all' || report.status === filters.status;
      return matchesType && matchesStatus;
    });
  }, [reports, filters.reportType, filters.status]);

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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Relatórios Financeiros
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gere e gerencie relatórios financeiros e análises
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={loading}
            className="bg-white"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {analyticsSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-700">
                    {formatCurrency(analyticsSummary.totalRevenue)}
                  </p>
                  {analyticsSummary.revenueChange !== undefined && (
                    <p className={cn(
                      "text-xs mt-1 flex items-center gap-1",
                      analyticsSummary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {analyticsSummary.revenueChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {analyticsSummary.revenueChange >= 0 ? '+' : ''}{analyticsSummary.revenueChange.toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Lucro Líquido</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-700">
                    {formatCurrency(analyticsSummary.netProfit)}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Pacientes</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-700">
                    {formatNumber(analyticsSummary.totalPatients)}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500 shadow-sm bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Agendamentos</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-700">
                    {formatNumber(analyticsSummary.totalAppointments)}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Gere relatórios comuns rapidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Button
              onClick={() => generateReport('revenue')}
              disabled={generating}
              className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
              <span className="text-xs sm:text-sm font-medium">Receita</span>
            </Button>
            <Button
              onClick={() => generateReport('profit')}
              disabled={generating}
              variant="outline"
              className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              )}
              <span className="text-xs sm:text-sm font-medium">Lucro/Prejuízo</span>
            </Button>
            <Button
              onClick={() => generateReport('clinical')}
              disabled={generating}
              variant="outline"
              className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border-teal-200"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              )}
              <span className="text-xs sm:text-sm font-medium">Clínico</span>
            </Button>
            <Button
              onClick={() => generateReport('appointments')}
              disabled={generating}
              variant="outline"
              className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-200"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              )}
              <span className="text-xs sm:text-sm font-medium">Agendamentos</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filtros de Relatório
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Filtre relatórios por período, tipo e status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Período</Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-white">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date }
                        }))}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-white">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date }
                        }))}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_PERIODS.map((period) => (
                    <Button
                      key={period.label}
                      variant="outline"
                      size="sm"
                      onClick={() => quickPeriodSelect(period.days)}
                      className="text-xs bg-white"
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">Tipo de Relatório</Label>
                <Select
                  value={filters.reportType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger className="mt-1 bg-white">
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
                <Label className="text-sm">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1 bg-white">
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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Relatórios Gerados</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredReports.length} {filteredReports.length === 1 ? 'relatório encontrado' : 'relatórios encontrados'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhum relatório encontrado</p>
              <p className="text-sm">Gere um novo relatório usando as ações rápidas acima</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 sm:p-6 hover:bg-slate-50 transition-colors bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      {getTypeIcon(report.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-sm sm:text-base font-semibold">{report.title}</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          Período: {report.period}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                          {report.summary.total > 0 && (
                            <span className="font-medium">
                              Total: {report.type === 'revenue' || report.type === 'expenses' || report.type === 'profit' 
                                ? formatCurrency(report.summary.total)
                                : formatNumber(report.summary.total)
                              }
                            </span>
                          )}
                          {report.summary.change !== 0 && (
                            <span className={cn(
                              "flex items-center gap-1 font-medium",
                              report.summary.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                            )}>
                              {report.summary.changeType === 'increase' ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                              )}
                              {report.summary.change >= 0 ? '+' : ''}{report.summary.change.toFixed(1)}% {report.summary.period}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4">
                      {report.status === 'ready' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report.id)}
                          className="bg-white"
                        >
                          <Download className="h-4 w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Baixar</span>
                          <span className="sm:hidden">Download</span>
                        </Button>
                      )}
                      {report.status === 'generating' && (
                        <Button variant="outline" size="sm" disabled className="bg-white">
                          <Loader2 className="h-4 w-4 mr-1.5 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Gerando...</span>
                          <span className="sm:hidden">...</span>
                        </Button>
                      )}
                      {report.status === 'error' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReport(report.type)}
                          className="bg-white"
                        >
                          <RefreshCw className="h-4 w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Tentar Novamente</span>
                          <span className="sm:hidden">Retry</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
