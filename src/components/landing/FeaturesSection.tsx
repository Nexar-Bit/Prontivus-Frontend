"use client";

import React from "react";
import Image from "next/image";
import {
  FileText,
  Video,
  CalendarDays,
  Pill,
  CircleDollarSign,
  ChartLine,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
  image?: string;
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
      image: "/resource image/prontivus (7).jpg",
    },
    {
      icon: Video,
      title: "Integração com Telemedicina",
      description: "Consultas virtuais com vídeo e mensagens seguras",
      iconColor: "text-[#1B9AAA]",
      iconBgColor: "bg-[#1B9AAA]/10",
      image: "/resource image/prontivus (2).jpg",
    },
    {
      icon: CalendarDays,
      title: "Gestão de Agendamentos",
      description: "Agenda inteligente com lembretes automáticos e lista de espera",
      iconColor: "text-[#16C79A]",
      iconBgColor: "bg-[#16C79A]/10",
      image: "/resource image/prontivus (3).jpg",
    },
    {
      icon: Pill,
      title: "Gestão de Prescrições",
      description: "Prescrições digitais com integração a farmácias e renovação",
      iconColor: "text-[#5D737E]",
      iconBgColor: "bg-[#5D737E]/10",
      image: "/resource image/prontivus (4).jpg",
    },
    {
      icon: CircleDollarSign,
      title: "Faturamento & Convênios",
      description: "Faturamento ágil com conformidade TISS e processamento de convênios",
      iconColor: "text-[#0F4C75]",
      iconBgColor: "bg-[#0F4C75]/10",
      image: "/resource image/prontivus (5).jpg",
    },
    {
      icon: ChartLine,
      title: "Análises & Relatórios",
      description: "Indicadores clínicos e financeiros para decisões baseadas em dados",
      iconColor: "text-[#1B9AAA]",
      iconBgColor: "bg-[#1B9AAA]/10",
      image: "/resource image/prontivus (6).jpg",
    },
  ];

  return (
    <section id="features" className={cn("py-20 lg:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden", className)}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 rounded-full mb-6">
            <span className="text-sm font-semibold text-blue-700">Recursos</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-[#0F4C75] mb-6 leading-tight">
            Tudo que você precisa para sua clínica
          </h2>
          <p className="text-xl lg:text-2xl text-[#5D737E] max-w-3xl mx-auto leading-relaxed">
            Ferramentas completas de gestão em saúde para clínicas modernas
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
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
                image={feature.image}
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
  image?: string;
  index: number;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBgColor,
  image,
  index,
}: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden h-full",
        "bg-white/80 backdrop-blur-xl border border-gray-200/50",
        "hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10",
        "transition-all duration-500 ease-out",
        "cursor-pointer",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/0 before:to-teal-50/0",
        "before:group-hover:from-blue-50/50 before:group-hover:to-teal-50/30",
        "before:transition-all before:duration-500 before:pointer-events-none",
        "transform group-hover:-translate-y-2"
      )}
    >
      {/* Background Image with modern overlay */}
      {image && (
        <>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-teal-500/30 to-blue-600/40" />
          </div>
          
          {/* Floating image thumbnail */}
          <div className="absolute top-6 right-6 w-32 h-32 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 shadow-2xl border-4 border-white/50">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="128px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </>
      )}

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/0 to-teal-500/0 group-hover:from-blue-500/10 group-hover:to-teal-500/10 transition-all duration-500 rounded-bl-full" />

      <CardHeader className="pb-6 relative z-10 pt-8">
        {/* Modern Icon Container */}
        <div className="mb-6">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              "transition-all duration-500",
              "group-hover:scale-110 group-hover:rotate-3",
              "bg-white/90 backdrop-blur-md shadow-lg",
              "group-hover:shadow-xl group-hover:shadow-blue-500/20",
              "border-2 border-transparent group-hover:border-blue-200",
              iconBgColor
            )}
          >
            <Icon className={cn(
              "h-8 w-8 transition-all duration-500",
              iconColor,
              "group-hover:scale-110"
            )} />
          </div>
        </div>

        <CardTitle className="text-2xl font-bold text-[#0F4C75] mb-3 group-hover:text-[#1B9AAA] transition-colors duration-300 leading-tight">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-8 relative z-10">
        <CardDescription className="text-[#5D737E] text-base leading-relaxed group-hover:text-[#2D3748] transition-colors duration-300">
          {description}
        </CardDescription>

        {/* Modern arrow indicator */}
        <div className="mt-6 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
          <span className="text-sm font-semibold">Saiba mais</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>

      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-300/50 transition-all duration-500 pointer-events-none" />
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Card>
  );
}

