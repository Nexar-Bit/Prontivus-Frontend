"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PrescriptionTemplate } from "@/components/documents/prescription-template";
import { prescriptionsApi } from "@/lib/clinical-api";
import { patientsApi } from "@/lib/patients-api";
import { appointmentsApi } from "@/lib/appointments-api";
import { Prescription, Patient, Doctor, Gender } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ViewPrescriptionPage() {
  const params = useParams();
  const prescriptionId = params.id as string;
  const [prescription, setPrescription] = React.useState<Prescription | null>(null);
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [doctor, setDoctor] = React.useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (prescriptionId) {
      loadPrescriptionData();
    }
  }, [prescriptionId]);

  const loadPrescriptionData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call when available
      // For now, using mock data structure
      // const presc = await prescriptionsApi.getById(parseInt(prescriptionId));
      
      // Mock prescription for demo - replace with actual API call
      const mockPrescription: Prescription = {
        id: parseInt(prescriptionId),
        medication_name: "Paracetamol",
        dosage: "500mg",
        frequency: "8/8 horas",
        duration: "5 dias",
        instructions: "Tomar após as refeições",
        clinical_record_id: 1,
        issued_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      };
      
      setPrescription(mockPrescription);

      // Load patient - mock for now
      // const patientData = await patientsApi.getById(mockPrescription.patient_id);
      const mockPatient: Patient = {
        id: 1,
        first_name: "João",
        last_name: "Silva",
        date_of_birth: "1980-01-01",
        gender: Gender.MALE,
        cpf: "123.456.789-00",
        clinic_id: 1,
        created_at: new Date().toISOString(),
      };
      setPatient(mockPatient);

      // Load doctor - get from appointment via clinical record
      const doctors = await appointmentsApi.getDoctors();
      const doctorData = doctors[0]; // Default to first doctor for demo
      if (doctorData) {
        setDoctor(doctorData);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar prescrição", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !prescription || !patient || !doctor) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C75]" />
      </div>
    );
  }

  // Convert single prescription to array format
  const prescriptionsArray = [prescription];

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <PrescriptionTemplate
        prescriptions={prescriptionsArray}
        patient={patient}
        doctor={doctor}
      />
    </div>
  );
}

