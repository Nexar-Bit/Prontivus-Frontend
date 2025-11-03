"use client";

import * as React from "react";
import { Patient } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Calendar,
  Droplet,
  AlertTriangle,
  Activity,
  Phone,
  Mail,
  CreditCard,
  Heart,
  Shield,
  Edit,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/patient-form";
import { PatientUpdate } from "@/lib/types";

interface PatientProfileSummaryProps {
  patient: Patient;
  onUpdate?: () => void;
}

export function PatientProfileSummary({ patient, onUpdate }: PatientProfileSummaryProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const getInitials = () => {
    return `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  };

  const getStatusBadge = () => {
    // Determine patient status (mock logic - replace with real data)
    return (
      <Badge className="bg-green-100 text-green-700 border-green-300">
        <Activity className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    );
  };

  const handleUpdate = async (data: PatientUpdate) => {
    setIsSubmitting(true);
    try {
      // Call API update
      // await patientsApi.update(patient.id, data);
      setIsEditOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating patient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="sticky top-6 medical-card border-2 border-gray-200">
      {/* Medical Pattern Background */}
      <div className={cn(
        "absolute inset-0 opacity-[0.02] pointer-events-none",
        "bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)]",
        "bg-[length:20px_20px]"
      )} />

      <CardContent className="relative p-6 space-y-6">
        {/* Patient Photo Section */}
        <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-200">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-4 ring-[#0F4C75]/10">
              <AvatarImage src={(patient as any).photo_url} alt={`${patient.first_name} ${patient.last_name}`} />
              <AvatarFallback className="bg-[#0F4C75] text-white text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {/* Medical frame decoration */}
            <div className="absolute -bottom-2 -right-2 bg-[#0F4C75] rounded-full p-1.5 shadow-md">
              <Heart className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              {getStatusBadge()}
            </div>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
                <DialogDescription>
                  Atualize as informações do paciente
                </DialogDescription>
              </DialogHeader>
              <PatientForm
                patient={patient}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Key Medical Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            <Activity className="h-4 w-4 text-[#0F4C75]" />
            Informações Médicas
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Calendar className="h-5 w-5 text-[#0F4C75] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Idade</p>
                <p className="font-semibold text-gray-900">
                  {calculateAge(patient.date_of_birth)} anos
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(patient.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Droplet className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Tipo Sanguíneo</p>
                <p className="font-semibold text-gray-900">
                  {patient.blood_type || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          {/* Allergies */}
          {patient.allergies && (
            <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-xs font-semibold text-red-700 uppercase">Alergias</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {patient.allergies.split(",").map((allergy, index) => (
                  <Badge
                    key={index}
                    variant="destructive"
                    className="bg-red-100 text-red-700 border-red-300"
                  >
                    {allergy.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Problems */}
          {patient.active_problems && (
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <p className="text-xs font-semibold text-orange-700 uppercase">Problemas Ativos</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {patient.active_problems.split(",").map((problem, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-orange-100 text-orange-700 border-orange-300"
                  >
                    {problem.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            <Phone className="h-4 w-4 text-[#0F4C75]" />
            Contato de Emergência
          </div>
          {(patient as any).emergency_contact_name && (
            <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
              <p className="font-semibold text-gray-900">
                {(patient as any).emergency_contact_name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <Phone className="h-3 w-3 inline mr-1" />
                {(patient as any).emergency_contact_phone || "Não informado"}
              </p>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            <User className="h-4 w-4 text-[#0F4C75]" />
            Contato
          </div>
          <div className="space-y-2">
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Insurance Status */}
        {(patient as any).insurance_provider && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700 uppercase">Convênio</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">{(patient as any).insurance_provider}</p>
              {(patient as any).insurance_number && (
                <p className="text-sm text-gray-600">
                  Nº: {(patient as any).insurance_number}
                </p>
              )}
              <Badge className="bg-green-100 text-green-700 border-green-300 mt-2">
                <CreditCard className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

