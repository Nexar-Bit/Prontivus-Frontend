"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Pill,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingCart,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bell,
  Download,
  Share2,
  Search,
  Filter,
  Plus,
  Clock3,
  Package,
  Truck,
  Phone,
  Mail,
  ExternalLink,
  Info,
  AlertCircle,
  Heart,
  Activity,
  Eye,
  ChevronUp,
  ChevronRight,
  Star,
} from "lucide-react";
import { format, parseISO, addDays, isAfter, isBefore, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";

// Types
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  issuedDate: string;
  prescriber: string;
  status: 'active' | 'completed' | 'discontinued';
  refillsRemaining: number;
  refillsTotal: number;
  nextRefillDate?: string;
  adherence: number;
  type: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream';
  color?: string;
  shape?: string;
  sideEffects?: string[];
  interactions?: string[];
  warnings?: string[];
  pharmacyId?: string;
  pharmacyName?: string;
  cost?: number;
  insuranceCoverage?: number;
  takenToday: number;
  scheduledToday: number;
  lastTaken?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  price: number;
  deliveryAvailable: boolean;
  estimatedDelivery?: string;
  rating: number;
}

interface RefillRequest {
  id: string;
  medicationId: string;
  medicationName: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'denied';
  pharmacyId?: string;
}

// Data state (from DB)
const mockActiveMedications: Medication[] = [];
const mockPastMedications: Medication[] = [];

const mockPharmacies: Pharmacy[] = [
  {
    id: 'ph1',
    name: 'Farmácia Central',
    address: 'Av. Principal, 123 - Centro',
    phone: '(11) 3456-7890',
    distance: 0.8,
    price: 45.90,
    deliveryAvailable: true,
    estimatedDelivery: '2-3 horas',
    rating: 4.8,
  },
  {
    id: 'ph2',
    name: 'Farmácia Popular',
    address: 'Rua das Flores, 456',
    phone: '(11) 3344-5566',
    distance: 1.2,
    price: 42.50,
    deliveryAvailable: true,
    estimatedDelivery: '3-4 horas',
    rating: 4.6,
  },
  {
    id: 'ph3',
    name: 'Farmácia 24h',
    address: 'Av. Comercial, 789',
    phone: '(11) 3789-0123',
    distance: 2.5,
    price: 48.90,
    deliveryAvailable: false,
    rating: 4.7,
  },
];

const medicationTypeColors: Record<string, string> = {
  tablet: '#0F4C75',
  capsule: '#1B9AAA',
  syrup: '#16C79A',
  injection: '#FF8C42',
  cream: '#9333EA',
};

const medicationTypeIcons: Record<string, React.ReactNode> = {
  tablet: '💊',
  capsule: '💉',
  syrup: '🧴',
  injection: '💉',
  cream: '🧴',
};

export default function PrescriptionsPage() {
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [pastMeds, setPastMeds] = useState<Medication[]>([]);

  useEffect(() => {
    const load = async () => {
      const history = await api.get<any[]>(`/api/clinical/me/history`);
      const meds: Medication[] = [];
      history.forEach(item => {
        item.clinical_record?.prescriptions?.forEach((p: any) => {
          meds.push({
            id: String(p.id),
            name: p.medication_name,
            dosage: p.dosage || '',
            frequency: p.frequency || '',
            duration: p.duration || '',
            instructions: p.instructions || '',
            issuedDate: p.issued_date,
            prescriber: item.doctor_name,
            status: p.is_active ? 'active' : 'completed',
            refillsRemaining: 0,
            refillsTotal: 0,
            adherence: 0,
            type: 'tablet',
            takenToday: 0,
            scheduledToday: 0,
          });
        });
      });
      setActiveMeds(meds.filter(m => m.status === 'active'));
      setPastMeds(meds.filter(m => m.status !== 'active'));
    };
    load();
  }, []);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showPharmacyDialog, setShowPharmacyDialog] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(new Set());

  // Filter medications
  const filteredActive = useMemo(() => {
    if (!searchQuery) return activeMeds;
    const query = searchQuery.toLowerCase();
    return activeMeds.filter(med =>
      med.name.toLowerCase().includes(query) ||
      med.prescriber.toLowerCase().includes(query)
    );
  }, [searchQuery, activeMeds]);

  const filteredPast = useMemo(() => {
    if (!searchQuery) return pastMeds;
    const query = searchQuery.toLowerCase();
    return pastMeds.filter(med =>
      med.name.toLowerCase().includes(query) ||
      med.prescriber.toLowerCase().includes(query)
    );
  }, [searchQuery, pastMeds]);

  // Pending refills
  const pendingRefills = useMemo(() => {
    return mockActiveMedications.filter(med => {
      if (!med.nextRefillDate) return false;
      const refillDate = parseISO(med.nextRefillDate);
      return isBefore(refillDate, addDays(new Date(), 7)) && med.refillsRemaining > 0;
    });
  }, []);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMedications);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMedications(newExpanded);
  };

  const markAsTaken = (medicationId: string) => {
    // In real app, this would update the database
    console.log('Marked as taken:', medicationId);
  };

  const requestRefill = (medication: Medication) => {
    const newRequest: RefillRequest = {
      id: Date.now().toString(),
      medicationId: medication.id,
      medicationName: medication.name,
      requestedDate: new Date().toISOString(),
      status: 'pending',
    };
    setRefillRequests(prev => [...prev, newRequest]);
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 90) return 'text-green-600';
    if (adherence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceLabel = (adherence: number) => {
    if (adherence >= 90) return 'Excelente';
    if (adherence >= 70) return 'Boa';
    return 'Precisa melhorar';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Activity className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'discontinued':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Descontinuado
          </Badge>
        );
      default:
        return null;
    }
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Medicamentos</h1>
              <p className="text-[#5D737E]">
                Gerencie suas prescrições e acompanhe sua adesão medicamentosa
              </p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Lista
            </Button>
          </div>

          {/* Pending Refills Alert */}
          {pendingRefills.length > 0 && (
            <Alert className="medical-card border-yellow-300 bg-yellow-50 mb-6">
              <Bell className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-900 font-semibold">
                Renovação de Prescrições Pendentes
              </AlertTitle>
              <AlertDescription className="text-yellow-800 mt-2">
                Você tem {pendingRefills.length} medicamento(s) que precisam ser renovados em breve.
              </AlertDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                {pendingRefills.map(med => (
                  <Button
                    key={med.id}
                    size="sm"
                    variant="outline"
                    className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                    onClick={() => requestRefill(med)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renovar {med.name}
                  </Button>
                ))}
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
                    placeholder="Buscar medicamentos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">
                Ativos ({activeMeds.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Histórico ({pastMeds.length})
              </TabsTrigger>
              <TabsTrigger value="refills">
                Renovações ({pendingRefills.length})
              </TabsTrigger>
              <TabsTrigger value="pharmacy">
                Farmácias
              </TabsTrigger>
            </TabsList>

            {/* Active Medications */}
            <TabsContent value="active" className="space-y-4">
              {filteredActive.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="py-12 text-center">
                    <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum medicamento ativo encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                filteredActive.map((medication) => {
                  const isExpanded = expandedMedications.has(medication.id);
                  const needsRefill = medication.nextRefillDate && isBefore(parseISO(medication.nextRefillDate), addDays(new Date(), 7));
                  const pillsRemaining = medication.refillsRemaining * 30; // Mock calculation

                  return (
                    <Card
                      key={medication.id}
                      className="medical-card hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Pill Visual */}
                            {/* eslint-disable-next-line react/forbid-dom-props */}
                            <div
                              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl border-2"
                              style={{
                                backgroundColor: `${medicationTypeColors[medication.type]}15`,
                                borderColor: `${medicationTypeColors[medication.type]}40`,
                              } as React.CSSProperties}
                            >
                              {medicationTypeIcons[medication.type] || '💊'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl text-[#0F4C75]">
                                  {medication.name}
                                </CardTitle>
                                {getStatusBadge(medication.status)}
                                {needsRefill && (
                                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Renovação Próxima
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500 mb-1">Dosagem</div>
                                  <div className="font-medium text-gray-900">{medication.dosage}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Frequência</div>
                                  <div className="font-medium text-gray-900">{medication.frequency}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Prescrito por</div>
                                  <div className="font-medium text-gray-900">{medication.prescriber}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Adesão</div>
                                  <div className={cn("font-semibold", getAdherenceColor(medication.adherence))}>
                                    {medication.adherence}% - {getAdherenceLabel(medication.adherence)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(medication.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Dosage Schedule Timeline */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-gray-700">
                              Horários de Hoje ({medication.takenToday}/{medication.scheduledToday})
                            </div>
                            {medication.takenToday < medication.scheduledToday && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsTaken(medication.id)}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Marcar como Tomado
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['08:00', '14:00', '20:00'].map((time, idx) => {
                              const isScheduled = idx < medication.scheduledToday;
                              const isTaken = idx < medication.takenToday;
                              return (
                                <div
                                  key={time}
                                  className={cn(
                                    "p-3 rounded-lg border-2 text-center transition-all",
                                    isTaken
                                      ? "border-green-300 bg-green-50"
                                      : isScheduled
                                      ? "border-blue-300 bg-blue-50"
                                      : "border-gray-200 bg-gray-50"
                                  )}
                                >
                                  <div className="text-xs text-gray-500 mb-1">{time}</div>
                                  {isTaken ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                  ) : isScheduled ? (
                                    <Clock className="h-5 w-5 text-blue-600 mx-auto" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Adherence Progress */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">Adesão ao Tratamento</span>
                              <span className={cn("font-semibold", getAdherenceColor(medication.adherence))}>
                                {medication.adherence}%
                              </span>
                            </div>
                            <Progress
                              value={medication.adherence}
                              className={cn(
                                "h-2",
                                medication.adherence >= 90 && "bg-green-100",
                                medication.adherence >= 70 && medication.adherence < 90 && "bg-yellow-100",
                                medication.adherence < 70 && "bg-red-100"
                              )}
                            />
                          </div>
                        </div>

                        {/* Refill Status */}
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-blue-900">Renovações</div>
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              {medication.refillsRemaining} de {medication.refillsTotal} restantes
                            </Badge>
                          </div>
                          {medication.nextRefillDate && (
                            <div className="text-sm text-blue-800">
                              Próxima renovação: {format(parseISO(medication.nextRefillDate), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                          )}
                          {medication.refillsRemaining > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={() => requestRefill(medication)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Solicitar Renovação
                            </Button>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-gray-200 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Instruções</div>
                                <div className="text-sm text-gray-900">{medication.instructions}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Duração do Tratamento</div>
                                <div className="text-sm text-gray-900">{medication.duration}</div>
                              </div>
                            </div>

                            {medication.warnings && medication.warnings.length > 0 && (
                              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <div className="text-sm font-semibold text-red-900">Avisos Importantes</div>
                                </div>
                                <ul className="space-y-1">
                                  {medication.warnings.map((warning, idx) => (
                                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                                      <span className="text-red-600 mt-0.5">•</span>
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {medication.sideEffects && medication.sideEffects.length > 0 && (
                              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                <div className="text-sm font-semibold text-yellow-900 mb-2">Possíveis Efeitos Colaterais</div>
                                <div className="flex flex-wrap gap-2">
                                  {medication.sideEffects.map((effect, idx) => (
                                    <Badge key={idx} variant="outline" className="border-yellow-300 text-yellow-700">
                                      {effect}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {medication.interactions && medication.interactions.length > 0 && (
                              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                                <div className="text-sm font-semibold text-orange-900 mb-2">Interações Medicamentosas</div>
                                <div className="text-sm text-orange-800">
                                  {medication.interactions.join(', ')}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMedication(medication);
                                  setShowPharmacyDialog(true);
                                }}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Encontrar Farmácia
                              </Button>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/prescriptions/${medication.id}/pdf`;
                                window.open(url, '_blank');
                              }}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Receita
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Past Medications */}
            <TabsContent value="past" className="space-y-4">
              {filteredPast.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum medicamento no histórico</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPast.map((medication) => (
                  <Card key={medication.id} className="medical-card opacity-75">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2"
                          style={{
                            backgroundColor: `${medicationTypeColors[medication.type] || '#0F4C75'}15`,
                            borderColor: `${medicationTypeColors[medication.type] || '#0F4C75'}40`,
                          } as React.CSSProperties}
                        >
                          {medicationTypeIcons[medication.type] || '💊'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg text-gray-700">
                              {medication.name}
                            </CardTitle>
                            {getStatusBadge(medication.status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {medication.dosage} • {medication.frequency} • Prescrito por {medication.prescriber}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Emitida em {format(parseISO(medication.issuedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Refills */}
            <TabsContent value="refills" className="space-y-4">
              {refillRequests.length === 0 && pendingRefills.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="py-12 text-center">
                    <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma renovação pendente</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {refillRequests.map(request => (
                    <Card key={request.id} className="medical-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-[#0F4C75]">
                              {request.medicationName}
                            </CardTitle>
                            <CardDescription>
                              Solicitado em {format(parseISO(request.requestedDate), "dd 'de' MMMM", { locale: ptBR })}
                            </CardDescription>
                          </div>
                          <Badge
                            className={
                              request.status === 'approved'
                                ? "bg-green-100 text-green-700"
                                : request.status === 'denied'
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {request.status === 'pending' && 'Pendente'}
                            {request.status === 'approved' && 'Aprovado'}
                            {request.status === 'denied' && 'Negado'}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {pendingRefills.map(med => (
                    <Card key={med.id} className="medical-card border-yellow-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-[#0F4C75]">
                              {med.name}
                            </CardTitle>
                            <CardDescription>
                              Renovação disponível • {med.refillsRemaining} renovação(ões) restante(s)
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => requestRefill(med)}
                            className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Solicitar Renovação
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>

            {/* Pharmacy */}
            <TabsContent value="pharmacy" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0F4C75] mb-4">Farmácias Próximas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockPharmacies.map((pharmacy) => (
                    <Card
                      key={pharmacy.id}
                      className="medical-card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedPharmacy(pharmacy)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-[#0F4C75] mb-2">
                              {pharmacy.name}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4" />
                              {pharmacy.distance} km • {pharmacy.address}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {pharmacy.rating}
                              </div>
                              {pharmacy.deliveryAvailable && (
                                <Badge variant="outline" className="border-green-300 text-green-700">
                                  <Truck className="h-3 w-3 mr-1" />
                                  Entrega Disponível
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div>
                            <div className="text-xs text-gray-500">Preço Estimado</div>
                            <div className="text-lg font-bold text-[#0F4C75]">
                              R$ {pharmacy.price.toFixed(2)}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Pharmacy Dialog */}
          <Dialog open={showPharmacyDialog} onOpenChange={setShowPharmacyDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Escolher Farmácia</DialogTitle>
                <DialogDescription>
                  Selecione uma farmácia para {selectedMedication?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {mockPharmacies.map((pharmacy) => (
                  <Card
                    key={pharmacy.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedPharmacy?.id === pharmacy.id && "border-2 border-[#0F4C75]"
                    )}
                    onClick={() => setSelectedPharmacy(pharmacy)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{pharmacy.name}</div>
                          <div className="text-sm text-gray-600 mb-2">{pharmacy.address}</div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {pharmacy.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {pharmacy.distance} km
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {pharmacy.rating}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-[#0F4C75]">
                            R$ {pharmacy.price.toFixed(2)}
                          </div>
                          {selectedMedication?.insuranceCoverage && (
                            <div className="text-xs text-gray-500">
                              Com seguro: R$ {((pharmacy.price * (100 - selectedMedication.insuranceCoverage)) / 100).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      {pharmacy.deliveryAvailable && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Truck className="h-4 w-4" />
                              Entrega em {pharmacy.estimatedDelivery}
                            </div>
                            <Button size="sm" variant="outline">
                              Agendar Entrega
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowPharmacyDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-[#0F4C75] hover:bg-[#1B9AAA]"
                  onClick={() => {
                    if (selectedPharmacy && selectedMedication) {
                      setShowPharmacyDialog(false);
                      // In real app, this would create a prescription order
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Solicitar na {selectedPharmacy?.name}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
    );
}

