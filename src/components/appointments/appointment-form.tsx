"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Appointment, AppointmentCreate, AppointmentUpdate, Doctor, Patient } from "@/lib/types";
import { patientsApi } from "@/lib/patients-api";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const appointmentFormSchema = z.object({
  patient_id: z.number({ message: "Paciente é obrigatório" }),
  doctor_id: z.number({ message: "Médico é obrigatório" }),
  scheduled_datetime: z.string().min(1, "Data e hora são obrigatórias"),
  appointment_type: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  appointment?: Appointment;
  doctors: Doctor[];
  onSubmit: (data: AppointmentCreate | AppointmentUpdate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultDate?: Date;
}

export function AppointmentForm({
  appointment,
  doctors,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultDate,
}: AppointmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: appointment
      ? {
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          scheduled_datetime: new Date(appointment.scheduled_datetime)
            .toISOString()
            .slice(0, 16),
          appointment_type: appointment.appointment_type || "",
          notes: appointment.notes || "",
        }
      : {
          scheduled_datetime: defaultDate
            ? new Date(defaultDate).toISOString().slice(0, 16)
            : "",
          appointment_type: "",
          notes: "",
        },
  });

  // Load patients
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSubmit = async (data: AppointmentFormValues) => {
    try {
      await onSubmit(data);
      toast.success("Agendamento salvo com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar agendamento");
      throw e;
    }
  };

  const selectedPatient = patients.find((p) => p.id === form.watch("patient_id"));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Paciente *</FormLabel>
              <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? patients.find((patient) => patient.id === field.value)
                            ? `${patients.find((patient) => patient.id === field.value)?.first_name} ${patients.find((patient) => patient.id === field.value)?.last_name}`
                            : "Selecione um paciente"
                        : "Selecione um paciente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar paciente..." />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingPatients
                          ? "Carregando..."
                          : "Nenhum paciente encontrado."}
                      </CommandEmpty>
                      <CommandGroup>
                        {patients.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            value={`${patient.first_name} ${patient.last_name}`}
                            onSelect={() => {
                              form.setValue("patient_id", patient.id);
                              setPatientSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                patient.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {patient.first_name} {patient.last_name}
                            {patient.cpf && ` - ${patient.cpf}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="doctor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Médico *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um médico" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      Dr(a). {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_datetime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e Hora *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Consulta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Consulta Geral">Consulta Geral</SelectItem>
                  <SelectItem value="Retorno">Retorno</SelectItem>
                  <SelectItem value="Exame">Exame</SelectItem>
                  <SelectItem value="Emergência">Emergência</SelectItem>
                  <SelectItem value="Procedimento">Procedimento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações adicionais..." {...field} />
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
            {isSubmitting
              ? "Salvando..."
              : appointment
              ? "Atualizar"
              : "Agendar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

