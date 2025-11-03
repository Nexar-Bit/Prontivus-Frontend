"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  FileText,
  TestTube,
  Pill,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Download,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MedicalRecord {
  id: string;
  type: 'consultation' | 'prescription' | 'test' | 'note';
  title: string;
  date: Date;
  doctor?: string;
  content: string;
  status?: 'normal' | 'abnormal' | 'pending';
  attachments?: number;
}

// Mock data - replace with API call
const mockRecords: MedicalRecord[] = [
  {
    id: '1',
    type: 'consultation',
    title: 'Consulta de Rotina',
    date: new Date(2024, 0, 15),
    doctor: 'Dr. Maria Silva',
    content: 'Paciente em bom estado geral. Pressão arterial: 120/80. Peso: 75kg. Exame físico normal.',
    status: 'normal',
  },
  {
    id: '2',
    type: 'prescription',
    title: 'Prescrição Médica',
    date: new Date(2024, 0, 15),
    doctor: 'Dr. Maria Silva',
    content: 'Dipirona 500mg - 1 comprimido a cada 8h por 5 dias\nParacetamol 750mg - se dor persistir',
  },
  {
    id: '3',
    type: 'test',
    title: 'Hemograma Completo',
    date: new Date(2024, 0, 10),
    doctor: 'Dr. João Santos',
    content: 'Hemácias: 4.8 milhões/mm³ (Normal)\nLeucócitos: 7.200/mm³ (Normal)\nPlaquetas: 250.000/mm³ (Normal)',
    status: 'normal',
    attachments: 1,
  },
  {
    id: '4',
    type: 'test',
    title: 'Glicemia em Jejum',
    date: new Date(2024, 0, 10),
    doctor: 'Dr. João Santos',
    content: 'Glicemia: 110 mg/dL (Valor elevado - acima do normal)',
    status: 'abnormal',
    attachments: 1,
  },
  {
    id: '5',
    type: 'consultation',
    title: 'Consulta de Acompanhamento',
    date: new Date(2023, 11, 20),
    doctor: 'Dr. Pedro Costa',
    content: 'Acompanhamento pós-operatório. Cicatrização adequada. Paciente relatou melhora.',
    status: 'normal',
  },
];

const typeConfig = {
  consultation: {
    icon: Stethoscope,
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  prescription: {
    icon: Pill,
    color: 'green',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    iconBg: 'bg-green-100',
  },
  test: {
    icon: TestTube,
    color: 'orange',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    iconBg: 'bg-orange-100',
  },
  note: {
    icon: FileText,
    color: 'gray',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    iconBg: 'bg-gray-100',
  },
};

export function MedicalRecordsTimeline({ patientId }: { patientId: number }) {
  const [expandedRecords, setExpandedRecords] = React.useState<Set<string>>(new Set());
  const [records] = React.useState<MedicalRecord[]>(mockRecords);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecords(newExpanded);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'abnormal':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'normal':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        );
      case 'abnormal':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Anormal
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Histórico Médico</h3>
          <p className="text-sm text-gray-500">Registros cronológicos do paciente</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {records.map((record, index) => {
            const config = typeConfig[record.type];
            const Icon = config.icon;
            const isExpanded = expandedRecords.has(record.id);

            return (
              <div key={record.id} className="relative">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-6 w-4 h-4 rounded-full border-4 border-white shadow-md z-10",
                  config.color === 'blue' && 'bg-blue-500',
                  config.color === 'green' && 'bg-green-500',
                  config.color === 'orange' && 'bg-orange-500',
                  config.color === 'gray' && 'bg-gray-500',
                )} />

                {/* Record card */}
                <Card
                  className={cn(
                    "ml-16 transition-all hover:shadow-md cursor-pointer medical-card",
                    config.border,
                    isExpanded && "shadow-md"
                  )}
                  onClick={() => toggleExpand(record.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg", config.iconBg)}>
                          <Icon className={cn("h-5 w-5", config.text)} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {record.title}
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(record.date, "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            {record.doctor && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {record.doctor}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {record.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          {record.attachments && (
                            <Button variant="outline" size="sm" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {record.attachments} Anexo(s)
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-xs ml-auto">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

