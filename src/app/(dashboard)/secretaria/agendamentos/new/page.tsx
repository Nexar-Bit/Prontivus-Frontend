"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { appointmentsApi } from "@/lib/appointments-api";
import { AppointmentWizard } from "@/components/appointments/appointment-wizard";
import { patientsApi } from "@/lib/patients-api";
import { Doctor, Patient, AppointmentCreate } from "@/lib/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [recentPatients, setRecentPatients] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Load doctors
      const doctorsData = await appointmentsApi.getDoctors();
      setDoctors(doctorsData);

      // Load recent patients
      const patientsData = await patientsApi.getAll();
      // Get most recently created/updated patients
      const recent = patientsData
        .sort((a, b) => {
          const dateA = new Date((a as any).updated_at || (a as any).created_at || 0);
          const dateB = new Date((b as any).updated_at || (b as any).created_at || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
      setRecentPatients(recent);
    } catch (error: any) {
      toast.error("Erro ao carregar dados", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: AppointmentCreate) => {
    try {
      setIsSubmitting(true);
      await appointmentsApi.create(data);
      toast.success("Agendamento criado com sucesso!");
      router.push("/secretaria/agendamentos");
    } catch (error: any) {
      toast.error("Erro ao criar agendamento", {
        description: error.message,
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/secretaria/agendamentos");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C75]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Novo Agendamento</h1>
        <p className="text-muted-foreground mt-1">
          Preencha as informações para agendar uma consulta
        </p>
      </div>

      <AppointmentWizard
        doctors={doctors}
        recentPatients={recentPatients}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        clinicId={user?.clinic_id || 0}
      />
    </div>
  );
}

