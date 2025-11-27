"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "@/contexts";
import Image from "next/image";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prevent body scrolling when this layout is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AuthProvider>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
        {/* Background Logo */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
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
        
        {/* Content - Fixed height container */}
        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}

