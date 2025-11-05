"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Users,
  Stethoscope,
  FileText,
  Calendar,
  DollarSign,
  Lock,
  Heart,
  Clock,
  Smartphone,
  BarChart3,
  Star,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProntivusLogo, MedicalPattern } from "@/components/assets";
import { LandingHeader } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ForPatientsSection } from "@/components/landing/ForPatientsSection";
import { ForProvidersSection } from "@/components/landing/ForProvidersSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { LandingFooter } from "@/components/landing/Footer";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();





  const pricingPlans = [
    {
      name: "Inicial",
      price: "R$ 299",
      period: "/mês",
      description: "Perfeito para clínicas pequenas",
      features: [
        "Até 500 pacientes",
        "Prontuário eletrônico básico",
        "Agendamento de consultas",
        "Suporte por e-mail",
      ],
      popular: false,
    },
    {
      name: "Profissional",
      price: "R$ 599",
      period: "/mês",
      description: "Para clínicas em crescimento",
      features: [
        "Pacientes ilimitados",
        "Prontuário eletrônico completo",
        "Gestão financeira",
        "Análises e relatórios",
        "Suporte prioritário",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      period: "",
      description: "Para grandes redes de saúde",
      features: [
        "Suporte multiunidade",
        "Integrações avançadas",
        "Fluxos personalizados",
        "Suporte dedicado",
        "Treinamento e onboarding",
      ],
      popular: false,
    },
  ];


  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Showcase */}
      <FeaturesSection />

      {/* For Patients Section */}
      <ForPatientsSection />

      {/* For Healthcare Providers */}
      <ForProvidersSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0F4C75] mb-4">Preços simples e transparentes</h2>
            <p className="text-xl text-[#5D737E] max-w-2xl mx-auto">
              Escolha o plano que se adapta ao tamanho e às necessidades da sua clínica
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  "medical-card border-2 relative",
                  plan.popular
                    ? "border-[#0F4C75] shadow-xl scale-105"
                    : "border-gray-200"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#0F4C75] text-white px-4 py-1">Mais popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-[#0F4C75] mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-[#5D737E] mb-4">{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-[#0F4C75]">{plan.price}</span>
                    <span className="text-[#5D737E] ml-2">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-[#16C79A] flex-shrink-0 mt-0.5" />
                        <span className="text-[#2D3748]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-[#0F4C75] hover:bg-[#0F4C75]/90 text-white"
                        : "border-2 border-[#0F4C75] text-[#0F4C75] hover:bg-[#0F4C75]/5"
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => router.push("/login")}
                  >
                    {plan.price === "Sob consulta" ? "Falar com vendas" : "Começar agora"}
                    {plan.price !== "Sob consulta" && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}

