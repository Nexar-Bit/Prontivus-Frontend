/**
 * Custom hook to fetch badge counts for patient sidebar
 */
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { messagesApi } from '@/lib/messages-api';

export interface PatientBadges {
  appointments: number;
  messages: number;
}

export function usePatientBadges() {
  const [badges, setBadges] = useState<PatientBadges>({ appointments: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        
        // Fetch appointments - count upcoming/pending appointments
        const appointmentsResponse = await api.get<any[]>(`/api/appointments/patient-appointments`);
        // Handle both direct array and wrapped response
        const appointments = Array.isArray(appointmentsResponse) 
          ? appointmentsResponse 
          : (appointmentsResponse as any)?.data || [];
        
        const now = new Date();
        const upcomingCount = appointments.filter((apt: any) => {
          const aptDate = new Date(apt.scheduled_datetime);
          return aptDate >= now && 
                 apt.status?.toLowerCase() !== 'cancelled' && 
                 apt.status?.toLowerCase() !== 'completed';
        }).length;

        // Fetch messages - count unread messages
        const threads = await messagesApi.listThreads(false);
        const unreadCount = threads.reduce((total, thread) => {
          return total + (thread.unread_count || 0);
        }, 0);

        setBadges({
          appointments: upcomingCount,
          messages: unreadCount,
        });
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
        // On error, set to 0 to avoid showing incorrect counts
        setBadges({ appointments: 0, messages: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
    
    // Refresh badges every 30 seconds
    const interval = setInterval(fetchBadges, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { badges, loading };
}

