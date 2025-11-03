"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FormCard } from "./form-card";
import { FormSection } from "./form-section";
import { MedicalInput } from "./medical-input";
import { ICD10Search } from "./icd10-search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Gender, Patient, PatientCreate, PatientUpdate } from "@/lib/types";
import { maskCPF, validateCPF, maskPhone, validatePhone, maskDate } from "@/lib/inputMasks";
import {
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Activity,
  Heart,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const patientFormSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório").max(100),
  last_name: z.string().min(1, "Sobrenome é obrigatório").max(100),
  date_of_birth: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.nativeEnum(Gender, {
    message: "Selecione um gênero",
  }),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  allergies: z.string().optional(),
  active_problems: z.string().optional(),
  blood_type: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface EnhancedPatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientCreate | PatientUpdate) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EnhancedPatientForm({
  patient,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EnhancedPatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: patient
      ? {
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          cpf: patient.cpf || "",
          phone: patient.phone || "",
          email: patient.email || "",
          address: patient.address || "",
          emergency_contact_name: patient.emergency_contact_name || "",
          emergency_contact_phone: patient.emergency_contact_phone || "",
          emergency_contact_relationship: patient.emergency_contact_relationship || "",
          allergies: patient.allergies || "",
          active_problems: patient.active_problems || "",
          blood_type: patient.blood_type || "",
        }
      : {
          first_name: "",
          last_name: "",
          date_of_birth: "",
          gender: Gender.MALE,
          cpf: "",
          phone: "",
          email: "",
          address: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          emergency_contact_relationship: "",
          allergies: "",
          active_problems: "",
          blood_type: "",
        },
  });

  const handleSubmit = async (data: PatientFormValues) => {
    try {
      await onSubmit(data);
      if (!patient) {
        toast.success("Paciente cadastrado com sucesso");
      } else {
        toast.success("Paciente atualizado com sucesso");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar paciente");
      throw e;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Personal Information */}
        <FormCard
          title="Informações Pessoais"
          icon={User}
          variant="medical"
        >
          <FormSection title="Dados Básicos" icon={User}>
            <FormField
              control={form.control}
              name="first_name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <MedicalInput
                    label="Nome"
                    required
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    placeholder="João"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <MedicalInput
                    label="Sobrenome"
                    required
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    placeholder="Silva"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field, fieldState }) => (
                <FormItem>
                  <MedicalInput
                    label="Data de Nascimento"
                    required
                    type="date"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    hint="Formato: dd/mm/aaaa"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field, fieldState }) => (
                <FormItem>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Gênero <span className="text-red-500">*</span>
                    </label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-lg border-2">
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Feminino</SelectItem>
                        <SelectItem value={Gender.OTHER}>Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-sm text-red-600">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        </FormCard>

        {/* Contact Information */}
        <FormCard
          title="Informações de Contato"
          icon={Phone}
        >
          <FormSection title="Contatos" icon={Phone}>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <MedicalInput
                    label="Telefone"
                    type="tel"
                    value={field.value || ""}
                    onChange={(e) => {
                      const masked = maskPhone(e.target.value);
                      field.onChange(masked);
                    }}
                    placeholder="(00) 00000-0000"
                    hint="Inclua DDD"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <MedicalInput
                    label="Email"
                    type="email"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    placeholder="joao.silva@email.com"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <MedicalInput
                    label="Endereço"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <MedicalInput
                    label="CPF"
                    value={field.value || ""}
                    onChange={(e) => {
                      const masked = maskCPF(e.target.value);
                      field.onChange(masked);
                    }}
                    placeholder="000.000.000-00"
                    hint="Apenas números"
                  />
                </FormItem>
              )}
            />
          </FormSection>
        </FormCard>

        {/* Medical Information */}
        <FormCard
          title="Informações Médicas"
          icon={Activity}
          variant="highlighted"
        >
          <FormSection title="Dados Clínicos" icon={Heart} required>
            <FormField
              control={form.control}
              name="blood_type"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo Sanguíneo</label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-lg border-2">
                          <SelectValue placeholder="Selecione o tipo sanguíneo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Alergias
                    </label>
                    <Textarea
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Liste as alergias separadas por vírgula (ex: Penicilina, Ibuprofeno)"
                      className="min-h-[80px] rounded-lg border-2 border-red-200 bg-red-50/30 focus-visible:ring-2 focus-visible:ring-red-400/20"
                    />
                    <p className="text-xs text-gray-500">
                      Separe múltiplas alergias por vírgula
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active_problems"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      Problemas Ativos
                    </label>
                    <Textarea
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Liste os problemas de saúde ativos separados por vírgula"
                      className="min-h-[80px] rounded-lg border-2 border-orange-200 bg-orange-50/30"
                    />
                    <p className="text-xs text-gray-500">
                      Ex: Hipertensão, Diabetes tipo 2
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </FormSection>
        </FormCard>

        {/* Emergency Contact */}
        <FormCard
          title="Contato de Emergência"
          icon={Phone}
        >
          <FormSection title="Dados do Contato" icon={Phone}>
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <MedicalInput
                    label="Nome do Contato"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Nome completo"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <MedicalInput
                    label="Telefone do Contato"
                    type="tel"
                    value={field.value || ""}
                    onChange={(e) => {
                      const masked = maskPhone(e.target.value);
                      field.onChange(masked);
                    }}
                    placeholder="(00) 00000-0000"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact_relationship"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Relacionamento</label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-lg border-2">
                          <SelectValue placeholder="Selecione o relacionamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parent">Parente</SelectItem>
                        <SelectItem value="spouse">Cônjuge</SelectItem>
                        <SelectItem value="child">Filho(a)</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />
          </FormSection>
        </FormCard>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-11 px-6"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-6 bg-[#0F4C75] hover:bg-[#0F4C75]/90"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Salvando...
              </>
            ) : patient ? (
              "Atualizar Paciente"
            ) : (
              "Cadastrar Paciente"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

