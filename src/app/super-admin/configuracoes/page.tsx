"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Key, Package, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SuperAdminRoute } from "@/components/auth/ProtectedRoute";

const configurations = [
  {
    id: "clinica",
    name: "Clínica",
    description: "Gerenciar informações das clínicas cadastradas no sistema, incluindo dados de contato, endereço e configurações gerais.",
    icon: Building,
    status: "Disponível",
    statusVariant: "default",
    link: "/super-admin/configuracoes/clinica",
    color: "bg-blue-500",
  },
  {
    id: "usuarios",
    name: "Usuários",
    description: "Gerenciar todos os usuários do sistema, incluindo criação, edição, desativação e atribuição de permissões.",
    icon: Users,
    status: "Disponível",
    statusVariant: "default",
    link: "/super-admin/configuracoes/usuarios",
    color: "bg-purple-500",
  },
  {
    id: "licenciamento",
    name: "Licenciamento",
    description: "Gerenciar licenças, ativações e configurações de módulos para cada clínica do sistema.",
    icon: Key,
    status: "Disponível",
    statusVariant: "default",
    link: "/super-admin/configuracoes/licenciamento",
    color: "bg-green-500",
  },
  {
    id: "modulos",
    name: "Módulos",
    description: "Ativar e desativar módulos do sistema para cada clínica, controlando quais funcionalidades estão disponíveis.",
    icon: Package,
    status: "Disponível",
    statusVariant: "default",
    link: "/super-admin/configuracoes/modulos",
    color: "bg-orange-500",
  },
];

export default function SuperAdminConfiguracoesPage() {
  return (
    <SuperAdminRoute>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        </div>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema Prontivus, incluindo clínicas, usuários, licenciamento e módulos.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {configurations.map((config) => (
            <Link href={config.link} key={config.id}>
              <Card className="hover:shadow-lg transition-shadow duration-200 ease-in-out h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <config.icon className={`h-8 w-8 text-white p-1.5 rounded-full ${config.color}`} />
                  <Badge variant={config.statusVariant as any} className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {config.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardTitle className="text-xl font-semibold">{config.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-2">
                    {config.description}
                  </CardDescription>
                  <div className="flex items-center text-sm font-medium text-gray-700 mt-4">
                    Acessar configurações
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Detalhes sobre as configurações disponíveis no sistema Prontivus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Gerenciamento de Clínicas</h3>
              <p className="text-sm text-gray-700">
                Cadastre e gerencie todas as clínicas que utilizam o sistema. Configure informações de contato,
                endereço, dados bancários e outras configurações específicas de cada clínica.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gerenciamento de Usuários</h3>
              <p className="text-sm text-gray-700">
                Controle completo sobre todos os usuários do sistema. Crie novos usuários, edite informações,
                atribua permissões e roles, e gerencie o acesso às funcionalidades do sistema.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Licenciamento</h3>
              <p className="text-sm text-gray-700">
                Gerencie licenças e ativações para cada clínica. Configure períodos de validade, limites de uso,
                e monitore o status de cada licença no sistema.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Módulos do Sistema</h3>
              <p className="text-sm text-gray-700">
                Ative ou desative módulos específicos para cada clínica. Controle quais funcionalidades estão
                disponíveis, como módulos de IA, relatórios avançados, integrações fiscais e muito mais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminRoute>
  );
}

