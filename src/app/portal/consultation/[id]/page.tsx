"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Peer from "peerjs";

interface Appointment {
  id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  notes: string;
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

export default function ConsultationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  // WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/portal/login");
      return;
    }
    loadAppointment();
  }, [isAuthenticated, router, appointmentId]);

  const loadAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      setAppointment((response as any).data);
      
      // Generate room token for this consultation
      const tokenResponse = await api.post(`/appointments/${appointmentId}/consultation-token`);
      setRoomToken((tokenResponse as any).data.token);
      
      initializeWebRTC();
    } catch (err: any) {
      console.error("Failed to load appointment:", err);
      setError("Failed to load consultation details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize PeerJS
      const peer = new Peer(`patient-${user?.id}-${Date.now()}`);
      peerRef.current = peer;

      peer.on("open", (id) => {
        console.log("Peer connected with ID:", id);
        setConnectionStatus("Connected");
        setIsConnected(true);
      });

      peer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setConnectionStatus("Connection error");
        setError("Failed to establish connection. Please try again.");
      });

    } catch (err) {
      console.error("Failed to initialize WebRTC:", err);
      setError("Failed to access camera/microphone. Please check your permissions.");
    }
  };

  const startCall = async () => {
    if (!peerRef.current || !roomToken) return;

    try {
      setConnectionStatus("Calling doctor...");
      setIsCallActive(true);
      
      // In a real implementation, you would use the room token to join a specific room
      // For now, we'll simulate a call to the doctor
      const doctorPeerId = `doctor-${appointment?.doctor.id}`;
      
      const call = peerRef.current.call(doctorPeerId, localStreamRef.current!);
      call.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setConnectionStatus("Connected to doctor");
      });

      call.on("close", () => {
        setIsCallActive(false);
        setConnectionStatus("Call ended");
      });

    } catch (err) {
      console.error("Failed to start call:", err);
      setError("Failed to start call. Please try again.");
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setIsCallActive(false);
    setConnectionStatus("Call ended");
    router.push("/portal/consultations");
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: "secondary" as const, label: "Scheduled" },
      checked_in: { variant: "default" as const, label: "Ready" },
      in_consultation: { variant: "default" as const, label: "In Progress" },
      completed: { variant: "default" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Appointment not found</p>
        <Button onClick={() => router.push("/portal/consultations")} className="mt-4">
          Back to Consultations
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Video Consultation</h1>
            <p className="text-gray-300">
              Dr. {appointment.doctor.full_name} • {format(new Date(appointment.scheduled_datetime), "PPP 'at' p", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(appointment.status)}
            <Badge variant="outline" className="text-white border-gray-600">
              {connectionStatus}
            </Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Video Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Remote Video (Doctor) */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {isCallActive ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Waiting for doctor to join...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Local Video (Patient) */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">You</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="lg"
                onClick={toggleVideo}
                disabled={!isConnected}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="lg"
                onClick={toggleAudio}
                disabled={!isConnected}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              {!isCallActive ? (
                <Button
                  size="lg"
                  onClick={startCall}
                  disabled={!isConnected || !roomToken}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Start Call
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endCall}
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </Button>
              )}

              <Button variant="outline" size="lg" disabled>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card className="mt-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Doctor</p>
                <p className="font-medium">Dr. {appointment.doctor.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Scheduled Time</p>
                <p className="font-medium">
                  {format(new Date(appointment.scheduled_datetime), "PPP 'at' p", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="font-medium">{appointment.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className="font-medium">{appointment.appointment_type || "Consultation"}</p>
              </div>
            </div>
            {appointment.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-400">Notes</p>
                <p className="font-medium">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
