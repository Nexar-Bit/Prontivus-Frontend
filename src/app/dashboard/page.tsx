"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Heart,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Package,
  ShieldCheck,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AppointmentChart } from "@/components/dashboard/appointment-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PatientVitalsChart } from "@/components/dashboard/patient-vitals-chart";
import { AppointmentHeatmap } from "@/components/dashboard/appointment-heatmap";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { api } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const { 
    user, 
    isAdmin, 
    isSecretary, 
    isDoctor, 
    isPatient, 
    getRoleDisplayName,
    canAccessFinancial,
  } = usePermissions();

  // Admin-specific state
  const [adminStats, setAdminStats] = React.useState({
    patients: 0,
    doctors: 0,
    products: 0,
    supplies: 0,
    loading: true,
  });

  // Check if user is admin (compute once to avoid recreating function)
  const userIsAdmin = React.useMemo(() => isAdmin(), [user?.role]);

  // Fetch admin statistics
  React.useEffect(() => {
    if (!userIsAdmin || !user) return;
    
    let isMounted = true;
    let abortController: AbortController | null = null;
    
    const fetchAdminStats = async () => {
      try {
        if (isMounted) {
          setAdminStats(prev => ({ ...prev, loading: true }));
        }
        
        // Create abort controller for cleanup
        abortController = new AbortController();
        
        // Fetch all stats in parallel with individual error handling
        const fetchWithErrorHandling = async <T,>(endpoint: string, defaultValue: T): Promise<T> => {
          try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
              return defaultValue;
            }
            
            const response = await api.get<T>(endpoint);
            return response || defaultValue;
          } catch (error: any) {
            // Silently handle network errors - don't log to console if it's a network issue
            // "Failed to fetch" is a TypeError that occurs when the backend is not available
            const isNetworkError = 
              error?.name === 'TypeError' ||
              error?.message?.includes('Failed to fetch') ||
              error?.message?.includes('NetworkError') ||
              error?.message?.includes('Network request failed') ||
              error?.message?.includes('fetch failed') ||
              (!error?.status && !error?.response);
            
            if (isNetworkError) {
              // Backend might not be running - this is expected in some cases
              // Silently return default value without logging
              return defaultValue;
            }
            
            // Only log unexpected errors (HTTP errors with status codes)
            if (error?.status && error?.status !== 401 && error?.status !== 403) {
              console.warn(`Failed to fetch from ${endpoint}:`, error);
            }
            return defaultValue;
          }
        };
        
        const [patientsData, doctorsData, productsData, stockSummary] = await Promise.all([
          fetchWithErrorHandling<any[] | { total?: number; count?: number }>("/api/v1/patients", []),
          fetchWithErrorHandling<any[] | { total?: number; count?: number }>("/api/v1/users/doctors", []),
          fetchWithErrorHandling<any[] | { total?: number; count?: number }>("/api/v1/stock/products", []),
          fetchWithErrorHandling<any>("/api/v1/stock/dashboard/summary", { total_products: 0 }),
        ]);
        
        // Don't update state if component unmounted or request was aborted
        if (!isMounted || abortController?.signal.aborted) {
          return;
        }
        
        // Extract counts safely - handle both array responses and paginated responses
        const patientsCount = Array.isArray(patientsData)
          ? patientsData.length
          : ((patientsData as { total?: number; count?: number })?.total || (patientsData as { total?: number; count?: number })?.count || 0);
        
        const doctorsCount = Array.isArray(doctorsData)
          ? doctorsData.length
          : ((doctorsData as { total?: number; count?: number })?.total || (doctorsData as { total?: number; count?: number })?.count || 0);
        
        const productsCount = Array.isArray(productsData)
          ? productsData.length
          : ((productsData as { total?: number; count?: number })?.total || (productsData as { total?: number; count?: number })?.count || 0);
        
        const suppliesCount = stockSummary?.total_products || stockSummary?.total || stockSummary?.count || 0;
        
        if (isMounted) {
          setAdminStats({
            patients: patientsCount,
            doctors: doctorsCount,
            products: productsCount,
            supplies: suppliesCount,
            loading: false,
          });
        }
      } catch (error: any) {
        // Only log if it's not a network error (which is expected if backend is down)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('NetworkError')) {
          console.error("Failed to fetch admin stats:", error);
        }
        if (isMounted) {
          setAdminStats(prev => ({ ...prev, loading: false }));
        }
      }
    };
    
    fetchAdminStats();
    
    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [userIsAdmin, user]);

  const getWelcomeMessage = () => {
    if (isPatient()) {
      return `Bem-vindo(a), ${user?.first_name || user?.username}! Acompanhe sua saúde.`;
    } else if (isDoctor()) {
      return `Bem-vindo(a), Dr(a). ${user?.first_name || user?.username}!`;
    } else if (isSecretary()) {
      return `Bem-vindo(a), ${user?.first_name || user?.username}!`;
    } else if (isAdmin()) {
      return `Bem-vindo(a), ${user?.first_name || user?.username}!`;
    }
    return "Bem-vindo(a) ao Prontivus!";
  };

  // Admin-specific metrics
  const adminMetrics = {
    patients: {
      value: adminStats.patients,
      change: 0,
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const,
      label: 'Pacientes Cadastrados',
      subtitle: 'Total de registros',
      link: '/admin/cadastros/pacientes',
    },
    doctors: {
      value: adminStats.doctors,
      change: 0,
      trend: 'up' as const,
      icon: Stethoscope,
      color: 'green' as const,
      label: 'Médicos Cadastrados',
      subtitle: 'Total de médicos',
      link: '/admin/cadastros/medicos',
    },
    products: {
      value: adminStats.products,
      change: 0,
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'orange' as const,
      label: 'Produtos Ativos',
      subtitle: 'Total de produtos',
      link: '/admin/cadastros/produtos',
    },
    supplies: {
      value: adminStats.supplies,
      change: 0,
      trend: 'up' as const,
      icon: Package,
      color: 'teal' as const,
      label: 'Insumos em Estoque',
      subtitle: 'Total de insumos',
      link: '/admin/cadastros/insumos',
    },
  };

  // Mock metrics data for non-admin users - replace with API calls
  const metrics = {
    patients: {
      value: 2847,
      change: 12.5,
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const,
      label: 'Pacientes Ativos',
      subtitle: 'Total cadastrado',
    },
    appointments: {
      value: 342,
      change: 8.2,
      trend: 'up' as const,
      icon: Calendar,
      color: 'orange' as const,
      label: 'Agendamentos Este Mês',
      subtitle: 'Consultas agendadas',
    },
    revenue: {
      value: 245800,
      change: -3.1,
      trend: 'down' as const,
      icon: DollarSign,
      color: 'green' as const,
      label: 'Receita Mensal',
      subtitle: 'Faturamento total',
    },
    satisfaction: {
      value: 94.2,
      change: 2.3,
      trend: 'up' as const,
      icon: Heart,
      color: 'teal' as const,
      label: 'Satisfação dos Pacientes',
      subtitle: 'Avaliação média',
    },
    todayAppointments: {
      value: 48,
      change: 4,
      trend: 'up' as const,
      icon: Clock,
      color: 'orange' as const,
      label: 'Agendamentos Hoje',
      subtitle: 'Consultas agendadas',
    },
    pendingResults: {
      value: 23,
      change: -12,
      trend: 'down' as const,
      icon: Activity,
      color: 'blue' as const,
      label: 'Resultados Pendentes',
      subtitle: 'Exames aguardando',
    },
  };

  // Render admin dashboard
  if (userIsAdmin) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              Dashboard Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              {getWelcomeMessage()}
            </p>
          </div>
        </div>

        {/* Admin Metrics - Key Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(adminMetrics).map(([key, metric]) => {
            // Map color names to Tailwind classes
            const colorClasses: Record<string, { bg: string; text: string }> = {
              blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
              green: { bg: 'bg-green-100', text: 'text-green-600' },
              orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
              teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
            };
            const colorClass = colorClasses[metric.color] || colorClasses.blue;

            const content = (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {metric.label}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                      <metric.icon className={`h-5 w-5 ${colorClass.text}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${colorClass.text}`}>
                    {adminStats.loading ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      metric.value.toLocaleString('pt-BR')
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                </CardContent>
              </Card>
            );

            if (metric.link) {
              return (
                <Link key={key} href={metric.link}>
                  {content}
                </Link>
              );
            }
            return <React.Fragment key={key}>{content}</React.Fragment>;
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades administrativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/cadastros/pacientes">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Cadastrar Pacientes</h3>
                    <p className="text-sm text-gray-600">Adicionar pacientes em massa</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/cadastros/medicos">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center mb-4">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Gerenciar Médicos</h3>
                    <p className="text-sm text-gray-600">Cadastrar e editar médicos</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/cadastros/produtos">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center mb-4">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Gerenciar Produtos</h3>
                    <p className="text-sm text-gray-600">Consultas, exames e procedimentos</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/cadastros/insumos">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center justify-center mb-4">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Gerenciar Insumos</h3>
                    <p className="text-sm text-gray-600">Controle de estoque</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas interações e atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {getWelcomeMessage()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Últimos 30 dias
          </Button>
          <Button variant="outline" size="sm">
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics - Top Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={metrics.patients.icon}
          value={metrics.patients.value}
          change={metrics.patients.change}
          trend={metrics.patients.trend}
          color={metrics.patients.color}
          label={metrics.patients.label}
          subtitle={metrics.patients.subtitle}
        />
        <MetricCard
          icon={metrics.appointments.icon}
          value={metrics.appointments.value}
          change={metrics.appointments.change}
          trend={metrics.appointments.trend}
          color={metrics.appointments.color}
          label={metrics.appointments.label}
          subtitle={metrics.appointments.subtitle}
        />
        {canAccessFinancial() && (
          <MetricCard
            icon={metrics.revenue.icon}
            value={metrics.revenue.value}
            change={metrics.revenue.change}
            trend={metrics.revenue.trend}
            color={metrics.revenue.color}
            label={metrics.revenue.label}
            subtitle={metrics.revenue.subtitle}
            format="currency"
          />
        )}
        <MetricCard
          icon={metrics.satisfaction.icon}
          value={metrics.satisfaction.value}
          change={metrics.satisfaction.change}
          trend={metrics.satisfaction.trend}
          color={metrics.satisfaction.color}
          label={metrics.satisfaction.label}
          subtitle={metrics.satisfaction.subtitle}
          format="percentage"
        />
      </div>

      {/* Secondary Metrics */}
      {(isSecretary() || isAdmin()) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={metrics.todayAppointments.icon}
            value={metrics.todayAppointments.value}
            change={metrics.todayAppointments.change}
            trend={metrics.todayAppointments.trend}
            color={metrics.todayAppointments.color}
            label={metrics.todayAppointments.label}
            subtitle={metrics.todayAppointments.subtitle}
          />
          <MetricCard
            icon={metrics.pendingResults.icon}
            value={metrics.pendingResults.value}
            change={metrics.pendingResults.change}
            trend={metrics.pendingResults.trend}
            color={metrics.pendingResults.color}
            label={metrics.pendingResults.label}
            subtitle={metrics.pendingResults.subtitle}
          />
        </div>
      )}

      {/* Charts Section - Middle */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#0F4C75]" />
              Agendamentos - Últimos 30 Dias
            </CardTitle>
            <CardDescription>
              Tendência de agendamentos e consultas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentChart />
          </CardContent>
        </Card>

        {canAccessFinancial() && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#0F4C75]" />
                Receita - Últimos 6 Meses
              </CardTitle>
              <CardDescription>
                Comparação entre receitas de convênio e particular
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Medical Data Visualization */}
      <div className="grid gap-4 md:grid-cols-2">
        {isDoctor() && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0F4C75]" />
                Sinais Vitais - Tendência
              </CardTitle>
              <CardDescription>
                Média de sinais vitais dos pacientes com indicadores de normalidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientVitalsChart />
            </CardContent>
          </Card>
        )}

        {(isSecretary() || isAdmin()) && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0F4C75]" />
                Utilização de Horários
              </CardTitle>
              <CardDescription>
                Heatmap de agendamentos por dia da semana e horário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentHeatmap />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Section - Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 medical-card">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas interações e atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Operações frequentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions role={user?.role} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

