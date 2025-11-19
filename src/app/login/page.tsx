"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Stethoscope } from "lucide-react";
import { MedicalPattern } from "@/components/assets";
import Image from "next/image";
import { toast } from "sonner";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const error = searchParams.get('error');

  useEffect(() => {
    // Show error message if redirected due to inactive account
    if (error === 'inactive') {
      toast.error('Conta inativa', {
        description: 'Sua conta está inativa. Entre em contato com o administrador ou faça login novamente.',
        duration: 5000,
      });
      // Remove error parameter from URL
      router.replace('/login');
    }
  }, [error, router]);

  useEffect(() => {
    // If user is already authenticated, redirect them to their intended destination
    // Only redirect if we're not navigating away from this page
    const token = localStorage.getItem('prontivus_access_token');
    if (token && redirectTo && redirectTo !== '/') {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  const handlePortalLogin = () => {
    const redirectUrl = redirectTo.startsWith('/portal') ? redirectTo : '/patient/dashboard';
    router.push(`/portal/login?redirect=${encodeURIComponent(redirectUrl)}&role=patient`);
  };

  const handleDashboardLogin = () => {
    // For staff dashboard, redirect to dashboard
    const redirectUrl = redirectTo.startsWith('/portal') ? '/dashboard' : (redirectTo === '/' ? '/dashboard' : redirectTo);
    router.push(`/portal/login?redirect=${encodeURIComponent(redirectUrl)}&role=staff`);
  };

  return (
    <div className="relative min-h-screen bg-[#FAFBFC] overflow-hidden">
      <MedicalPattern variant="dots" intensity="subtle" color="#0F4C75" />
      <style jsx>{`
        @keyframes spin-ring { to { transform: rotate(360deg); } }
        .star-trail::after {
          content: "";
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          pointer-events: none;
          /* Create a thin ring, then use a conic gradient as a moving highlight */
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
          background:
            conic-gradient(from 0deg,
              rgba(15,76,117,0) 0deg, rgba(15,76,117,0) 300deg,
              rgba(27,154,170,0.9) 312deg, rgba(15,76,117,0) 324deg,
              rgba(27,154,170,0.7) 336deg, rgba(15,76,117,0) 348deg,
              rgba(15,76,117,0) 360deg);
          animation: spin-ring 6s linear infinite;
          filter: drop-shadow(0 0 6px rgba(27,154,170,0.6));
        }
      `}</style>

      {/* Metade esquerda/direita ocupadas pelos botões */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Angled divider ~20deg */}
        <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center z-0">
          <div className="w-px h-[130%] bg-gradient-to-b from-[#0F4C75]/20 via-[#1B9AAA] to-[#0F4C75]/20 transform rotate-[20deg]"></div>
        </div>

        {/* Logo centralizado na tela - above buttons but clickable */}
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center relative">
            <Link 
              href="/" 
              className="block cursor-pointer hover:opacity-90 transition-opacity pointer-events-auto"
              onClick={(e) => {
                // Prevent event bubbling to buttons below
                e.stopPropagation();
                // Clear any redirect parameter when going to home
                if (searchParams.get('redirect')) {
                  e.preventDefault();
                  router.push('/');
                }
              }}
            >
              <div className="mx-auto flex items-center justify-center w-40 h-40 rounded-full bg-white/95 shadow-xl ring-2 ring-[#0F4C75]/20 relative overflow-visible star-trail backdrop-blur-sm">
                <Image
                  src="/Logo/Sublogo PNG Transparente.png"
                  alt="Prontivus"
                  width={220}
                  height={60}
                  priority
                  className="w-[75%] h-auto"
                />
              </div>
              <p className="text-sm text-[#5D737E] mt-3 font-medium pointer-events-auto">Prontivus — Cuidado inteligente</p>
            </Link>
          </div>
        </div>
        {/* Metade Paciente */}
        <button
          className="group relative overflow-hidden w-full h-full flex flex-col items-center justify-center p-10 bg-white/70 hover:bg-white transition-colors cursor-pointer"
          onClick={(e) => {
            // Don't trigger if clicking on logo area
            const target = e.target as HTMLElement;
            if (target.closest('a[href="/"]')) {
              return;
            }
            handlePortalLogin();
          }}
          aria-label="Entrar como Paciente"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-300"
            style={{ backgroundImage: "url('/resource image/prontivus (2).jpg')" } as React.CSSProperties}
          />
          {/* Subtle gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/50 group-hover:from-white/40 group-hover:via-white/20 group-hover:to-white/40 transition-all duration-300" />
          <div className="relative z-20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#1B9AAA]/10 flex items-center justify-center mb-4 group-hover:bg-[#1B9AAA]/20 transition-colors">
              <Users className="h-10 w-10 text-[#1B9AAA]" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-[#0F4C75]">Portal do Paciente</div>
              <div className="text-[#0F4C75]/80 mt-1">Acesse seu prontuário e agendamentos</div>
              <div className="mt-4 inline-flex items-center gap-2 text-[#0F4C75] font-medium">
                Entrar <ArrowRight className="h-4 w-4" />
        </div>
            </div>
          </div>
        </button>

        {/* Metade Equipe */}
        <button
          className="group relative overflow-hidden w-full h-full flex flex-col items-center justify-center p-10 bg-white/70 hover:bg-white transition-colors cursor-pointer"
          onClick={(e) => {
            // Don't trigger if clicking on logo area
            const target = e.target as HTMLElement;
            if (target.closest('a[href="/"]')) {
              return;
            }
            handleDashboardLogin();
          }}
          aria-label="Entrar como Equipe"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-300"
            style={{ backgroundImage: "url('/resource image/prontivus (3).jpg')" } as React.CSSProperties}
          />
          {/* Subtle gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/50 group-hover:from-white/40 group-hover:via-white/20 group-hover:to-white/40 transition-all duration-300" />
          <div className="relative z-20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#0F4C75]/10 flex items-center justify-center mb-4 group-hover:bg-[#0F4C75]/20 transition-colors">
              <Stethoscope className="h-10 w-10 text-[#0F4C75]" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-[#0F4C75]">Painel da Equipe</div>
              <div className="text-[#0F4C75]/80 mt-1">Gerencie pacientes e operações</div>
              <div className="mt-4 inline-flex items-center gap-2 text-[#0F4C75] font-medium">
                Entrar <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
