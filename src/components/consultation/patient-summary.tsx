"use client";

import { Patient } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, AlertTriangle, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientSummaryProps {
  patient: Patient;
}

export function PatientSummary({ patient }: PatientSummaryProps) {
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Resumo do Paciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Name and Age */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Nome</span>
            </div>
            <p className="font-semibold text-lg">
              {patient.first_name} {patient.last_name}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{calculateAge(patient.date_of_birth)} anos</span>
            </div>
          </div>

          {/* Blood Type */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Tipo Sanguíneo</div>
            <p className="font-semibold text-lg">
              {patient.blood_type || "Não informado"}
            </p>
          </div>

          {/* Allergies */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>Alergias</span>
            </div>
            {patient.allergies ? (
              <div className="space-y-1">
                {patient.allergies.split(",").map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="mr-1">
                    {allergy.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma alergia registrada</p>
            )}
          </div>

          {/* Active Problems */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Problemas Ativos</span>
            </div>
            {patient.active_problems ? (
              <div className="space-y-1">
                {patient.active_problems.split(",").map((problem, index) => (
                  <Badge key={index} variant="secondary" className="mr-1">
                    {problem.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum problema ativo
              </p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="font-medium">{patient.phone || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{patient.email || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CPF</p>
            <p className="font-medium">{patient.cpf || "-"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

