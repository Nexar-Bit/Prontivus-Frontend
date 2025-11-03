/**
 * Icon Showcase Component
 * Demo component showing all medical icons for reference
 */

"use client";

import {
  PatientProfileIcon,
  StethoscopeIcon,
  MedicalCalendarIcon,
  PrescriptionPadIcon,
  LaboratoryFlaskIcon,
  PharmacyBottleIcon,
  MedicalFinanceIcon,
  SecureLockIcon,
  MedicalFileIcon,
  MedicalHeartIcon,
  MedicalChartIcon,
  MedicalRecordIcon,
} from "./medical-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const icons = [
  { name: "Patient Profile", component: PatientProfileIcon, description: "Patient profiles and user accounts" },
  { name: "Stethoscope", component: StethoscopeIcon, description: "Consultations and examinations" },
  { name: "Medical Calendar", component: MedicalCalendarIcon, description: "Appointments and scheduling" },
  { name: "Prescription Pad", component: PrescriptionPadIcon, description: "Prescriptions and medications" },
  { name: "Laboratory Flask", component: LaboratoryFlaskIcon, description: "Laboratory tests and exams" },
  { name: "Pharmacy Bottle", component: PharmacyBottleIcon, description: "Pharmacy and medications" },
  { name: "Medical Finance", component: MedicalFinanceIcon, description: "Finance, insurance, and billing" },
  { name: "Secure Lock", component: SecureLockIcon, description: "Security, privacy, and HIPAA compliance" },
  { name: "Medical File", component: MedicalFileIcon, description: "Medical records and files" },
  { name: "Medical Heart", component: MedicalHeartIcon, description: "Vital signs and health metrics" },
  { name: "Medical Chart", component: MedicalChartIcon, description: "Charts, analytics, and reports" },
  { name: "Medical Record", component: MedicalRecordIcon, description: "Clinical records and notes" },
];

export function IconShowcase() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Prontivus Medical Icon System</h1>
        <p className="text-muted-foreground">
          Professional medical icons with consistent 24x24px size and 2px stroke width
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {icons.map(({ name, component: Icon, description }) => (
          <Card key={name}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default size */}
                <div className="flex items-center gap-4">
                  <Icon className="h-6 w-6 text-foreground" />
                  <span className="text-sm text-muted-foreground">Default (24px)</span>
                </div>
                
                {/* Small size */}
                <div className="flex items-center gap-4">
                  <Icon className="h-4 w-4 text-foreground" />
                  <span className="text-sm text-muted-foreground">Small (16px)</span>
                </div>
                
                {/* Large size */}
                <div className="flex items-center gap-4">
                  <Icon className="h-8 w-8 text-foreground" />
                  <span className="text-sm text-muted-foreground">Large (32px)</span>
                </div>
                
                {/* With color variants */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Icon className="h-5 w-5 text-primary" />
                  <Icon className="h-5 w-5 text-secondary" />
                  <Icon className="h-5 w-5 text-success" />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

