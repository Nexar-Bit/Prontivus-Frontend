"use client";
import React, { useEffect, useState, useRef } from "react";
import { usePatientCalling } from "@/hooks/usePatientCalling";
import { Phone, Settings, Maximize2, ArrowLeft } from "lucide-react";
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
  const [clinicName, setClinicName] = useState<string>("CLÍNICA");
  const [lastCalls, setLastCalls] = useState<Array<{ patient_name: string; doctor_name: string; location: string; called_at: string }>>([]);
  const [appointmentDetails, setAppointmentDetails] = useState<Record<number, { room?: string; location?: string; appointment_type?: string }>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate room code based on doctor_id (fallback)
  const getRoomCodeFallback = (doctorId: number): string => {
    const roomNumber = ((doctorId - 1) % 5) + 1;
    return `PC${roomNumber}`;
  };

  // Get room code for a call
  const getRoomCode = (doctorId: number, appointmentId?: number): string => {
    if (appointmentId && appointmentDetails[appointmentId]?.room) {
      return appointmentDetails[appointmentId].room!;
    }
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
          // Use full appointment_type if available, otherwise fallback to room code
          const appointmentType = appointment?.appointment_type 
            ? appointment.appointment_type.toUpperCase()
            : null;
          const room = appointmentType || getRoomCodeFallback(call.doctor_id);
          
          setAppointmentDetails(prev => ({
            ...prev,
            [call.appointment_id]: { 
              room: appointmentType || room, 
              location: appointmentType || room,
              appointment_type: appointmentType
            }
          }));
        } catch (error) {
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
        }
      } catch (err) {
        console.log("Fullscreen not available:", err);
      }
    };

    const timer = setTimeout(enterFullscreen, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Load clinic name
  const clinicId = user?.clinic_id ?? null;
  useEffect(() => {
    const loadClinicInfo = async () => {
      try {
        if (clinicId) {
          try {
            const clinic = await api.get<ClinicInfo>(`/api/v1/admin/clinics/me`);
            if (clinic?.name || clinic?.commercial_name) {
              setClinicName((clinic.commercial_name || clinic.name || "CLÍNICA").toUpperCase());
              return;
            }
          } catch (meError: any) {
            if (meError?.status !== 404 && meError?.status !== 403) {
              console.warn("Error loading clinic info:", meError);
            }
          }
        }
      } catch (error) {
        // Silently fail
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

  // Get current active call (most recent "called" status)
  const currentCall = activeCalls
    .filter((call) => call.status === "called")
    .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())[0] || 
    activeCalls
      .filter((call) => call.status !== "completed")
      .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())[0];

  // Get location text - format as "SALA DE [TYPE]" matching the image design
  const getLocationText = (): string => {
    if (!currentCall) return "";
    
    // Check if we have appointment_type from appointment details
    if (currentCall.appointment_id && appointmentDetails[currentCall.appointment_id]?.appointment_type) {
      const appointmentType = appointmentDetails[currentCall.appointment_id].appointment_type!;
      
      // If already formatted with "SALA DE", return as is
      if (appointmentType.toUpperCase().includes("SALA DE") || appointmentType.toUpperCase().includes("CONSULTÓRIO")) {
        return appointmentType.toUpperCase();
      }
      
      // Format appointment type: convert underscores to spaces, capitalize properly
      // Handle cases like "pré-consulta 1" or "PRE_CONSULTA_1"
      let formattedType = appointmentType
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();
      
      // Return as "SALA DE [FORMATTED_TYPE]"
      return `SALA DE ${formattedType.toUpperCase()}`;
    }
    
    // Fallback: use room code if available
    if (currentCall.appointment_id && appointmentDetails[currentCall.appointment_id]?.room) {
      const room = appointmentDetails[currentCall.appointment_id].room!;
      // If room is a simple code like "PC1", format as "SALA PC1"
      if (room.match(/^[A-Z]{1,3}\d+$/)) {
        return `SALA ${room}`;
      }
      // Otherwise format as "SALA DE [ROOM]"
      return `SALA DE ${room.toUpperCase()}`;
    }
    
    // Final fallback: generate room code
    const roomCode = getRoomCode(currentCall.doctor_id, currentCall.appointment_id);
    return roomCode ? `SALA ${roomCode}` : "CONSULTÓRIO";
  };

  return (
    <div className="fixed inset-0 bg-white overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>

      {/* Top Blue Header Bar - Solid Blue */}
      <div className="bg-blue-600 text-white px-16 py-8 flex items-center justify-between shadow-lg">
        <h1 className="text-6xl font-bold tracking-wider uppercase">
          {clinicName}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`} />
        </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/secretaria/dashboard'}
              className="p-3 hover:bg-blue-700 rounded-lg transition-all duration-200"
              title="Voltar"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="p-3 hover:bg-blue-700 rounded-lg transition-all duration-200"
              title="Configurações"
              aria-label="Configurações"
            >
              <Settings className="h-6 w-6 text-white" />
            </button>
        <button
              onClick={async () => {
                try {
                  if (document.fullscreenElement) {
                    await document.exitFullscreen();
                  } else {
                    await document.documentElement.requestFullscreen();
                  }
                } catch (err) {
                  console.log("Fullscreen not available:", err);
                }
              }}
              className="p-3 hover:bg-blue-700 rounded-lg transition-all duration-200"
              title="Tela Cheia"
              aria-label="Tela Cheia"
        >
              <Maximize2 className="h-6 w-6 text-white" />
        </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-112px)] bg-white">
        {/* Left Side - Patient Information (2/3 width) */}
        <div className="flex-[2] flex flex-col justify-center items-start px-24 py-20">
          {currentCall ? (
            <div className="w-full max-w-6xl space-y-20">
              {/* Patient Called Section */}
              <div className="space-y-3">
                <p className="text-xl font-normal text-gray-400 tracking-wide uppercase">
                  Paciente Chamado
                </p>
                <h2 className="text-8xl font-bold text-blue-600 uppercase leading-none tracking-tight">
                  {currentCall.patient_name || `PACIENTE #${currentCall.patient_id}`}
                </h2>
              </div>

              {/* Professional Section */}
              <div className="space-y-3">
                <p className="text-xl font-normal text-gray-400 tracking-wide uppercase">
                  Profissional
                </p>
                <p className="text-6xl font-bold text-blue-600 uppercase leading-tight tracking-tight">
                  {currentCall.doctor_name || `DR. #${currentCall.doctor_id}`}
                </p>
              </div>

              {/* Service Location Section */}
              <div className="space-y-3">
                <p className="text-xl font-normal text-gray-400 tracking-wide uppercase">
                  Local de Atendimento
                </p>
                <p className="text-5xl font-bold text-blue-600 uppercase tracking-tight">
                  {getLocationText()}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full text-center">
              <Phone className="h-40 w-40 text-gray-300 mx-auto mb-10" />
              <p className="text-6xl text-gray-400 font-semibold mb-6">Aguardando Chamadas</p>
              <p className="text-3xl text-gray-400 font-light">Nenhum paciente chamado no momento</p>
            </div>
          )}
        </div>

        {/* Right Side - Logo and Recent Calls (1/3 width) */}
        <div className="flex-1 bg-gray-50 border-l-2 border-gray-200 px-12 py-16 flex flex-col">
          {/* Municipal Logo Section - Centered */}
          <div className="mb-12 flex justify-center items-center">
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
              <Image
                src={"/Logo/Logotipo em Fundo Transparente.png"}
                alt="Logo Municipal"
                width={200}
                height={200}
                className="w-auto h-32 object-contain"
                priority
              />
            </div>
          </div>

          {/* Recent Calls Section */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-700 mb-6 tracking-wide uppercase">
              Últimas Chamadas
            </h3>
            
            {lastCalls.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Paciente
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Local
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastCalls.slice(0, 10).map((call, index) => (
                      <tr
                    key={index}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
                  >
                        <td className="px-4 py-4 text-base font-semibold text-gray-900">
                        {call.patient_name.toUpperCase()}
                        </td>
                        <td className="px-4 py-4 text-right text-base font-bold text-blue-600">
                        {call.location}
                        </td>
                      </tr>
                ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-lg font-light">Nenhuma chamada recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
