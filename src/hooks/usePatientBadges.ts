/**
 * Custom hook to fetch badge counts for patient sidebar
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { api } from '@/lib/api';
import { messagesApi } from '@/lib/messages-api';

export interface PatientBadges {
  appointments: number;
  messages: number;
}

export function usePatientBadges() {
  const { user, isAuthenticated } = useAuth();
  const [badges, setBadges] = useState<PatientBadges>({ appointments: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      // Only fetch badges if user is authenticated
      if (!isAuthenticated || !user) {
        setBadges({ appointments: 0, messages: 0 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Only fetch if user is a patient
        if (user?.role !== 'patient' && user?.role_name?.toLowerCase() !== 'patient') {
          setBadges({ appointments: 0, messages: 0 });
          setLoading(false);
          return;
        }
        
        // Fetch appointments - count upcoming/pending appointments
        const appointmentsResponse = await api.get<any[]>(`/api/v1/appointments/patient-appointments`);
        // Handle both direct array and wrapped response
        const appointments = Array.isArray(appointmentsResponse) 
          ? appointmentsResponse 
          : (appointmentsResponse as any)?.data || [];
        
        const now = new Date();
        const upcomingCount = appointments.filter((apt: any) => {
          if (!apt.scheduled_datetime) return false;
          const aptDate = new Date(apt.scheduled_datetime);
          return aptDate >= now && 
                 apt.status?.toLowerCase() !== 'cancelled' && 
                 apt.status?.toLowerCase() !== 'completed';
        }).length;

        // Fetch messages - count unread messages
        let unreadCount = 0;
        try {
          const threads = await messagesApi.listThreads(false);
          unreadCount = threads.reduce((total, thread) => {
            return total + (thread.unread_count || 0);
          }, 0);
        } catch (msgError) {
          // Silently handle message errors
          console.warn('Failed to fetch message badges:', msgError);
        }

        setBadges({
          appointments: upcomingCount,
          messages: unreadCount,
        });
      } catch (error: any) {
        // Silently handle 401/403 errors (user not authenticated or not a patient)
        if (error?.status === 401 || error?.status === 403 || error?.response?.status === 401 || error?.response?.status === 403) {
          console.warn("Not authenticated or not a patient, skipping badge fetch");
          setBadges({ appointments: 0, messages: 0 });
        } else if (error?.response?.status === 404) {
          // Endpoint not found - user might not be a patient
          console.warn("Patient appointments endpoint not found, skipping badge fetch");
          setBadges({ appointments: 0, messages: 0 });
        } else {
          console.error('Failed to fetch badge counts:', error);
          // On error, set to 0 to avoid showing incorrect counts
          setBadges({ appointments: 0, messages: 0 });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
    
    // Refresh badges every 30 seconds
    const interval = setInterval(fetchBadges, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return { badges, loading };
}

