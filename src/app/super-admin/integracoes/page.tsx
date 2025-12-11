"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Sparkles, Receipt, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { SuperAdminRoute } from "@/components/auth/ProtectedRoute";

export default function IntegracoesPage() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(false);
  }, []);

  const integrations = [
    {
      id: "tiss",
      title: "TISS",
      description: "Integração com o padrão TISS (Troca de Informação em Saúde Suplementar) para envio de autorizações e guias",
      icon: Code2,
      url: "/super-admin/integracoes/tiss",
      status: "available",
      color: "blue",
    },
    {
      id: "ia",
      title: "Inteligência Artificial",
      description: "Configuração de provedores de IA (OpenAI, Google Gemini, Anthropic Claude, Azure OpenAI)",
      icon: Sparkles,
      url: "/super-admin/integracoes/ia",
      status: "available",
      color: "purple",
    },
    {
      id: "fiscal",
      title: "Fiscal",
      description: "Integração com sistemas fiscais e emissão de notas fiscais eletrônicas",
      icon: Receipt,
      url: "/super-admin/integracoes/fiscal",
      status: "available",
      color: "green",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "unavailable":
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; hover: string; icon: string; bg: string }> = {
      blue: {
        border: "border-blue-200",
        hover: "hover:border-blue-300 hover:bg-blue-50/50",
        icon: "text-blue-600",
        bg: "bg-blue-50",
      },
      purple: {
        border: "border-purple-200",
        hover: "hover:border-purple-300 hover:bg-purple-50/50",
        icon: "text-purple-600",
        bg: "bg-purple-50",
      },
      green: {
        border: "border-green-200",
        hover: "hover:border-green-300 hover:bg-green-50/50",
        icon: "text-green-600",
        bg: "bg-green-50",
      },
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <SuperAdminRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </SuperAdminRoute>
    );
  }

  return (
    <SuperAdminRoute>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrações</h1>
          <p className="text-gray-600">
            Configure e gerencie as integrações do sistema com serviços externos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const colorClasses = getColorClasses(integration.color);
            const Icon = integration.icon;

            return (
              <Link key={integration.id} href={integration.url}>
                <Card
                  className={`cursor-pointer transition-all duration-200 ${colorClasses.border} ${colorClasses.hover}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                        <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
                      </div>
                      {getStatusIcon(integration.status)}
                    </div>
                    <CardTitle className="mt-4">{integration.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      Configurar
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações sobre Integrações</CardTitle>
            <CardDescription>
              As integrações permitem conectar o Prontivus com outros sistemas e serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">TISS</h3>
                <p className="text-sm text-gray-600">
                  Padrão brasileiro para troca de informações entre operadoras de planos de saúde e prestadores.
                  Configure credenciais e endpoints para envio automático de autorizações e guias.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Inteligência Artificial</h3>
                <p className="text-sm text-gray-600">
                  Configure múltiplos provedores de IA para recursos avançados como transcrição de voz,
                  análise de sintomas, sugestões de diagnóstico e geração de relatórios clínicos.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fiscal</h3>
                <p className="text-sm text-gray-600">
                  Integração com sistemas fiscais para emissão automática de notas fiscais eletrônicas,
                  controle de impostos e relatórios fiscais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminRoute>
  );
}

