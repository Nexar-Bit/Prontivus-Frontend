"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Search, User, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MedicoProntuariosPage() {
  const [patientId, setPatientId] = useState<number | ''>('' as any);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!patientId || patientId <= 0) {
      setError("Por favor, insira um ID de paciente válido");
      return;
    }
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-7 w-7 text-blue-600" />
          </div>
          Prontuários
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Acesse o prontuário do paciente pelo ID
        </p>
      </div>

      {/* Search Card */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-600">Abrir Prontuário</CardTitle>
              <CardDescription className="mt-1">
                Digite o ID do paciente para acessar seu prontuário médico completo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              ID do Paciente
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="patientId"
                type="number"
                placeholder="Ex: 123"
                value={patientId as any}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : '' as any;
                  setPatientId(value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && patientId) {
                    handleSearch();
                  }
                }}
                className={cn(
                  "w-full max-w-xs text-lg",
                  error && "border-red-300 focus-visible:ring-red-500"
                )}
                min="1"
              />
              <Link 
                href={patientId ? `/medico/prontuario/${patientId}` : '#'}
                onClick={handleSearch}
              >
                <Button 
                  disabled={!patientId || patientId <= 0}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Abrir Prontuário
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg mt-1">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-blue-900 mb-1">Informação</h3>
              <p className="text-sm text-blue-700">
                O prontuário médico contém todas as informações clínicas do paciente, incluindo histórico médico, 
                consultas anteriores, exames, prescrições e anotações clínicas. Certifique-se de ter o ID correto do paciente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
