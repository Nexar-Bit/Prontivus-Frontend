"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthData } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refresh_token");
      const userJson = searchParams.get("user");

      if (!token || !userJson) {
        toast.error("Falha na autenticação com Google");
        router.push("/login");
        return;
      }

      try {
        // Parse user data
        const user = JSON.parse(userJson);

        // Store auth data
        setAuthData({
          access_token: token,
          refresh_token: refreshToken || undefined,
          token_type: "bearer",
          expires_in: 1800,
          user: user,
        });

        toast.success("Login com Google realizado com sucesso!");

        // Redirect based on user role
        if (user.role === "patient") {
          router.push("/patient/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error processing Google callback:", error);
        toast.error("Erro ao processar autenticação");
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFBFC] via-[#F0F4F8] to-[#E8F0F5]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B9AAA] mx-auto mb-4" />
        <p className="text-[#0F4C75] font-medium">Processando autenticação...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFBFC] via-[#F0F4F8] to-[#E8F0F5]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B9AAA] mx-auto mb-4" />
          <p className="text-[#0F4C75] font-medium">Carregando...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}

