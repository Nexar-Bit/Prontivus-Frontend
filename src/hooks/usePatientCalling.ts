"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";

interface PatientCall {
  id: number;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  clinic_id: number;
  status: "called" | "answered" | "completed";
  called_at: string;
}

type Callback = (call: PatientCall) => void;

export function usePatientCalling(onCallReceived?: Callback, onCallRemoved?: (appointmentId: number) => void) {
  const { user } = useAuth();
  const [activeCalls, setActiveCalls] = useState<PatientCall[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user?.clinic_id || wsRef.current?.readyState === WebSocket.OPEN) return;

    // Get backend URL from API_URL
    const apiUrl = API_URL || 'http://localhost:8000';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const wsUrl = `${wsProtocol}//${wsHost}/ws/patient-calling/${user.clinic_id}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "active_calls":
              setActiveCalls(message.data || []);
              break;
            case "patient_called":
              const newCall = message.data;
              setActiveCalls((prev) => {
                const filtered = prev.filter((c) => c.appointment_id !== newCall.appointment_id);
                return [...filtered, newCall];
              });
              if (onCallReceived) onCallReceived(newCall);
              break;
            case "call_status_updated":
              setActiveCalls((prev) =>
                prev.map((c) =>
                  c.appointment_id === message.data.appointment_id
                    ? { ...c, status: message.data.status }
                    : c
                )
              );
              break;
            case "call_removed":
              setActiveCalls((prev) =>
                prev.filter((c) => c.appointment_id !== message.data.appointment_id)
              );
              if (onCallRemoved) onCallRemoved(message.data.appointment_id);
              break;
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WebSocket disconnected, reconnecting...");
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setConnected(false);
    }
  }, [user?.clinic_id, onCallReceived, onCallRemoved]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { activeCalls, connected };
}

