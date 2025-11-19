"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Shield,
  Building,
  Users,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  UserRound,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Role-Based Dashboard Component
 * Provides tailored dashboard for each user role
 */
export function RoleBasedDashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const roleId = user.role_id;

  switch (roleId) {
    case 1:
      return <SuperAdminDashboard />;
    case 2:
      return <AdminClinicaDashboard />;
    case 3:
      return <MedicoDashboard />;
    case 4:
      return <SecretariaDashboard />;
    case 5:
      return <PacienteDashboard />;
    default:
      return <DefaultDashboard />;
  }
}

function SuperAdminDashboard() {
  const stats = [
    { title: "Total Clínicas", value: "0", icon: Building, color: "text-purple-600", bgColor: "bg-purple-100", link: "/super-admin/configuracoes/clinica" },
    { title: "Usuários Ativos", value: "0", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { title: "Licenças Ativas", value: "0", icon: Shield, color: "text-green-600", bgColor: "bg-green-100", link: "/super-admin/configuracoes/licenciamento" },
    { title: "Módulos Ativos", value: "0", icon: Activity, color: "text-orange-600", bgColor: "bg-orange-100", link: "/super-admin/configuracoes/modulos" },
  ];

  const quickActions = [
    { title: "Gerenciar Clínicas", link: "/super-admin/configuracoes/clinica", icon: Building },
    { title: "Licenciamento", link: "/super-admin/configuracoes/licenciamento", icon: Shield },
    { title: "Módulos", link: "/super-admin/configuracoes/modulos", icon: Activity },
    { title: "Integrações", link: "/super-admin/integracoes/tiss", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Super Administração</h1>
        <p className="text-gray-600">Gerencie o sistema completo e todas as clínicas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link key={index} href={stat.link}>
              {content}
            </Link>
          ) : (
            <React.Fragment key={index}>{content}</React.Fragment>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.link}>
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                    <Icon className="h-6 w-6" />
                    <span>{action.title}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminClinicaDashboard() {
  const stats = [
    { title: "Total de Pacientes", value: "0", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100", link: "/admin/cadastros/pacientes" },
    { title: "Médicos Cadastrados", value: "0", icon: Stethoscope, color: "text-green-600", bgColor: "bg-green-100", link: "/admin/cadastros/medicos" },
    { title: "Produtos Ativos", value: "0", icon: Activity, color: "text-purple-600", bgColor: "bg-purple-100", link: "/admin/cadastros/produtos" },
    { title: "Insumos em Estoque", value: "0", icon: ClipboardList, color: "text-orange-600", bgColor: "bg-orange-100", link: "/admin/cadastros/insumos" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Administração da Clínica</h1>
        <p className="text-gray-600">Gerencie sua clínica e recursos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.link || '#'}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MedicoDashboard() {
  const stats = [
    { title: "Agendamentos Hoje", value: "0", icon: CalendarDays, color: "text-green-600", bgColor: "bg-green-100" },
    { title: "Pacientes em Fila", value: "0", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100", link: "/medico/atendimento/fila" },
    { title: "Prontuários Pendentes", value: "0", icon: ClipboardList, color: "text-orange-600", bgColor: "bg-orange-100", link: "/medico/prontuarios" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Médico</h1>
        <p className="text-gray-600">Visão geral do seu trabalho</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link key={index} href={stat.link}>
              {content}
            </Link>
          ) : (
            <React.Fragment key={index}>{content}</React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function SecretariaDashboard() {
  const stats = [
    { title: "Agendamentos Hoje", value: "12", icon: CalendarDays, color: "text-teal-600", bgColor: "bg-teal-100", link: "/secretaria/agendamentos" },
    { title: "Pacientes Cadastrados", value: "245", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100", link: "/secretaria/cadastros/pacientes" },
    { title: "Tarefas Pendentes", value: "5", icon: ClipboardList, color: "text-orange-600", bgColor: "bg-orange-100" },
    { title: "Agendamentos Confirmados", value: "8", icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Secretária</h1>
        <p className="text-gray-600">Visão geral das atividades do dia</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link key={index} href={stat.link}>
              {content}
            </Link>
          ) : (
            <React.Fragment key={index}>{content}</React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function PacienteDashboard() {
  const stats = [
    { title: "Próximos Agendamentos", value: "2", icon: CalendarDays, color: "text-cyan-600", bgColor: "bg-cyan-100", link: "/pacient/agendamentos" },
    { title: "Exames Pendentes", value: "1", icon: Activity, color: "text-orange-600", bgColor: "bg-orange-100", link: "/pacient/exames" },
    { title: "Mensagens Não Lidas", value: "3", icon: AlertCircle, color: "text-blue-600", bgColor: "bg-blue-100", link: "/pacient/mensagens" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meu Portal</h1>
        <p className="text-gray-600">Acompanhe sua saúde e agendamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.link || '#'}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DefaultDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao sistema</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Seu dashboard personalizado será exibido aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}

