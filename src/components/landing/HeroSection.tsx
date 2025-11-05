"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Play, Shield, Lock, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const router = useRouter();
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const trustIndicators = [
    { icon: Shield, label: "Conforme HIPAA" },
    { icon: Lock, label: "Segurança nível bancário" },
    { icon: Award, label: "Certificação ISO 27001" },
  ];

  return (
    <section
      className={cn(
        "relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden",
        "bg-gradient-to-br from-[#0F4C75] via-[#1B9AAA] to-[#0F4C75]",
        "pt-20",
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <MedicalPattern variant="circuit" intensity="medium" color="#FFFFFF" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-up">
            <div className="space-y-6">
              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                Gestão em Saúde
                <span className="block text-[#16C79A]">Moderna e Simplificada</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl">
                O Prontivus conecta pacientes, médicos e clínicas em uma plataforma segura e inteligente,
                projetada para a saúde moderna.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => router.push("/login")}
                className={cn(
                  "bg-white text-[#0F4C75] hover:bg-white/90",
                  "text-lg px-8 py-6 h-auto font-semibold",
                  "shadow-xl hover:shadow-2xl transition-all duration-300",
                  "hover:scale-105 active:scale-95"
                )}
              >
                Comece grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      "border-2 border-white/80 text-white hover:bg-white/20",
                      "bg-white/10 backdrop-blur-md",
                      "text-lg px-8 py-6 h-auto font-semibold",
                      "transition-all duration-300",
                      "hover:scale-105 active:scale-95 hover:border-white hover:bg-white/25",
                      "shadow-lg hover:shadow-xl"
                    )}
                  >
                    <Play className="mr-2 h-5 w-5 fill-white" />
                    Assistir demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#0F4C75]">
                      Demonstração da Plataforma Prontivus
                    </DialogTitle>
                    <DialogDescription>
                      Veja como o Prontivus transforma a gestão em saúde
                    </DialogDescription>
                  </DialogHeader>
                  <div className="aspect-video bg-[#0F4C75]/5 rounded-lg flex items-center justify-center">
                    {/* Placeholder for video embed */}
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-[#1B9AAA]/20 rounded-full flex items-center justify-center">
                        <Play className="h-10 w-10 text-[#0F4C75]" />
                      </div>
                      <p className="text-[#5D737E] text-sm">
                        Espaço reservado para vídeo
                        <br />
                        Substitua pela URL do seu vídeo de demonstração
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              {trustIndicators.map((indicator, index) => {
                const Icon = indicator.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-white/90 text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-medium">{indicator.label}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <CheckCircle2 className="h-5 w-5 text-[#16C79A]" />
                <span className="font-medium">Avaliação gratuita por 30 dias</span>
              </div>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="relative hidden lg:block animate-fade-up-delay">
            <HealthcarePlatformIllustration />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FAFBFC] to-transparent" />
    </section>
  );
}

// Healthcare Platform Illustration Component
function HealthcarePlatformIllustration() {
  return (
    <div className="relative w-full h-full max-w-lg mx-auto">
      {/* Main Device Frame */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform perspective-1000">
        {/* Device Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#16C79A]" />
            <div className="w-2 h-2 rounded-full bg-[#5D737E]" />
            <div className="w-2 h-2 rounded-full bg-[#5D737E]" />
          </div>
          <div className="text-xs font-semibold text-[#0F4C75]">Prontivus Platform</div>
          <div className="w-16 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Screen Content */}
        <div className="space-y-4">
          {/* Doctor Avatar & Info */}
          <div className="flex items-center gap-3 p-3 bg-[#FAFBFC] rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-[#0F4C75] rounded w-24 mb-2" />
              <div className="h-2 bg-[#5D737E]/30 rounded w-32" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#1B9AAA]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#1B9AAA]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Patient Data Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 bg-gradient-to-br from-[#0F4C75]/5 to-[#1B9AAA]/5 rounded-lg border border-[#1B9AAA]/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#1B9AAA]" />
                  <div className="h-2 bg-[#0F4C75] rounded w-16" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-[#5D737E]/20 rounded w-full" />
                  <div className="h-1.5 bg-[#5D737E]/20 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>

          {/* Medical Chart */}
          <div className="p-4 bg-white border-2 border-[#1B9AAA]/20 rounded-lg">
            <div className="h-2 bg-[#0F4C75] rounded w-20 mb-3" />
            <div className="flex items-end justify-between h-20 gap-1">
              {[
                { height: 65 },
                { height: 72 },
                { height: 68 },
                { height: 75 },
                { height: 70 },
                { height: 78 },
                { height: 73 },
              ].map((bar, i) => (
                // eslint-disable-next-line react/forbid-dom-props
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-[#1B9AAA] to-[#16C79A] rounded-t"
                  style={{ height: `${bar.height}%` } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#5D737E]">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-[#0F4C75] rounded-lg flex items-center justify-center">
              <div className="h-2 bg-white/30 rounded w-16" />
            </div>
            <div className="flex-1 h-10 bg-[#1B9AAA]/10 border border-[#1B9AAA]/30 rounded-lg flex items-center justify-center">
              <div className="h-2 bg-[#1B9AAA] rounded w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#16C79A]/20 rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-[#1B9AAA]/20 rounded-full blur-xl animate-pulse-slow" />
    </div>
  );
}

