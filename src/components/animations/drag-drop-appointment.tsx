"use client";

import React, { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface DragDropAppointmentProps {
  children: ReactNode;
  onDrop: (newTime: Date) => void;
  className?: string;
}

export function DragDropAppointment({
  children,
  onDrop,
  className,
}: DragDropAppointmentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setIsDragging(false);
    
    // Extract time from drop target
    const target = e.currentTarget as HTMLElement;
    const timeSlot = target.dataset.timeSlot;
    if (timeSlot) {
      onDrop(new Date(timeSlot));
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "cursor-move transition-all medical-transition",
        isDragging && "dragging",
        dragOver && "drag-over",
        className
      )}
    >
      {children}
    </div>
  );
}

