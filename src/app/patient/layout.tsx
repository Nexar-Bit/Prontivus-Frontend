"use client";

import React from "react";
import { AuthProvider } from "@/contexts";
import Image from "next/image";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        {/* Background Logo */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
            <Image
              src="/Logo/Logotipo em Fundo Transparente.png"
              alt="Prontivus Logo"
              width={800}
              height={800}
              className="object-contain max-w-[90vw] max-h-[90vh]"
              priority={false}
              quality={50}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}

