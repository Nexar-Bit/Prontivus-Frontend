"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ValidatedInput from "@/components/form/ValidatedInput";
import { maskCPF, validateCPF, maskPhone, validatePhone, maskDate, maskCEP, lookupAddressByCEP } from "@/lib/inputMasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gender, Patient, PatientCreate, PatientUpdate } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
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

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientCreate | PatientUpdate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PatientForm({
  patient,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PatientFormProps) {
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
      toast.success("Paciente cadastrado com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar paciente");
      throw e;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="João" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome *</FormLabel>
                <FormControl>
                  <Input placeholder="Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento *</FormLabel>
                <ValidatedInput
                  label=""
                  required
                  placeholder="dd/mm/aaaa"
                  value={field.value}
                  onValueChange={field.onChange}
                  mask={maskDate}
                  validate={(v) => !!v && v.length === 10}
                  tooltip="Formato: dd/mm/aaaa"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                    <SelectItem value={Gender.FEMALE}>Feminino</SelectItem>
                    <SelectItem value={Gender.OTHER}>Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <ValidatedInput
                  label=""
                  placeholder="000.000.000-00"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  mask={maskCPF}
                  validate={(v) => !v || validateCPF(v)}
                  tooltip="Informe um CPF válido"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <ValidatedInput
                  label=""
                  placeholder="(00) 00000-0000"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  mask={maskPhone}
                  validate={(v) => !v || validatePhone(v)}
                  tooltip="Celular: (00) 00000-0000 | Fixo: (00) 0000-0000"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="joao@exemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="blood_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Sanguíneo</FormLabel>
                <FormControl>
                  <Input placeholder="A+" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, número, bairro, cidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <ValidatedInput
                  label=""
                  placeholder="00000-000"
                  value={field.value || ''}
                  onValueChange={async (v) => {
                    field.onChange(v);
                    const addr = await lookupAddressByCEP(v);
                    if (addr) {
                      const composed = `${addr.street || ''}${addr.neighborhood ? ', ' + addr.neighborhood : ''}${addr.city ? ' - ' + addr.city : ''}${addr.state ? '/' + addr.state : ''}`;
                      form.setValue('address', composed.trim());
                    }
                  }}
                  mask={maskCEP}
                  validate={(v) => !v || v.length === 9}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Contato</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mãe, Filho" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alergias</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Liste alergias conhecidas..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active_problems"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problemas Ativos</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Liste problemas de saúde ativos..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : patient ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

