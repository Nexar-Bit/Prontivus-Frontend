"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Stethoscope } from "lucide-react";
import { ProntivusLogo, MedicalPattern } from "@/components/assets";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    // If user is already authenticated, redirect them to their intended destination
    const token = localStorage.getItem('prontivus_access_token');
    if (token) {
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <MedicalPattern variant="dots" intensity="subtle" color="#0F4C75" />
      <div className="max-w-4xl w-full space-y-8 relative z-10">
        <div className="text-center flex flex-col items-center">
          <ProntivusLogo variant="full" size="xl" includeMedicalSymbol />
          <p className="text-sm text-[#5D737E] mt-2 font-medium">Prontivus — Cuidado inteligente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Login do Portal do Paciente */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary-accent medical-card" onClick={handlePortalLogin}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#1B9AAA]/10 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:bg-[#1B9AAA]/20">
                <Users className="h-8 w-8 text-[#1B9AAA]" />
              </div>
              <CardTitle className="text-2xl text-[#0F4C75]">Portal do Paciente</CardTitle>
              <CardDescription className="text-[#5D737E]">
                Acesse seu prontuário, agende consultas e gerencie seu cuidado
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" onClick={handlePortalLogin}>
                Entrar como Paciente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Login do Painel da Equipe */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary-accent medical-card" onClick={handleDashboardLogin}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#0F4C75]/10 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:bg-[#0F4C75]/20">
                <Stethoscope className="h-8 w-8 text-[#0F4C75]" />
              </div>
              <CardTitle className="text-2xl text-[#0F4C75]">Painel da Equipe</CardTitle>
              <CardDescription className="text-[#5D737E]">
                Gerencie pacientes, agendamentos, faturamento e operações da clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" onClick={handleDashboardLogin}>
                Entrar como Equipe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-[#5D737E]">
          <p>
            Pacientes e equipe utilizam o mesmo sistema de login. 
            Seu perfil será definido após a autenticação.
          </p>
        </div>
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
