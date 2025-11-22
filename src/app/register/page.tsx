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
import Image from "next/image";

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
      
      // Get default clinic_id - try to get from API or use default
      let clinicId = 1; // Default fallback
      try {
        const clinicsResponse = await api.get<Array<{ id: number }>>('/api/v1/admin/clinics');
        if (clinicsResponse && Array.isArray(clinicsResponse) && clinicsResponse.length > 0) {
          clinicId = clinicsResponse[0].id; // Use first available clinic
        }
      } catch (error) {
        console.warn('Could not fetch clinics, using default clinic_id:', error);
        // Use default clinic_id = 1
      }

      const userData = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: userRole,
        clinic_id: clinicId,
      };

      await register(userData);

      // Note: Patient profile creation would need to be handled separately
      // or integrated into the registration process on the backend
      toast.success("Cadastro realizado com sucesso!");
      
      // Redirect is handled by AuthContext after successful registration
      // No need to redirect here as AuthContext will handle it
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/v1/auth/google/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
      );
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    } catch (err: any) {
      console.error("Google signup error:", err);
      setError("Falha ao iniciar cadastro com Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md w-full space-y-6 relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/Logo/Logotipo em Fundo Transparente.png"
                alt="Prontivus"
                width={600}
                height={180}
                priority
                className="h-36 w-auto mx-auto"
              />
            </Link>
            <p className="text-gray-600">Criar uma nova conta</p>
          </div>

          {/* Card */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-gray-900">
                {isEmployee ? 'Cadastro da Equipe' : 'Cadastro do Paciente'}
              </CardTitle>
              <CardDescription className="text-gray-600">
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
                    <Label htmlFor="first_name" className="text-gray-700 font-medium">Nome *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={isEmployee ? employeeFormData.first_name : patientFormData.first_name}
                      onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                      placeholder="Seu nome"
                      className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-gray-700 font-medium">Sobrenome *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={isEmployee ? employeeFormData.last_name : patientFormData.last_name}
                      onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                      placeholder="Seu sobrenome"
                      className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Endereço de e-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={isEmployee ? employeeFormData.email : patientFormData.email}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                    placeholder="seu.email@exemplo.com"
                    className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Senha *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={isEmployee ? employeeFormData.password : patientFormData.password}
                      onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                      placeholder="Mínimo 8 caracteres"
                      className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Confirmar Senha *</Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      required
                      value={isEmployee ? employeeFormData.confirm_password : patientFormData.confirm_password}
                      onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                      placeholder="Confirme sua senha"
                      className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Telefone {isEmployee ? '' : '*'}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required={!isEmployee}
                    value={isEmployee ? employeeFormData.phone : patientFormData.phone}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                    placeholder="(00) 00000-0000"
                    className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                  />
                </div>

                {/* Patient-specific fields */}
                {!isEmployee && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth" className="text-gray-700 font-medium">Data de Nascimento *</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          required
                          value={patientFormData.date_of_birth}
                          onChange={handlePatientInputChange}
                          className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-gray-700 font-medium">Gênero *</Label>
                        <select
                          id="gender"
                          name="gender"
                          required
                          value={patientFormData.gender}
                          onChange={handlePatientInputChange}
                          aria-label="Seleção de gênero"
                          className="flex h-11 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                      <Label htmlFor="cpf" className="text-gray-700 font-medium">CPF *</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={patientFormData.cpf}
                        onChange={handlePatientInputChange}
                        className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-gray-700 font-medium">Endereço *</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        required
                        placeholder="Rua, número, bairro, cidade"
                        value={patientFormData.address}
                        onChange={handlePatientInputChange}
                        className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                      />
                    </div>

                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato de Emergência</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_name" className="text-gray-700 font-medium">Nome do Contato *</Label>
                          <Input
                            id="emergency_contact_name"
                            name="emergency_contact_name"
                            type="text"
                            required
                            placeholder="Nome completo"
                            value={patientFormData.emergency_contact_name}
                            onChange={handlePatientInputChange}
                            className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_phone" className="text-gray-700 font-medium">Telefone do Contato *</Label>
                          <Input
                            id="emergency_contact_phone"
                            name="emergency_contact_phone"
                            type="tel"
                            required
                            placeholder="(00) 00000-0000"
                            value={patientFormData.emergency_contact_phone}
                            onChange={handlePatientInputChange}
                            className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="emergency_contact_relationship" className="text-gray-700 font-medium">Parentesco *</Label>
                        <Input
                          id="emergency_contact_relationship"
                          name="emergency_contact_relationship"
                          type="text"
                          required
                          placeholder="Ex: Cônjuge, Pai, Mãe, Irmão"
                          value={patientFormData.emergency_contact_relationship}
                          onChange={handlePatientInputChange}
                          className="h-11 border-gray-300 focus:border-purple-600 focus:ring-purple-600 transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
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
                  <span className="px-2 bg-white text-gray-500">Ou continue com</span>
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
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{" "}
                  <Link 
                    href="/login" 
                    className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/resource image/prontivus (31).jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-purple-600/20"></div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

