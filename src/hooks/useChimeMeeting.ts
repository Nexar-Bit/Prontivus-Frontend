/**
 * AWS Chime SDK Hook for Telemedicine
 * 
 * Provides secure, compliant video/audio communication using AWS Chime SDK
 * Replaces WebSocket-based WebRTC signaling with AWS Chime SDK
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { toast } from "sonner";

interface MeetingCredentials {
  meeting_id: string;
  meeting_arn: string;
  doctor_attendee: {
    attendee_id: string;
    join_token: string;
    external_user_id: string;
  };
  patient_attendee: {
    attendee_id: string;
    join_token: string;
    external_user_id: string;
  };
  expires_at: string;
  region: string;
  media_placement: {
    AudioHostUrl: string;
    AudioFallbackUrl: string;
    ScreenDataUrl: string;
    ScreenSharingUrl: string;
    ScreenViewingUrl: string;
    SignalingUrl: string;
    TurnControlUrl: string;
  };
}

interface UseChimeMeetingOptions {
  appointmentId: number;
  role: "doctor" | "patient";
  onMeetingEnded?: () => void;
}

export function useChimeMeeting({
  appointmentId,
  role,
  onMeetingEnded,
}: UseChimeMeetingOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [meetingCredentials, setMeetingCredentials] = useState<MeetingCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chime SDK refs (will be initialized when library is loaded)
  const meetingSessionRef = useRef<any>(null);
  const audioVideoRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  /**
   * Create a new AWS Chime meeting
   */
  const createMeeting = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/telemedicine/meetings/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create meeting");
      }

      const data = await response.json();
      
      if (data.success && data.meeting) {
        setMeetingCredentials(data.meeting);
        return data.meeting;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create meeting";
      setError(errorMessage);
      toast.error("Erro ao criar reunião", {
        description: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  /**
   * Join an existing AWS Chime meeting
   */
  const joinMeeting = useCallback(async (meetingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Dynamically import AWS Chime SDK
      const {
        DefaultMeetingSession,
        MeetingSessionConfiguration,
        DefaultDeviceController,
        MeetingSessionStatusCode,
        ConsoleLogger,
        LogLevel,
      } = await import("amazon-chime-sdk-js");

      // Get meeting info from backend
      const response = await fetch(
        `${API_URL}/telemedicine/meetings/${meetingId}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointment_id: appointmentId,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to join meeting");
      }

      // Get attendee credentials based on role
      // In production, these should be retrieved from the backend securely
      const attendeeCredentials = role === "doctor" 
        ? meetingCredentials?.doctor_attendee 
        : meetingCredentials?.patient_attendee;

      if (!attendeeCredentials || !meetingCredentials) {
        throw new Error("Meeting credentials not available. Create meeting first.");
      }

      // Configure meeting session
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: meetingId,
          MediaPlacement: meetingCredentials.media_placement,
          ExternalMeetingId: `appointment-${appointmentId}`,
        },
        {
          AttendeeId: attendeeCredentials.attendee_id,
          JoinToken: attendeeCredentials.join_token,
          ExternalUserId: attendeeCredentials.external_user_id,
        }
      );

      // Create meeting session
      const logger = new ConsoleLogger("ChimeMeeting", LogLevel.INFO);
      const deviceController = new DefaultDeviceController(logger);
      
      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      meetingSessionRef.current = meetingSession;
      audioVideoRef.current = meetingSession.audioVideo;

      // Set up event listeners
      audioVideoRef.current.observer.subscribe("audioVideoDidStart", () => {
        setIsMeetingActive(true);
        toast.success("Conectado à reunião");
      });

      audioVideoRef.current.observer.subscribe("audioVideoDidStop", (statusCode: any) => {
        setIsMeetingActive(false);
        if (statusCode.statusCode() === MeetingSessionStatusCode.Left) {
          toast.info("Você saiu da reunião");
        } else {
          toast.warning("Conexão perdida");
        }
        onMeetingEnded?.();
      });

      // Request permissions and start
      await audioVideoRef.current.start();

      // Bind video elements
      if (localVideoRef.current) {
        audioVideoRef.current.bindVideoElement(0, localVideoRef.current);
      }
      if (remoteVideoRef.current) {
        audioVideoRef.current.bindVideoElement(1, remoteVideoRef.current);
      }

      setIsMeetingActive(true);
      return meetingSession;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to join meeting";
      setError(errorMessage);
      toast.error("Erro ao entrar na reunião", {
        description: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, role, meetingCredentials, onMeetingEnded]);

  /**
   * End the current meeting
   */
  const endMeeting = useCallback(async (meetingId: string) => {
    try {
      setIsLoading(true);

      const token = getAccessToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Stop audio/video
      if (audioVideoRef.current) {
        audioVideoRef.current.stop();
      }

      // Call backend to end meeting
      const response = await fetch(
        `${API_URL}/telemedicine/meetings/${meetingId}/end`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ appointment_id: appointmentId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to end meeting");
      }

      setIsMeetingActive(false);
      meetingSessionRef.current = null;
      audioVideoRef.current = null;

      toast.success("Reunião encerrada");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to end meeting";
      setError(errorMessage);
      toast.error("Erro ao encerrar reunião", {
        description: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  /**
   * Toggle microphone
   */
  const toggleMicrophone = useCallback(() => {
    if (audioVideoRef.current) {
      audioVideoRef.current.realtimeMuteLocalAudio();
    }
  }, []);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (audioVideoRef.current) {
      audioVideoRef.current.realtimeSetLocalVideoEnabled(!audioVideoRef.current.isLocalVideoEnabled());
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioVideoRef.current) {
        audioVideoRef.current.stop();
      }
    };
  }, []);

  return {
    isLoading,
    isMeetingActive,
    meetingCredentials,
    error,
    localVideoRef,
    remoteVideoRef,
    createMeeting,
    joinMeeting,
    endMeeting,
    toggleMicrophone,
    toggleVideo,
  };
}
