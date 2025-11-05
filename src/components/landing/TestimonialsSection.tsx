"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Award,
  Users,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  rating: number;
  type: "patient" | "doctor" | "admin";
}

interface TestimonialsSectionProps {
  className?: string;
}

export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote:
        "O Prontivus tornou o cuidado da minha família muito mais fácil. A telemedicina evitou várias idas à clínica e ter todo o prontuário em um só lugar é extremamente conveniente.",
      name: "Maria Silva",
      role: "Paciente",
      rating: 5,
      type: "patient",
    },
    {
      id: 2,
      quote:
        "A plataforma otimizou as operações da clínica e melhorou muito a comunicação com os pacientes. O PEP é intuitivo e robusto, permitindo focar mais no cuidado e menos na papelada.",
      name: "Dr. Roberto Santos",
      role: "Cardiologista",
      rating: 5,
      type: "doctor",
    },
    {
      id: 3,
      quote:
        "A implantação foi tranquila e a equipe se adaptou rápido. O faturamento por si só economizou 15 horas por semana, e a automação TISS eliminou inúmeros processos manuais.",
      name: "Ana Costa",
      role: "Gestora de Clínica",
      rating: 5,
      type: "admin",
    },
    {
      id: 4,
      quote:
        "Como profissional com rotina cheia, adoro poder agendar consultas e ver resultados no celular. O portal do paciente é simples e seguro.",
      name: "Carlos Oliveira",
      role: "Paciente",
      rating: 5,
      type: "patient",
    },
    {
      id: 5,
      quote:
        "O Prontivus transformou a gestão de dados dos pacientes. O painel de análises trouxe insights inéditos, ajudando decisões baseadas em dados.",
      name: "Dr. Juliana Ferreira",
      role: "Clínica Geral",
      rating: 5,
      type: "doctor",
    },
  ];

  const trustIndicators = [
    {
      icon: Shield,
      label: "HIPAA Compliant",
      description: "Full compliance with healthcare regulations",
    },
    {
      icon: Award,
      label: "ISO 27001 Certified",
      description: "International security standard",
    },
    {
      icon: FileText,
      label: "GDPR Compliant",
      description: "EU data protection compliance",
    },
    {
      icon: CheckCircle2,
      label: "SOC 2 Type II",
      description: "Security and availability standards",
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-advance carousel (optional)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const getRoleColor = (type: string) => {
    switch (type) {
      case "doctor":
        return "from-[#0F4C75] to-[#1B9AAA]";
      case "patient":
        return "from-[#1B9AAA] to-[#16C79A]";
      case "admin":
        return "from-[#5D737E] to-[#0F4C75]";
      default:
        return "from-[#0F4C75] to-[#1B9AAA]";
    }
  };

  const getRoleIcon = (type: string) => {
    switch (type) {
      case "doctor":
        return "👨‍⚕️";
      case "patient":
        return "👤";
      case "admin":
        return "👩‍💼";
      default:
        return "👤";
    }
  };

  return (
    <section className={cn("py-20 lg:py-24 bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] text-white relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <MedicalPattern variant="circuit" intensity="medium" color="#FFFFFF" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Confiado por profissionais de saúde</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Veja o que médicos, pacientes e gestores dizem sobre o Prontivus
          </p>
        </div>

        {/* User Statistics */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-sm text-white/80">Profissionais de saúde</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">50K+</div>
            <div className="text-sm text-white/80">Pacientes ativos</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">1M+</div>
            <div className="text-sm text-white/80">Consultas</div>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">99.9%</div>
            <div className="text-sm text-white/80">Disponibilidade</div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="mb-16">
          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                } as React.CSSProperties}
              >
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="min-w-full px-4">
                    <TestimonialCard testimonial={testimonial} getRoleColor={getRoleColor} getRoleIcon={getRoleIcon} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </button>
          </div>

          {/* Carousel Indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex ? "bg-white w-8" : "bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustIndicators.map((indicator, index) => {
            const Icon = indicator.icon;
            return (
              <Card
                key={index}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300"
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{indicator.label}</h3>
                  <p className="text-sm text-white/80">{indicator.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  getRoleColor: (type: string) => string;
  getRoleIcon: (type: string) => string;
}

function TestimonialCard({ testimonial, getRoleColor, getRoleIcon }: TestimonialCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-4xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar/Photo */}
          <div className="flex-shrink-0">
            <div
              className={cn(
                "w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-3xl lg:text-4xl shadow-lg",
                getRoleColor(testimonial.type)
              )}
            >
              {getRoleIcon(testimonial.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-lg lg:text-xl leading-relaxed mb-6 italic">
              "{testimonial.quote}"
            </blockquote>

            {/* Author Info */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/20">
              <div>
                <div className="font-semibold text-lg">{testimonial.name}</div>
                <div className="text-sm text-white/80">{testimonial.role}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

