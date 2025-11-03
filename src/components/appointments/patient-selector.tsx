"use client";

import * as React from "react";
import { Patient } from "@/lib/types";
import { patientsApi } from "@/lib/patients-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  User,
  Check,
  Search,
  Clock,
  Shield,
  AlertTriangle,
  Phone,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientSelectorProps {
  value?: Patient;
  onChange: (patient: Patient) => void;
  recentPatients?: Patient[];
  className?: string;
}

export function PatientSelector({
  value,
  onChange,
  recentPatients = [],
  className,
}: PatientSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = React.useMemo(() => {
    if (!searchQuery) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query) ||
        p.cpf?.includes(query) ||
        p.email?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

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

  const getInitials = (patient: Patient) => {
    return `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-12 text-left font-normal rounded-lg border-2 transition-all",
              value
                ? "border-[#0F4C75] bg-[#0F4C75]/5"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {value ? (
                <>
                  <Avatar className="h-8 w-8 border-2 border-[#0F4C75]/20">
                    <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75] font-semibold text-sm">
                      {getInitials(value)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-900 truncate">
                      {value.first_name} {value.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {value.cpf || value.email || `${calculateAge(value.date_of_birth)} anos`}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-gray-400">Selecione um paciente</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar paciente por nome, CPF ou email..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0F4C75]" />
                </div>
              ) : (
                <>
                  {recentPatients.length > 0 && !searchQuery && (
                    <CommandGroup heading="Pacientes Recentes">
                      {recentPatients.slice(0, 3).map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.first_name} ${patient.last_name}`}
                          onSelect={() => {
                            onChange(patient);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75] text-xs">
                                {getInitials(patient)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {patient.cpf || `${calculateAge(patient.date_of_birth)} anos`}
                              </p>
                            </div>
                            <Check
                              className={cn(
                                "h-4 w-4",
                                value?.id === patient.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  <CommandGroup heading={recentPatients.length > 0 && !searchQuery ? "Todos os Pacientes" : "Pacientes"}>
                    {filteredPatients.length === 0 ? (
                      <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                    ) : (
                      filteredPatients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.first_name} ${patient.last_name}`}
                          onSelect={() => {
                            onChange(patient);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75] text-xs">
                                {getInitials(patient)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {patient.cpf || patient.email || `${calculateAge(patient.date_of_birth)} anos`}
                              </p>
                            </div>
                            <Check
                              className={cn(
                                "h-4 w-4",
                                value?.id === patient.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Patient Summary Card */}
      {value && (
        <div className="p-4 rounded-lg border-2 border-[#0F4C75]/20 bg-[#0F4C75]/5 medical-card">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-[#0F4C75]/30">
              <AvatarFallback className="bg-[#0F4C75] text-white font-bold">
                {getInitials(value)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {value.first_name} {value.last_name}
                </h4>
                <p className="text-sm text-gray-600">
                  {calculateAge(value.date_of_birth)} anos • {value.gender === 'male' ? 'Masculino' : value.gender === 'female' ? 'Feminino' : 'Outro'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {value.allergies && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alergias
                  </Badge>
                )}
                {value.blood_type && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {value.blood_type}
                  </Badge>
                )}
                {(value as any).insurance_provider && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Convênio Ativo
                  </Badge>
                )}
              </div>
              {value.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  {value.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

