"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Building, Key, Users, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboard() {
  const stats = [
    {
      title: "Total de Clínicas",
      value: "3",
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/super-admin/configuracoes/clinica",
    },
    {
      title: "Licenças Ativas",
      value: "3",
      icon: Key,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/super-admin/configuracoes/licenciamento",
    },
    {
      title: "Clientes Ativos",
      value: "3",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/super-admin/relatorios/clientes-ativos",
    },
    {
      title: "Receita Mensal",
      value: "R$ 660k",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const quickActions = [
    {
      title: "Gestão de Clínicas",
      description: "Cadastrar e gerenciar clínicas",
      icon: Building,
      link: "/super-admin/configuracoes/clinica",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Licenciamento",
      description: "Gerenciar licenças e chaves",
      icon: Key,
      link: "/super-admin/configuracoes/licenciamento",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Módulos",
      description: "Ativar/desativar módulos",
      icon: Activity,
      link: "/super-admin/configuracoes/modulos",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Integrações",
      description: "Configurar integrações",
      icon: ShieldCheck,
      link: "/super-admin/integracoes/tiss",
      color: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
          Super Administrador
        </h1>
        <p className="text-gray-600 mt-2">
          Painel de controle do sistema - Gestão centralizada
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
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
                  {stat.value}
                </div>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.link}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Últimas ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Atividades recentes serão exibidas aqui</p>
            <p className="text-sm mt-2">Funcionalidade em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

