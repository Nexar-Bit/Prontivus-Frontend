"use client";
import React, { useEffect, useState, useRef } from "react";
import { usePatientCalling } from "@/hooks/usePatientCalling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, User, Stethoscope, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { patientCallingApi } from "@/lib/patient-calling-api";
import { toast } from "sonner";

export default function SecretariaPainelPage() {
  const { activeCalls, connected } = usePatientCalling();
  const [playedSounds, setPlayedSounds] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play sound notification for new calls
  useEffect(() => {
    activeCalls.forEach((call) => {
      if (call.status === "called" && !playedSounds.has(call.id)) {
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
        }
        setPlayedSounds((prev) => new Set([...prev, call.id]));
      }
    });
  }, [activeCalls, playedSounds]);

  const handleDismiss = async (appointmentId: number) => {
    try {
      await patientCallingApi.complete(appointmentId);
      toast.success("Chamada removida");
    } catch (error: any) {
      toast.error("Erro ao remover chamada", { description: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <h1 className="text-4xl font-bold text-gray-900">Painel de Chamadas</h1>
        </div>
        <p className="text-lg text-gray-600">Prontivus — Sistema de Chamada de Pacientes</p>
      </div>

      {/* Active Calls Display */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeCalls.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Phone className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">Nenhuma chamada ativa</p>
              <p className="text-sm text-gray-400 mt-2">Aguardando chamadas do médico...</p>
            </CardContent>
          </Card>
        ) : (
          activeCalls
            .filter((call) => call.status !== "completed")
            .map((call) => {
              const calledAt = new Date(call.called_at);
              const minutesAgo = Math.floor((Date.now() - calledAt.getTime()) / 60000);

              return (
                <Card
                  key={call.id}
                  className="border-2 border-blue-400 shadow-lg animate-in fade-in duration-500"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                        <Phone className="h-3 w-3 mr-1" />
                        Chamada Ativa
                      </Badge>
                      <button
                        onClick={() => handleDismiss(call.appointment_id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-full p-3">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {call.patient_name || `Paciente #${call.patient_id}`}
                          </h3>
                          <p className="text-sm text-gray-500">ID: {call.patient_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t">
                        <div className="bg-indigo-100 rounded-full p-2">
                          <Stethoscope className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Médico:</p>
                          <p className="font-semibold text-gray-900">
                            {call.doctor_name || `Dr. #${call.doctor_id}`}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500">
                          Chamado às {format(calledAt, "HH:mm", { locale: ptBR })} • {minutesAgo} min atrás
                        </p>
                        {call.status === "answered" && (
                          <Badge variant="default" className="mt-2 bg-green-600">
                            Paciente Atendido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      {/* Connection Status Footer */}
      <div className="mt-8 text-center">
        <p className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
          {connected ? "✓ Conectado" : "✗ Desconectado - Tentando reconectar..."}
        </p>
      </div>
    </div>
  );
}

