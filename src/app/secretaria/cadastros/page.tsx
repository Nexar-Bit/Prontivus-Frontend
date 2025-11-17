"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface RegistrationStats {
  total_patients: number;
  total_supplies: number;
  total_doctors: number;
  total_products: number;
  total_payment_methods: number;
  total_registrations: number;
  active_registrations: number;
  today_updates: number;
}

interface RegistrationModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  link: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  count: number;
  label: string;
}

export default function CadastrosPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RegistrationStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.get<RegistrationStats>("/api/secretary/registration-stats");
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load registration stats:", error);
      toast.error("Erro ao carregar estatísticas", {
        description: error?.message || error?.detail || "Não foi possível carregar as estatísticas",
      });
      // Set default values on error
      setStats({
        total_patients: 0,
        total_supplies: 0,
        total_doctors: 0,
        total_products: 0,
        total_payment_methods: 0,
        total_registrations: 0,
        active_registrations: 0,
        today_updates: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationModules = (): RegistrationModule[] => {
    if (!stats) return [];

    return [
      {
        id: "pacientes",
        title: "Pacientes",
        description: "Gerencie o cadastro de pacientes da clínica",
        icon: Users,
        link: "/secretaria/cadastros/pacientes",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        hoverColor: "hover:bg-blue-50",
        count: stats.total_patients,
        label: "cadastrados",
      },
      {
        id: "insumos",
        title: "Insumos",
        description: "Controle de insumos e materiais médicos",
        icon: Package,
        link: "/secretaria/cadastros/insumos",
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        hoverColor: "hover:bg-purple-50",
        count: stats.total_supplies,
        label: "itens",
      },
    ];
  };

  const registrationModules = getRegistrationModules();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-teal-600" />
            Cadastros
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os cadastros e registros da clínica
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Cadastros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{stats.total_registrations}</div>
              <p className="text-sm text-gray-600 mt-1">Itens cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cadastros Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.active_registrations}</div>
              <p className="text-sm text-gray-600 mt-1">Em uso ativo</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Atualizações Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.today_updates}</div>
              <p className="text-sm text-gray-600 mt-1">Registros atualizados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registration Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Módulos de Cadastro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registrationModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.id} href={module.link}>
                <Card className={`${module.hoverColor} transition-all duration-200 hover:shadow-lg cursor-pointer border-2 hover:border-teal-300`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {module.description}
                        </CardDescription>
                      </div>
                      <div className={`p-3 rounded-lg ${module.bgColor}`}>
                        <Icon className={`h-6 w-6 ${module.color}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-medium">
                        {module.count} {module.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      >
                        Acessar →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesse rapidamente as funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/secretaria/cadastros/pacientes">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Users className="h-4 w-4 mr-2" />
                Novo Paciente
              </Button>
            </Link>
            <Link href="/secretaria/cadastros/insumos">
              <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50">
                <Package className="h-4 w-4 mr-2" />
                Novo Insumo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
