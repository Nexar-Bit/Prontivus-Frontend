"use client";

import * as React from "react";
import { Doctor } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSlotSelector, DoctorSchedule } from "./time-slot-selector";
import { Stethoscope, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoctorScheduleViewProps {
  doctor: Doctor;
  date: Date;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
  appointments?: Array<{
    id: number;
    time: string;
    patientName: string;
    status: string;
    urgent?: boolean;
  }>;
}

export function DoctorScheduleView({
  doctor,
  date,
  onTimeSelect,
  selectedTime,
  appointments = [],
}: DoctorScheduleViewProps) {
  const getInitials = () => {
    return `${doctor.first_name[0]}${doctor.last_name[0]}`.toUpperCase();
  };

  // Convert appointments to schedule format
  const schedule: DoctorSchedule = React.useMemo(() => {
    const slots = appointments.map((apt) => ({
      time: apt.time,
      available: false,
      status: apt.urgent ? 'urgent' : (apt.status === 'scheduled' ? 'booked' : 'tentative') as any,
      appointmentId: apt.id,
      patientName: apt.patientName,
    }));

    return {
      doctorId: doctor.id,
      doctorName: `Dr(a). ${doctor.first_name} ${doctor.last_name}`,
      doctorAvatar: (doctor as any).avatar,
      slots,
      breakStart: "12:00",
      breakEnd: "13:00",
    };
  }, [doctor, appointments]);

  const availabilityStats = React.useMemo(() => {
    const totalSlots = 40; // 8 hours * 5 slots per hour
    const booked = appointments.length;
    const available = totalSlots - booked;
    const utilization = Math.round((booked / totalSlots) * 100);

    return { total: totalSlots, booked, available, utilization };
  }, [appointments]);

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-[#0F4C75]/20">
              <AvatarImage src={(doctor as any).avatar} alt={doctor.first_name} />
              <AvatarFallback className="bg-[#0F4C75] text-white text-lg font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                Dr(a). {doctor.first_name} {doctor.last_name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {(doctor as any).specialty || "Clínico Geral"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Disponível
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Utilização</p>
            <p className="text-2xl font-bold text-[#0F4C75]">
              {availabilityStats.utilization}%
            </p>
            <p className="text-xs text-gray-500">
              {availabilityStats.booked} / {availabilityStats.total} horários
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TimeSlotSelector
          date={date}
          schedule={schedule}
          selectedTime={selectedTime}
          onTimeSelect={onTimeSelect}
        />
      </CardContent>
    </Card>
  );
}

