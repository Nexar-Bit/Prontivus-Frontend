"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Building, Key, Users, TrendingUp, Activity, AlertTriangle, CheckCircle2, Clock, Loader2, Database, Server, Globe, Settings } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { adminApi, ClinicStats, Clinic } from "@/lib/admin-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface SystemMetrics {
  total_modules_active: number;
  total_integrations: number;
  system_uptime_percentage: number;
  average_clinic_users: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [recentClinics, setRecentClinics] = useState<Clinic[]>([]);
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsData = await api.get<ClinicStats>("/api/v1/admin/clinics/stats");
      setStats(statsData);

      // Load recent clinics (last 5)
      const clinicsData = await api.get<Clinic[]>("/api/v1/admin/clinics?limit=5&skip=0");
      setRecentClinics(clinicsData || []);

      // Load all clinics for additional metrics
      const allClinicsData = await api.get<Clinic[]>("/api/v1/admin/clinics?limit=1000");
      setAllClinics(allClinicsData || []);

      // Calculate system metrics
      const totalModules = allClinicsData?.reduce((sum, clinic) => {
        return sum + (clinic.active_modules?.length || 0);
      }, 0) || 0;

      const totalIntegrations = allClinicsData?.reduce((sum, clinic) => {
        // Count integrations (TISS, IA, Fiscal) - assuming at least one module means integration
        return sum + (clinic.active_modules && clinic.active_modules.length > 0 ? 1 : 0);
      }, 0) || 0;

      const activeClinics = allClinicsData?.filter(c => c.is_active).length || 0;
      const avgUsers = statsData?.total_users && statsData?.total_clinics 
        ? Math.round(statsData.total_users / statsData.total_clinics) 
        : 0;

      setSystemMetrics({
        total_modules_active: totalModules,
        total_integrations: totalIntegrations,
        system_uptime_percentage: activeClinics > 0 ? Math.round((activeClinics / (statsData?.total_clinics || 1)) * 100) : 0,
        average_clinic_users: avgUsers,
      });
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      
      // Provide user-friendly error message based on error type
      let errorMessage = "Não foi possível carregar as informações do dashboard";
      let errorDescription = "Tente recarregar a página em alguns instantes.";
      
      if (error?.message?.includes("Service temporarily unavailable") || error?.status === 503) {
        errorMessage = "Serviço temporariamente indisponível";
        errorDescription = "O servidor está sobrecarregado. Por favor, tente novamente em alguns instantes.";
      } else if (error?.message?.includes("timeout")) {
        errorMessage = "Tempo de resposta excedido";
        errorDescription = "A requisição demorou muito para responder. Verifique sua conexão e tente novamente.";
      } else if (error?.message) {
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Clínicas",
      value: stats?.total_clinics ?? 0,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/super-admin/configuracoes/clinica",
      description: "Clínicas cadastradas no sistema",
    },
    {
      title: "Clínicas Ativas",
      value: stats?.active_clinics ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/super-admin/configuracoes/clinica",
      description: "Clínicas operacionais",
    },
    {
      title: "Total de Usuários",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/super-admin/configuracoes/usuarios",
      description: "Usuários em todo o sistema",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
          <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <span className="truncate">Super Administrador</span>
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Painel de controle do sistema - Gestão centralizada de todas as clínicas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                </div>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                )}
              </CardContent>
            </Card>
          );

          if (stat.link) {
            return (
              <Link key={index} href={stat.link}>
                {content}
              </Link>
            );
          }
          return <React.Fragment key={index}>{content}</React.Fragment>;
        })}
      </div>

      {/* Recent Clinics and System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Clinics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clínicas Recentes</CardTitle>
                <CardDescription>
                  Últimas clínicas cadastradas no sistema
                </CardDescription>
              </div>
              <Link
                href="/super-admin/configuracoes/clinica"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentClinics.length > 0 ? (
              <div className="space-y-3">
                {recentClinics.map((clinic) => (
                  <Link
                    key={clinic.id}
                    href={`/super-admin/configuracoes/clinica?clinic=${clinic.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {clinic.name}
                          </h4>
                          {clinic.is_active ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Ativa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                              Inativa
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {clinic.legal_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Cadastrada em {format(new Date(clinic.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Building className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma clínica cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Visão geral da saúde do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Sistema Operacional</p>
                    <p className="text-sm text-gray-600">Todos os serviços estão funcionando</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Clínicas Ativas</p>
                    <p className="text-sm text-gray-600">
                      {stats?.active_clinics ?? 0} de {stats?.total_clinics ?? 0} clínicas
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {stats?.total_clinics ? Math.round(((stats.active_clinics || 0) / stats.total_clinics) * 100) : 0}%
                </span>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Saúde do Sistema
            </CardTitle>
            <CardDescription>
              Status geral da infraestrutura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Disponibilidade</span>
                <span className="text-sm font-semibold text-green-600">
                  {systemMetrics?.system_uptime_percentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${systemMetrics?.system_uptime_percentage ?? 0}%` } as React.CSSProperties}
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Média de Usuários/Clínica</span>
                <span className="text-sm font-semibold text-blue-600">
                  {systemMetrics?.average_clinic_users ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/super-admin/configuracoes/clinica"
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Building className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-semibold text-gray-900">Gerenciar Clínicas</h4>
              <p className="text-sm text-gray-600 mt-1">Cadastrar e editar todas as clínicas</p>
            </Link>

            <Link
              href="/super-admin/configuracoes/usuarios"
              className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
            >
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <h4 className="font-semibold text-gray-900">Usuários do Sistema</h4>
              <p className="text-sm text-gray-600 mt-1">Gerenciar todos os usuários</p>
            </Link>

            <Link
              href="/super-admin/integracoes/ia"
              className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
            >
              <Globe className="h-6 w-6 text-orange-600 mb-2" />
              <h4 className="font-semibold text-gray-900">Integrações</h4>
              <p className="text-sm text-gray-600 mt-1">Configurar integrações do sistema</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

