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
import { api } from "@/lib/api";
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
      // Determine expected role based on login type
      const expectedRole = role === 'staff' ? 'staff' : role === 'patient' ? 'patient' : undefined;
      
      await login({
        username_or_email: formData.email,
        password: formData.password,
        expected_role: expectedRole,
      });
      toast.success("Login realizado com sucesso!");
      
      // Get user from localStorage (login updates it via setAuthData)
      // Use a small delay to ensure localStorage is updated and auth context is ready
      setTimeout(() => {
        const currentUser = getStoredUser();
        const userRole = currentUser?.role;
        
        // Check if user is SuperAdmin
        const isSuperAdmin = currentUser?.role === 'admin' && 
          (currentUser?.role_id === 1 || currentUser?.role_name === 'SuperAdmin');
        
        // Determine where to redirect based on user role
        if (userRole === 'patient') {
          // Patients always go to patient dashboard
          router.push('/patient/dashboard');
        } else if (isSuperAdmin) {
          // SuperAdmin users go to super-admin dashboard
          router.push('/super-admin');
        } else {
          // Staff users: use the redirect URL, defaulting to /dashboard if not specified or if it's a patient route
          if (redirectTo.startsWith('/patient') || redirectTo === '/portal' || !redirectTo || redirectTo === '/') {
            router.push('/dashboard');
          } else {
            router.push(redirectTo);
          }
        }
      }, 200); // Increased delay to ensure auth context is ready
    } catch (err: any) {
      console.error("Login error:", err);
      // Extract error message from various error formats
      let errorMessage = "Falha no login. Verifique suas credenciais.";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Check if it's a role verification error
      if (errorMessage.includes("Access denied") || errorMessage.includes("restricted")) {
        if (role === 'staff') {
          errorMessage = "Acesso negado. Este login é restrito apenas para membros da equipe (administradores, secretários ou médicos).";
        } else if (role === 'patient') {
          errorMessage = "Acesso negado. Este login é restrito apenas para pacientes.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Get Google OAuth URL from backend
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const response = await api.get<{ auth_url: string }>(
        `/api/auth/google/authorize?role=${role || 'patient'}&redirect_uri=${encodeURIComponent(redirectUri)}`
      );
      
      // Redirect to Google OAuth
      window.location.href = response.auth_url;
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Falha ao iniciar login com Google. Tente novamente.");
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#5D737E]">ou</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white hover:bg-gray-50 text-gray-700 font-medium border-2 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Carregando..." : "Continuar com Google"}
            </Button>

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
