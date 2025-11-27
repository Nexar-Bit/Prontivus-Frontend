"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Calendar,
  User,
  TestTube,
  Bell,
  Eye,
  EyeOff,
  ArrowRight,
  FileDown,
  Phone,
  Mail,
  Share2,
  RefreshCw,
} from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { LineChart } from "@/components/charts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Types
interface TestResult {
  id: string;
  testName: string;
  category: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'borderline' | 'abnormal' | 'critical';
  date: string;
  provider: string;
  notes?: string;
  critical?: boolean;
  trend?: 'improving' | 'declining' | 'stable';
  previousValue?: number | string;
  previousDate?: string;
}

interface LabReport {
  id: string;
  reportDate: string;
  orderedBy: string;
  provider: string;
  results: TestResult[];
  summary?: string;
  doctorNotes?: string;
  recommendations?: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
}

const mockReports: LabReport[] = [];

const statusConfig = {
  normal: {
    color: '#16C79A',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    icon: CheckCircle2,
    label: 'Normal',
  },
  borderline: {
    color: '#F59E0B',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    icon: AlertTriangle,
    label: 'Fora do Normal',
  },
  abnormal: {
    color: '#EF4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: AlertTriangle,
    label: 'Anormal',
  },
  critical: {
    color: '#DC2626',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    icon: Bell,
    label: 'Crítico',
  },
};

export default function TestResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper function to determine status from exam data
  const getExamStatus = (exam: any): 'normal' | 'borderline' | 'abnormal' | 'critical' => {
    // If exam is not completed (status is "pending"), it's pending (borderline)
    if (exam.status === 'pending' || !exam.completed_date) {
      return 'borderline'; // Pending
    }
    
    // If exam has abnormalities, check if it's critical
    if (exam.has_abnormalities) {
      // Check if description contains critical keywords
      const description = (exam.description || '').toLowerCase();
      const criticalKeywords = ['crítico', 'critico', 'emergência', 'emergencia', 'urgente'];
      if (criticalKeywords.some(keyword => description.includes(keyword))) {
        return 'critical';
      }
      return 'abnormal';
    }
    
    return 'normal';
  };

  // Helper function to parse exam description for values
  const parseExamDescription = (description: string): { value: string | number; unit: string; referenceRange: string } => {
    if (!description) {
      return { value: '-', unit: '', referenceRange: '-' };
    }

    // Try to extract numeric values and units from description
    // This is a simple parser - can be enhanced based on actual data format
    const numberMatch = description.match(/(\d+\.?\d*)\s*([a-zA-Z\/%]+)?/);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1]);
      const unit = numberMatch[2] || '';
      return {
        value: isNaN(value) ? description : value,
        unit,
        referenceRange: '-', // Would need to be extracted from description or separate field
      };
    }

    return { value: description, unit: '', referenceRange: '-' };
  };

  // Helper function to map exam data to TestResult
  const mapExamToTestResult = (exam: any, reportDate: string): TestResult => {
    const status = getExamStatus(exam);
    const parsed = parseExamDescription(exam.description || '');
    
    // Use completed_date if available, otherwise use requested_date
    const resultDate = exam.completed_date || exam.requested_date || reportDate;
    
    return {
      id: String(exam.id),
      testName: exam.exam_type || 'Exame',
      category: 'Exames',
      value: parsed.value,
      unit: parsed.unit,
      referenceRange: parsed.referenceRange,
      status,
      date: resultDate,
      provider: 'Clínica',
      notes: exam.description || undefined,
      critical: status === 'critical',
      trend: undefined, // Would need historical data to calculate
      previousValue: undefined,
      previousDate: undefined,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Fetch exam results from the dedicated endpoint
        const examResults = await api.get<any[]>(`/api/v1/patient/exam-results`);
        
        // Group exams by appointment date to create reports
        const reportsMap = new Map<string, LabReport>();
        
        examResults.forEach((exam: any) => {
          // Use completed_date if available, otherwise use requested_date or appointment_date
          const reportDate = exam.completed_date || exam.appointment_date || exam.requested_date || new Date().toISOString();
          const reportKey = reportDate.split('T')[0]; // Group by date
          
          if (!reportsMap.has(reportKey)) {
            reportsMap.set(reportKey, {
              id: `report-${reportKey}`,
              reportDate: reportDate,
              orderedBy: exam.doctor_name || 'Médico',
              provider: 'Clínica',
              results: [],
              summary: undefined,
              doctorNotes: undefined,
              recommendations: undefined,
              acknowledged: exam.status === 'available' && exam.completed_date,
              acknowledgedAt: exam.completed_date || undefined,
            });
          }
          
          const report = reportsMap.get(reportKey)!;
          const testResult = mapExamToTestResult(exam, reportDate);
          report.results.push(testResult);
        });
        
        // Convert map to array and set summary
        const reportsArray: LabReport[] = Array.from(reportsMap.values()).map(report => ({
          ...report,
          summary: `${report.results.length} exame(s) - ${format(parseISO(report.reportDate), "dd/MM/yyyy", { locale: ptBR })}`,
        }));
        
        // Sort by date (newest first)
        reportsArray.sort((a, b) => parseISO(b.reportDate).getTime() - parseISO(a.reportDate).getTime());
        
        setReports(reportsArray);
      } catch (error: any) {
        console.error("Error loading exam results:", error);
        toast.error("Erro ao carregar resultados de exames", {
          description: error?.message || "Não foi possível carregar seus exames",
        });
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    reports.forEach(report => {
      report.results.forEach(result => {
        cats.add(result.category);
      });
    });
    return Array.from(cats);
  }, [reports]);

  // Get critical results
  const criticalResults = useMemo(() => {
    const critical: TestResult[] = [];
    reports.forEach(report => {
      report.results.forEach(result => {
        if (result.status === 'critical' || result.critical) {
          critical.push(result);
        }
      });
    });
    return critical;
  }, [reports]);

  // Get abnormal results for summary
  const abnormalResults = useMemo(() => {
    const abnormal: TestResult[] = [];
    reports.forEach(report => {
      report.results.forEach(result => {
        if (result.status !== 'normal') {
          abnormal.push(result);
        }
      });
    });
    return abnormal.sort((a, b) => {
      const priority = { critical: 0, abnormal: 1, borderline: 2, normal: 3 };
      return priority[a.status] - priority[b.status];
    });
  }, [reports]);

  // Separate pending and completed reports
  // A report is pending if it has at least one result with status 'borderline' (which means pending)
  const pendingReports = useMemo(() => {
    return reports.filter(report => 
      report.results.some(r => r.status === 'borderline')
    );
  }, [reports]);

  // A report is completed if all results are not pending (not borderline)
  const completedReports = useMemo(() => {
    return reports.filter(report => 
      report.results.every(r => r.status !== 'borderline')
    );
  }, [reports]);

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // Apply tab filter
    if (activeTab === 'pending') {
      filtered = pendingReports;
    } else if (activeTab === 'completed') {
      filtered = completedReports;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.summary?.toLowerCase().includes(query) ||
        report.results.some(r => r.testName.toLowerCase().includes(query)) ||
        report.provider.toLowerCase().includes(query) ||
        report.orderedBy.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.map(report => ({
        ...report,
        results: report.results.filter(r => r.category === selectedCategory),
      })).filter(report => report.results.length > 0);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.map(report => ({
        ...report,
        results: report.results.filter(r => r.status === selectedStatus),
      })).filter(report => report.results.length > 0);
    }

    return filtered.sort((a, b) => parseISO(b.reportDate).getTime() - parseISO(a.reportDate).getTime());
  }, [reports, searchQuery, selectedCategory, selectedStatus, activeTab, pendingReports, completedReports]);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getTrendLabel = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return 'Melhorando';
      case 'declining':
        return 'Piorando';
      case 'stable':
        return 'Estável';
      default:
        return 'Sem histórico';
    }
  };

  // Prepare trend chart data for a specific test
  const getTrendChartData = (testName: string) => {
    const allResults: Array<{ date: string; value: number }> = [];
    
    reports.forEach(report => {
      report.results.forEach(result => {
        if (result.testName === testName && typeof result.value === 'number') {
          allResults.push({
            date: result.date,
            value: result.value,
          });
        }
      });
    });

    if (allResults.length === 0) return null;

    const sorted = allResults.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    return {
      labels: sorted.map(r => format(parseISO(r.date), 'MMM yyyy', { locale: ptBR })),
      datasets: [
        {
          label: testName,
          data: sorted.map(r => r.value),
          borderColor: '#5b9eff',
          backgroundColor: 'rgba(91, 158, 255, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const acknowledgeReport = (reportId: string) => {
    // In real app, this would call an API
    console.log('Acknowledging report:', reportId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 overflow-y-auto patient-content-scroll w-full">
          <div className="px-4 lg:px-5 py-4 lg:py-6 pb-20 lg:pb-6">
          {/* Modern Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-700 to-teal-700 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                  <TestTube className="h-7 w-7 text-white" />
                </div>
                Resultados de Exames
              </h1>
              <p className="text-gray-600 text-sm lg:text-base font-medium mt-2">
                Acompanhe seus exames laboratoriais e resultados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setRefreshKey(prev => prev + 1);
                    toast.success('Resultados atualizados!');
                  } catch (error: any) {
                    toast.error('Erro ao atualizar', {
                      description: error?.message || error?.detail || 'Não foi possível atualizar os resultados',
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const examResults = await api.get<any[]>(`/api/v1/patient/exam-results`);
                    if (examResults.length === 0) {
                      toast.info('Nenhum resultado para exportar');
                      return;
                    }
                    
                    // Create CSV content
                    const csvRows = [];
                    csvRows.push('ID,Tipo de Exame,Data Solicitação,Data Conclusão,Status,Médico,Descrição,Anormalidades');
                    
                    examResults.forEach((exam: any) => {
                      csvRows.push([
                        exam.id,
                        exam.exam_type || '',
                        exam.requested_date ? format(parseISO(exam.requested_date), 'dd/MM/yyyy', { locale: ptBR }) : '',
                        exam.completed_date ? format(parseISO(exam.completed_date), 'dd/MM/yyyy', { locale: ptBR }) : '',
                        exam.status === 'available' ? 'Disponível' : 'Pendente',
                        exam.doctor_name || '',
                        (exam.description || '').replace(/,/g, ';'),
                        exam.has_abnormalities ? 'Sim' : 'Não'
                      ].join(','));
                    });
                    
                    const csvContent = csvRows.join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `resultados_exames_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Resultados exportados com sucesso!');
                  } catch (error: any) {
                    toast.error('Erro ao exportar resultados', {
                      description: error?.message || error?.detail || 'Não foi possível exportar os resultados',
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <TestTube className="h-10 w-10 text-blue-600 animate-pulse" />
                </div>
                <p className="text-gray-500 font-medium">Carregando resultados de exames...</p>
              </CardContent>
            </Card>
          )}

          {/* Statistics Cards */}
          {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Exames
                </CardTitle>
                <TestTube className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.reduce((sum, r) => sum + r.results.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{reports.length} relatório(s)</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Normais
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.reduce((sum, r) => 
                    sum + r.results.filter(res => res.status === 'normal').length, 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Resultados normais</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReports.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Aguardando resultados</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Críticos
                </CardTitle>
                <Bell className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{criticalResults.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Resultados críticos</p>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Critical Results Alert */}
          {!loading && criticalResults.length > 0 && (
            <Alert className="border-l-4 border-l-red-500 bg-red-50/50 mb-6">
              <Bell className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">
                Resultados Críticos Requerem Atenção Imediata
              </AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                Você tem {criticalResults.length} resultado(s) crítico(s) que requerem atenção médica imediata.
                Entre em contato com seu médico o quanto antes.
              </AlertDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar para o Médico
                </Button>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </Alert>
          )}

          {/* Search and Filters */}
          {!loading && (
          <Card className="border-l-4 border-l-blue-500 mb-6 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar exames..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor="category-filter">Filtrar por categoria</label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                    title="Filtrar por categoria"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor="status-filter">Filtrar por status</label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                    title="Filtrar por status"
                  >
                    <option value="all">Todos os resultados</option>
                    <option value="normal">Normal</option>
                    <option value="borderline">Fora do Normal</option>
                    <option value="abnormal">Anormal</option>
                    <option value="critical">Crítico</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>
          )}

          {/* Tabs for All/Pending/Completed */}
          {!loading && (
          <div className="mb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'pending' | 'completed')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  Todos ({reports.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes ({pendingReports.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Concluídos ({completedReports.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          )}

          {/* View Toggle */}
          {!loading && (
          <div className="mb-4 flex items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'summary' | 'detailed')}>
              <TabsList>
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="detailed">Detalhado</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          )}

          {/* Empty State */}
          {!loading && reports.length === 0 && (
            <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <TestTube className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-gray-500 font-medium mb-2">Nenhum resultado de exame encontrado</p>
                <p className="text-sm text-gray-400">Seus resultados de exames aparecerão aqui quando estiverem disponíveis.</p>
              </CardContent>
            </Card>
          )}

          {/* Summary View */}
          {!loading && viewMode === 'summary' && (
            <div className="space-y-6">
              {/* Abnormal Results Summary */}
              {abnormalResults.length > 0 && (
                <Card className="border-l-4 border-l-orange-500 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      Resultados que Requerem Atenção
                    </CardTitle>
                    <CardDescription>
                      {abnormalResults.length} resultado(s) fora do normal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {abnormalResults.slice(0, 5).map((result) => {
                        const config = statusConfig[result.status];
                        const StatusIcon = config.icon;
                        const trendData = getTrendChartData(result.testName);

                        return (
                          <div
                            key={result.id}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                              config.borderColor,
                              config.bgColor
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <StatusIcon className={cn("h-5 w-5", config.textColor)} />
                                  <h4 className="font-semibold text-gray-900">{result.testName}</h4>
                                  <Badge className={cn("ml-2", config.bgColor, config.textColor, "border-0")}>
                                    {config.label}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {result.category} • {format(parseISO(result.date), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTrendIcon(result.trend)}
                                <span className="text-xs text-gray-500">{getTrendLabel(result.trend)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Seu Valor</div>
                                <div className={cn("text-lg font-bold", config.textColor)}>
                                  {result.value} {result.unit}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Valor de Referência</div>
                                <div className="text-sm text-gray-700">{result.referenceRange} {result.unit}</div>
                              </div>
                              {result.previousValue && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Valor Anterior</div>
                                  <div className="text-sm text-gray-700">
                                    {result.previousValue} {result.unit}
                                    {result.previousDate && (
                                      <span className="text-xs text-gray-400 ml-1">
                                        ({format(parseISO(result.previousDate), "MMM yyyy", { locale: ptBR })})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {trendData && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-2">Tendência Histórica</div>
                                <div className="h-24">
                                  <LineChart
                                    data={trendData}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: { display: false },
                                        tooltip: { mode: 'index', intersect: false },
                                      },
                                      scales: {
                                        y: { beginAtZero: false },
                                        x: { grid: { display: false } },
                                      },
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() => {
                                const report = reports.find(r => r.results.some(res => res.id === result.id));
                                if (report) setSelectedReport(report);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Discutir com o Médico
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Reports */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  Todos os Relatórios
                </h2>
                {filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm"
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-blue-600 mb-1">
                            {report.summary || 'Relatório de Exames'}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(parseISO(report.reportDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {report.orderedBy}
                            </div>
                            <div className="flex items-center gap-1">
                              <TestTube className="h-4 w-4" />
                              {report.provider}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.acknowledged ? (
                            <Badge className="bg-green-100 text-green-700">
                              <Eye className="h-3 w-3 mr-1" />
                              Visualizado
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Novo
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {report.results.length} {report.results.length === 1 ? 'exame' : 'exames'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {report.results.slice(0, 4).map((result) => {
                          const config = statusConfig[result.status];
                          return (
                            <div
                              key={result.id}
                              className={cn(
                                "p-3 rounded-lg border",
                                config.borderColor,
                                config.bgColor
                              )}
                            >
                              <div className="text-xs text-gray-600 mb-1">{result.testName}</div>
                              <div className={cn("text-sm font-semibold", config.textColor)}>
                                {result.value} {result.unit}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Ref: {result.referenceRange}
                              </div>
                            </div>
                          );
                        })}
                        {report.results.length > 4 && (
                          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <span className="text-sm text-gray-600">
                              +{report.results.length - 4} mais
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Detailed View */}
          {!loading && viewMode === 'detailed' && (
            <div className="space-y-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-blue-600 mb-2">
                          {report.summary || 'Relatório de Exames'}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(parseISO(report.reportDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Solicitado por: {report.orderedBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <TestTube className="h-4 w-4" />
                            {report.provider}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              // Generate a simple text report for download
                              const reportText = `
RELATÓRIO DE EXAMES

Data: ${format(parseISO(report.reportDate), "dd/MM/yyyy", { locale: ptBR })}
Solicitado por: ${report.orderedBy}
Laboratório: ${report.provider}

RESULTADOS:
${report.results.map(r => `
${r.testName}
  Resultado: ${r.value} ${r.unit}
  Referência: ${r.referenceRange} ${r.unit}
  Status: ${statusConfig[r.status].label}
${r.notes ? `  Observações: ${r.notes}` : ''}
`).join('\n')}
                              `.trim();
                              
                              const blob = new Blob([reportText], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `relatorio_exames_${format(parseISO(report.reportDate), 'yyyy-MM-dd', { locale: ptBR })}.txt`;
                              link.click();
                              URL.revokeObjectURL(url);
                              toast.success('Relatório baixado com sucesso!');
                            } catch (error: any) {
                              toast.error('Erro ao baixar relatório', {
                                description: error?.message || 'Não foi possível baixar o relatório',
                              });
                            }
                          }}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        {!report.acknowledged && (
                          <Button
                            size="sm"
                            onClick={() => {
                              acknowledgeReport(report.id);
                              // Update local state
                              setReports(prev => prev.map(r => 
                                r.id === report.id 
                                  ? { ...r, acknowledged: true, acknowledgedAt: new Date().toISOString() }
                                  : r
                              ));
                              toast.success('Leitura confirmada!');
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirmar Leitura
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Results Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left p-3 text-sm font-semibold text-gray-700">Exame</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-700">Resultado</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-700">Valor de Referência</th>
                            <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                            <th className="text-center p-3 text-sm font-semibold text-gray-700">Tendência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.results.map((result, idx) => {
                            const config = statusConfig[result.status];
                            const StatusIcon = config.icon;
                            return (
                              <tr
                                key={result.id}
                                className={cn(
                                  "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                )}
                              >
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">{result.testName}</div>
                                  <div className="text-xs text-gray-500">{result.category}</div>
                                </td>
                                <td className="p-3">
                                  <div className={cn("font-semibold text-lg", config.textColor)}>
                                    {result.value} <span className="text-sm text-gray-600">{result.unit}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-sm text-gray-700">{result.referenceRange} {result.unit}</div>
                                  {result.previousValue && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Anterior: {result.previousValue} {result.unit}
                                      {result.previousDate && (
                                        <span> ({format(parseISO(result.previousDate), "MMM yyyy", { locale: ptBR })})</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <Badge className={cn(config.bgColor, config.textColor, "border-0")}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {getTrendIcon(result.trend)}
                                    <span className="text-xs text-gray-600">{getTrendLabel(result.trend)}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Doctor Notes */}
                    {report.doctorNotes && (
                      <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Observações do Médico
                        </h4>
                        <p className="text-blue-800 text-sm">{report.doctorNotes}</p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {report.recommendations && (
                      <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          Recomendações
                        </h4>
                        <p className="text-green-800 text-sm">{report.recommendations}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Discutir com o Médico
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            const reportText = `
RELATÓRIO DE EXAMES

Data: ${format(parseISO(report.reportDate), "dd/MM/yyyy", { locale: ptBR })}
Solicitado por: ${report.orderedBy}
Laboratório: ${report.provider}

RESULTADOS:
${report.results.map(r => `
${r.testName}
  Resultado: ${r.value} ${r.unit}
  Referência: ${r.referenceRange} ${r.unit}
  Status: ${statusConfig[r.status].label}
${r.notes ? `  Observações: ${r.notes}` : ''}
`).join('\n')}
                            `.trim();
                            
                            const blob = new Blob([reportText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `relatorio_exames_${format(parseISO(report.reportDate), 'yyyy-MM-dd', { locale: ptBR })}.txt`;
                            link.click();
                            URL.revokeObjectURL(url);
                            toast.success('Relatório baixado com sucesso!');
                          } catch (error: any) {
                            toast.error('Erro ao baixar relatório', {
                              description: error?.message || 'Não foi possível baixar o relatório',
                            });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Report Detail Modal */}
          {selectedReport && (
            <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-blue-600 flex items-center gap-2">
                    <TestTube className="h-6 w-6" />
                    {selectedReport.summary || 'Relatório de Exames'}
                  </DialogTitle>
                  <DialogDescription>
                    {format(parseISO(selectedReport.reportDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • {selectedReport.provider}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Solicitado por:</span>
                      <span className="ml-2 font-medium">{selectedReport.orderedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Laboratório:</span>
                      <span className="ml-2 font-medium">{selectedReport.provider}</span>
                    </div>
                  </div>
                  {/* Results table - same as detailed view */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Exame</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Resultado</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Referência</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.results.map((result, idx) => {
                          const config = statusConfig[result.status];
                          const StatusIcon = config.icon;
                          return (
                            <tr
                              key={result.id}
                              className={cn(
                                "border-b border-gray-100",
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              )}
                            >
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{result.testName}</div>
                                <div className="text-xs text-gray-500">{result.category}</div>
                              </td>
                              <td className="p-3">
                                <div className={cn("font-semibold", config.textColor)}>
                                  {result.value} {result.unit}
                                </div>
                              </td>
                              <td className="p-3 text-sm text-gray-700">
                                {result.referenceRange} {result.unit}
                              </td>
                              <td className="p-3 text-center">
                                <Badge className={cn(config.bgColor, config.textColor, "border-0")}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selectedReport.doctorNotes && (
                    <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Observações do Médico</h4>
                      <p className="text-blue-800 text-sm">{selectedReport.doctorNotes}</p>
                    </div>
                  )}
                  {selectedReport.recommendations && (
                    <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Recomendações</h4>
                      <p className="text-green-800 text-sm">{selectedReport.recommendations}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}

