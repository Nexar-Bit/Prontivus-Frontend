"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  Share2,
  MessageCircle,
  Calendar,
  User,
  Stethoscope,
  TestTube,
  Pill,
  AlertTriangle,
  Heart,
  Syringe,
  TrendingUp,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { format, subDays, startOfYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { LineChart } from "@/components/charts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { BodyChart } from "@/components/patient/BodyChart";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

// Types
interface MedicalRecord {
  id: string;
  type: 'consultation' | 'prescription' | 'test' | 'allergy' | 'condition' | 'procedure' | 'immunization';
  category: 'consultations' | 'allergies' | 'conditions' | 'procedures' | 'immunizations';
  title: string;
  date: string;
  doctor?: string;
  provider?: string;
  content: string;
  details?: Record<string, any>;
  status?: 'normal' | 'abnormal' | 'pending' | 'active' | 'resolved';
  attachments?: number;
  vitalSigns?: {
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
  };
}

interface VitalSignData {
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  weight: number;
}

interface MedicationAdherence {
  medication: string;
  prescribed: number;
  taken: number;
  adherence: number;
  status: 'good' | 'fair' | 'poor';
}

// Mock data
const mockRecords: MedicalRecord[] = [
  {
    id: '1',
    type: 'consultation',
    category: 'consultations',
    title: 'Consulta de Rotina - Cardiologia',
    date: '2024-01-15',
    doctor: 'Dr. Maria Silva',
    provider: 'Clínica Prontivus',
    content: 'Paciente em bom estado geral. Pressão arterial: 120/80 mmHg. Frequência cardíaca: 72 bpm. Peso: 75kg. Exame físico normal. Recomendações: manter atividade física regular.',
    status: 'normal',
    vitalSigns: {
      systolic: 120,
      diastolic: 80,
      heartRate: 72,
      temperature: 36.5,
      weight: 75,
    },
  },
  {
    id: '2',
    type: 'allergy',
    category: 'allergies',
    title: 'Alergia a Penicilina',
    date: '2023-12-10',
    doctor: 'Dr. João Santos',
    provider: 'Clínica Prontivus',
    content: 'Alergia confirmada à penicilina. Reação observada: urticária e inchaço. Gravidade: Moderada. Status: Ativa.',
    status: 'active',
    details: {
      severity: 'Moderada',
      reaction: 'Urticária e inchaço',
      firstObserved: '2020-05-15',
    },
  },
  {
    id: '3',
    type: 'condition',
    category: 'conditions',
    title: 'Hipertensão Arterial',
    date: '2023-11-20',
    doctor: 'Dr. Pedro Costa',
    provider: 'Clínica Prontivus',
    content: 'Diagnóstico de hipertensão arterial. Pressão arterial média: 140/90 mmHg. Plano de tratamento: medicação diária e mudanças no estilo de vida.',
    status: 'active',
    details: {
      diagnosisDate: '2023-11-20',
      severity: 'Moderada',
      treatment: 'Medicação diária',
    },
  },
  {
    id: '4',
    type: 'procedure',
    category: 'procedures',
    title: 'Exame de Ecocardiograma',
    date: '2024-01-10',
    doctor: 'Dr. Maria Silva',
    provider: 'Clínica Prontivus',
    content: 'Ecocardiograma transtorácico realizado. Função cardíaca normal. Fração de ejeção: 65%. Sem alterações estruturais.',
    status: 'normal',
    attachments: 1,
  },
  {
    id: '5',
    type: 'immunization',
    category: 'immunizations',
    title: 'Vacina contra Influenza (2024)',
    date: '2024-01-05',
    doctor: 'Dr. Ana Paula',
    provider: 'Clínica Prontivus',
    content: 'Vacinação contra influenza administrada. Lote: INF-2024-001. Próxima dose recomendada: Janeiro 2025.',
    status: 'normal',
    details: {
      lotNumber: 'INF-2024-001',
      nextDose: '2025-01',
    },
  },
  {
    id: '6',
    type: 'test',
    category: 'consultations',
    title: 'Hemograma Completo',
    date: '2024-01-10',
    doctor: 'Dr. João Santos',
    provider: 'Laboratório Central',
    content: 'Hemácias: 4.8 milhões/mm³ (Normal)\nLeucócitos: 7.200/mm³ (Normal)\nPlaquetas: 250.000/mm³ (Normal)\nHemoglobina: 14.5 g/dL (Normal)',
    status: 'normal',
    attachments: 1,
  },
  {
    id: '7',
    type: 'prescription',
    category: 'consultations',
    title: 'Prescrição - Losartana 50mg',
    date: '2024-01-15',
    doctor: 'Dr. Maria Silva',
    provider: 'Clínica Prontivus',
    content: 'Losartana 50mg - 1 comprimido ao dia pela manhã\nÁcido Acetilsalicílico 100mg - 1 comprimido ao dia\nUso contínuo. Retornar em 3 meses para acompanhamento.',
    status: 'active',
  },
  {
    id: '8',
    type: 'test',
    category: 'consultations',
    title: 'Glicemia em Jejum',
    date: '2024-01-10',
    doctor: 'Dr. João Santos',
    provider: 'Laboratório Central',
    content: 'Glicemia: 110 mg/dL (Valor elevado - acima do normal)\nRecomendação: repetir exame e avaliar glicemia pós-prandial.',
    status: 'abnormal',
    attachments: 1,
  },
];

const mockVitalSigns: VitalSignData[] = [
  { date: '2023-10-01', systolic: 145, diastolic: 92, heartRate: 78, temperature: 36.8, weight: 76 },
  { date: '2023-11-01', systolic: 140, diastolic: 88, heartRate: 75, temperature: 36.6, weight: 75.5 },
  { date: '2023-12-01', systolic: 138, diastolic: 85, heartRate: 74, temperature: 36.7, weight: 75.2 },
  { date: '2024-01-01', systolic: 135, diastolic: 82, heartRate: 73, temperature: 36.5, weight: 75 },
  { date: '2024-01-15', systolic: 120, diastolic: 80, heartRate: 72, temperature: 36.5, weight: 75 },
];

const mockMedications: MedicationAdherence[] = [
  { medication: 'Losartana 50mg', prescribed: 30, taken: 28, adherence: 93, status: 'good' },
  { medication: 'Ácido Acetilsalicílico 100mg', prescribed: 30, taken: 30, adherence: 100, status: 'good' },
  { medication: 'Metformina 500mg', prescribed: 60, taken: 48, adherence: 80, status: 'fair' },
];

const recordTypeConfig = {
  consultation: {
    icon: Stethoscope,
    color: '#0F4C75',
    bgColor: 'bg-[#0F4C75]/10',
    borderColor: 'border-[#0F4C75]/20',
    textColor: 'text-[#0F4C75]',
    label: 'Consulta',
  },
  prescription: {
    icon: Pill,
    color: '#16C79A',
    bgColor: 'bg-[#16C79A]/10',
    borderColor: 'border-[#16C79A]/20',
    textColor: 'text-[#16C79A]',
    label: 'Prescrição',
  },
  test: {
    icon: TestTube,
    color: '#FF8C42',
    bgColor: 'bg-[#FF8C42]/10',
    borderColor: 'border-[#FF8C42]/20',
    textColor: 'text-[#FF8C42]',
    label: 'Exame',
  },
  allergy: {
    icon: AlertTriangle,
    color: '#DC2626',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    label: 'Alergia',
  },
  condition: {
    icon: Heart,
    color: '#9333EA',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    label: 'Condição',
  },
  procedure: {
    icon: Activity,
    color: '#1B9AAA',
    bgColor: 'bg-[#1B9AAA]/10',
    borderColor: 'border-[#1B9AAA]/20',
    textColor: 'text-[#1B9AAA]',
    label: 'Procedimento',
  },
  immunization: {
    icon: Syringe,
    color: '#16C79A',
    bgColor: 'bg-[#16C79A]/10',
    borderColor: 'border-[#16C79A]/20',
    textColor: 'text-[#16C79A]',
    label: 'Vacinação',
  },
};

export default function MedicalRecordsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: startOfYear(new Date()),
    to: new Date(),
  });
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Get unique providers
  const providers = useMemo<string[]>(() => {
    const uniqueProviders = new Set<string>(
      mockRecords
        .map(r => r.provider)
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
    );
    return Array.from(uniqueProviders);
  }, []);

  // Filter records
  const filteredRecords = useMemo(() => {
    let filtered = [...mockRecords];

    // Filter by category/tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.category === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query) ||
        r.doctor?.toLowerCase().includes(query) ||
        r.provider?.toLowerCase().includes(query)
      );
    }

    // Filter by provider
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(r => r.provider === selectedProvider);
    }

    // Filter by date range
    if (selectedDateRange.from && selectedDateRange.to) {
      filtered = filtered.filter(r => {
        const recordDate = parseISO(r.date);
        return recordDate >= selectedDateRange.from! && recordDate <= selectedDateRange.to!;
      });
    }

    return filtered.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [activeTab, searchQuery, selectedProvider, selectedDateRange]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecords(newExpanded);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'normal':
      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        );
      case 'abnormal':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Anormal
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <Activity className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  // Prepare vital signs chart data
  const vitalSignsData = {
    labels: mockVitalSigns.map(v => format(parseISO(v.date), 'MMM yyyy', { locale: ptBR })),
    datasets: [
      {
        label: 'Pressão Sistólica',
        data: mockVitalSigns.map(v => v.systolic),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Pressão Diastólica',
        data: mockVitalSigns.map(v => v.diastolic),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Frequência Cardíaca',
        data: mockVitalSigns.map(v => v.heartRate),
        borderColor: '#1B9AAA',
        backgroundColor: 'rgba(27, 154, 170, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const vitalSignsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
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
            <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Prontuário Médico</h1>
            <p className="text-[#5D737E]">
              Seu histórico médico completo, organizado e acessível
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="medical-card mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar no prontuário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full md:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Período
                    </label>
                    <DateRangePicker
                      value={{
                        from: selectedDateRange.from || undefined,
                        to: selectedDateRange.to || undefined,
                      }}
                      onChange={(range) => {
                        setSelectedDateRange({
                          from: range.from || null,
                          to: range.to || null,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Prestador
                    </label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os prestadores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os prestadores</SelectItem>
                        {providers.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedProvider('all');
                        setSelectedDateRange({ from: startOfYear(new Date()), to: new Date() });
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="consultations">Consultas</TabsTrigger>
              <TabsTrigger value="allergies">Alergias</TabsTrigger>
              <TabsTrigger value="conditions">Condições</TabsTrigger>
              <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
              <TabsTrigger value="immunizations">Vacinas</TabsTrigger>
            </TabsList>

            {/* Data Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
              {/* Interactive Body Chart */}
              <div className="lg:col-span-2">
                <BodyChart interactive />
              </div>
              {/* Vital Signs Trends */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F4C75]">
                    <TrendingUp className="h-5 w-5" />
                    Tendência de Sinais Vitais
                  </CardTitle>
                  <CardDescription>
                    Monitoramento ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <LineChart data={vitalSignsData} options={vitalSignsOptions} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#DC2626]" />
                      <span className="text-gray-600">Normal: 90-120 mmHg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#1B9AAA]" />
                      <span className="text-gray-600">Normal: 60-100 bpm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medication Adherence */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F4C75]">
                    <Pill className="h-5 w-5" />
                    Adesão Medicamentosa
                  </CardTitle>
                  <CardDescription>
                    Taxa de adesão aos medicamentos prescritos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMedications.map((med, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{med.medication}</span>
                          <Badge
                            className={cn(
                              med.status === 'good' && 'bg-green-100 text-green-700',
                              med.status === 'fair' && 'bg-yellow-100 text-yellow-700',
                              med.status === 'poor' && 'bg-red-100 text-red-700'
                            )}
                          >
                            {med.adherence}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          {/* eslint-disable-next-line react/forbid-dom-props */}
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              med.status === 'good' && 'bg-green-500',
                              med.status === 'fair' && 'bg-yellow-500',
                              med.status === 'poor' && 'bg-red-500'
                            )}
                            style={{ width: `${med.adherence}%` } as React.CSSProperties}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {med.taken} de {med.prescribed} doses
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline View */}
            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0F4C75]">
                  Linha do Tempo Médica
                </h2>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Prontuário
                </Button>
              </div>

              {/* Timeline Visualization */}
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0F4C75] via-[#1B9AAA] to-[#16C79A]" />

                <div className="space-y-6">
                  {filteredRecords.length === 0 ? (
                    <Card className="medical-card">
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum registro encontrado</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredRecords.map((record) => {
                      const config = recordTypeConfig[record.type];
                      const Icon = config.icon;
                      const isExpanded = expandedRecords.has(record.id);

                      return (
                        <div key={record.id} className="relative">
                          {/* Timeline dot */}
                          {/* eslint-disable-next-line react/forbid-dom-props */}
                          <div
                            className={cn(
                              "absolute left-4 w-4 h-4 rounded-full border-4 border-white shadow-md z-10"
                            )}
                            style={{ backgroundColor: config.color } as React.CSSProperties}
                          />

                          {/* Record Card */}
                          <Card
                            className={cn(
                              "ml-16 transition-all hover:shadow-lg cursor-pointer medical-card",
                              config.borderColor,
                              isExpanded && "shadow-md"
                            )}
                            onClick={() => toggleExpand(record.id)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                                    <Icon className={cn("h-5 w-5", config.textColor)} />
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-base font-semibold text-gray-900 mb-1">
                                      {record.title}
                                    </CardTitle>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(parseISO(record.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </div>
                                      {record.doctor && (
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {record.doctor}
                                        </div>
                                      )}
                                      {record.provider && (
                                        <div className="flex items-center gap-1">
                                          <Stethoscope className="h-3 w-3" />
                                          {record.provider}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(record.status)}
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>

                            {isExpanded && (
                              <CardContent className="pt-0">
                                <div className="space-y-4">
                                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                    <p className="text-sm text-gray-700 whitespace-pre-line">
                                      {record.content}
                                    </p>
                                  </div>

                                  {record.details && (
                                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                                      {Object.entries(record.details).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="text-xs font-medium text-blue-700 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                                          </span>
                                          <span className="text-sm text-blue-900 ml-2">{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {record.vitalSigns && (
                                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                      <h4 className="text-sm font-semibold text-green-900 mb-2">Sinais Vitais</h4>
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                        <div>
                                          <span className="text-green-700">PA:</span>
                                          <span className="text-green-900 ml-1">
                                            {record.vitalSigns.systolic}/{record.vitalSigns.diastolic} mmHg
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-green-700">FC:</span>
                                          <span className="text-green-900 ml-1">
                                            {record.vitalSigns.heartRate} bpm
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-green-700">Temp:</span>
                                          <span className="text-green-900 ml-1">
                                            {record.vitalSigns.temperature}°C
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-green-700">Peso:</span>
                                          <span className="text-green-900 ml-1">
                                            {record.vitalSigns.weight} kg
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                    {record.attachments && (
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {record.attachments} Anexo(s)
                                      </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="text-xs ml-auto">
                                      <Download className="h-3 w-3 mr-1" />
                                      Baixar
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs">
                                      <Share2 className="h-3 w-3 mr-1" />
                                      Compartilhar
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs">
                                      <MessageCircle className="h-3 w-3 mr-1" />
                                      Falar com médico
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

