"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts";
import { api } from "@/lib/api";

interface PatientRegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  cpf: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

interface EmployeeRegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Get role parameter - default to patient if not specified
  const roleParam = searchParams.get('role') || 'patient';
  const isEmployee = roleParam === 'staff' || roleParam === 'employee';
  
  // Patient form data
  const [patientFormData, setPatientFormData] = useState<PatientRegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    cpf: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });
  
  // Employee form data
  const [employeeFormData, setEmployeeFormData] = useState<EmployeeRegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
  });

  const handlePatientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmployeeFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePatientForm = (): string | null => {
    if (!patientFormData.first_name.trim()) return "Nome é obrigatório";
    if (!patientFormData.last_name.trim()) return "Sobrenome é obrigatório";
    if (!patientFormData.email.trim()) return "E-mail é obrigatório";
    if (!patientFormData.password) return "Senha é obrigatória";
    if (patientFormData.password.length < 8) return "A senha deve ter pelo menos 8 caracteres";
    if (patientFormData.password !== patientFormData.confirm_password) return "As senhas não coincidem";
    if (!patientFormData.phone.trim()) return "Telefone é obrigatório";
    if (!patientFormData.date_of_birth) return "Data de nascimento é obrigatória";
    if (!patientFormData.gender) return "Gênero é obrigatório";
    if (!patientFormData.cpf.trim()) return "CPF é obrigatório";
    if (!patientFormData.address.trim()) return "Endereço é obrigatório";
    if (!patientFormData.emergency_contact_name.trim()) return "Nome do contato de emergência é obrigatório";
    if (!patientFormData.emergency_contact_phone.trim()) return "Telefone do contato de emergência é obrigatório";
    if (!patientFormData.emergency_contact_relationship.trim()) return "Parentesco do contato de emergência é obrigatório";
    return null;
  };

  const validateEmployeeForm = (): string | null => {
    if (!employeeFormData.first_name.trim()) return "Nome é obrigatório";
    if (!employeeFormData.last_name.trim()) return "Sobrenome é obrigatório";
    if (!employeeFormData.email.trim()) return "E-mail é obrigatório";
    if (!employeeFormData.password) return "Senha é obrigatória";
    if (employeeFormData.password.length < 8) return "A senha deve ter pelo menos 8 caracteres";
    if (employeeFormData.password !== employeeFormData.confirm_password) return "As senhas não coincidem";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate based on form type
    const validationError = isEmployee 
      ? validateEmployeeForm() 
      : validatePatientForm();
      
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Register the user using auth context
      // Determine role from URL parameter, default to patient
      const userRole = isEmployee 
        ? 'secretary' as const  // Default staff role to secretary (can be changed by admin later)
        : 'patient' as const;
      
      // Use appropriate form data based on user type
      const formData = isEmployee ? employeeFormData : patientFormData;
      
      const userData = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: userRole,
        clinic_id: 1, // TODO: Get clinic_id from context or default clinic
      };

      await register(userData);

      // Note: Patient profile creation would need to be handled separately
      // or integrated into the registration process on the backend
      toast.success("Cadastro realizado com sucesso! Bem-vindo ao portal.");
      
      // Redirect based on role: patients to patient dashboard, staff to main dashboard
      if (userRole === 'patient') {
        router.push("/patient/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Extract error message from various error formats
      let errorMessage = "Falha no cadastro. Por favor, tente novamente.";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => 
            e.msg || e.message || JSON.stringify(e)
          ).join(', ');
        } else {
          errorMessage = detail;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      // Get Google OAuth URL from backend
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const response = await api.get<{ auth_url: string }>(
        `/api/auth/google/authorize?role=${roleParam || 'patient'}&redirect_uri=${encodeURIComponent(redirectUri)}`
      );
      
      // Redirect to Google OAuth
      window.location.href = response.auth_url;
    } catch (err: any) {
      console.error("Google signup error:", err);
      setError("Falha ao iniciar cadastro com Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#FAFBFC] via-[#F0F4F8] to-[#E8F0F5] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1B9AAA]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0F4C75]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#16C79A]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full space-y-6 relative z-10">
        {/* Back button */}
        <Link 
          href={`/portal/login${roleParam && roleParam !== 'patient' ? `?role=${roleParam}` : ''}`}
          className="inline-flex items-center text-[#0F4C75] hover:text-[#1B9AAA] transition-colors mb-2 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar para login</span>
        </Link>

        {/* Avatar and Welcome Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1B9AAA] to-[#0F4C75] blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#1B9AAA] to-[#0F4C75] flex items-center justify-center shadow-xl ring-4 ring-white/50">
                <UserPlus className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-[#0F4C75] mb-2">Criar Conta</h2>
          <p className="text-base text-[#5D737E]">
            {roleParam === 'staff' || roleParam === 'employee' 
              ? 'Cadastre-se para acessar o painel da equipe' 
              : 'Junte-se ao portal do paciente para gerenciar sua saúde'}
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-[#0F4C75]">
              {roleParam === 'staff' || roleParam === 'employee' ? 'Cadastro da Equipe' : 'Cadastro do Paciente'}
            </CardTitle>
            <CardDescription className="text-[#5D737E]">
              Preencha suas informações para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Common fields for both forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-[#0F4C75] font-medium">Nome *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={isEmployee ? employeeFormData.first_name : patientFormData.first_name}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                    placeholder="Seu nome"
                    className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-[#0F4C75] font-medium">Sobrenome *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={isEmployee ? employeeFormData.last_name : patientFormData.last_name}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                    placeholder="Seu sobrenome"
                    className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0F4C75] font-medium">Endereço de e-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={isEmployee ? employeeFormData.email : patientFormData.email}
                  onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                  placeholder="seu.email@exemplo.com"
                  className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0F4C75] font-medium">Senha *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={isEmployee ? employeeFormData.password : patientFormData.password}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                    placeholder="Mínimo 8 caracteres"
                    className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-[#0F4C75] font-medium">Confirmar Senha *</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    value={isEmployee ? employeeFormData.confirm_password : patientFormData.confirm_password}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                    placeholder="Confirme sua senha"
                    className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#0F4C75] font-medium">Telefone {isEmployee ? '' : '*'}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required={!isEmployee}
                  value={isEmployee ? employeeFormData.phone : patientFormData.phone}
                  onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                  placeholder="(00) 00000-0000"
                  className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                />
              </div>

              {/* Patient-specific fields */}
              {!isEmployee && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-[#0F4C75] font-medium">Data de Nascimento *</Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        required
                        value={patientFormData.date_of_birth}
                        onChange={handlePatientInputChange}
                        className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[#0F4C75] font-medium">Gênero *</Label>
                      <select
                        id="gender"
                        name="gender"
                        required
                        value={patientFormData.gender}
                        onChange={handlePatientInputChange}
                        aria-label="Seleção de gênero"
                        className="flex h-11 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9AAA] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        <option value="">Selecione o gênero</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                        <option value="prefer_not_to_say">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-[#0F4C75] font-medium">CPF *</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={patientFormData.cpf}
                      onChange={handlePatientInputChange}
                      className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[#0F4C75] font-medium">Endereço *</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      placeholder="Rua, número, bairro, cidade"
                      value={patientFormData.address}
                      onChange={handlePatientInputChange}
                      className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-[#0F4C75] mb-4">Contato de Emergência</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name" className="text-[#0F4C75] font-medium">Nome do Contato *</Label>
                        <Input
                          id="emergency_contact_name"
                          name="emergency_contact_name"
                          type="text"
                          required
                          placeholder="Nome completo"
                          value={patientFormData.emergency_contact_name}
                          onChange={handlePatientInputChange}
                          className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone" className="text-[#0F4C75] font-medium">Telefone do Contato *</Label>
                        <Input
                          id="emergency_contact_phone"
                          name="emergency_contact_phone"
                          type="tel"
                          required
                          placeholder="(00) 00000-0000"
                          value={patientFormData.emergency_contact_phone}
                          onChange={handlePatientInputChange}
                          className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="emergency_contact_relationship" className="text-[#0F4C75] font-medium">Parentesco *</Label>
                      <Input
                        id="emergency_contact_relationship"
                        name="emergency_contact_relationship"
                        type="text"
                        required
                        placeholder="Ex: Cônjuge, Pai, Mãe, Irmão"
                        value={patientFormData.emergency_contact_relationship}
                        onChange={handlePatientInputChange}
                        className="h-11 border-gray-300 focus:border-[#1B9AAA] focus:ring-[#1B9AAA] transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-[#1B9AAA] to-[#0F4C75] hover:from-[#0F4C75] hover:to-[#1B9AAA] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
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

            {/* Google Sign Up Button */}
            <Button
              type="button"
              onClick={handleGoogleSignUp}
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
              {loading ? "Carregando..." : "Cadastrar com Google"}
            </Button>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-[#5D737E]">
                Já tem uma conta?{" "}
                <Link 
                  href={`/portal/login${roleParam && roleParam !== 'patient' ? `?role=${roleParam}` : ''}`} 
                  className="font-semibold text-[#1B9AAA] hover:text-[#0F4C75] transition-colors"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
