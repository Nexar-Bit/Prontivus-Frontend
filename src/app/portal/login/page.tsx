"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts";
import { getStoredUser } from "@/lib/auth";
import Image from "next/image";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Get role parameter and set default redirect based on role
  const roleParam = searchParams.get('role');
  const redirectTo = searchParams.get('redirect') || 
    (roleParam === 'staff' ? '/dashboard' : '/patient/dashboard');
  const role = roleParam;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      await login({
        username_or_email: formData.email,
        password: formData.password,
      });
      toast.success("Login realizado com sucesso!");
      
      // Get user from localStorage (login updates it via setAuthData)
      // Use a small delay to ensure localStorage is updated
      setTimeout(() => {
        const currentUser = getStoredUser();
        const userRole = currentUser?.role;
        
        // Determine where to redirect based on user role
        if (userRole === 'patient') {
          // Patients always go to patient dashboard
          router.push('/patient/dashboard');
        } else {
          // Staff users: use the redirect URL, defaulting to /dashboard if not specified or if it's a patient route
          if (redirectTo.startsWith('/patient') || redirectTo === '/portal' || !redirectTo || redirectTo === '/') {
            router.push('/dashboard');
          } else {
            router.push(redirectTo);
          }
        }
      }, 100);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Falha no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#FAFBFC] via-[#F0F4F8] to-[#E8F0F5] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1B9AAA]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0F4C75]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Back button */}
        <Link 
          href="/login" 
          className="inline-flex items-center text-[#0F4C75] hover:text-[#1B9AAA] transition-colors mb-2 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar para opções de login</span>
        </Link>

        {/* Avatar and Welcome Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1B9AAA] to-[#0F4C75] blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#1B9AAA] to-[#0F4C75] flex items-center justify-center shadow-xl ring-4 ring-white/50">
                <Image
                  src={role === 'staff' ? '/assets/svg/placeholders/doctor-avatar.svg' : '/assets/svg/placeholders/patient-avatar.svg'}
                  alt={role === 'staff' ? 'Avatar da Equipe' : 'Avatar do Paciente'}
                  width={112}
                  height={112}
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-[#0F4C75] mb-2">Bem-vindo de volta</h2>
          <p className="text-base text-[#5D737E]">
            {role === 'staff' ? 'Acesse sua conta do painel da equipe' : 'Acesse sua conta do portal do paciente'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-[#0F4C75]">
              {role === 'staff' ? 'Login da Equipe' : 'Login do Paciente'}
            </CardTitle>
            <CardDescription className="text-[#5D737E]">
              Informe suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0F4C75] font-medium">
                  Endereço de e-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu.email@exemplo.com"
                  className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#0F4C75] font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Digite sua senha"
                  className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-[#1B9AAA] to-[#0F4C75] hover:from-[#0F4C75] hover:to-[#1B9AAA] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-[#5D737E]">
                Não tem uma conta?{" "}
                <Link 
                  href={`/portal/register${role ? `?role=${role}` : ''}`} 
                  className="font-semibold text-[#1B9AAA] hover:text-[#0F4C75] transition-colors"
                >
                  Crie uma
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
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
