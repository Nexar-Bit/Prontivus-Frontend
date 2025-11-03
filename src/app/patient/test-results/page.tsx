"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { LineChart } from "@/components/charts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

// Mock data
const mockReports: LabReport[] = [
  {
    id: '1',
    reportDate: '2024-01-15',
    orderedBy: 'Dr. Maria Silva',
    provider: 'Laboratório Central',
    summary: 'Hemograma completo e glicemia de jejum',
    doctorNotes: 'Resultados dentro da normalidade. Manter acompanhamento.',
    recommendations: 'Repetir hemograma em 6 meses.',
    acknowledged: true,
    acknowledgedAt: '2024-01-16',
    results: [
      {
        id: 'r1',
        testName: 'Hemácias',
        category: 'Hemograma',
        value: 4.8,
        unit: 'milhões/mm³',
        referenceRange: '4.5 - 5.5',
        status: 'normal',
        date: '2024-01-15',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
      {
        id: 'r2',
        testName: 'Leucócitos',
        category: 'Hemograma',
        value: 7.2,
        unit: 'mil/mm³',
        referenceRange: '4.0 - 11.0',
        status: 'normal',
        date: '2024-01-15',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
      {
        id: 'r3',
        testName: 'Plaquetas',
        category: 'Hemograma',
        value: 250,
        unit: 'mil/mm³',
        referenceRange: '150 - 400',
        status: 'normal',
        date: '2024-01-15',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
      {
        id: 'r4',
        testName: 'Hemoglobina',
        category: 'Hemograma',
        value: 14.5,
        unit: 'g/dL',
        referenceRange: '13.0 - 17.0',
        status: 'normal',
        date: '2024-01-15',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
    ],
  },
  {
    id: '2',
    reportDate: '2024-01-10',
    orderedBy: 'Dr. João Santos',
    provider: 'Laboratório Central',
    summary: 'Perfil lipídico e glicemia',
    doctorNotes: 'Atenção para glicemia elevada. Recomendo repetir teste e avaliar hemoglobina glicada.',
    recommendations: 'Repetir glicemia e realizar hemoglobina glicada. Avaliar com endocrinologista.',
    acknowledged: false,
    results: [
      {
        id: 'r5',
        testName: 'Glicemia em Jejum',
        category: 'Glicemia',
        value: 110,
        unit: 'mg/dL',
        referenceRange: '70 - 100',
        status: 'abnormal',
        date: '2024-01-10',
        provider: 'Laboratório Central',
        previousValue: 105,
        previousDate: '2023-12-01',
        trend: 'declining',
      },
      {
        id: 'r6',
        testName: 'Colesterol Total',
        category: 'Lipídios',
        value: 220,
        unit: 'mg/dL',
        referenceRange: '< 200',
        status: 'borderline',
        date: '2024-01-10',
        provider: 'Laboratório Central',
        previousValue: 215,
        previousDate: '2023-11-15',
        trend: 'declining',
      },
      {
        id: 'r7',
        testName: 'HDL Colesterol',
        category: 'Lipídios',
        value: 45,
        unit: 'mg/dL',
        referenceRange: '> 40',
        status: 'normal',
        date: '2024-01-10',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
      {
        id: 'r8',
        testName: 'LDL Colesterol',
        category: 'Lipídios',
        value: 155,
        unit: 'mg/dL',
        referenceRange: '< 130',
        status: 'borderline',
        date: '2024-01-10',
        provider: 'Laboratório Central',
        previousValue: 150,
        previousDate: '2023-11-15',
        trend: 'declining',
      },
      {
        id: 'r9',
        testName: 'Triglicerídeos',
        category: 'Lipídios',
        value: 180,
        unit: 'mg/dL',
        referenceRange: '< 150',
        status: 'abnormal',
        date: '2024-01-10',
        provider: 'Laboratório Central',
        previousValue: 175,
        previousDate: '2023-11-15',
        trend: 'declining',
      },
    ],
  },
  {
    id: '3',
    reportDate: '2023-12-15',
    orderedBy: 'Dr. Pedro Costa',
    provider: 'Laboratório Central',
    summary: 'Hemograma completo',
    doctorNotes: 'Resultados normais. Paciente em bom estado de saúde.',
    acknowledged: true,
    acknowledgedAt: '2023-12-16',
    results: [
      {
        id: 'r10',
        testName: 'Hemácias',
        category: 'Hemograma',
        value: 4.7,
        unit: 'milhões/mm³',
        referenceRange: '4.5 - 5.5',
        status: 'normal',
        date: '2023-12-15',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
      {
        id: 'r11',
        testName: 'Leucócitos',
        category: 'Hemograma',
        value: 7.0,
        unit: 'mil/mm³',
        referenceRange: '4.0 - 11.0',
        status: 'normal',
        date: '2023-12-15',
        provider: 'Laboratório Central',
        trend: 'stable',
      },
    ],
  },
];

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

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    mockReports.forEach(report => {
      report.results.forEach(result => {
        cats.add(result.category);
      });
    });
    return Array.from(cats);
  }, []);

  // Get critical results
  const criticalResults = useMemo(() => {
    const critical: TestResult[] = [];
    mockReports.forEach(report => {
      report.results.forEach(result => {
        if (result.status === 'critical' || result.critical) {
          critical.push(result);
        }
      });
    });
    return critical;
  }, []);

  // Get abnormal results for summary
  const abnormalResults = useMemo(() => {
    const abnormal: TestResult[] = [];
    mockReports.forEach(report => {
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
  }, []);

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = [...mockReports];

    if (searchQuery) {
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
  }, [searchQuery, selectedCategory, selectedStatus]);

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
    
    mockReports.forEach(report => {
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
          borderColor: '#0F4C75',
          backgroundColor: 'rgba(15, 76, 117, 0.1)',
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
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Resultados de Exames</h1>
            <p className="text-[#5D737E]">
              Acompanhe seus exames laboratoriais e resultados
            </p>
          </div>

          {/* Critical Results Alert */}
          {criticalResults.length > 0 && (
            <Alert className="medical-card border-red-300 bg-red-50 mb-6">
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
          <Card className="medical-card mb-6">
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

          {/* View Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'summary' | 'detailed')}>
              <TabsList>
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="detailed">Detalhado</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </div>

          {/* Summary View */}
          {viewMode === 'summary' && (
            <div className="space-y-6">
              {/* Abnormal Results Summary */}
              {abnormalResults.length > 0 && (
                <Card className="medical-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0F4C75]">
                      <AlertTriangle className="h-5 w-5" />
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
                                const report = mockReports.find(r => r.results.some(res => res.id === result.id));
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
                <h2 className="text-xl font-semibold text-[#0F4C75]">Todos os Relatórios</h2>
                {filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className="medical-card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-[#0F4C75] mb-1">
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
          {viewMode === 'detailed' && (
            <div className="space-y-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="medical-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-[#0F4C75] mb-2">
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
                        <Button variant="outline" size="sm">
                          <FileDown className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        {!report.acknowledged && (
                          <Button
                            size="sm"
                            onClick={() => acknowledgeReport(report.id)}
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
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Observações do Médico
                        </h4>
                        <p className="text-blue-800 text-sm">{report.doctorNotes}</p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {report.recommendations && (
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
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
                      <Button variant="outline" size="sm">
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
                  <DialogTitle className="text-2xl text-[#0F4C75]">
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
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Observações do Médico</h4>
                      <p className="text-blue-800 text-sm">{selectedReport.doctorNotes}</p>
                    </div>
                  )}
                  {selectedReport.recommendations && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Recomendações</h4>
                      <p className="text-green-800 text-sm">{selectedReport.recommendations}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}

