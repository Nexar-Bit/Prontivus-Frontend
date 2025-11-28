"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePatientCalling } from "@/hooks/usePatientCalling";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, Maximize2, Minimize2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Image from "next/image";

interface ClinicInfo {
  name?: string;
  commercial_name?: string;
}

export default function SecretariaPainelPage() {
  const { activeCalls, connected } = usePatientCalling();
  const { user } = useAuth();
  const [playedSounds, setPlayedSounds] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clinicName, setClinicName] = useState<string>("Clínica");
  const [lastCalls, setLastCalls] = useState<Array<{ patient_name: string; doctor_name: string; location: string; called_at: string }>>([]);
  const [appointmentDetails, setAppointmentDetails] = useState<Record<number, { room?: string; location?: string }>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate room code based on doctor_id (fallback)
  const getRoomCodeFallback = (doctorId: number): string => {
    // Generate room code based on doctor_id (simple mapping)
    // PC1, PC2, PC3 for doctors 1, 2, 3, etc.
    const roomNumber = ((doctorId - 1) % 5) + 1;
    return `PC${roomNumber}`;
  };

  // Get room code for a call (with appointment details if available)
  const getRoomCode = (doctorId: number, appointmentId?: number): string => {
    // Try to get from cached appointment details
    if (appointmentId && appointmentDetails[appointmentId]?.room) {
      return appointmentDetails[appointmentId].room!;
    }
    // Fallback to generated code
    return getRoomCodeFallback(doctorId);
  };

  // Fetch appointment details for room information
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      const callsToFetch = activeCalls.filter(call => 
        call.status === "called" && 
        !appointmentDetails[call.appointment_id]
      );

      for (const call of callsToFetch) {
        try {
          const appointment = await api.get<any>(`/api/v1/appointments/${call.appointment_id}`);
          // Extract room/location from appointment_type or notes
          // If appointment_type exists, use first 3 chars, otherwise generate from doctor_id
          const room = appointment?.appointment_type 
            ? appointment.appointment_type.toUpperCase().substring(0, 3)
            : getRoomCodeFallback(call.doctor_id);
          
          setAppointmentDetails(prev => ({
            ...prev,
            [call.appointment_id]: { room, location: room }
          }));
        } catch (error) {
          // If fetch fails, use generated room code
          const room = getRoomCodeFallback(call.doctor_id);
          setAppointmentDetails(prev => ({
            ...prev,
            [call.appointment_id]: { room, location: room }
          }));
        }
      }
    };

    if (activeCalls.length > 0) {
      fetchAppointmentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCalls]);

  // Enter fullscreen on mount (for TV display)
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.log("Fullscreen not available:", err);
      }
    };

    // Auto-enter fullscreen after a short delay
    const timer = setTimeout(enterFullscreen, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Load clinic name
  const clinicId = user?.clinic_id ?? null;
  useEffect(() => {
    const loadClinicInfo = async () => {
      try {
        if (clinicId) {
          // Try to get clinic info from /me endpoint (for admin users)
          try {
            const clinic = await api.get<ClinicInfo>(`/api/v1/admin/clinics/me`);
            if (clinic?.name || clinic?.commercial_name) {
              setClinicName(clinic.commercial_name || clinic.name || "Clínica");
              return;
            }
          } catch (meError: any) {
            // If /me fails (not admin), try alternative approach or use default
            // The endpoint might not be accessible for all roles
            if (meError?.status !== 404 && meError?.status !== 403) {
              console.warn("Error loading clinic info:", meError);
            }
            // Use default name - clinic name is optional for TV display
          }
        }
      } catch (error) {
        // Silently fail - clinic name is optional for TV display
        // Default "Clínica" will be used
      }
    };
    loadClinicInfo();
  }, [clinicId]);

  // Track last calls for history
  useEffect(() => {
    const currentCall = activeCalls.find(call => call.status === "called" && !call.status.includes("completed"));
    if (currentCall) {
      setLastCalls(prev => {
        const exists = prev.some(c => c.patient_name === currentCall.patient_name && 
          new Date(c.called_at).getTime() === new Date(currentCall.called_at).getTime());
        if (!exists) {
          // Get room code - use appointment details if available, otherwise generate
          const roomCode = currentCall.appointment_id && appointmentDetails[currentCall.appointment_id]?.room
            ? appointmentDetails[currentCall.appointment_id].room!
            : getRoomCodeFallback(currentCall.doctor_id);
          
          return [
            {
              patient_name: currentCall.patient_name,
              doctor_name: currentCall.doctor_name,
              location: roomCode,
              called_at: currentCall.called_at,
            },
            ...prev.slice(0, 9) // Keep last 10 calls
          ];
        }
        return prev;
      });
    }
  }, [activeCalls, appointmentDetails]);

  // Play sound notification for new calls
  useEffect(() => {
    activeCalls.forEach((call) => {
      if (call.status === "called" && !playedSounds.has(call.id)) {
        if (audioRef.current) {
          audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
        }
        setPlayedSounds((prev) => new Set([...prev, call.id]));
      }
    });
  }, [activeCalls, playedSounds]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log("Fullscreen toggle failed:", err);
    }
  };

  // Get current active call (most recent "called" status)
  const currentCall = activeCalls
    .filter((call) => call.status === "called")
    .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())[0] || 
    activeCalls
      .filter((call) => call.status !== "completed")
      .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())[0];

  return (
    <div className="fixed inset-0 bg-gray-100 overflow-hidden">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>

      {/* Top Blue Banner */}
      <div className="bg-blue-600 text-white px-8 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`} />
          <h1 className="text-4xl font-bold tracking-wide">{clinicName.toUpperCase()}</h1>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-blue-700 rounded transition-colors opacity-70 hover:opacity-100"
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Side - Current Call (Main Display) - ~2/3 width */}
        <div className="flex-[2] flex flex-col justify-center items-start px-16 py-12">
          {currentCall ? (
            <div className="w-full max-w-6xl space-y-10 animate-in fade-in duration-500">
              {/* Patient Called Section */}
              <div>
                <p className="text-3xl font-semibold text-gray-900 mb-6">PACIENTE CHAMADO</p>
                <h2 className="text-8xl font-bold text-blue-700 uppercase leading-tight">
                  {currentCall.patient_name || `PACIENTE #${currentCall.patient_id}`}
                </h2>
              </div>

              {/* Professional Section */}
              <div className="mt-12">
                <p className="text-3xl font-semibold text-gray-900 mb-6">PROFISSIONAL</p>
                <p className="text-6xl font-bold text-blue-700 uppercase leading-tight">
                  {currentCall.doctor_name || `DR. #${currentCall.doctor_id}`}
                </p>
              </div>

              {/* Service Location Section */}
              <div className="mt-12">
                <p className="text-3xl font-semibold text-gray-900 mb-6">LOCAL DE ATENDIMENTO</p>
                <p className="text-5xl font-bold text-blue-700 uppercase">
                  {currentCall.appointment_id && appointmentDetails[currentCall.appointment_id]?.room
                    ? `SALA ${appointmentDetails[currentCall.appointment_id].room}`
                    : getRoomCode(currentCall.doctor_id, currentCall.appointment_id)
                      ? `SALA ${getRoomCode(currentCall.doctor_id, currentCall.appointment_id)}`
                      : "CONSULTÓRIO"}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full text-center">
              <Phone className="h-40 w-40 text-gray-300 mx-auto mb-8" />
              <p className="text-6xl text-gray-600 font-semibold mb-4">Aguardando Chamadas</p>
              <p className="text-4xl text-gray-500">Nenhum paciente chamado no momento</p>
            </div>
          )}
        </div>

        {/* Right Side - Logo and Last Calls - ~1/3 width */}
        <div className="flex-1 bg-gray-50 border-l-2 border-gray-300 px-8 py-8 overflow-y-auto">
          {/* Logo Section */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <Image
                src={"/Logo/Logotipo em Fundo Transparente.png"}
                alt="Logo"
                width={200}
                height={200}
                className="w-auto h-32 object-contain"
                priority
              />
            </div>
          </div>

          {/* Last Calls Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">ÚLTIMAS CHAMADAS</h3>
            
            {lastCalls.length > 0 ? (
              <div className="space-y-3">
                {lastCalls.map((call, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-blue-700">
                        {call.patient_name.toUpperCase()}
                      </p>
                      <p className="text-lg font-semibold text-blue-500">
                        {call.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Nenhuma chamada recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

