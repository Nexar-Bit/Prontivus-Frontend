"use client";

import React from "react";
import Image from "next/image";
import {
  CalendarDays,
  Video,
  FileText,
  Pill,
  Activity,
  CheckCircle2,
  Download,
  ArrowRight,
  Smartphone,
  Timer,
  HeartPulse,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";

interface ForPatientsSectionProps {
  className?: string;
}

export function ForPatientsSection({ className }: ForPatientsSectionProps) {
  const benefits = [
    {
      icon: CalendarDays,
      title: "Agendamento fácil",
      description: "Marque, reagende ou cancele consultas em segundos com disponibilidade em tempo real",
    },
    {
      icon: Video,
      title: "Consultas virtuais",
      description: "Vídeo-consultas seguras com seu médico no conforto da sua casa",
    },
    {
      icon: FileText,
      title: "Acesso ao prontuário",
      description: "Acesso completo ao seu histórico, exames e prescrições",
    },
    {
      icon: Pill,
      title: "Gestão de prescrições",
      description: "Prescrições digitais enviadas à farmácia com lembretes automáticos",
    },
    {
      icon: Activity,
      title: "Monitoramento de saúde",
      description: "Acompanhe sinais vitais, medicações e métricas de saúde ao longo do tempo",
    },
  ];

  return (
    <section id="patients" className={cn("py-20 lg:py-24 bg-[#FAFBFC] relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <MedicalPattern variant="waves" intensity="medium" color="#1B9AAA" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F4C75] mb-4">
            Sua saúde, no seu controle
          </h2>
          <p className="text-xl text-[#5D737E] max-w-2xl mx-auto">
            Tenha controle do seu cuidado com acesso fácil a agendamentos, prontuário e comunicação direta
            com sua equipe de saúde.
          </p>
        </div>

        {/* Main Content: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-lg bg-white border border-gray-200 hover:border-[#1B9AAA] hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#1B9AAA]/10 rounded-lg flex items-center justify-center group-hover:bg-[#1B9AAA]/20 transition-colors">
                        <Icon className="h-6 w-6 text-[#1B9AAA]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F4C75] mb-1 group-hover:text-[#1B9AAA] transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-[#5D737E] text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Patient App Mockup */}
          <div className="relative hidden lg:block">
            <PatientAppMockup />
          </div>
        </div>

        {/* Patient Journey Visualization */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 rounded-full mb-4">
              <span className="text-sm font-semibold text-blue-700">Jornada do Paciente</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-[#0F4C75] mb-4">
              Sua jornada de cuidado, simplificada
            </h3>
            <p className="text-lg text-[#5D737E] max-w-2xl mx-auto">
              Do agendamento ao monitoramento contínuo, tudo em um só lugar
            </p>
          </div>
          <PatientJourneyIllustration />
        </div>

        {/* Testimonial */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-2 border-[#1B9AAA]/20 bg-gradient-to-br from-white to-[#FAFBFC]">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B9AAA] to-[#0F4C75] flex items-center justify-center flex-shrink-0">
                  <HeartPulse className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-lg text-[#2D3748] mb-4 italic">
                    "O Prontivus transformou completamente como eu cuido da minha saúde. Consigo marcar
                    consultas na hora, acessar meus exames assim que ficam prontos e me comunicar
                    diretamente com meu médico. Ficou muito mais fácil cuidar da minha saúde."
                  </p>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-[#0F4C75]">Ana Oliveira</div>
                      <div className="text-sm text-[#5D737E]">Paciente Prontivus desde 2023</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call-to-Action */}
        <div className="text-center">
          <div className="inline-block">
            <h3 className="text-2xl font-bold text-[#0F4C75] mb-6">
              Comece a usar o Prontivus hoje
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                size="lg"
                className="bg-[#0F4C75] hover:bg-[#0F4C75]/90 text-white px-8 py-6 h-auto text-lg font-semibold"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/login";
                  }
                }}
              >
                <Download className="mr-2 h-5 w-5" />
                Acessar Portal do Paciente
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#0F4C75] text-[#0F4C75] hover:bg-[#0F4C75]/5 px-8 py-6 h-auto text-lg font-semibold"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Saiba mais
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* App Store Badges */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-sm text-[#5D737E] mb-2 sm:mb-0">Baixe nosso app móvel:</div>
              <AppStoreBadge platform="apple" />
              <AppStoreBadge platform="google" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Patient App Mockup Component
function PatientAppMockup() {
  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative mx-auto w-[320px] aspect-[9/19] bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] rounded-[3rem] p-3 shadow-2xl">
        {/* Phone Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
          {/* Status Bar */}
          <div className="h-8 bg-[#0F4C75] flex items-center justify-between px-6 text-white text-xs">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-white rounded-sm">
                <div className="w-3 h-1.5 bg-white rounded-sm m-0.5" />
              </div>
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>

          {/* App Content */}
          <div className="h-[calc(100%-2rem)] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#0F4C75] text-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Ana Oliveira</div>
                  <div className="text-xs text-white/80">Portal do Paciente</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ActionCard icon={CalendarDays} title="Consultas" color="bg-[#1B9AAA]/10" />
                <ActionCard icon={Video} title="Chamada de vídeo" color="bg-[#16C79A]/10" />
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-[#0F4C75] text-sm">Registros recentes</div>
                  <CheckCircle2 className="h-4 w-4 text-[#16C79A]" />
                </div>
                <div className="space-y-2">
                  <RecordItem title="Resultados de sangue" date="há 2 dias" status="available" />
                  <RecordItem title="Laudo de raio-X" date="há 1 semana" status="available" />
                  <RecordItem title="Prescrição" date="há 1 semana" status="active" />
                </div>
              </div>

              {/* Health Metrics */}
              <div className="p-3 bg-[#FAFBFC] rounded-lg border border-gray-200">
                <div className="font-semibold text-[#0F4C75] text-sm mb-3">Sinais vitais de hoje</div>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="PA" value="120/80" normal />
                  <MetricCard label="Pulso" value="72" normal />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#16C79A]/20 rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#1B9AAA]/20 rounded-full blur-xl animate-pulse-slow" />
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
}) {
  return (
    <div className={cn("p-4 rounded-lg border border-gray-200", color)}>
      <Icon className="h-6 w-6 text-[#0F4C75] mb-2" />
      <div className="text-sm font-medium text-[#0F4C75]">{title}</div>
    </div>
  );
}

function RecordItem({ title, date, status }: { title: string; date: string; status: string }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-[#FAFBFC] rounded-lg border border-gray-200">
      <FileText className="h-5 w-5 text-[#1B9AAA] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#2D3748] truncate">{title}</div>
        <div className="text-xs text-[#5D737E]">{date}</div>
      </div>
      {status === "available" && (
        <div className="w-2 h-2 rounded-full bg-[#16C79A] flex-shrink-0" />
      )}
      {status === "active" && (
        <div className="w-2 h-2 rounded-full bg-[#1B9AAA] flex-shrink-0" />
      )}
    </div>
  );
}

function MetricCard({ label, value, normal }: { label: string; value: string; normal: boolean }) {
  return (
    <div className="text-center p-2 bg-white rounded border border-gray-200">
      <div className="text-xs text-[#5D737E] mb-1">{label}</div>
      <div className="text-sm font-semibold text-[#0F4C75]">{value}</div>
      {normal && (
        <div className="text-xs text-[#16C79A] mt-1">Normal</div>
      )}
    </div>
  );
}

// Patient Journey Illustration
function PatientJourneyIllustration() {
  const steps = [
    {
      icon: CalendarDays,
      label: "Agendar",
      description: "Marque sua consulta em segundos com disponibilidade em tempo real",
      image: "/resource image/prontivus (8).jpg",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: Video,
      label: "Consultar",
      description: "Atendimento virtual ou presencial com seu médico de confiança",
      image: "/resource image/prontivus (9).jpg",
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
    },
    {
      icon: FileText,
      label: "Revisar",
      description: "Acesse seu prontuário completo, exames e histórico médico",
      image: "/resource image/prontivus (10).jpg",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      icon: Pill,
      label: "Gerir",
      description: "Prescrições digitais e lembretes automáticos de medicamentos",
      image: "/resource image/prontivus (11).jpg",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      icon: Activity,
      label: "Monitorar",
      description: "Acompanhe sua saúde com métricas e indicadores em tempo real",
      image: "/resource image/prontivus (12).jpg",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <div className="relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-teal-200/10 rounded-full blur-3xl translate-x-1/2" />
      </div>

      {/* Journey Steps */}
      <div className="relative z-10">
        {/* Desktop: Horizontal Flow */}
        <div className="hidden lg:block">
          <div className="flex items-start justify-center gap-4 relative">
            {/* Connection Line */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-teal-200 to-orange-200 opacity-30" />
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center group relative z-10">
                    {/* Step Card */}
                    <Card
                      className={cn(
                        "w-72 bg-white/90 backdrop-blur-xl border-2",
                        step.borderColor,
                        "hover:shadow-2xl hover:shadow-blue-500/10",
                        "transition-all duration-500 ease-out",
                        "transform hover:-translate-y-3",
                        "overflow-hidden"
                      )}
                    >
                      {/* Image Background */}
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={step.image}
                          alt={step.label}
                          fill
                          className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                          sizes="288px"
                        />
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-b from-transparent to-white/95",
                          "group-hover:to-white/98 transition-all duration-500"
                        )} />
                        
                        {/* Icon Badge */}
                        <div className={cn(
                          "absolute top-4 right-4 w-14 h-14 rounded-2xl",
                          "bg-gradient-to-br",
                          step.color,
                          "flex items-center justify-center shadow-xl",
                          "transform group-hover:scale-110 group-hover:rotate-3",
                          "transition-all duration-500"
                        )}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>

                        {/* Step Number */}
                        <div className={cn(
                          "absolute top-4 left-4 w-8 h-8 rounded-full",
                          step.bgColor,
                          "flex items-center justify-center",
                          "border-2 border-white shadow-md",
                          "font-bold text-sm text-gray-700"
                        )}>
                          {index + 1}
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <h4 className="text-xl font-bold text-[#0F4C75] mb-2 group-hover:text-[#1B9AAA] transition-colors">
                          {step.label}
                        </h4>
                        <p className="text-sm text-[#5D737E] leading-relaxed">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Step Label Below */}
                    <div className="mt-4 text-center">
                      <div className="font-semibold text-[#0F4C75] text-sm">{step.label}</div>
                    </div>
                  </div>

                  {/* Arrow Connector */}
                  {index < steps.length - 1 && (
                    <div className="flex items-center pt-24">
                      <div className="relative">
                        <ArrowRight className="h-8 w-8 text-blue-300 group-hover:text-blue-500 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet: Vertical Flow */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection Line (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-teal-200 opacity-30 z-0" />
                )}

                <div className="relative z-10 flex gap-4 group">
                  {/* Icon Circle */}
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl",
                      "bg-gradient-to-br",
                      step.color,
                      "flex items-center justify-center shadow-xl",
                      "transform group-hover:scale-110 group-hover:rotate-3",
                      "transition-all duration-500",
                      "border-4 border-white"
                    )}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    {/* Step Number */}
                    <div className={cn(
                      "absolute -top-2 -right-2 w-6 h-6 rounded-full",
                      step.bgColor,
                      "flex items-center justify-center",
                      "border-2 border-white shadow-md",
                      "font-bold text-xs text-gray-700"
                    )}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content Card */}
                  <Card
                    className={cn(
                      "flex-1 bg-white/90 backdrop-blur-xl border-2",
                      step.borderColor,
                      "hover:shadow-xl transition-all duration-300",
                      "overflow-hidden"
                    )}
                  >
                    <div className="flex gap-4">
                      {/* Image Thumbnail */}
                      <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={step.image}
                          alt={step.label}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-br from-transparent",
                          "to-black/20"
                        )} />
                      </div>

                      <CardContent className="p-4 flex-1">
                        <h4 className="text-lg font-bold text-[#0F4C75] mb-1">
                          {step.label}
                        </h4>
                        <p className="text-xs text-[#5D737E] leading-relaxed line-clamp-2">
                          {step.description}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// App Store Badge Component
function AppStoreBadge({ platform }: { platform: "apple" | "google" }) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200",
        "hover:scale-105 hover:shadow-md",
        platform === "apple"
          ? "bg-black text-white border-black"
          : "bg-white text-black border-gray-300"
      )}
      onClick={() => {
        // Placeholder - replace with actual app store links
        if (typeof window !== "undefined") {
          const urls = {
            apple: "https://apps.apple.com/app/prontivus",
            google: "https://play.google.com/store/apps/details?id=com.prontivus",
          };
          window.open(urls[platform], "_blank");
        }
      }}
    >
      <div className="flex items-center gap-2">
        {platform === "apple" ? (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] leading-tight">Download on the</div>
              <div className="text-sm font-semibold">App Store</div>
            </div>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L16.81,15.12L14.54,12.85L16.81,10.81L20.16,10.81M20.84,9.69L21.94,8.31C22.18,7.96 22.18,7.5 21.94,7.15L14.54,1.54L6.05,11.03L16.81,17.25L20.84,9.69Z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] leading-tight">Get it on</div>
              <div className="text-sm font-semibold">Google Play</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

