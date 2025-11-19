"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  HelpCircle,
  Search,
  Keyboard,
  Settings,
  Clock,
} from "lucide-react";
import { ProntivusLogo } from "@/components/assets";
import Link from "next/link";

export default function HelpPage() {
  const helpSections = [
    {
      title: "Getting Started",
      icon: BookOpen,
      items: [
        "Welcome to Prontivus",
        "Navigation basics",
        "Dashboard overview",
        "User profile setup",
      ],
    },
    {
      title: "Patient Management",
      icon: FileText,
      items: [
        "Registering patients",
        "Viewing medical records",
        "Searching patients",
        "Managing appointments",
      ],
    },
    {
      title: "Clinical Features",
      icon: HelpCircle,
      items: [
        "Creating consultations",
        "SOAP notes",
        "Prescriptions",
        "ICD-10 coding",
      ],
    },
    {
      title: "System Settings",
      icon: Settings,
      items: [
        "User management",
        "Clinic configuration",
        "Module settings",
        "System preferences",
      ],
    },
  ];

  const quickLinks = [
    {
      title: "Keyboard Shortcuts",
      icon: Keyboard,
      description: "Learn time-saving shortcuts",
      href: "#shortcuts",
    },
    {
      title: "Video Tutorials",
      icon: Video,
      description: "Watch step-by-step guides",
      href: "#tutorials",
    },
    {
      title: "Contact Support",
      icon: MessageCircle,
      description: "Get help from our team",
      href: "#support",
    },
    {
      title: "Search Help",
      icon: Search,
      description: "Search help articles",
      href: "#search",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="h-7 w-7 text-blue-600" />
            </div>
            Ajuda e Suporte
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Encontre respostas para suas dúvidas e aprenda a usar o Prontivus de forma eficiente
          </p>
        </div>
      </div>
      
      <div className="space-y-8">

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.title}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300 hover:bg-blue-50/50"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">
                    {link.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {link.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <HelpCircle className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  Perguntas Frequentes
                </CardTitle>
                <CardDescription className="mt-1">
                  Respostas rápidas para dúvidas comuns
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                Como registro um novo paciente?
              </h3>
              <p className="text-gray-700 text-sm ml-4">
                Navegue até <strong>Secretaria → Pacientes</strong> e clique no botão "Novo Paciente". 
                Preencha as informações necessárias e salve.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                Como agendo uma consulta?
              </h3>
              <p className="text-gray-700 text-sm ml-4">
                Vá para <strong>Secretaria → Agendamentos</strong>, selecione "Novo Agendamento", 
                escolha o paciente e o médico, depois selecione um horário disponível.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                Onde posso visualizar prontuários médicos?
              </h3>
              <p className="text-gray-700 text-sm ml-4">
                Abra o perfil de um paciente a partir da lista de pacientes. Todos os registros médicos, 
                prescrições e resultados de exames estão organizados em abas para fácil acesso.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                Como crio uma prescrição?
              </h3>
              <p className="text-gray-700 text-sm ml-4">
                Durante uma consulta, use o formulário de prescrição para adicionar medicamentos. 
                Você pode buscar medicamentos e adicionar instruções de dosagem.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  Precisa de Mais Ajuda?
                </CardTitle>
                <CardDescription className="mt-1">
                  Entre em contato com nossa equipe de suporte para assistência adicional
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" variant="default">
                <MessageCircle className="h-4 w-4 mr-2" />
                Email de Suporte
              </Button>
              <Button className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50" variant="outline">
                <Video className="h-4 w-4 mr-2" />
                Agendar Chamada
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Horário de atendimento: Segunda a Sexta, 8:00 - 18:00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

