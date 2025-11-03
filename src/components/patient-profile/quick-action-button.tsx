"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Calendar,
  FileText,
  TestTube,
  Pill,
  Phone,
  Mail,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  patientId: number;
}

export function QuickActionButton({ patientId }: QuickActionButtonProps) {
  const router = useRouter();

  const actions = [
    {
      label: "Nova Consulta",
      icon: Calendar,
      onClick: () => router.push(`/secretaria/agendamentos/new?patientId=${patientId}`),
    },
    {
      label: "Adicionar Nota",
      icon: FileText,
      onClick: () => {
        // TODO: Open add note dialog
      },
    },
    {
      label: "Solicitar Exame",
      icon: TestTube,
      onClick: () => {
        // TODO: Open exam request dialog
      },
    },
    {
      label: "Nova Prescrição",
      icon: Pill,
      onClick: () => {
        // TODO: Open prescription dialog
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg bg-[#0F4C75] hover:bg-[#0F4C75]/90",
              "text-white border-0 focus-visible:ring-4 focus-visible:ring-[#0F4C75]/30"
            )}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-white shadow-xl border border-gray-200"
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
            Ações Rápidas
          </div>
          <DropdownMenuSeparator />
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className="cursor-pointer focus:bg-[#0F4C75]/5"
              >
                <Icon className="mr-2 h-4 w-4 text-[#0F4C75]" />
                <span>{action.label}</span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // TODO: Open contact dialog
            }}
            className="cursor-pointer focus:bg-[#0F4C75]/5"
          >
            <Phone className="mr-2 h-4 w-4 text-[#0F4C75]" />
            <span>Contatar Paciente</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // TODO: Export patient data
            }}
            className="cursor-pointer focus:bg-[#0F4C75]/5"
          >
            <Download className="mr-2 h-4 w-4 text-[#0F4C75]" />
            <span>Exportar Dados</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

