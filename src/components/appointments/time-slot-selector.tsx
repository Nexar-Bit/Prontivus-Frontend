"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TimeSlot {
  time: string;
  available: boolean;
  status: 'available' | 'booked' | 'tentative' | 'break' | 'urgent';
  appointmentId?: number;
  patientName?: string;
}

export interface DoctorSchedule {
  doctorId: number;
  doctorName: string;
  doctorAvatar?: string;
  slots: TimeSlot[];
  breakStart?: string;
  breakEnd?: string;
}

interface TimeSlotSelectorProps {
  date: Date;
  schedule: DoctorSchedule;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  intervalMinutes?: number;
  startHour?: number;
  endHour?: number;
}

export function TimeSlotSelector({
  date,
  schedule,
  selectedTime,
  onTimeSelect,
  intervalMinutes = 15,
  startHour = 8,
  endHour = 18,
}: TimeSlotSelectorProps) {
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const totalMinutes = (endHour - startHour) * 60;
    const numSlots = Math.floor(totalMinutes / intervalMinutes);

    for (let i = 0; i < numSlots; i++) {
      const minutes = startHour * 60 + i * intervalMinutes;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      // Check if this is break time
      const isBreak = schedule.breakStart && schedule.breakEnd &&
        timeString >= schedule.breakStart && timeString < schedule.breakEnd;

      // Find existing slot status
      const existingSlot = schedule.slots.find(s => s.time === timeString);

      slots.push({
        time: timeString,
        available: !isBreak && (!existingSlot || existingSlot.status === 'available'),
        status: isBreak 
          ? 'break' 
          : existingSlot?.status || 'available',
        appointmentId: existingSlot?.appointmentId,
        patientName: existingSlot?.patientName,
      });
    }

    return slots;
  };

  const slots = generateTimeSlots();

  const getSlotColor = (status: TimeSlot['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100';
      case 'booked':
        return 'bg-red-50 border-red-300 text-red-700 cursor-not-allowed opacity-60';
      case 'tentative':
        return 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100';
      case 'break':
        return 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
      case 'urgent':
        return 'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-400';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getSlotIcon = (status: TimeSlot['status']) => {
    switch (status) {
      case 'booked':
      case 'urgent':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'break':
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0F4C75]" />
              Horários Disponíveis
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Tentativo</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isClickable = slot.available && slot.status !== 'break';

            return (
              <button
                key={slot.time}
                onClick={() => isClickable && onTimeSelect(slot.time)}
                disabled={!isClickable}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all text-sm font-medium",
                  "flex flex-col items-center justify-center gap-1 min-h-[60px]",
                  getSlotColor(slot.status),
                  isSelected && "ring-4 ring-[#0F4C75] ring-offset-2 border-[#0F4C75]",
                  isClickable && "cursor-pointer hover:shadow-md hover:scale-105",
                  !isClickable && "cursor-not-allowed"
                )}
                title={
                  slot.status === 'break'
                    ? 'Intervalo'
                    : slot.patientName
                    ? `Reservado para ${slot.patientName}`
                    : 'Disponível'
                }
              >
                {slot.status === 'urgent' && (
                  <span className="absolute -top-1 -right-1 text-xs">⚠️</span>
                )}
                <div className="flex items-center gap-1">
                  {getSlotIcon(slot.status)}
                  <span className="font-semibold">{slot.time}</span>
                </div>
                {slot.patientName && (
                  <span className="text-xs opacity-75 truncate w-full">
                    {slot.patientName}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Doctor Break Indicator */}
        {schedule.breakStart && schedule.breakEnd && (
          <div className="mt-4 p-3 rounded-lg bg-gray-100 border border-gray-300">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4" />
              <span>
                <span className="font-medium">Intervalo:</span> {schedule.breakStart} - {schedule.breakEnd}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

