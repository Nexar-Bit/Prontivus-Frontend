"use client";

import * as React from "react";
import {
  Calendar as RBCalendar,
  dateFnsLocalizer,
  View,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "pt-BR": ptBR },
});

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  status: AppointmentStatus;
  type: 'consultation' | 'procedure' | 'follow-up' | 'emergency';
  patientName: string;
  doctorName: string;
  urgent?: boolean;
}

interface MedicalCalendarProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  defaultView?: View;
  onViewChange?: (view: View) => void;
  className?: string;
}

const appointmentTypeColors = {
  consultation: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-white',
  },
  procedure: {
    bg: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-white',
  },
  'follow-up': {
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-white',
  },
  emergency: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
  },
};

const statusStyles = {
  scheduled: 'opacity-100',
  checked_in: 'opacity-90',
  in_progress: 'opacity-80',
  completed: 'opacity-70',
  cancelled: 'opacity-50 line-through',
};

export function MedicalCalendar({
  events,
  onSelectEvent,
  onSelectSlot,
  defaultView = Views.WEEK,
  onViewChange,
  className,
}: MedicalCalendarProps) {
  const [currentView, setCurrentView] = React.useState<View>(defaultView);
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    onViewChange?.(view);
  };

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    if (action === 'PREV') {
      if (currentView === Views.MONTH) {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === Views.WEEK) {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else if (action === 'NEXT') {
      if (currentView === Views.MONTH) {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === Views.WEEK) {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else {
      setCurrentDate(new Date());
      return;
    }
    setCurrentDate(newDate);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const typeColors = appointmentTypeColors[event.type] || appointmentTypeColors.consultation;
    const statusStyle = statusStyles[event.status as keyof typeof statusStyles] || '';
    
    return {
      className: cn(
        'medical-appointment-event',
        typeColors.bg,
        typeColors.border,
        typeColors.text,
        statusStyle,
        event.urgent && 'ring-2 ring-red-400 animate-pulse',
        'rounded-lg px-2 py-1 font-medium text-xs shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all'
      ),
      style: {
        borderLeftColor: event.urgent ? '#FF6B6B' : undefined,
      },
    };
  };

  const customComponents = {
    event: ({ event }: { event: CalendarEvent }) => (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          {event.urgent && (
            <span className="text-xs font-bold">⚠️</span>
          )}
          <span className="truncate font-semibold">{event.patientName}</span>
        </div>
        <span className="text-xs opacity-90 truncate">{event.title}</span>
        <span className="text-xs opacity-75">{format(event.start, 'HH:mm', { locale: ptBR })}</span>
      </div>
    ),
    toolbar: (props: any) => (
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('TODAY')}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate('PREV')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate('NEXT')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="ml-4 text-lg font-semibold text-gray-900">
            {format(currentDate, currentView === Views.MONTH ? "MMMM yyyy" : "dd MMMM yyyy", { locale: ptBR })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === Views.DAY ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange(Views.DAY)}
            className={currentView === Views.DAY ? "bg-[#0F4C75] text-white" : ""}
          >
            Dia
          </Button>
          <Button
            variant={currentView === Views.WEEK ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange(Views.WEEK)}
            className={currentView === Views.WEEK ? "bg-[#0F4C75] text-white" : ""}
          >
            Semana
          </Button>
          <Button
            variant={currentView === Views.MONTH ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange(Views.MONTH)}
            className={currentView === Views.MONTH ? "bg-[#0F4C75] text-white" : ""}
          >
            Mês
          </Button>
        </div>
      </div>
    ),
  };

  return (
    <div className={cn("medical-card bg-white", className)}>
      <RBCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={currentView}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={customComponents}
        style={{ height: 700 }}
        className="medical-calendar"
      />
    </div>
  );
}

