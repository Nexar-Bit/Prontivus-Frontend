"use client";

import React, { useEffect } from "react";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { AppHeader } from "@/components/app-header";
import { useRequireAuth } from "@/contexts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user is SuperAdmin
      // SuperAdmin role should be "admin" with role_name "SuperAdmin" or role_id pointing to SuperAdmin
      const isSuperAdmin = 
        user.role === 'admin' && 
        (user.role_id === 1 || // SuperAdmin role_id from seed data
         user.role_name === 'SuperAdmin');
      
      if (!isSuperAdmin) {
        toast.error("Acesso negado. Apenas Super Administradores podem acessar esta área.");
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Check if user is SuperAdmin
  const isSuperAdmin = 
    user.role === 'admin' && 
    (user.role_id === 1 || user.role_name === 'SuperAdmin');

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg border border-blue-200">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar a área de Super Administrador.
            Apenas Super Administradores podem acessar esta seção.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-blue-50 to-blue-50">
      <SuperAdminSidebar />
      <main className="flex-1 flex flex-col lg:ml-[240px] transition-all duration-300">
        <AppHeader />
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

