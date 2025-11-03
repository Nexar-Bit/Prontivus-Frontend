"use client";

import React from "react";
import { AuthProvider } from "@/contexts";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

