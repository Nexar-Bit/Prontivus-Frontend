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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
      <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para opções de login
          </Link>
      <h2 className="text-3xl font-bold text-gray-900">Bem-vindo de volta</h2>
          <p className="mt-2 text-sm text-gray-600">
        {role === 'staff' ? 'Acesse sua conta do painel da equipe' : 'Acesse sua conta do portal do paciente'}
          </p>
        </div>

        <Card>
          <CardHeader>
        <CardTitle>{role === 'staff' ? 'Login da Equipe' : 'Login do Paciente'}</CardTitle>
            <CardDescription>
          Informe suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
        <Label htmlFor="email">Endereço de e-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
          placeholder="Digite seu e-mail"
                />
              </div>

              <div>
        <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
          placeholder="Digite sua senha"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Entrar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
        Não tem uma conta?{" "}
                <Link href={`/portal/register${role ? `?role=${role}` : ''}`} className="font-medium text-blue-600 hover:text-blue-500">
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
