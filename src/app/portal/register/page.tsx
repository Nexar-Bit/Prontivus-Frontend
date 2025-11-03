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
    if (!patientFormData.first_name.trim()) return "First name is required";
    if (!patientFormData.last_name.trim()) return "Last name is required";
    if (!patientFormData.email.trim()) return "Email is required";
    if (!patientFormData.password) return "Password is required";
    if (patientFormData.password.length < 6) return "Password must be at least 6 characters";
    if (patientFormData.password !== patientFormData.confirm_password) return "Passwords do not match";
    if (!patientFormData.phone.trim()) return "Phone number is required";
    if (!patientFormData.date_of_birth) return "Date of birth is required";
    if (!patientFormData.gender) return "Gender is required";
    if (!patientFormData.cpf.trim()) return "CPF is required";
    if (!patientFormData.address.trim()) return "Address is required";
    if (!patientFormData.emergency_contact_name.trim()) return "Emergency contact name is required";
    if (!patientFormData.emergency_contact_phone.trim()) return "Emergency contact phone is required";
    if (!patientFormData.emergency_contact_relationship.trim()) return "Emergency contact relationship is required";
    return null;
  };

  const validateEmployeeForm = (): string | null => {
    if (!employeeFormData.first_name.trim()) return "First name is required";
    if (!employeeFormData.last_name.trim()) return "Last name is required";
    if (!employeeFormData.email.trim()) return "Email is required";
    if (!employeeFormData.password) return "Password is required";
    if (employeeFormData.password.length < 6) return "Password must be at least 6 characters";
    if (employeeFormData.password !== employeeFormData.confirm_password) return "Passwords do not match";
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
      };

      await register(userData);

      // Note: Patient profile creation would need to be handled separately
      // or integrated into the registration process on the backend
      toast.success("Registration successful! Welcome to the portal.");
      
      // Redirect based on role: patients to patient dashboard, staff to main dashboard
      if (userRole === 'patient') {
        router.push("/patient/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/portal" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            {roleParam === 'staff' || roleParam === 'employee' 
              ? 'Register for staff access to the dashboard' 
              : 'Join our patient portal to manage your healthcare'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{roleParam === 'staff' || roleParam === 'employee' ? 'Staff Registration' : 'Patient Registration'}</CardTitle>
            <CardDescription>
              Please fill in your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Common fields for both forms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={isEmployee ? employeeFormData.first_name : patientFormData.first_name}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={isEmployee ? employeeFormData.last_name : patientFormData.last_name}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={isEmployee ? employeeFormData.email : patientFormData.email}
                  onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={isEmployee ? employeeFormData.password : patientFormData.password}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    value={isEmployee ? employeeFormData.confirm_password : patientFormData.confirm_password}
                    onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number {isEmployee ? '' : '*'}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required={!isEmployee}
                  value={isEmployee ? employeeFormData.phone : patientFormData.phone}
                  onChange={isEmployee ? handleEmployeeInputChange : handlePatientInputChange}
                />
              </div>

              {/* Patient-specific fields */}
              {!isEmployee && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth *</Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        required
                        value={patientFormData.date_of_birth}
                        onChange={handlePatientInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <select
                        id="gender"
                        name="gender"
                        required
                        value={patientFormData.gender}
                        onChange={handlePatientInputChange}
                        aria-label="Gender selection"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={patientFormData.cpf}
                      onChange={handlePatientInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={patientFormData.address}
                      onChange={handlePatientInputChange}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                        <Input
                          id="emergency_contact_name"
                          name="emergency_contact_name"
                          type="text"
                          required
                          value={patientFormData.emergency_contact_name}
                          onChange={handlePatientInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                        <Input
                          id="emergency_contact_phone"
                          name="emergency_contact_phone"
                          type="tel"
                          required
                          value={patientFormData.emergency_contact_phone}
                          onChange={handlePatientInputChange}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="emergency_contact_relationship">Relationship *</Label>
                      <Input
                        id="emergency_contact_relationship"
                        name="emergency_contact_relationship"
                        type="text"
                        required
                        placeholder="e.g., Spouse, Parent, Sibling"
                        value={patientFormData.emergency_contact_relationship}
                        onChange={handlePatientInputChange}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href={`/portal/login${roleParam && roleParam !== 'patient' ? `?role=${roleParam}` : ''}`} className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
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
