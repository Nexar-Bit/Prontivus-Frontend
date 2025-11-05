"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Shield,
  Award,
  CheckCircle2,
  Globe,
  ChevronDown,
} from "lucide-react";
import { ProntivusLogo } from "@/components/assets";
import { Button } from "@/components/ui/button";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function LandingFooter({ className }: FooterProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setShowBackToTop(window.scrollY > 400);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const patientLinks = [
    { label: "Portal do Paciente", href: "/login" },
    { label: "App Mobile", href: "#" },
    { label: "Telemedicina", href: "#patients" },
    { label: "Prontuário", href: "#features" },
    { label: "Central de Suporte", href: "/help" },
    { label: "Recursos para Pacientes", href: "#" },
  ];

  const providerLinks = [
    { label: "Soluções para Clínicas", href: "#providers" },
    { label: "Sistema de PEP", href: "#features" },
    { label: "Implantação", href: "#" },
    { label: "Treinamento & Suporte", href: "/help" },
    { label: "Programa de Parcerias", href: "#" },
    { label: "Documentação da API", href: "#" },
  ];

  const legalLinks = [
    { label: "Política de Privacidade", href: "/privacy" },
    { label: "Termos de Uso", href: "/terms" },
    { label: "Conformidade HIPAA", href: "#" },
    { label: "Política GDPR", href: "#" },
    { label: "Política de Cookies", href: "#" },
    { label: "Acessibilidade", href: "#" },
  ];

  const contactInfo = [
    { icon: Mail, label: "contact@prontivus.com", href: "mailto:contact@prontivus.com" },
    { icon: Phone, label: "(11) 3000-0000", href: "tel:+551130000000" },
    { icon: MapPin, label: "São Paulo, Brasil", href: "#" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
  ];

  const complianceBadges = [
    { icon: Shield, label: "Conforme HIPAA" },
    { icon: Award, label: "ISO 27001" },
    { icon: CheckCircle2, label: "SOC 2 Tipo II" },
    { icon: CheckCircle2, label: "Conforme GDPR" },
  ];

  return (
    <footer className={cn("relative bg-[#0F4C75] text-white overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <MedicalPattern variant="circuit" intensity="medium" color="#FFFFFF" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Company & Product */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <ProntivusLogo variant="full" size="md" includeMedicalSymbol={false} />
                <p className="text-sm text-white/70 mt-3 mb-4">
                  Plataforma completa de gestão em saúde para clínicas modernas.
                </p>
                <p className="text-xs text-white/60 font-medium">Prontivus — Cuidado inteligente</p>
              </div>

              {/* Social Media Links */}
              <div className="flex items-center gap-3 mb-6">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </a>
                  );
                })}
              </div>

              {/* App Download Badges */}
              <div className="space-y-2">
              <div className="text-xs font-medium text-white/80 mb-2">Baixe nosso app:</div>
                <div className="flex flex-col gap-2">
                  <AppStoreBadge platform="apple" />
                  <AppStoreBadge platform="google" />
                </div>
              </div>
            </div>

            {/* Column 2: For Patients */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Para Pacientes</h3>
              <ul className="space-y-3">
                {patientLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: For Providers */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Para Profissionais</h3>
              <ul className="space-y-3">
                {providerLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Legal & Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Legal & Contato</h3>
              
              {/* Contact Information */}
              <div className="space-y-3 mb-6">
                {contactInfo.map((contact, index) => {
                  const Icon = contact.icon;
                  return (
                    <a
                      key={index}
                      href={contact.href}
                      className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors duration-200 group"
                    >
                      <Icon className="h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
                      <span>{contact.label}</span>
                    </a>
                  );
                })}
              </div>

              {/* Legal Links */}
              <ul className="space-y-3">
                {legalLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {complianceBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-xs text-white/70">
                  <Icon className="h-4 w-4" />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/70 text-center md:text-left">
            © {new Date().getFullYear()} Prontivus. Todos os direitos reservados.
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>PT-BR</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", languageOpen && "rotate-180")} />
              </button>
              {languageOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg py-2 min-w-[120px]">
                  <button className="w-full text-left px-4 py-2 text-sm text-[#0F4C75] hover:bg-[#0F4C75]/5">
                    Português (BR)
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-[#5D737E] hover:bg-[#0F4C75]/5">
                    English (US)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-[#1B9AAA] hover:bg-[#1B9AAA]/90 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </footer>
  );
}

// App Store Badge Component
function AppStoreBadge({ platform }: { platform: "apple" | "google" }) {
  return (
    <a
      href="#"
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105",
        platform === "apple"
          ? "bg-black text-white border-black hover:bg-black/90"
          : "bg-white text-black border-gray-300 hover:bg-gray-50"
      )}
      onClick={(e) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
          const urls = {
            apple: "https://apps.apple.com/app/prontivus",
            google: "https://play.google.com/store/apps/details?id=com.prontivus",
          };
          window.open(urls[platform], "_blank");
        }
      }}
    >
      {platform === "apple" ? (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="text-left">
            <div className="text-[9px] leading-tight">Disponível na</div>
            <div className="text-xs font-semibold">App Store</div>
          </div>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L16.81,15.12L14.54,12.85L16.81,10.81L20.16,10.81M20.84,9.69L21.94,8.31C22.18,7.96 22.18,7.5 21.94,7.15L14.54,1.54L6.05,11.03L16.81,17.25L20.84,9.69Z" />
          </svg>
          <div className="text-left">
            <div className="text-[9px] leading-tight">Disponível no</div>
            <div className="text-xs font-semibold">Google Play</div>
          </div>
        </>
      )}
    </a>
  );
}

