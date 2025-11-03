"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { patientsApi } from "@/lib/patients-api";
import { Patient } from "@/lib/types";
import { PatientProfileSummary } from "@/components/patient-profile/patient-summary-card";
import { MedicalRecordsTimeline } from "@/components/patient-profile/medical-records-timeline";
import { PatientProfileTabs } from "@/components/patient-profile/patient-profile-tabs";
import { QuickActionButton } from "@/components/patient-profile/quick-action-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("records");

  const patientId = params.id as string;

  React.useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    try {
      setIsLoading(true);
      const data = await patientsApi.getById(parseInt(patientId));
      setPatient(data);
    } catch (error: any) {
      toast.error("Erro ao carregar paciente", {
        description: error.message,
      });
      router.push("/secretaria/pacientes");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C75]" />
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/secretaria/pacientes")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Summary Card */}
        <div className="lg:col-span-1">
          <PatientProfileSummary patient={patient} onUpdate={loadPatient} />
        </div>

        {/* Right: Medical Records and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <PatientProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            patientId={patient.id}
            patient={patient}
          />
        </div>
      </div>

      {/* Quick Action Floating Button */}
      <QuickActionButton patientId={patient.id} />
    </div>
  );
}

