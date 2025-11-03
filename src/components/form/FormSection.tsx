"use client";
import React from "react";
import { Separator } from "@/components/ui/separator";

export default function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-sm font-semibold text-muted-foreground">{title}</div>
      <Separator className="mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}


