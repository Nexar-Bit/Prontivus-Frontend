"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Building, Users, ShoppingCart, FileText, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total de Pacientes",
      value: "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/admin/cadastros/pacientes",
    },
    {
      title: "Médicos Cadastrados",
      value: "0",
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/admin/cadastros/medicos",
    },
    {
      title: "Produtos Ativos",
      value: "0",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/admin/cadastros/produtos",
    },
    {
      title: "Insumos em Estoque",
      value: "0",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      link: "/admin/cadastros/insumos",
    },
  ];

  const quickActions = [
    {
      title: "Configurar Clínica",
      description: "Gerenciar informações da clínica",
      icon: Building,
      link: "/admin/configuracoes/clinica",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Cadastrar Pacientes",
      description: "Adicionar pacientes em massa",
      icon: Users,
      link: "/admin/cadastros/pacientes",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Gerenciar Produtos",
      description: "Consultas, exames e procedimentos",
      icon: ShoppingCart,
      link: "/admin/cadastros/produtos",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Relatórios",
      description: "Configurações de relatórios",
      icon: FileText,
      link: "/admin/relatorios/configuracoes",
      color: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
          Administração da Clínica
        </h1>
        <p className="text-gray-600 mt-2">
          Painel de controle - Gestão da clínica
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
    </div>
  );
}

