"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";

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
  tablet: '#5b9eff',
  capsule: '#14b8a6',
  syrup: '#22c55e',
  injection: '#f59e0b',
  cream: '#a78bfa',
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
  const [loading, setLoading] = useState(true);

  // Helper function to map prescription data from API
  const mapPrescription = (presc: any): Medication => {
    // Determine medication type based on name or default to tablet
    const nameLower = (presc.medication_name || '').toLowerCase();
    let medType: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' = 'tablet';
    if (nameLower.includes('cápsula') || nameLower.includes('capsula')) medType = 'capsule';
    else if (nameLower.includes('xarope') || nameLower.includes('solução') || nameLower.includes('suspensão')) medType = 'syrup';
    else if (nameLower.includes('injeção') || nameLower.includes('injecao') || nameLower.includes('ampola')) medType = 'injection';
    else if (nameLower.includes('creme') || nameLower.includes('pomada') || nameLower.includes('gel')) medType = 'cream';

    return {
      id: String(presc.id),
      name: presc.medication_name || 'Medicamento',
      dosage: presc.dosage || 'Não especificado',
      frequency: presc.frequency || 'Não especificado',
      duration: presc.duration || 'Não especificado',
      instructions: presc.instructions || 'Seguir orientações do médico',
      issuedDate: presc.issued_date || presc.appointment_date || new Date().toISOString(),
      prescriber: presc.doctor_name || 'Médico',
      status: presc.is_active ? 'active' : 'completed',
      refillsRemaining: 0, // Not available in current model
      refillsTotal: 0, // Not available in current model
      adherence: 85, // Default adherence (could be calculated from usage data if available)
      type: medType,
      takenToday: 0, // Would need separate tracking
      scheduledToday: 3, // Default based on frequency
      lastTaken: undefined,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Fetch all prescriptions (active and past)
        const prescriptions = await api.get<any[]>(`/api/v1/patient/prescriptions`);
        
        // Map prescriptions to Medication format
        const meds: Medication[] = prescriptions.map(mapPrescription);
        
        // Separate active and past medications
        setActiveMeds(meds.filter(m => m.status === 'active'));
        setPastMeds(meds.filter(m => m.status !== 'active'));
      } catch (error: any) {
        console.error("Error loading prescriptions:", error);
        toast.error("Erro ao carregar prescrições", {
          description: error?.message || "Não foi possível carregar suas prescrições",
        });
        setActiveMeds([]);
        setPastMeds([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showPharmacyDialog, setShowPharmacyDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter medications
  const filteredActive = useMemo(() => {
    let filtered = activeMeds;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(query) ||
        med.prescriber.toLowerCase().includes(query) ||
        med.dosage.toLowerCase().includes(query) ||
        med.frequency.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(med => med.status === statusFilter);
    }
    
    return filtered;
  }, [searchQuery, activeMeds, statusFilter]);

  const filteredPast = useMemo(() => {
    let filtered = pastMeds;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(query) ||
        med.prescriber.toLowerCase().includes(query) ||
        med.dosage.toLowerCase().includes(query) ||
        med.frequency.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(med => med.status === statusFilter);
    }
    
    return filtered;
  }, [searchQuery, pastMeds, statusFilter]);

  // Pending refills - check medications that might need refill soon
  const pendingRefills = useMemo(() => {
    return activeMeds.filter(med => {
      // Check if medication was issued more than 20 days ago (approaching end of typical 30-day supply)
      if (!med.issuedDate) return false;
      try {
        const issuedDate = parseISO(med.issuedDate);
        const daysSinceIssued = differenceInDays(new Date(), issuedDate);
        // If issued more than 20 days ago, might need refill
        return daysSinceIssued >= 20;
      } catch {
        return false;
      }
    });
  }, [activeMeds]);

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
                  <Pill className="h-7 w-7 text-white" />
                </div>
                Medicamentos
              </h1>
              <p className="text-gray-600 text-sm lg:text-base font-medium mt-2">
                Gerencie suas prescrições e acompanhe sua adesão medicamentosa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const prescriptions = await api.get<any[]>(`/api/v1/patient/prescriptions`);
                    const meds: Medication[] = prescriptions.map(mapPrescription);
                    setActiveMeds(meds.filter(m => m.status === 'active'));
                    setPastMeds(meds.filter(m => m.status !== 'active'));
                    setRefreshKey(prev => prev + 1);
                    toast.success('Prescrições atualizadas!');
                  } catch (error: any) {
                    toast.error('Erro ao atualizar', {
                      description: error?.message || error?.detail || 'Não foi possível atualizar as prescrições',
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
                className="border-2 border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                onClick={async () => {
                  try {
                    // Export prescriptions as CSV
                    const prescriptions = await api.get<any[]>(`/api/v1/patient/prescriptions`);
                    if (prescriptions.length === 0) {
                      toast.info('Nenhuma prescrição para exportar');
                      return;
                    }
                    
                    // Create CSV content
                    const csvRows = [];
                    csvRows.push('ID,Medicamento,Dosagem,Frequência,Duração,Instruções,Data Emissão,Médico,Status');
                    
                    prescriptions.forEach((presc: any) => {
                      csvRows.push([
                        presc.id,
                        presc.medication_name || '',
                        presc.dosage || '',
                        presc.frequency || '',
                        presc.duration || '',
                        (presc.instructions || '').replace(/,/g, ';'),
                        presc.issued_date ? format(parseISO(presc.issued_date), 'dd/MM/yyyy', { locale: ptBR }) : '',
                        presc.doctor_name || '',
                        presc.is_active ? 'Ativo' : 'Concluído'
                      ].join(','));
                    });
                    
                    const csvContent = csvRows.join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `prescricoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Lista exportada com sucesso!');
                  } catch (error: any) {
                    toast.error('Erro ao exportar lista', {
                      description: error?.message || error?.detail || 'Não foi possível exportar as prescrições',
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
                  <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <p className="text-gray-500 font-medium">Carregando prescrições...</p>
              </CardContent>
            </Card>
          )}

          {/* Statistics Cards */}
          {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Ativos
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Pill className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{activeMeds.length}</div>
                <p className="text-xs text-gray-600 mt-2 font-medium">Medicamentos ativos</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/30 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Histórico
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-colors">
                  <Package className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">{pastMeds.length}</div>
                <p className="text-xs text-gray-600 mt-2 font-medium">Medicamentos anteriores</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/30 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Adesão Média
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  {activeMeds.length > 0 
                    ? Math.round(activeMeds.reduce((sum, m) => sum + m.adherence, 0) / activeMeds.length)
                    : 0}%
                </div>
                <p className="text-xs text-gray-600 mt-2 font-medium">Taxa de adesão</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/30 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Renovações
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{pendingRefills.length}</div>
                <p className="text-xs text-gray-600 mt-2 font-medium">Pendentes</p>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Pending Refills Alert */}
          {!loading && pendingRefills.length > 0 && (
            <Alert className="border-l-4 border-l-orange-500 bg-orange-50/50 mb-6">
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
          {!loading && (
          <Card className="border-2 border-blue-100/50 mb-6 bg-gradient-to-br from-white to-blue-50/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por medicamento, médico, dosagem ou frequência..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="discontinued">Descontinuados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>
          )}

          {/* Tabs */}
          {!loading && (
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
                <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Pill className="h-10 w-10 text-blue-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum medicamento ativo encontrado</p>
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
                      className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm"
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
                                <CardTitle className="text-xl text-blue-600">
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
                        <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
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
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // For now, we'll create a simple text-based prescription
                                    // In production, this would generate a PDF from the backend
                                    const prescriptionText = `
PRESCRIÇÃO MÉDICA

Medicamento: ${medication.name}
Dosagem: ${medication.dosage}
Frequência: ${medication.frequency}
Duração: ${medication.duration}
Instruções: ${medication.instructions}

Prescrito por: ${medication.prescriber}
Data: ${format(parseISO(medication.issuedDate), "dd/MM/yyyy", { locale: ptBR })}

${medication.instructions || ''}
                                  `.trim();
                                  
                                  const blob = new Blob([prescriptionText], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `receita_${medication.name.replace(/\s+/g, '_')}_${format(parseISO(medication.issuedDate), 'yyyy-MM-dd', { locale: ptBR })}.txt`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Receita baixada com sucesso!');
                                } catch (error: any) {
                                  toast.error('Erro ao baixar receita', {
                                    description: error?.message || error?.detail || 'Não foi possível baixar a receita',
                                  });
                                }
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
                <Card className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <div className="p-4 bg-teal-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Package className="h-10 w-10 text-teal-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum medicamento no histórico</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPast.map((medication) => (
                  <Card key={medication.id} className="border-l-4 border-l-teal-500 opacity-75 bg-white/80 backdrop-blur-sm">
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
                <Card className="border-l-4 border-l-orange-500 bg-white/80 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <div className="p-4 bg-orange-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <RefreshCw className="h-10 w-10 text-orange-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma renovação pendente</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {refillRequests.map(request => (
                    <Card key={request.id} className="border-l-4 border-l-orange-500 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-blue-600">
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
                    <Card key={med.id} className="border-l-4 border-l-orange-500 bg-orange-50/30">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-blue-600">
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
                <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  Farmácias Próximas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockPharmacies.length > 0 ? mockPharmacies.map((pharmacy) => (
                    <Card
                      key={pharmacy.id}
                      className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm"
                      onClick={() => setSelectedPharmacy(pharmacy)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-blue-600 mb-2">
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
                            <div className="text-lg font-bold text-blue-600">
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
                  )) : (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                      Nenhuma farmácia disponível. Este recurso requer integração com um serviço de diretório de farmácias.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}

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
                {mockPharmacies.length > 0 ? mockPharmacies.map((pharmacy) => (
                  <Card
                    key={pharmacy.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedPharmacy?.id === pharmacy.id && "border-2 border-blue-500"
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
                          <div className="text-2xl font-bold text-blue-600">
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
                )) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma farmácia disponível. Este recurso requer integração com um serviço de diretório de farmácias.
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowPharmacyDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
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

          {/* Prescription Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes da Prescrição</DialogTitle>
                <DialogDescription>
                  Informações completas sobre a prescrição médica
                </DialogDescription>
              </DialogHeader>
              {selectedMedication && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl border-2 flex-shrink-0"
                      style={{
                        backgroundColor: `${medicationTypeColors[selectedMedication.type]}15`,
                        borderColor: `${medicationTypeColors[selectedMedication.type]}40`,
                      } as React.CSSProperties}
                    >
                      {medicationTypeIcons[selectedMedication.type] || '💊'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-600 mb-2">{selectedMedication.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(selectedMedication.status)}
                        <Badge variant="outline" className="capitalize">
                          {selectedMedication.type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Main Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Dosagem</div>
                      <div className="font-semibold text-gray-900">{selectedMedication.dosage}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Frequência</div>
                      <div className="font-semibold text-gray-900">{selectedMedication.frequency}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Duração do Tratamento</div>
                      <div className="font-semibold text-gray-900">{selectedMedication.duration}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Prescrito por</div>
                      <div className="font-semibold text-gray-900">{selectedMedication.prescriber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Data de Emissão</div>
                      <div className="font-semibold text-gray-900">
                        {format(parseISO(selectedMedication.issuedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Adesão ao Tratamento</div>
                      <div className={cn("font-semibold", getAdherenceColor(selectedMedication.adherence))}>
                        {selectedMedication.adherence}% - {getAdherenceLabel(selectedMedication.adherence)}
                      </div>
                      <Progress
                        value={selectedMedication.adherence}
                        className={cn(
                          "h-2 mt-2",
                          selectedMedication.adherence >= 90 && "bg-green-100",
                          selectedMedication.adherence >= 70 && selectedMedication.adherence < 90 && "bg-yellow-100",
                          selectedMedication.adherence < 70 && "bg-red-100"
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Instructions */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Instruções de Uso</div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMedication.instructions}</p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {selectedMedication.warnings && selectedMedication.warnings.length > 0 && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div className="text-sm font-semibold text-red-900">Avisos Importantes</div>
                      </div>
                      <ul className="space-y-2">
                        {selectedMedication.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedMedication.sideEffects && selectedMedication.sideEffects.length > 0 && (
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-sm font-semibold text-yellow-900 mb-3">Possíveis Efeitos Colaterais</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedMedication.sideEffects.map((effect, idx) => (
                          <Badge key={idx} variant="outline" className="border-yellow-300 text-yellow-700">
                            {effect}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMedication.interactions && selectedMedication.interactions.length > 0 && (
                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="text-sm font-semibold text-orange-900 mb-2">Interações Medicamentosas</div>
                      <div className="text-sm text-orange-800">
                        {selectedMedication.interactions.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedMedication(selectedMedication);
                        setShowPharmacyDialog(true);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Encontrar Farmácia
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          const prescriptionText = `
PRESCRIÇÃO MÉDICA

Medicamento: ${selectedMedication.name}
Dosagem: ${selectedMedication.dosage}
Frequência: ${selectedMedication.frequency}
Duração: ${selectedMedication.duration}
Instruções: ${selectedMedication.instructions}

Prescrito por: ${selectedMedication.prescriber}
Data: ${format(parseISO(selectedMedication.issuedDate), "dd/MM/yyyy", { locale: ptBR })}

${selectedMedication.instructions || ''}
                          `.trim();
                          
                          const blob = new Blob([prescriptionText], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `receita_${selectedMedication.name.replace(/\s+/g, '_')}_${format(parseISO(selectedMedication.issuedDate), 'yyyy-MM-dd', { locale: ptBR })}.txt`;
                          link.click();
                          URL.revokeObjectURL(url);
                          toast.success('Receita baixada com sucesso!');
                        } catch (error: any) {
                          toast.error('Erro ao baixar receita', {
                            description: error?.message || error?.detail || 'Não foi possível baixar a receita',
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Receita
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          </div>
        </main>
      </div>
    </div>
    );
}

