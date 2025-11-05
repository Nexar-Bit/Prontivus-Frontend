"use client";

import React from "react";
import {
  FileText,
  Video,
  Calendar,
  Pill,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
}

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  const features: Feature[] = [
    {
      icon: FileText,
      title: "Prontuário Eletrônico (PEP)",
      description: "Registros de pacientes seguros e acessíveis, com organização inteligente",
      iconColor: "text-[#0F4C75]",
      iconBgColor: "bg-[#0F4C75]/10",
    },
    {
      icon: Video,
      title: "Integração com Telemedicina",
      description: "Consultas virtuais com vídeo e mensagens seguras",
      iconColor: "text-[#1B9AAA]",
      iconBgColor: "bg-[#1B9AAA]/10",
    },
    {
      icon: Calendar,
      title: "Gestão de Agendamentos",
      description: "Agenda inteligente com lembretes automáticos e lista de espera",
      iconColor: "text-[#16C79A]",
      iconBgColor: "bg-[#16C79A]/10",
    },
    {
      icon: Pill,
      title: "Gestão de Prescrições",
      description: "Prescrições digitais com integração a farmácias e renovação",
      iconColor: "text-[#5D737E]",
      iconBgColor: "bg-[#5D737E]/10",
    },
    {
      icon: DollarSign,
      title: "Faturamento & Convênios",
      description: "Faturamento ágil com conformidade TISS e processamento de convênios",
      iconColor: "text-[#0F4C75]",
      iconBgColor: "bg-[#0F4C75]/10",
    },
    {
      icon: BarChart3,
      title: "Análises & Relatórios",
      description: "Indicadores clínicos e financeiros para decisões baseadas em dados",
      iconColor: "text-[#1B9AAA]",
      iconBgColor: "bg-[#1B9AAA]/10",
    },
  ];

  return (
    <section id="features" className={cn("py-20 lg:py-24 bg-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F4C75] mb-4">
            Tudo que você precisa para sua clínica
          </h2>
          <p className="text-xl text-[#5D737E] max-w-2xl mx-auto">
            Ferramentas completas de gestão em saúde para clínicas modernas
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FeatureCard
                key={index}
                icon={Icon}
                title={feature.title}
                description={feature.description}
                iconColor={feature.iconColor}
                iconBgColor={feature.iconBgColor}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
  index: number;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBgColor,
  index,
}: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "medical-card border-2 border-gray-200",
        "hover:border-[#1B9AAA] hover:shadow-xl",
        "transition-all duration-300 ease-out",
        "group cursor-pointer",
        "relative overflow-hidden",
        "h-full"
      )}
    >

      <CardHeader className="pb-4">
        {/* Icon Container */}
        <div className="mb-4">
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "transition-all duration-300",
              "group-hover:scale-110 group-hover:shadow-lg",
              iconBgColor
            )}
          >
            <Icon className={cn("h-7 w-7", iconColor, "transition-transform duration-300 group-hover:scale-110")} />
          </div>
        </div>

        <CardTitle className="text-xl font-semibold text-[#0F4C75] mb-2 group-hover:text-[#1B9AAA] transition-colors duration-300">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-[#5D737E] text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B9AAA]/0 to-[#0F4C75]/0 group-hover:from-[#1B9AAA]/5 group-hover:to-[#0F4C75]/5 transition-all duration-300 pointer-events-none rounded-lg" />
    </Card>
  );
}

