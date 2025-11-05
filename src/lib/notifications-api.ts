/**
 * Notifications API client
 */
import { api } from "./api";

export interface NotificationItem {
  id: string;
  kind: string; // "stock" | "appointment" | ...
  source_id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  read: boolean;
  timestamp: string;
  source: string;
  actionUrl?: string;
  actionText?: string;
}

export const notificationsApi = {
  getAll: async (): Promise<NotificationItem[]> => {
    const res = await api.get<{ data: NotificationItem[] }>("/api/notifications");
    return res?.data || [];
  },
  markRead: async (kind: string, sourceId: number) => {
    return api.post(`/api/notifications/${kind}/${sourceId}/read`);
  },
  delete: async (kind: string, sourceId: number) => {
    return api.delete(`/api/notifications/${kind}/${sourceId}`);
  },
};


