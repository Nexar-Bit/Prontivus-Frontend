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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from "lucide-react";
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
  type: 'consultation' | 'procedure' | 'follow-up' | 'return' | 'retorno' | 'emergency';
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
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    border: 'border-blue-400',
    text: 'text-white',
    shadow: 'shadow-lg shadow-blue-500/30',
    hover: 'hover:from-blue-600 hover:to-blue-700',
  },
  procedure: {
    bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
    border: 'border-purple-400',
    text: 'text-white',
    shadow: 'shadow-lg shadow-purple-500/30',
    hover: 'hover:from-purple-600 hover:to-purple-700',
  },
  'follow-up': {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    border: 'border-orange-400',
    text: 'text-white',
    shadow: 'shadow-lg shadow-orange-500/30',
    hover: 'hover:from-orange-600 hover:to-orange-700',
  },
  return: {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    border: 'border-orange-400',
    text: 'text-white',
    shadow: 'shadow-lg shadow-orange-500/30',
    hover: 'hover:from-orange-600 hover:to-orange-700',
  },
  retorno: {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    border: 'border-orange-400',
    text: 'text-white',
    shadow: 'shadow-lg shadow-orange-500/30',
    hover: 'hover:from-orange-600 hover:to-orange-700',
  },
  emergency: {
    bg: 'bg-gradient-to-r from-red-500 to-red-600',
    border: 'border-red-400',
    text: 'text-white',
    shadow: 'shadow-lg shadow-red-500/40',
    hover: 'hover:from-red-600 hover:to-red-700',
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
        typeColors.shadow,
        typeColors.hover,
        statusStyle,
        event.urgent && 'ring-2 ring-red-400 ring-offset-2 animate-pulse',
        'rounded-xl px-3 py-2 font-semibold text-xs border-l-4 cursor-pointer',
        'transition-all duration-300 ease-in-out',
        'hover:scale-[1.02] hover:shadow-xl',
        'backdrop-blur-sm',
        'transform-gpu'
      ),
      style: {
        borderLeftWidth: '4px',
        borderLeftColor: event.urgent ? '#FF6B6B' : undefined,
        boxShadow: event.urgent ? '0 0 20px rgba(255, 107, 107, 0.5)' : undefined,
      },
    };
  };

  const customComponents = {
    event: ({ event }: { event: CalendarEvent }) => (
      <div className="flex flex-col gap-1.5 p-1">
        <div className="flex items-center gap-1.5">
          {event.urgent && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 animate-pulse">
              <span className="text-[8px]">⚠</span>
            </span>
          )}
          <span className="truncate font-bold text-sm leading-tight">{event.patientName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs opacity-95">
          <Clock className="h-3 w-3" />
          <span>{format(event.start, 'HH:mm', { locale: ptBR })}</span>
        </div>
        <span className="text-xs opacity-85 truncate font-medium">{event.title}</span>
      </div>
    ),
    toolbar: (props: any) => (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-5 bg-gradient-to-r from-white via-gray-50 to-white rounded-2xl border border-gray-200/50 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('TODAY')}
            className="gap-2 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 border-gray-300"
          >
            <CalendarIcon className="h-4 w-4 text-green-600" />
            <span className="font-medium">Hoje</span>
          </Button>
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate('PREV')}
              className="h-8 w-8 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate('NEXT')}
              className="h-8 w-8 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="ml-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
            <div className="text-lg font-bold text-gray-900 capitalize">
              {format(currentDate, currentView === Views.MONTH ? "MMMM yyyy" : "dd MMMM yyyy", { locale: ptBR })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
          <Button
            variant={currentView === Views.DAY ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewChange(Views.DAY)}
            className={cn(
              "transition-all duration-200 font-medium",
              currentView === Views.DAY 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-500/30" 
                : "hover:bg-gray-100"
            )}
          >
            Dia
          </Button>
          <Button
            variant={currentView === Views.WEEK ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewChange(Views.WEEK)}
            className={cn(
              "transition-all duration-200 font-medium",
              currentView === Views.WEEK 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-500/30" 
                : "hover:bg-gray-100"
            )}
          >
            Semana
          </Button>
          <Button
            variant={currentView === Views.MONTH ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewChange(Views.MONTH)}
            className={cn(
              "transition-all duration-200 font-medium",
              currentView === Views.MONTH 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-500/30" 
                : "hover:bg-gray-100"
            )}
          >
            Mês
          </Button>
        </div>
      </div>
    ),
  };

  return (
    <div className={cn("medical-card bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200/50", className)}>
      <style jsx global>{`
        .medical-calendar {
          font-family: inherit;
        }
        
        .medical-calendar .rbc-header {
          padding: 12px 8px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
          border-bottom: 2px solid #e5e7eb;
          text-transform: capitalize;
        }
        
        .medical-calendar .rbc-time-header {
          border-bottom: 2px solid #e5e7eb;
        }
        
        .medical-calendar .rbc-time-content {
          border-top: 1px solid #e5e7eb;
        }
        
        .medical-calendar .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        .medical-calendar .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f9fafb;
        }
        
        .medical-calendar .rbc-today {
          background-color: #f0fdf4;
        }
        
        .medical-calendar .rbc-off-range-bg {
          background: #fafafa;
        }
        
        .medical-calendar .rbc-current-time-indicator {
          background-color: #10b981;
          height: 2px;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }
        
        .medical-calendar .rbc-current-time-indicator::before {
          background-color: #10b981;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        
        .medical-calendar .rbc-event {
          border: none;
          border-radius: 0.75rem;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .medical-calendar .rbc-event:focus {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }
        
        .medical-calendar .rbc-selected {
          background-color: rgba(16, 185, 129, 0.1);
        }
        
        .medical-calendar .rbc-show-more {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 0.5rem;
          padding: 4px 8px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .medical-calendar .rbc-show-more:hover {
          background-color: rgba(59, 130, 246, 0.2);
        }
        
        .medical-calendar .rbc-toolbar {
          display: none;
        }
        
        .medical-calendar .rbc-month-view {
          border-radius: 0.75rem;
        }
        
        .medical-calendar .rbc-month-row {
          border-color: #e5e7eb;
        }
        
        .medical-calendar .rbc-date-cell {
          padding: 8px;
        }
        
        .medical-calendar .rbc-date-cell > a {
          color: #374151;
          font-weight: 500;
        }
        
        .medical-calendar .rbc-date-cell.rbc-now > a {
          color: #10b981;
          font-weight: 700;
        }
        
        .medical-calendar .rbc-day-bg.rbc-today {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        
        .medical-calendar .rbc-day-bg.rbc-off-range-bg {
          background: #fafafa;
        }
        
        .medical-calendar .rbc-agenda-view table {
          border-radius: 0.75rem;
          overflow: hidden;
        }
        
        .medical-calendar .rbc-agenda-view table tbody > tr > td {
          border-color: #e5e7eb;
          padding: 12px;
        }
        
        .medical-calendar .rbc-agenda-view table tbody > tr:hover {
          background-color: #f9fafb;
        }
        
        @media (max-width: 768px) {
          .medical-calendar .rbc-header {
            padding: 8px 4px;
            font-size: 0.75rem;
          }
        }
      `}</style>
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
        popup
        step={15}
        timeslots={4}
      />
    </div>
  );
}

